// ===========================
// DEEP NEURAL NETWORK BACKGROUND - MASSIVE EXPANSION
// ===========================
import * as THREE from "three";

export function initThreeJS() {
  console.log("🧠 Neural Network Background: Creating MASSIVE network...");

  // --- SCENE, CAMERA, RENDERER ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    90, // VERY WIDE field of view
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 15); // MUCH closer to network

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

  // --- MASSIVE NETWORK PARAMETERS ---
  const nodeCount = 400; // Many more nodes
  const connectionDistance = 25; // Connect farther nodes
  const maxConnections = 12;
  
  // HUGE spread - nodes will be WAY outside viewport
  const spreadX = 80; // Massive horizontal spread
  const spreadY = 80; // Massive vertical spread
  const spreadZ = 100; // Deep 3D space

  console.log(`Creating HUGE network: ${spreadX}x${spreadY}x${spreadZ}`);

  const nodes = [];
  const connections = [];

  // --- NODE GEOMETRY + MATERIAL ---
  const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x49c5b6,
    transparent: true,
    opacity: 0.8,
  });

  // --- CREATE NODES (SCATTERED EVERYWHERE) ---
  for (let i = 0; i < nodeCount; i++) {
    // Random distribution across ENTIRE volume
    const x = (Math.random() - 0.5) * spreadX;
    const y = (Math.random() - 0.5) * spreadY;
    const z = (Math.random() - 0.5) * spreadZ;
    
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
    node.position.set(x, y, z);
    
    // Color based on Z depth
    const depthRatio = (z + spreadZ / 2) / spreadZ;
    const hue = 0.48 + depthRatio * 0.12; // Cyan to pink gradient
    node.material.color.setHSL(hue, 1.0, 0.6);
    
    node.userData = {
      activation: Math.random(),
      baseScale: 0.6 + Math.random() * 0.8,
      pulseOffset: Math.random() * Math.PI * 2,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.005
      )
    };
    
    scene.add(node);
    nodes.push(node);
  }

  console.log(`✓ Created ${nodes.length} nodes scattered everywhere`);

  // --- CREATE CONNECTIONS ---
  const connectionMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.2,
  });

  const positions = [];
  const colors = [];

  // Connect nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    let connectionCount = 0;
    
    for (let j = i + 1; j < nodes.length; j++) {
      if (connectionCount >= maxConnections) break;
      
      const nodeB = nodes[j];
      const distance = nodeA.position.distanceTo(nodeB.position);
      
      if (distance < connectionDistance) {
        positions.push(
          nodeA.position.x, nodeA.position.y, nodeA.position.z,
          nodeB.position.x, nodeB.position.y, nodeB.position.z
        );
        
        // Color gradient
        const avgZ = (nodeA.position.z + nodeB.position.z) / 2;
        const depthRatio = (avgZ + spreadZ / 2) / spreadZ;
        const color = new THREE.Color().setHSL(0.48 + depthRatio * 0.12, 1.0, 0.6);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
        
        connections.push({
          a: nodeA,
          b: nodeB,
          signal: Math.random(),
          strength: 1.0 - (distance / connectionDistance),
          index: connections.length
        });
        
        connectionCount++;
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
  console.log(`✓ Network spans from -${spreadX/2} to +${spreadX/2} on X axis`);
  console.log(`✓ Network spans from -${spreadY/2} to +${spreadY/2} on Y axis`);
  console.log(`✓ Network depth: -${spreadZ/2} to +${spreadZ/2} on Z axis`);

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
      // Slow floating drift
      node.position.add(node.userData.velocity);
      
      // Bounce back if too far (keep in bounds loosely)
      if (Math.abs(node.position.x) > spreadX * 0.6) {
        node.userData.velocity.x *= -0.5;
      }
      if (Math.abs(node.position.y) > spreadY * 0.6) {
        node.userData.velocity.y *= -0.5;
      }
      if (Math.abs(node.position.z) > spreadZ * 0.6) {
        node.userData.velocity.z *= -0.5;
      }

      // Mouse repulsion (push nodes away from cursor)
      const screenX = mouse.x * 40;
      const screenY = mouse.y * 40;
      const dx = node.position.x - screenX;
      const dy = node.position.y - screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 20) {
        const force = (1 - dist / 20) * 0.5;
        node.position.x += (dx / dist) * force;
        node.position.y += (dy / dist) * force;
      }

      // Pulsating size and color
      const pulseSpeed = 2 + node.userData.activation * 2;
      const intensity = Math.sin(t * pulseSpeed + node.userData.pulseOffset) * 0.5 + 0.5;
      const baseScale = node.userData.baseScale;
      node.scale.setScalar(baseScale * (0.8 + intensity * 0.4));
      
      node.material.color.lerpColors(signalColorA, signalColorB, intensity * 0.4);
      node.material.opacity = 0.4 + intensity * 0.5;
    });

    // Update connections dynamically (follow nodes)
    const pos = connectionGeometry.attributes.position.array;
    const col = connectionGeometry.attributes.color.array;
    
    for (let i = 0; i < connections.length; i++) {
      const conn = connections[i];
      
      // Update connection positions (nodes moved)
      const bi = i * 6;
      pos[bi] = conn.a.position.x;
      pos[bi + 1] = conn.a.position.y;
      pos[bi + 2] = conn.a.position.z;
      pos[bi + 3] = conn.b.position.x;
      pos[bi + 4] = conn.b.position.y;
      pos[bi + 5] = conn.b.position.z;
      
      // Signal flow
      conn.signal += delta * 1.5;
      if (conn.signal > 1) conn.signal = 0;

      // Create traveling pulse
      const pulsePos = conn.signal;
      const pulseWidth = 0.15;
      const dist = Math.abs(pulsePos - 0.5);
      const pulseIntensity = Math.max(0, 1 - dist / pulseWidth);
      
      const colorPhase = (Math.sin(t * 2 + i * 0.1) + 1) / 2;
      const baseColor = new THREE.Color().lerpColors(
        signalColorA,
        signalColorB,
        colorPhase
      );
      
      const brightColor = baseColor.clone().multiplyScalar(0.5 + pulseIntensity * 1.5);

      col[bi] = brightColor.r * conn.strength;
      col[bi + 1] = brightColor.g * conn.strength;
      col[bi + 2] = brightColor.b * conn.strength;
      col[bi + 3] = brightColor.r * conn.strength;
      col[bi + 4] = brightColor.g * conn.strength;
      col[bi + 5] = brightColor.b * conn.strength;
    }

    connectionGeometry.attributes.position.needsUpdate = true;
    connectionGeometry.attributes.color.needsUpdate = true;

    // Slow rotation for 3D effect
    scene.rotation.y = Math.sin(t * 0.05) * 0.2;
    scene.rotation.x = Math.cos(t * 0.03) * 0.1;

    // Camera movement
    camera.position.x = Math.sin(mouse.x * 0.5) * 3;
    camera.position.y = Math.cos(mouse.y * 0.5) * 3 - scrollY * 0.005;
    camera.lookAt(0, camera.position.y, 0);

    renderer.render(scene, camera);
  }

  animate();
  console.log("🎬 MASSIVE network is LIVE! Nodes everywhere!");

  // --- RESIZE HANDLER ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
