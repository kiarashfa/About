// ===========================
// THREE.JS NEURAL NETWORK BACKGROUND
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
    const nodeCount = 300;
    const connectionDistance = 3.5;
    const maxConnections = 8;
    const signalSpeed = 1.5;
    const signalLength = 0.3; // Length of the signal trail (0-1)
    const autoSignalInterval = 2000; // Auto-fire signals every 2 seconds

    // ===========================
    // CREATE NODES (NEURONS)
    // ===========================
    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeScales = new Float32Array(nodeCount);
    const nodeActivity = new Float32Array(nodeCount);

    // Store node data
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
            activation: 0.0 // Current activation level (0-1)
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
        varying float vActivity;
        
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
            
            // Pulse based on activity
            float pulse = sin(uTime * 2.0 + aActivity * 10.0) * 0.3 + 0.7;
            gl_PointSize = uSize * aScale * pulse * (1.0 / -viewPosition.z);
            
            vActivity = aActivity;
            vColor = mix(
                vec3(0.29, 0.77, 0.71),
                vec3(1.0, 0.58, 0.6),
                aActivity
            );
        }
    `;

    const nodeFragmentShader = `
        varying vec3 vColor;
        varying float vActivity;
        
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
                    start: { x: nodeA.x, y: nodeA.y, z: nodeA.z },
                    end: { x: nodeB.x, y: nodeB.y, z: nodeB.z },
                    distance: distance,
                    strength: 1.0 - (distance / connectionDistance),
                    signals: [] // Active signals on this connection
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
    const lineStrengths = new Float32Array(connections.length * 2);

    connections.forEach((conn, i) => {
        const i6 = i * 6;
        const i2 = i * 2;
        
        linePositions[i6] = conn.start.x;
        linePositions[i6 + 1] = conn.start.y;
        linePositions[i6 + 2] = conn.start.z;
        
        linePositions[i6 + 3] = conn.end.x;
        linePositions[i6 + 4] = conn.end.y;
        linePositions[i6 + 5] = conn.end.z;
        
        lineStrengths[i2] = conn.strength;
        lineStrengths[i2 + 1] = conn.strength;
    });

    const connectionsGeometry = new THREE.BufferGeometry();
    connectionsGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const connectionsMaterial = new THREE.LineBasicMaterial({
        color: 0x49c5b6,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });

    const connectionLines = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
    scene.add(connectionLines);

    // ===========================
    // SIGNAL PROPAGATION SYSTEM
    // ===========================
    
    class Signal {
        constructor(connection, direction = 1, color = 0x49c5b6) {
            this.connection = connection;
            this.progress = 0; // 0 to 1
            this.direction = direction; // 1 = forward, -1 = backward
            this.speed = signalSpeed;
            this.color = color;
            this.active = true;
        }
        
        update(deltaTime) {
            if (!this.active) return false;
            
            this.progress += this.speed * deltaTime * this.direction;
            
            // Signal completed
            if (this.progress >= 1.0 || this.progress <= 0) {
                this.active = false;
                
                // Activate the end node and propagate
                const targetNode = this.direction > 0 ? 
                    this.connection.endNode : 
                    this.connection.startNode;
                
                activateNode(targetNode);
                return false;
            }
            
            return true;
        }
        
        getPosition() {
            const t = Math.max(0, Math.min(1, this.progress));
            const start = this.connection.start;
            const end = this.connection.end;
            
            return {
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t,
                z: start.z + (end.z - start.z) * t
            };
        }
    }

    // Active signals container
    const activeSignals = [];

    // Function to activate a node and send signals to connected nodes
    function activateNode(node, isManual = false) {
        node.activation = 1.0;
        
        // Send signals through all connections
        node.connections.forEach(conn => {
            const direction = conn.startNode === node ? 1 : -1;
            
            // Random color: mostly cyan, sometimes pink
            const color = Math.random() > 0.3 ? 0x49c5b6 : 0xFF9398;
            
            const signal = new Signal(conn, direction, color);
            conn.signals.push(signal);
            activeSignals.push(signal);
        });
        
        // Create visual burst effect for manual clicks
        if (isManual) {
            createBurstEffect(node);
        }
    }

    // Visual burst effect when clicking a node
    function createBurstEffect(node) {
        const burstGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const burstMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF9398,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const burst = new THREE.Mesh(burstGeometry, burstMaterial);
        burst.position.set(node.x, node.y, node.z);
        scene.add(burst);
        
        // Animate burst
        let scale = 1;
        const burstAnimation = () => {
            scale += 0.1;
            burst.scale.setScalar(scale);
            burst.material.opacity = Math.max(0, 0.8 - scale * 0.1);
            
            if (burst.material.opacity > 0) {
                requestAnimationFrame(burstAnimation);
            } else {
                scene.remove(burst);
                burst.geometry.dispose();
                burst.material.dispose();
            }
        };
        burstAnimation();
    }

    // Auto-fire random signals
    setInterval(() => {
        const randomNode = nodeArray[Math.floor(Math.random() * nodeArray.length)];
        activateNode(randomNode);
    }, autoSignalInterval);

    // Start with a few initial signals
    for (let i = 0; i < 5; i++) {
        const randomNode = nodeArray[Math.floor(Math.random() * nodeArray.length)];
        activateNode(randomNode);
    }

    // ===========================
    // DYNAMIC CONNECTION RENDERING
    // ===========================
    
    // Create material for signal trails
    const signalMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        linewidth: 2
    });

    const signalLines = [];

    function updateSignalVisualization() {
        // Clear old signal lines
        signalLines.forEach(line => {
            scene.remove(line);
            line.geometry.dispose();
        });
        signalLines.length = 0;

        // Create new signal lines
        connections.forEach(conn => {
            if (conn.signals.length === 0) return;

            conn.signals.forEach(signal => {
                if (!signal.active) return;

                // Calculate trail start and end
                const trailStart = Math.max(0, signal.progress - signalLength);
                const trailEnd = signal.progress;

                const start = conn.start;
                const end = conn.end;

                // Interpolate positions
                const startPos = {
                    x: start.x + (end.x - start.x) * trailStart,
                    y: start.y + (end.y - start.y) * trailStart,
                    z: start.z + (end.z - start.z) * trailStart
                };

                const endPos = {
                    x: start.x + (end.x - start.x) * trailEnd,
                    y: start.y + (end.y - start.y) * trailEnd,
                    z: start.z + (end.z - start.z) * trailEnd
                };

                // Create trail geometry
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array([
                    startPos.x, startPos.y, startPos.z,
                    endPos.x, endPos.y, endPos.z
                ]);

                // Color gradient (fade out at tail)
                const color = new THREE.Color(signal.color);
                const colors = new Float32Array([
                    color.r * 0.3, color.g * 0.3, color.b * 0.3,
                    color.r, color.g, color.b
                ]);

                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                const line = new THREE.Line(geometry, signalMaterial);
                
                // Apply network rotation
                line.rotation.copy(nodes.rotation);
                
                scene.add(line);
                signalLines.push(line);
            });

            // Remove inactive signals
            conn.signals = conn.signals.filter(s => s.active);
        });
    }

    // ===========================
    // MOUSE INTERACTION & CLICK
    // ===========================
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.5;
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Click to activate nodes
    window.addEventListener('click', (event) => {
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
        const deltaTime = clock.getDelta();
        
        // Update node uniforms
        nodesMaterial.uniforms.uTime.value = elapsedTime;
        nodesMaterial.uniforms.uMouse.value = mouse;
        
        // Slowly rotate network
        nodes.rotation.y = elapsedTime * 0.02;
        nodes.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
        connectionLines.rotation.copy(nodes.rotation);
        
        // Update all active signals
        for (let i = activeSignals.length - 1; i >= 0; i--) {
            const signal = activeSignals[i];
            const stillActive = signal.update(deltaTime);
            
            if (!stillActive) {
                activeSignals.splice(i, 1);
            }
        }
        
        // Update node activation decay
        nodeArray.forEach(node => {
            if (node.activation > 0) {
                node.activation -= deltaTime * 0.5; // Decay rate
                node.activation = Math.max(0, node.activation);
            }
        });
        
        // Update signal visualization
        updateSignalVisualization();
        
        // Camera movement
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
