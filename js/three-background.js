// nn-background.js
// Minimal, high-performance layered neural network background using THREE.js
// Features:
// - Layered "deep" structure (feed-forward style)
// - Thin connections (LineSegments) and glowing nodes (InstancedMesh)
// - Animated traveling "signals" on connections
// - Mouse attraction: nodes gently move/toward cursor (absorbed feeling)
// - Optimized: instancing for nodes, single buffer geometry for lines

import * as THREE from "three";

export function initThreeJS({
  containerId = "canvas-container",
  layers = 8,
  nodesPerLayer = 36,
  layerSpacing = 7,
  nodeRadius = 0.22,
  connectionProb = 0.18, // probability to connect node->node in adjacent layers
} = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initNNBackground: missing container '#${containerId}'`);
    return;
  }

  // --- renderer / scene / camera
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 36);

  // -- simple fog for depth feel (optional)
  scene.fog = new THREE.FogExp2(0x0b0f16, 0.004);

  // --- create layered nodes positions
  const allNodes = []; // {pos: Vector3, velocity: Vector3, layer, id}
  for (let l = 0; l < layers; l++) {
    const z = l * layerSpacing - ((layers - 1) * layerSpacing) / 2;
    const radius = 6 - Math.abs(l - (layers - 1) / 2) * 0.5; // slightly tighter center
    for (let i = 0; i < nodesPerLayer; i++) {
      // distribute in disk-ish area for each layer
      const angle = Math.random() * Math.PI * 2;
      const r = (Math.random() ** 0.7) * radius;
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.6;
      const y = Math.sin(angle) * r + (Math.random() - 0.5) * 0.6;
      allNodes.push({
        pos: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(),
        layer: l,
        id: allNodes.length,
        activation: Math.random() * 0.25,
      });
    }
  }

  // --- connections between adjacent layers (feed-forward)
  // Each connection: {aIndex, bIndex, length, baseColor, signalPhase}
  const connections = [];
  const layerIndexOffsets = (layer) => layer * nodesPerLayer;
  for (let l = 0; l < layers - 1; l++) {
    const startOffset = layerIndexOffsets(l);
    const endOffset = layerIndexOffsets(l + 1);
    for (let i = 0; i < nodesPerLayer; i++) {
      for (let j = 0; j < nodesPerLayer; j++) {
        if (Math.random() < connectionProb) {
          const aIdx = startOffset + i;
          const bIdx = endOffset + j;
          const a = allNodes[aIdx], b = allNodes[bIdx];
          const len = a.pos.distanceTo(b.pos);
          connections.push({
            aIndex: aIdx,
            bIndex: bIdx,
            length: len,
            signal: Math.random(), // current traveling phase [0,1]
            speed: 0.4 + Math.random() * 0.8,
            weight: 0.3 + Math.random() * 0.7,
          });
        }
      }
    }
  }
  console.log("nodes:", allNodes.length, "connections:", connections.length);

  // --- Node instanced mesh (efficient)
  const nodeGeom = new THREE.SphereGeometry(nodeRadius, 10, 8);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: 0x9be7ff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const instCount = allNodes.length;
  const nodesInst = new THREE.InstancedMesh(nodeGeom, nodeMat, instCount);
  nodesInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(nodesInst);

  // We'll use per-instance colors for subtle variation
  const instColors = new Float32Array(instCount * 3);
  for (let i = 0; i < instCount; i++) {
    const col = new THREE.Color().setHSL(0.52 + Math.random() * 0.03, 0.85, 0.56);
    instColors[i * 3] = col.r;
    instColors[i * 3 + 1] = col.g;
    instColors[i * 3 + 2] = col.b;
  }
  // Attach instance color attribute via a simple workaround: small per-instance material arrays are heavy,
  // so we'll handle per-instance color via vertex shader only if needed. For this simple basic material we just tint globally.

  // initialize instance matrices
  const dummy = new THREE.Object3D();
  for (let i = 0; i < allNodes.length; i++) {
    const p = allNodes[i].pos;
    dummy.position.copy(p);
    dummy.scale.setScalar(1 + (allNodes[i].activation * 0.8));
    dummy.updateMatrix();
    nodesInst.setMatrixAt(i, dummy.matrix);
  }
  nodesInst.instanceMatrix.needsUpdate = true;

  // --- Connections as a single LineSegments buffer geometry ---
  const posArr = new Float32Array(connections.length * 2 * 3); // start + end, xyz
  const colArr = new Float32Array(connections.length * 2 * 3); // colors per vertex
  for (let i = 0; i < connections.length; i++) {
    const c = connections[i];
    const a = allNodes[c.aIndex].pos;
    const b = allNodes[c.bIndex].pos;
    const baseCol = new THREE.Color().setHSL(0.54, 0.6, 0.55); // soft cyan
    // start
    posArr[i * 6 + 0] = a.x;
    posArr[i * 6 + 1] = a.y;
    posArr[i * 6 + 2] = a.z;
    colArr[i * 6 + 0] = baseCol.r;
    colArr[i * 6 + 1] = baseCol.g;
    colArr[i * 6 + 2] = baseCol.b;
    // end
    posArr[i * 6 + 3] = b.x;
    posArr[i * 6 + 4] = b.y;
    posArr[i * 6 + 5] = b.z;
    colArr[i * 6 + 3] = baseCol.r;
    colArr[i * 6 + 4] = baseCol.g;
    colArr[i * 6 + 5] = baseCol.b;
  }

  const connGeom = new THREE.BufferGeometry();
  connGeom.setAttribute("position", new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage));
  connGeom.setAttribute("color", new THREE.BufferAttribute(colArr, 3).setUsage(THREE.DynamicDrawUsage));

  const connMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.35,
    linewidth: 1, // note: linewidth may not work in all browsers; effect remains subtle
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const connLines = new THREE.LineSegments(connGeom, connMat);
  scene.add(connLines);

  // --- Mouse interaction (world point on z=0 plane) ---
  const mouse = new THREE.Vector2(-999, -999);
  const mouseWorld = new THREE.Vector3(999, 999, 999);
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z=0 plane
  function onMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouse.set(x, y);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseWorld);
  }
  window.addEventListener("mousemove", onMove, { passive: true });

  // --- simple helper: distance falloff function ---
  const falloff = (d, radius) => Math.max(0, 1 - (d / radius) ** 2);

  // --- Animation state ---
  const clock = new THREE.Clock();
  let lastT = 0;

  function animate() {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - lastT);
    lastT = t;

    // subtle global rotation and camera jitter for depth
    scene.rotation.y = Math.sin(t * 0.05) * 0.12;
    scene.rotation.x = Math.sin(t * 0.022) * 0.04;

    // --- update node positions (apply attraction toward mouse and small noise drift)
    const attractionRadius = 6.0;
    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      // drift (soft)
      n.velocity.x += (Math.sin(t * 0.3 + i) * 0.0008 - n.velocity.x) * 0.02;
      n.velocity.y += (Math.cos(t * 0.27 + i * 0.7) * 0.0008 - n.velocity.y) * 0.02;

      // attraction to mouse
      const d2 = mouseWorld.distanceToSquared(n.pos);
      if (d2 < attractionRadius * attractionRadius) {
        const d = Math.sqrt(d2);
        const f = falloff(d, attractionRadius) * 0.28 * (1 + n.activation);
        const dir = new THREE.Vector3().subVectors(mouseWorld, n.pos).multiplyScalar(f);
        n.velocity.add(dir);
      } else {
        // small restore force to original layer region so nodes don't drift forever
        const baseZ = n.layer * layerSpacing - ((layers - 1) * layerSpacing) / 2;
        const zDiff = baseZ - n.pos.z;
        n.velocity.z += zDiff * 0.002;
      }

      // damping
      n.velocity.multiplyScalar(0.92);

      // apply velocity
      n.pos.addScaledVector(n.velocity, Math.min(1, dt * 60 * 0.6));
    }

    // update instanced mesh matrices
    for (let i = 0; i < allNodes.length; i++) {
      const p = allNodes[i].pos;
      const scale = 1 + Math.max(0, allNodes[i].activation) * 0.8;
      dummy.position.copy(p);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      nodesInst.setMatrixAt(i, dummy.matrix);
    }
    nodesInst.instanceMatrix.needsUpdate = true;

    // --- update connections buffers and animate traveling signals (glow)
    const posBuf = connGeom.attributes.position.array;
    const colBuf = connGeom.attributes.color.array;

    // base color
    const baseColor = new THREE.Color().setHSL(0.54, 0.6, 0.55);
    const signalColor = new THREE.Color().setHSL(0.93, 0.9, 0.82); // pink-ish highlight for current

    for (let i = 0; i < connections.length; i++) {
      const c = connections[i];
      const aPos = allNodes[c.aIndex].pos;
      const bPos = allNodes[c.bIndex].pos;
      const bi = i * 6;

      // write positions (slight pulse jitter)
      posBuf[bi + 0] = aPos.x + Math.sin(t * 2 + i) * 0.005;
      posBuf[bi + 1] = aPos.y + Math.cos(t * 1.7 + i * 0.9) * 0.005;
      posBuf[bi + 2] = aPos.z;
      posBuf[bi + 3] = bPos.x + Math.cos(t * 2.1 + i) * 0.005;
      posBuf[bi + 4] = bPos.y + Math.sin(t * 1.6 + i * 0.8) * 0.005;
      posBuf[bi + 5] = bPos.z;

      // advance signal
      c.signal += c.speed * dt * 0.18;
      if (c.signal > 1.2) c.signal = Math.random() * 0.05; // restart with small random gap

      // compute glow blend on endpoints
      // endpoints distances to signal (0..1) (approx using segment projection)
      const pA = aPos;
      const pB = bPos;
      // approximate endpoint proximity with signal value:
      const s = c.signal;
      const glowA = Math.max(0, 1 - Math.abs(s - 0.0) * 6) * c.weight;
      const glowB = Math.max(0, 1 - Math.abs(s - 1.0) * 6) * c.weight;
      const midGlow = Math.max(0, 1 - Math.abs(s - 0.5) * 4) * c.weight;

      // start color = base * (1 - glow) + signalColor * glow
      const startMix = Math.min(1, 0.15 + glowA * 1.6 + midGlow * 0.6);
      const endMix = Math.min(1, 0.15 + glowB * 1.6 + midGlow * 0.6);

      // lerp for start
      colBuf[bi + 0] = THREE.MathUtils.lerp(baseColor.r, signalColor.r, startMix);
      colBuf[bi + 1] = THREE.MathUtils.lerp(baseColor.g, signalColor.g, startMix);
      colBuf[bi + 2] = THREE.MathUtils.lerp(baseColor.b, signalColor.b, startMix);
      // lerp for end
      colBuf[bi + 3] = THREE.MathUtils.lerp(baseColor.r, signalColor.r, endMix);
      colBuf[bi + 4] = THREE.MathUtils.lerp(baseColor.g, signalColor.g, endMix);
      colBuf[bi + 5] = THREE.MathUtils.lerp(baseColor.b, signalColor.b, endMix);
    }
    connGeom.attributes.position.needsUpdate = true;
    connGeom.attributes.color.needsUpdate = true;

    // subtle camera sway based on mouse
    camera.position.x += (mouse.x * 8 - camera.position.x) * 0.04;
    camera.position.y += (mouse.y * 4 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // start
  animate();

  // --- resize handling
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);

  // --- expose a simple API to trigger "firing" a layer (propagate activation)
  function pulseLayer(layerIndex, intensity = 1.0) {
    const start = layerIndex * nodesPerLayer;
    for (let i = start; i < start + nodesPerLayer; i++) {
      allNodes[i].activation = Math.min(1, allNodes[i].activation + 0.5 * intensity);
      // push a quick velocity outward so it feels like a spike
      allNodes[i].velocity.add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0));
    }
  }

  return { scene, camera, renderer, pulseLayer, dispose };

  // dispose function to clean up when needed
  function dispose() {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    nodesInst.geometry.dispose();
    nodesInst.material.dispose();
    connGeom.dispose();
    connMat.dispose();
    container.removeChild(renderer.domElement);
  }
}
