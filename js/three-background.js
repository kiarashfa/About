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
    const signalSpeed = 1.5; // Speed of signal propagation through connections
    const activationProbability = 0.02; // Chance per frame that a node "fires"

    // ===========================
    // CREATE NODES (NEURONS)
    // ===========================
    const nodesGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeScales = new Float32Array(nodeCount);
    const nodeActivity = new Float32Array(nodeCount);

    // Store node data for connection calculation and signal propagation
    const nodeArray = [];

    for (let i = 0; i < nodeCount; i++) {
        const i3 = i * 3;
        
        // Distribute nodes in a large cube
        const x = (Math.random() - 0.5) * 25;
        const y = (Math.random() - 0.5) * 25;
        const z = (Math.random() - 0.5) * 25;
        
        nodePositions[i3] = x;
        nodePositions[i3 + 1] = y;
        nodePositions[i3 + 2] = z;
        
        nodeArray.push({ 
            x, y, z, 
            index: i,
            connections: [], // Will store connected node indices
            activation: 0.0  // Current activation level (0-1)
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
            
            // Color based on activity
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
                const connectionData = {
                    startNode: i,
                    endNode: j,
                    start: { x: nodeA.x, y: nodeA.y, z: nodeA.z },
                    end: { x: nodeB.x, y: nodeB.y, z: nodeB.z },
                    distance: distance,
                    strength: 1.0 - (distance / connectionDistance),
                    signals: [] // Array to hold active signals on this connection
                };
                
                connections.push(connectionData);
                
                // Store connection indices in nodes for signal propagation
                nodeA.connections.push(connections.length - 1);
                nodeB.connections.push(connections.length - 1);
                
                connectionCount++;
            }
        }
    }

    console.log(`Created ${connections.length} connections between ${nodeCount} nodes`);

    // Create line geometry for all connections with color attribute
    const linePositions = new Float32Array(connections.length * 6); // 2 points * 3 coords
    const lineColors = new Float32Array(connections.length * 6); // 2 points * 3 color channels
    const lineStrengths = new Float32Array(connections.length * 2);

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
        
        // Initial color (cyan)
        lineColors[i6] = 0.29;
        lineColors[i6 + 1] = 0.77;
        lineColors[i6 + 2] = 0.71;
        lineColors[i6 + 3] = 0.29;
        lineColors[i6 + 4] = 0.77;
        lineColors[i6 + 5] = 0.71;
        
        // Strength
        lineStrengths[i2] = conn.strength;
        lineStrengths[i2 + 1] = conn.strength;
    });

    const connectionsGeometry = new THREE.BufferGeometry();
    connectionsGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    connectionsGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    connectionsGeometry.setAttribute('aStrength', new THREE.BufferAttribute(lineStrengths, 1));

    const connectionsMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });

    const connectionLines = new THREE.LineSegments(connectionsGeometry, connectionsMaterial);
    scene.add(connectionLines);

    // ===========================
    // SIGNAL PROPAGATION SYSTEM
    // ===========================
    
    // Signal class to track current flowing through connections
    class Signal {
        constructor(connectionIndex, direction, color) {
            this.connectionIndex = connectionIndex;
            this.progress = 0.0; // 0 to 1 along the connection
            this.direction = direction; // 'forward' or 'backward'
            this.speed = signalSpeed;
            this.color = color; // THREE.Color
            this.intensity = 1.0; // Brightness multiplier
        }
        
        update(deltaTime) {
            this.progress += this.speed * deltaTime;
            
            // Fade out as it reaches the end
            if (this.progress > 0.8) {
                this.intensity = (1.0 - this.progress) / 0.2;
            }
            
            return this.progress >= 1.0; // Return true when complete
        }
    }
    
    const activeSignals = [];
    
    // Function to fire a node and propagate signals
    function fireNode(nodeIndex) {
        const node = nodeArray[nodeIndex];
        node.activation = 1.0;
        
        // Send signals through all connections from this node
        node.connections.forEach(connIndex => {
            const conn = connections[connIndex];
            
            // Determine direction and color
            const isStartNode = conn.startNode === nodeIndex;
            const direction = isStartNode ? 'forward' : 'backward';
            const color = isStartNode ? 
                new THREE.Color(0x49c5b6) : // Forward = Cyan
                new THREE.Color(0xFF9398);  // Backward = Pink
            
            // Create new signal
            activeSignals.push(new Signal(connIndex, direction, color));
        });
    }
    
    // Initialize with some random activations
    for (let i = 0; i < 5; i++) {
        fireNode(Math.floor(Math.random() * nodeCount));
    }

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
        
        // Decay node activations
        nodeArray.forEach(node => {
            node.activation *= 0.95; // Decay
        });
        
        // Random node firing (forward propagation)
        if (Math.random() < activationProbability) {
            fireNode(Math.floor(Math.random() * nodeCount));
        }
        
        // Update all active signals and render them on connections
        const colorArray = connectionsGeometry.attributes.color.array;
        
        // Reset all connections to base cyan color with low opacity
        for (let i = 0; i < connections.length; i++) {
            const i6 = i * 6;
            const baseIntensity = 0.2;
            
            // Start point
            colorArray[i6] = 0.29 * baseIntensity;
            colorArray[i6 + 1] = 0.77 * baseIntensity;
            colorArray[i6 + 2] = 0.71 * baseIntensity;
            
            // End point
            colorArray[i6 + 3] = 0.29 * baseIntensity;
            colorArray[i6 + 4] = 0.77 * baseIntensity;
            colorArray[i6 + 5] = 0.71 * baseIntensity;
        }
        
        // Update signals
        for (let i = activeSignals.length - 1; i >= 0; i--) {
            const signal = activeSignals[i];
            const isComplete = signal.update(deltaTime);
            
            if (isComplete) {
                // Signal reached end, activate the target node
                const conn = connections[signal.connectionIndex];
                const targetNode = signal.direction === 'forward' ? conn.endNode : conn.startNode;
                
                // Chance to propagate further (creates chain reactions)
                if (Math.random() < 0.3) {
                    fireNode(targetNode);
                }
                
                // Remove signal
                activeSignals.splice(i, 1);
                continue;
            }
            
            // Render signal on connection
            const connIndex = signal.connectionIndex;
            const i6 = connIndex * 6;
            
            // Calculate signal position and glow effect
            const progress = signal.progress;
            const glowRadius = 0.15; // How much of the line glows
            
            // Apply glow to line segments near the signal
            for (let segment = 0; segment < 2; segment++) {
                const segmentProgress = segment === 0 ? 0 : 1;
                const distanceToSignal = Math.abs(segmentProgress - progress);
                
                if (distanceToSignal < glowRadius) {
                    // Calculate glow intensity (gaussian-like falloff)
                    const glowStrength = (1.0 - distanceToSignal / glowRadius) * signal.intensity;
                    
                    const baseIndex = i6 + segment * 3;
                    
                    // Blend signal color with base color
                    colorArray[baseIndex] += signal.color.r * glowStrength * 2.0;
                    colorArray[baseIndex + 1] += signal.color.g * glowStrength * 2.0;
                    colorArray[baseIndex + 2] += signal.color.b * glowStrength * 2.0;
                }
            }
        }
        
        // Mark colors as needing update
        connectionsGeometry.attributes.color.needsUpdate = true;
        
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
