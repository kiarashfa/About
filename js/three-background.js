// ===========================
// THREE.JS 3D BACKGROUND
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

    camera.position.z = 5;

    // Custom vertex shader for particles
    const particleVertexShader = `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uSize;
        
        attribute float aScale;
        attribute vec3 aRandomness;
        
        varying vec3 vColor;
        
        void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            // Wave effect
            float distanceToMouse = distance(modelPosition.xy, uMouse * 10.0);
            float wave = sin(distanceToMouse * 2.0 - uTime * 2.0) * 0.3;
            modelPosition.z += wave;
            
            // Add randomness
            modelPosition.xyz += aRandomness * sin(uTime + position.x * 10.0) * 0.1;
            
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            
            gl_Position = projectedPosition;
            gl_PointSize = uSize * aScale * (1.0 / -viewPosition.z);
            
            // Color based on position and time
            vColor = vec3(
                0.5 + 0.5 * sin(uTime + position.x * 2.0),
                0.5 + 0.5 * sin(uTime + position.y * 2.0 + 2.0),
                0.5 + 0.5 * sin(uTime + position.z * 2.0 + 4.0)
            );
        }
    `;

    // Custom fragment shader for particles
    const particleFragmentShader = `
        varying vec3 vColor;
        
        void main() {
            // Circular particles
            float strength = distance(gl_PointCoord, vec2(0.5));
            strength = 1.0 - strength;
            strength = pow(strength, 3.0);
            
            vec3 finalColor = mix(vec3(0.29, 0.77, 0.71), vec3(1.0, 0.58, 0.6), vColor.r);
            finalColor = mix(finalColor, vColor, 0.5);
            
            gl_FragColor = vec4(finalColor, strength * 0.6);
        }
    `;

    // Create particle system
    const particleCount = 10000;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const randomness = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Sphere distribution
        const radius = Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        scales[i] = Math.random();
        
        randomness[i3] = (Math.random() - 0.5) * 0.5;
        randomness[i3 + 1] = (Math.random() - 0.5) * 0.5;
        randomness[i3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    particlesGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uSize: { value: 25.0 }
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Background sphere
    const sphereVertexShader = `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const sphereFragmentShader = `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vec2 uv = vUv;
            
            vec3 color1 = vec3(0.05, 0.1, 0.15);
            vec3 color2 = vec3(0.29, 0.77, 0.71);
            vec3 color3 = vec3(1.0, 0.58, 0.6);
            
            float noise = sin(vPosition.x * 5.0 + uTime) * 
                         sin(vPosition.y * 5.0 + uTime * 0.7) * 
                         sin(vPosition.z * 5.0 + uTime * 1.3);
            
            vec3 color = mix(color1, color2, uv.y);
            color = mix(color, color3, noise * 0.5 + 0.5);
            
            gl_FragColor = vec4(color, 0.15);
        }
    `;

    const sphereGeometry = new THREE.SphereGeometry(20, 64, 64);
    const sphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }
        },
        vertexShader: sphereVertexShader,
        fragmentShader: sphereFragmentShader,
        transparent: true,
        side: THREE.BackSide
    });

    const backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(backgroundSphere);

    // Mouse interaction
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation loop
    const clock = new THREE.Clock();
    let scrollY = 0;
    
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });
    
    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        
        // Update shader uniforms
        particlesMaterial.uniforms.uTime.value = elapsedTime;
        particlesMaterial.uniforms.uMouse.value = mouse;
        sphereMaterial.uniforms.uTime.value = elapsedTime;
        
        // Rotate particle system
        particles.rotation.y = elapsedTime * 0.03;
        particles.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2;
        
        // Camera movement with mouse
        camera.position.x = Math.sin(mouse.x * 0.3) * 2;
        camera.position.y = Math.cos(mouse.y * 0.3) * 2 - scrollY * 0.0015;
        camera.lookAt(scene.position);
        
        // Rotate background
        backgroundSphere.rotation.y = elapsedTime * 0.01;
        backgroundSphere.rotation.x = elapsedTime * 0.005;
        
        renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
