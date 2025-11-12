// ===========================
// DEEP NEURAL NETWORK BACKGROUND - FULL SCREEN
// ===========================
import * as THREE from "three";

export function initThreeJS() {
  console.log("🧠 Neural Network Background: Initializing full-screen network...");

  // --- SCENE, CAMERA, RENDERER ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75, // Wider FOV for more dramatic perspective
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 20); // Closer to the network

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("❌ ERROR: canvas-container element not found!");
    return;
  }
  container.appendChild(renderer.domElement);
  console.log("✓ Renderer attached");

  // --- NETWORK STRUCTURE PARAMETERS ---
  const layers = 6; // Fewer layers but more spread out
  const nodesPerLayer = 50; // More nodes per layer
  const layerSpacing = 12; // More space between layers
  const nodeRadius = 0.25;
  
  // Calculate spread based on viewport to fill screen
  const aspectRatio = window.innerWidth / window.innerHeight;
  const spreadX = 35 * aspectRatio; // Horizontal spread adapts to screen width
  const spreadY = 35; // Vertical spread
  const spreadZ = 50; // Deep spread front-to-back

  const nodes = [];
  const connections = [];

  console.log(`Spread: X=${spreadX}, Y=${spreadY}, Z=${spreadZ}`);

  // --- NODE GEOMETRY + MATERIAL ---
  const nodeGeometry = new THREE.SphereGeometry(nodeRadius, 16, 16);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x49c5b6,
    transparent: true,
    opacity: 0.8,
  });

  // --- CREATE NODES IN LAYERS (with wide distribution) ---
  for (let l = 0; l < layers; l++) {
    const layerProgress = l / (layers - 1); // 0 to 1
    
    for (let i = 0; i < nodesPerLayer; i++) {
      // Distribute widely across screen with some clustering
      const clusterX = (Math.random() - 0.5) * 0.3;
      const clusterY = (Math.random() - 0.5) * 0.3;
      
      const x = (Math.random() - 0.5 + clusterX) * spreadX;
      const y = (Math.random() - 0.5 + clusterY) * spreadY;
      const z = layerProgress * spreadZ - spreadZ / 2;
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
      node.position.set(x, y, z);
      
      // Color gradient from cyan to pink based on depth
      const hue = 0.5 + layerProgress * 0.1; // Cyan to slightly pink
      node.material.color.setHSL(hue, 1.0, 0.6);
      
      node.userData = {
        activation: Math.random(),
        layer: l,
        baseScale: 0.8 + Math.random() * 0.4, // Vary sizes
        pulseOffset: Math.random() * Math.PI * 2
      };
      
      scene.add(node);
      nodes.push(node);
    }
  }

  console.log(`✓ Created ${nodes.length} nodes across ${layers} layers`);

  // --- CREATE CONNECTIONS (Connect nearby nodes + some cross-layer) ---
  const connectionMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.25,
  });

  const positions = [];
  const colors = [];
  const maxDistance = 15; // Max distance for connections
  const connectionProbability = 0.15; // Lower probability for cleaner look

  // Connect nodes within same layer and adjacent layers
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    let connectionCount = 0;
    const maxConnectionsPerNode = 8;
    
    for (let j = i + 1; j < nodes.length; j++) {
      if (connectionCount >= maxConnectionsPerNode) break;
      
      const nodeB = nodes[j];
      const layerDiff = Math.abs(nodeA.userData.layer - nodeB.userData.layer);
      
      // Only connect within same layer or adjacent layers
      if (layerDiff <= 1) {
        const distance = nodeA.position.distanceTo(nodeB.position);
        
        if (distance < maxDistance && Math.random() < connectionProbability) {
          positions.push(
            nodeA.position.x, nodeA.position.y, nodeA.position.z,
            nodeB.position.x, nodeB.position.y, nodeB.position.z
          );
          
          // Connection color based on layer
          const avgLayer = (nodeA.userData.layer + nodeB.userData.layer) / 2;
          const hue = 0.5 + (avgLayer / layers) * 0.1;
          const color = new THREE.Color().setHSL(hue, 1.0, 0.6);
          colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
          
          connections.push({
            a: nodeA,
            b: nodeB,
            signal: Math.random(),
            strength: 1.0 - (distance / maxDistance)
          });
          
          connectionCount++;
        }
      }
    }
  }

  const connectionGeometry = new THREE.BufferGeometry();
  connectionGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  connectionGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colors, 3)
  );
  
  const connectionLines = new THREE.LineSegments(
    connectionGeometry,
    connectionMaterial
  );
  scene.add(connectionLines);

  console.log(`✓ Created ${connections.length} connections`);

  // --- MOUSE INTERACTION ---
  const mouse = new THREE.Vector2(0, 0);
  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- SIGNAL COLORS ---
  const signalColorA = new THREE.Color(0x49c5b6); // Cyan
  const signalColorB = new THREE.Color(0xFF9398); // Pink

  // --- ANIMATION LOOP ---
  const clock = new THREE.Clock();
  let scrollY = 0;
  
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  function animate() {
    requestAnimationFrame(animate);
    
    const t = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Update nodes
    nodes.forEach((node) => {
      // Mouse attraction effect (stronger)
      const screenX = mouse.x * spreadX * 0.4;
      const screenY = mouse.y * spreadY * 0.4;
      const dist = Math.sqrt(
        Math.pow(node.position.x - screenX, 2) +
        Math.pow(node.position.y - screenY, 2)
      );
      const influence = Math.max(0, 1 - dist / 20);
      const baseScale = node.userData.baseScale;
      node.scale.setScalar(baseScale * (1 + influence * 0.6));

      // Pulsating color and glow
      const pulseSpeed = 2 + node.userData.activation * 2;
      const intensity = Math.sin(t * pulseSpeed + node.userData.pulseOffset) * 0.5 + 0.5;
      node.material.color.lerpColors(signalColorA, signalColorB, intensity * 0.3);
      node.material.opacity = 0.5 + intensity * 0.4;
      
      // Subtle floating animation
      node.position.y += Math.sin(t + node.userData.pulseOffset) * 0.002;
    });

    // Update connection colors (signal flow)
    const col = connectionGeometry.attributes.color.array;
    
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      conn.signal += delta * 1.5;
      if (conn.signal > 1) conn.signal = 0;

      // Create traveling pulse effect
      const pulsePos = conn.signal;
      const pulseWidth = 0.2;
      const pulseIntensity = Math.max(0, 1 - Math.abs(pulsePos - 0.5) / pulseWidth);
      
      const colorPhase = (Math.sin(t * 3 + i * 0.1) + 1) / 2;
      const baseColor = new THREE.Color().lerpColors(
        signalColorA,
        signalColorB,
        colorPhase
      );
      
      // Brighten where pulse is
      const brightColor = baseColor.clone().multiplyScalar(1 + pulseIntensity * 2);

      const bi = i * 6;
      col[bi] = brightColor.r * conn.strength;
      col[bi + 1] = brightColor.g * conn.strength;
      col[bi + 2] = brightColor.b * conn.strength;
      col[bi + 3] = brightColor.r * conn.strength;
      col[bi + 4] = brightColor.g * conn.strength;
      col[bi + 5] = brightColor.b * conn.strength;
    }

    connectionGeometry.attributes.color.needsUpdate = true;

    // Gentle rotation for 3D depth perception
    scene.rotation.y = Math.sin(t * 0.05) * 0.15;
    scene.rotation.x = Math.cos(t * 0.03) * 0.08;

    // Camera responds to scroll
    camera.position.y = -scrollY * 0.003;
    camera.position.x = Math.sin(mouse.x * 0.3) * 2;
    camera.lookAt(0, camera.position.y, 0);

    renderer.render(scene, camera);
  }

  animate();
  console.log("🎬 Full-screen neural network is live!");

  // --- RESIZE HANDLER ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
