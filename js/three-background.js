// ===========================
// THREE.JS NEURAL NETWORK BACKGROUND
// OPTIMIZED VERSION
// ===========================
import * as THREE from 'three';

export function initThreeJS() {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    camera.position.z = 15;

    // ===========================
    // NEURAL NETWORK PARAMETERS
    // ===========================
    const nodeCount = 200; // Reduced for better performance
    const connectionDistance = 3.5;
    const maxConnections = 6; // Reduced connections
    const signalSpeed = 2.0;
    const maxActiveSignals = 30; // Limit active signals
    const autoSignalInterval = 3000; // Slower auto-fire

    // ===========================
    // CREATE NODES (NEURONS)
    // ===========================
    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeScales = new Float32Array(nodeCount);
    const nodeActivity = new Float32Array(nodeCount);

    const nodeArray = [];

    for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3;
        
        const x = (Math.random() - 0.5) * 25;
        const y = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 25;
        
        nodePositions[i3] = x;
        nodePositions[i3 + 1] = y;
        nodePositions[i3 + 2] = z;
        
        nodeArray.push({ 
            x, y, z, 
            index: i,
            connections: [],
            activation: 0.0
        });
        
        nodeScales[i] = 0.5 + Math.random() * 0.5;
        nodeActivity[i] = Math.random();
    }

    nodesGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    nodesGeometry.setAttribute('aScale', new THREE.BufferAttribute(nodeScales, 1));
    nodesGeometry.setAttribute('aActivity', new THREE.BufferAttribute(nodeActivity, 1));

    // Custom vertex shader for nodes
    const nodeVertexShader = `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uSize;
        
        attribute float aScale;
        attribute float aActivity;
        
        varying vec3 vColor;
        
        void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            // Mouse interaction
            vec2 mousePos = uMouse * 15.0;
            float distanceToMouse = distance(modelPosition.xy, mousePos);
            float pushForce = smoothstep(5.0, 0.0, distanceToMouse);
            modelPosition.xyz += normalize(modelPosition.xyz - vec3(mousePos, 0.0)) * pushForce * 2.0;
            
            // Slight floating
            modelPosition.y += sin(uTime * 0.5 + position.x * 0.5) * 0.3;
            modelPosition.x += cos(uTime * 0.3 + position.y * 0.5) * 0.3;
            
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
            
            float pulse = sin(uTime * 2.0 + aActivity * 10.0) * 0.3 + 0.7;
            gl_PointSize = uSize * aScale * pulse * (1.0 / -viewPosition.z);
            
            vColor = mix(
                vec3(0.29, 0.77, 0.71),
                vec3(1.0, 0.58, 0.6),
                aActivity
            );
        }
    `;

    const nodeFragmentShader = `
        varying vec3 vColor;
        
        void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            float core = smoothstep(0.5, 0.3, dist);
            float glow = smoothstep(0.5, 0.0, dist) * 0.3;
            float alpha = core + glow;
            
            vec3 finalColor = vColor * (1.0 + core * 0.5);
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

    const nodesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uSize: { value: 40.0 }
        },
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const nodes = new THREE.Points(nodesGeometry, nodesMaterial);
    scene.add(nodes);

    // ===========================
    // CREATE CONNECTIONS
    // ===========================
    const connections = [];
    
    for (let i = 0; i < nodeArray.length; i++) {
        const nodeA = nodeArray[i];
        let connectionCount = 0;
        
        for (let j = i + 1; j < nodeArray.length; j++) {
            if (connectionCount >= maxConnections) break;
            
            const nodeB = nodeArray[j];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const dz = nodeA.z - nodeB.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < connectionDistance) {
                const connection = {
                    startNode: nodeA,
                    endNode: nodeB,
                    start: new THREE.Vector3(nodeA.x, nodeA.y, nodeA.z),
                    end: new THREE.Vector3(nodeB.x, nodeB.y, nodeB.z),
                    distance: distance,
                    strength: 1.0 - (distance / connectionDistance),
                    activeSignals: [] // Track signals on this connection
                };
                
                connections.push(connection);
                nodeA.connections.push(connection);
                nodeB.connections.push(connection);
                connectionCount++;
            }
        }
    }

    console.log(`Created ${connections.length} connections between ${nodeCount} nodes`);

    // Create base connection lines (static)
    const linePositions = new Float32Array(connections.length * 6);

    connections.forEach((conn, i) => {
        const i6 = i * 6;
        
        linePositions[i6] = conn.start.x;
        linePositions[i6 + 1] = conn.start.y;
        linePositions[i6 + 2] = conn.start.z;
        
        linePositions[i6 + 3] = conn.end.x;
        linePositions[i6 + 4] = conn.end.y;
        linePositions[i6 + 5] = conn.end.z;
    });

    const connectionsGeometry = new THREE.BufferGeometry();
    connectionsGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const connectionsMaterial = new THREE.LineBasicMaterial({
        color: 0x49c5b6,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending
    });

    const connectionLines = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
    scene.add(connectionLines);

    // ===========================
    // OPTIMIZED SIGNAL SYSTEM
    // ===========================
    
    class Signal {
        constructor(connection, direction = 1, color = 0x49c5b6) {
            this.connection = connection;
            this.progress = 0;
            this.direction = direction;
            this.speed = signalSpeed;
            this.color = new THREE.Color(color);
            this.active = true;
        }
        
        update(deltaTime) {
            if (!this.active) return false;
            
            this.progress += this.speed * deltaTime * this.direction;
            
            if (this.progress >= 1.0 || this.progress <= 0) {
                this.active = false;
                
                const targetNode = this.direction > 0 ? 
                    this.connection.endNode : 
                    this.connection.startNode;
                
                // Only propagate if we have room for more signals
                if (activeSignals.length < maxActiveSignals) {
                    activateNode(targetNode, false);
                }
                
                return false;
            }
            
            return true;
        }
    }

    const activeSignals = [];

    function activateNode(node, isManual = false) {
        node.activation = 1.0;
        
        // Limit propagation
        const maxNewSignals = Math.min(node.connections.length, 3);
        
        for (let i = 0; i < maxNewSignals; i++) {
            if (activeSignals.length >= maxActiveSignals) break;
            
            const conn = node.connections[i];
            const direction = conn.startNode === node ? 1 : -1;
            const color = Math.random() > 0.3 ? 0x49c5b6 : 0xFF9398;
            
            const signal = new Signal(conn, direction, color);
            conn.activeSignals.push(signal);
            activeSignals.push(signal);
        }
        
        if (isManual) {
            createBurstEffect(node);
        }
    }

    function createBurstEffect(node) {
        const burstGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF9398,
            transparent: true,
            opacity: 0.6
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.set(node.x, node.y, node.z);
        scene.add(burst);
        
        let life = 0;
        const animate = () => {
            life += 0.05;
            burst.scale.setScalar(1 + life * 2);
            burst.material.opacity = Math.max(0, 0.6 - life);
            
            if (burst.material.opacity > 0.01) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(burst);
                burst.geometry.dispose();
                burst.material.dispose();
            }
        };
        animate();
    }

    // Auto-fire with throttling
    let lastAutoFire = 0;
    function autoFireSignal(currentTime) {
        if (currentTime - lastAutoFire > autoSignalInterval && activeSignals.length < maxActiveSignals) {
            const randomNode = nodeArray[Math.floor(Math.random() * nodeArray.length)];
            activateNode(randomNode);
            lastAutoFire = currentTime;
        }
    }

    // Start with fewer initial signals
    for (let i = 0; i < 3; i++) {
        const randomNode = nodeArray[Math.floor(Math.random() * nodeArray.length)];
        activateNode(randomNode);
    }

    // ===========================
    // POOLED SIGNAL GEOMETRY
    // ===========================
    const maxSignalLines = 50;
    const signalGeometries = [];
    const signalMeshes = [];
    
    // Pre-create signal line pool
    for (let i = 0; i < maxSignalLines; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6); // 2 points * 3 coords
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0
        });
        
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        
        signalGeometries.push(geometry);
        signalMeshes.push(line);
    }

    function updateSignalVisualization() {
        let signalIndex = 0;
        
        // Hide all lines first
        signalMeshes.forEach(mesh => {
            mesh.material.opacity = 0;
        });
        
        // Update only active signals
        for (const connection of connections) {
            for (const signal of connection.activeSignals) {
                if (!signal.active || signalIndex >= maxSignalLines) continue;
                
                const line = signalMeshes[signalIndex];
                const geometry = signalGeometries[signalIndex];
                const positions = geometry.attributes.position.array;
                
                // Calculate trail
                const trailLength = 0.2;
                const start = Math.max(0, signal.progress - trailLength);
                const end = signal.progress;
                
                const connStart = connection.start;
                const connEnd = connection.end;
                
                // Update positions
                positions[0] = connStart.x + (connEnd.x - connStart.x) * start;
                positions[1] = connStart.y + (connEnd.y - connStart.y) * start;
                positions[2] = connStart.z + (connEnd.z - connStart.z) * start;
                
                positions[3] = connStart.x + (connEnd.x - connStart.x) * end;
                positions[4] = connStart.y + (connEnd.y - connStart.y) * end;
                positions[5] = connStart.z + (connEnd.z - connStart.z) * end;
                
                geometry.attributes.position.needsUpdate = true;
                
                // Update material
                line.material.color.copy(signal.color);
                line.material.opacity = 0.8;
                line.rotation.copy(nodes.rotation);
                
                signalIndex++;
            }
        }
    }

    // ===========================
    // MOUSE INTERACTION
    // ===========================
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.5;
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    let clicking = false;
    window.addEventListener('click', (event) => {
        if (clicking) return;
        clicking = true;
        
        const clickMouse = new THREE.Vector2();
        clickMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        clickMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(clickMouse, camera);
        const intersects = raycaster.intersectObject(nodes);

        if (intersects.length > 0) {
            const intersectedIndex = intersects[0].index;
            const clickedNode = nodeArray[intersectedIndex];
            
            console.log(`Node ${intersectedIndex} activated!`);
            activateNode(clickedNode, true);
        }
        
        setTimeout(() => { clicking = false; }, 100);
    });

    // ===========================
    // ANIMATION LOOP
    // ===========================
    const clock = new THREE.Clock();
    let scrollY = 0;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });
    
    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = Math.min(clock.getDelta(), 0.1); // Cap delta time
        
        // Update nodes
        nodesMaterial.uniforms.uTime.value = elapsedTime;
        nodesMaterial.uniforms.uMouse.value = mouse;
        
        // Rotate network
        nodes.rotation.y = elapsedTime * 0.02;
        nodes.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
        connectionLines.rotation.copy(nodes.rotation);
        
        // Update signals
        for (let i = activeSignals.length - 1; i >= 0; i--) {
            const signal = activeSignals[i];
            if (!signal.update(deltaTime)) {
                activeSignals.splice(i, 1);
            }
        }
        
        // Clean up inactive signals from connections
        for (const connection of connections) {
            connection.activeSignals = connection.activeSignals.filter(s => s.active);
        }
        
        // Update node activation
        for (const node of nodeArray) {
            if (node.activation > 0) {
                node.activation -= deltaTime * 0.5;
                node.activation = Math.max(0, node.activation);
            }
        }
        
        // Update signal visualization
        updateSignalVisualization();
        
        // Auto-fire
        autoFireSignal(elapsedTime * 1000);
        
        // Camera
        camera.position.x = Math.sin(mouse.x * 0.3) * 3;
        camera.position.y = Math.cos(mouse.y * 0.3) * 3 - scrollY * 0.002;
        camera.lookAt(scene.position);
        
        renderer.render(scene, camera);
    }

    animate();

    // ===========================
    // RESIZE HANDLER
    // ===========================
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
