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
    const nodeCount = 300; // Reduced for better performance with connections
    const connectionDistance = 3.5; // Max distance to draw connections
    const maxConnections = 8; // Max connections per node
    const signalSpeed = 2.0; // Speed of signal propagation
    const signalCount = 20; // Number of active signals

    // ===========================
    // CREATE NODES (NEURONS)
    // ===========================
    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeScales = new Float32Array(nodeCount);
    const nodeActivity = new Float32Array(nodeCount); // For pulsing effect

    // Store node positions for connection calculation
    const nodeArray = [];

    for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3;
        
        // Distribute nodes in a large cube with some clustering
        const x = (Math.random() - 0.5) * 25;
        const y = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 25;
        
        nodePositions[i3] = x;
        nodePositions[i3 + 1] = y;
        nodePositions[i3 + 2] = z;
        
        nodeArray.push({ x, y, z, index: i });
        
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
            
            // Mouse interaction - nodes get pushed away
            vec2 mousePos = uMouse * 15.0;
            float distanceToMouse = distance(modelPosition.xy, mousePos);
            float pushForce = smoothstep(5.0, 0.0, distanceToMouse);
            modelPosition.xyz += normalize(modelPosition.xyz - vec3(mousePos, 0.0)) * pushForce * 2.0;
            
            // Slight floating animation
            modelPosition.y += sin(uTime * 0.5 + position.x * 0.5) * 0.3;
            modelPosition.x += cos(uTime * 0.3 + position.y * 0.5) * 0.3;
            
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
            
            // Size based on activity and distance
            float pulse = sin(uTime * 2.0 + aActivity * 10.0) * 0.3 + 0.7;
            gl_PointSize = uSize * aScale * pulse * (1.0 / -viewPosition.z);
            
            // Color based on activity - cyan to pink gradient
            vActivity = aActivity;
            vColor = mix(
                vec3(0.29, 0.77, 0.71), // Cyan
                vec3(1.0, 0.58, 0.6),   // Pink
                aActivity
            );
        }
    `;

    // Custom fragment shader for nodes
    const nodeFragmentShader = `
        varying vec3 vColor;
        varying float vActivity;
        
        void main() {
            // Circular node with glow
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            // Sharp core with soft glow
            float core = smoothstep(0.5, 0.3, dist);
            float glow = smoothstep(0.5, 0.0, dist) * 0.3;
            float alpha = core + glow;
            
            // Brighter center
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
    // CREATE CONNECTIONS (SYNAPSES)
    // ===========================
    
    // Calculate connections between nearby nodes
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
                connections.push({
                    start: { x: nodeA.x, y: nodeA.y, z: nodeA.z },
                    end: { x: nodeB.x, y: nodeB.y, z: nodeB.z },
                    distance: distance,
                    strength: 1.0 - (distance / connectionDistance) // Closer = stronger
                });
                connectionCount++;
            }
        }
    }

    console.log(`Created ${connections.length} connections between ${nodeCount} nodes`);

    // Create line geometry for all connections
    const linePositions = new Float32Array(connections.length * 6); // 2 points * 3 coords
    const lineStrengths = new Float32Array(connections.length * 2); // Strength for each vertex

    connections.forEach((conn, i) => {
        const i6 = i * 6;
        const i2 = i * 2;
        
        // Start point
        linePositions[i6] = conn.start.x;
        linePositions[i6 + 1] = conn.start.y;
        linePositions[i6 + 2] = conn.start.z;
        
        // End point
        linePositions[i6 + 3] = conn.end.x;
        linePositions[i6 + 4] = conn.end.y;
        linePositions[i6 + 5] = conn.end.z;
        
        // Strength (opacity)
        lineStrengths[i2] = conn.strength;
        lineStrengths[i2 + 1] = conn.strength;
    });

    const connectionsGeometry = new THREE.BufferGeometry();
    connectionsGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    connectionsGeometry.setAttribute('aStrength', new THREE.BufferAttribute(lineStrengths, 1));

    const connectionsMaterial = new THREE.LineBasicMaterial({
        color: 0x49c5b6,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });

    const connectionLines = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
    scene.add(connectionLines);

    // ===========================
    // SIGNAL PROPAGATION SYSTEM
    // ===========================
    
    const signals = [];
    
    // Initialize random signals
    for (let i = 0; i < signalCount; i++) {
        const randomConnection = connections[Math.floor(Math.random() * connections.length)];
        signals.push({
            connection: randomConnection,
            progress: Math.random(), // 0 to 1 along the connection
            speed: signalSpeed * (0.5 + Math.random() * 0.5),
            color: Math.random() > 0.5 ? 
                new THREE.Color(0x49c5b6) : // Cyan
                new THREE.Color(0xFF9398)   // Pink
        });
    }

    // Signal visualization (small spheres traveling along connections)
    const signalGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const signalMeshes = signals.map(signal => {
        const material = new THREE.MeshBasicMaterial({
            color: signal.color,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(signalGeometry, material);
        scene.add(mesh);
        return mesh;
    });

    // ===========================
    // MOUSE INTERACTION
    // ===========================
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
        
        // Slowly rotate the entire network
        nodes.rotation.y = elapsedTime * 0.02;
        nodes.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1;
        
        connectionLines.rotation.copy(nodes.rotation);
        
        // Update signals
        signals.forEach((signal, index) => {
            // Move signal along connection
            signal.progress += signal.speed * deltaTime;
            
            // Loop when reaching end
            if (signal.progress >= 1.0) {
                signal.progress = 0;
                // Random new connection
                signal.connection = connections[Math.floor(Math.random() * connections.length)];
            }
            
            // Interpolate position along connection
            const t = signal.progress;
            const start = signal.connection.start;
            const end = signal.connection.end;
            
            const mesh = signalMeshes[index];
            mesh.position.x = start.x + (end.x - start.x) * t;
            mesh.position.y = start.y + (end.y - start.y) * t;
            mesh.position.z = start.z + (end.z - start.z) * t;
            
            // Apply same rotation as network
            mesh.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), nodes.rotation.y);
            mesh.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), nodes.rotation.x);
            
            // Pulse effect
            const pulse = 1.0 + Math.sin(signal.progress * Math.PI) * 0.5;
            mesh.scale.setScalar(pulse);
        });
        
        // Camera movement with mouse and scroll
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
