// ===========================
// DEEP NEURAL NETWORK BACKGROUND (THREE.JS) - DEBUG VERSION
// ===========================
import * as THREE from "three";

export function initThreeJS() {
  console.log("🧠 Neural Network Background: Starting initialization...");

  // --- SCENE, CAMERA, RENDERER ---
  const scene = new THREE.Scene();
  console.log("✓ Scene created");

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 40);
  console.log("✓ Camera positioned at:", camera.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("❌ ERROR: canvas-container element not found!");
    return;
  }
  container.appendChild(renderer.domElement);
  console.log("✓ Renderer attached to DOM");

  // --- NETWORK STRUCTURE PARAMETERS ---
  const layers = 8;
  const nodesPerLayer = 40;
  const layerSpacing = 8;
  const nodeRadius = 0.3;

  const nodes = [];
  const connections = [];

  console.log(`Creating ${layers} layers with ${nodesPerLayer} nodes each...`);

  // --- NODE GEOMETRY + MATERIAL ---
  const nodeGeometry = new THREE.SphereGeometry(nodeRadius, 12, 12);
  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
  });

  // --- CREATE NODES ---
  for (let l = 0; l < layers; l++) {
    const radius = 6;
    for (let i = 0; i < nodesPerLayer; i++) {
      const x = (Math.random() - 0.5) * radius * 2;
      const y = (Math.random() - 0.5) * radius * 2;
      const z = l * layerSpacing - (layers * layerSpacing) / 2;
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
      node.position.set(x, y, z);
      node.material.color.setHSL(0.5 + Math.random() * 0.1, 1.0, 0.6);
      node.userData = { activation: Math.random() * 0.5, layer: l };
      
      scene.add(node);
      nodes.push(node);
    }
  }

  console.log(`✓ Created ${nodes.length} nodes`);

  // --- CREATE CONNECTIONS ---
  const connectionMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.35,
  });

  const positions = [];
  const colors = [];

  for (let l = 0; l < layers - 1; l++) {
    const current = nodes.filter((n) => n.userData.layer === l);
    const next = nodes.filter((n) => n.userData.layer === l + 1);
    
    for (let a of current) {
      for (let b of next) {
        if (Math.random() < 0.2) {
          positions.push(
            a.position.x, a.position.y, a.position.z,
            b.position.x, b.position.y, b.position.z
          );
          
          const c = new THREE.Color(0x49c5b6);
          colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
          connections.push({ a, b, signal: Math.random() });
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
  let frameCount = 0;

  function animate() {
    requestAnimationFrame(animate);
    
    const t = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Log first frame to confirm animation is running
    if (frameCount === 0) {
      console.log("✓ Animation loop started!");
    }
    frameCount++;

    // Update node glow + hover attraction
    nodes.forEach((node) => {
      const dist = Math.sqrt(
        Math.pow(node.position.x - mouse.x * 20, 2) +
        Math.pow(node.position.y - mouse.y * 10, 2)
      );
      const influence = Math.max(0, 1 - dist / 10);
      node.scale.setScalar(1 + influence * 0.5);

      // Pulsating color
      const a = node.userData.activation;
      const intensity = Math.sin(t * 3 + a * 5) * 0.5 + 0.5;
      node.material.color.lerpColors(signalColorA, signalColorB, intensity);
      node.material.opacity = 0.6 + intensity * 0.3;
    });

    // Update connections
    const pos = connectionGeometry.attributes.position.array;
    const col = connectionGeometry.attributes.color.array;

    for (let i = 0; i < connections.length; i++) {
      const c = connections[i];
      c.signal += delta * 2;
      if (c.signal > 1) c.signal = 0;

      const colorPhase = (Math.sin(t * 5 + i) + 1) / 2;
      const mixColor = new THREE.Color().lerpColors(
        signalColorA,
        signalColorB,
        colorPhase
      );

      const bi = i * 6;
      col[bi] = mixColor.r;
      col[bi + 1] = mixColor.g;
      col[bi + 2] = mixColor.b;
      col[bi + 3] = mixColor.r;
      col[bi + 4] = mixColor.g;
      col[bi + 5] = mixColor.b;

      // Vibrate connections
      pos[bi] = c.a.position.x + Math.sin(t * 3 + i) * 0.02;
      pos[bi + 1] = c.a.position.y + Math.cos(t * 3 + i) * 0.02;
      pos[bi + 3] = c.b.position.x + Math.sin(t * 3 + i) * 0.02;
      pos[bi + 4] = c.b.position.y + Math.cos(t * 3 + i) * 0.02;
    }

    connectionGeometry.attributes.position.needsUpdate = true;
    connectionGeometry.attributes.color.needsUpdate = true;

    // Rotate slowly
    scene.rotation.y = Math.sin(t * 0.1) * 0.2;
    scene.rotation.x = Math.cos(t * 0.05) * 0.1;

    renderer.render(scene, camera);
  }

  animate();
  console.log("🎬 Animation started - you should see the network now!");

  // --- RESIZE HANDLER ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("📐 Window resized");
  });
}
