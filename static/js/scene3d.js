/**
 * AI Accident Guard — 3D Spatial Roadway Digital Twin
 * Themed: Industrial Gunmetal & Highway Safety Hazard Orange
 * Powered by Three.js WebGL & GSAP Camera Choreography
 */

(function () {
  const container = document.getElementById('radar-3d-section');
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

  // Global handles
  window.trigger3DCollisionEffect = triggerCollision;

  let scene, camera, renderer, animationFrameId;
  let roadGroup, vehicleGroup, fxGroup;
  let clock;
  let cameraMode = 'drone'; // 'drone', 'satellite', 'chase', 'lidar'
  let isSceneVisible = true;

  // Mouse interaction state
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let targetRotationY = 0;
  let currentRotationY = 0;
  let targetRotationX = 0.35;
  let currentRotationX = 0.35;
  let targetZoom = 120;
  let currentZoom = 120;

  // Vehicle data
  const vehicles = [];
  const LANE_LEFT = -12;
  const LANE_RIGHT = 12;
  const ROAD_LENGTH = 300;

  function init() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js not loaded, using fallback');
      return;
    }

    clock = new THREE.Clock();

    const isLight = document.body.classList.contains('theme-light') || !document.documentElement.classList.contains('dark');
    const bgColor = isLight ? 0xF1F5F9 : 0x0A0E17;

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, isLight ? 0.0035 : 0.005);

    window.update3DTheme = function(light) {
      if (!scene) return;
      const col = light ? 0xF1F5F9 : 0x0A0E17;
      scene.background.setHex(col);
      scene.fog.color.setHex(col);
      const amb = scene.getObjectByName('ambientLight');
      if (amb) amb.color.setHex(light ? 0xFFFFFF : 0x1e293b);
    };

    // 2. Camera setup
    const aspect = canvas.clientWidth / (canvas.clientHeight || 320);
    camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    setCameraPreset('drone', false);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight || 320);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 4. Lighting
    buildLighting();

    // 5. Roadway (Industrial Asphalt with Hazard Orange Guide Rails)
    roadGroup = new THREE.Group();
    buildRoadway(roadGroup);
    scene.add(roadGroup);

    // 6. Vehicles
    vehicleGroup = new THREE.Group();
    scene.add(vehicleGroup);
    spawnVehicles();

    // 7. FX Group (shockwaves, particles, beacons)
    fxGroup = new THREE.Group();
    scene.add(fxGroup);

    // 8. Event Listeners
    setupInteraction();
    window.addEventListener('resize', onWindowResize);

    // 9. Intersection Observer (Freeze 60fps WebGL when not visible to eliminate lag)
    if ('IntersectionObserver' in window && container) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isSceneVisible = entry.isIntersecting;
          if (isSceneVisible && !animationFrameId) {
            clock.getDelta(); // flush delta
            animate();
          }
        });
      }, { rootMargin: '80px' });
      observer.observe(container);
    }

    // 10. Start animation
    animate();
  }

  function buildLighting() {
    // Industrial Slate Ambient
    const ambient = new THREE.AmbientLight(0x1e293b, 1.5);
    ambient.name = 'ambientLight';
    scene.add(ambient);

    // Hazard Orange Key Directional Light
    const dirLight = new THREE.DirectionalLight(0xf97316, 1.6);
    dirLight.position.set(40, 90, 60);
    scene.add(dirLight);

    // Clean Technical Slate/Moonlight Fill
    const fillLight = new THREE.PointLight(0x94a3b8, 1.2, 200);
    fillLight.position.set(-60, 30, -50);
    scene.add(fillLight);

    // Center Intersection Beacon (Safety Amber)
    const intersectionBeacon = new THREE.PointLight(0xfbbf24, 1.4, 90);
    intersectionBeacon.position.set(0, 8, 0);
    scene.add(intersectionBeacon);
  }

  function buildRoadway(group) {
    // Ground Grid Matrix (Industrial Slate)
    const gridGeo = new THREE.PlaneGeometry(500, 500, 50, 50);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const ground = new THREE.Mesh(gridGeo, gridMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    group.add(ground);

    // Main Asphalt Highway (North-South) — Gunmetal Asphalt
    const roadGeo = new THREE.PlaneGeometry(36, ROAD_LENGTH);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.25
    });
    const mainRoad = new THREE.Mesh(roadGeo, roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    group.add(mainRoad);

    // Cross Highway (East-West Intersection)
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_LENGTH, 32), roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.y = 0.02;
    group.add(crossRoad);

    // Safety Hazard Orange Guardrails
    const railMatOrange = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const railMatAmber = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    function createRail(x, z, len, isHorizontal = false) {
      const geo = isHorizontal ? new THREE.BoxGeometry(len, 0.45, 0.45) : new THREE.BoxGeometry(0.45, 0.45, len);
      const rail = new THREE.Mesh(geo, railMatOrange);
      rail.position.set(x, 0.22, z);
      group.add(rail);
    }

    createRail(-18, 0, ROAD_LENGTH);
    createRail(18, 0, ROAD_LENGTH);
    createRail(0, -16, ROAD_LENGTH, true);
    createRail(0, 16, ROAD_LENGTH, true);

    // High-Vis Dashed Highway Lines (Hazard Amber)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.85 });
    for (let z = -ROAD_LENGTH / 2; z < ROAD_LENGTH / 2; z += 12) {
      if (Math.abs(z) < 20) continue; // Clear intersection center
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 5), dashMat);
      dash.position.set(0, 0.05, z);
      group.add(dash);
    }

    // Overhead Gantries with Highway Sensors
    buildOverheadGantry(group, 0, -60);
    buildOverheadGantry(group, 0, 60);

    // Radar Scanning Sweeper Ring (Hazard Orange glow)
    const radarRingGeo = new THREE.RingGeometry(2, 45, 64);
    const radarRingMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const radarRing = new THREE.Mesh(radarRingGeo, radarRingMat);
    radarRing.rotation.x = -Math.PI / 2;
    radarRing.position.set(0, 0.1, 0);
    radarRing.name = 'radarRing';
    group.add(radarRing);
  }

  function buildOverheadGantry(group, x, z) {
    const gantry = new THREE.Group();
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const orangeLED = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14), gantryMat);
    p1.position.set(-20, 7, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14), gantryMat);
    p2.position.set(20, 7, 0);

    const truss = new THREE.Mesh(new THREE.BoxGeometry(41, 1.2, 1.2), gantryMat);
    truss.position.set(0, 14, 0);

    for (let offset = -14; offset <= 14; offset += 7) {
      const sensor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), orangeLED);
      sensor.position.set(offset, 13.5, 0);
      gantry.add(sensor);
    }

    gantry.add(p1, p2, truss);
    gantry.position.set(x, 0, z);
    group.add(gantry);
  }

  function spawnVehicles() {
    const vehicleConfigs = [
      { color: 0xf97316, speed: 42, lane: LANE_LEFT, dir: 1, z: -100, isTarget: false }, // Highway Safety Orange
      { color: 0x94a3b8, speed: 38, lane: LANE_LEFT + 6, dir: 1, z: -40, isTarget: false }, // Slate Titanium
      { color: 0xef4444, speed: 45, lane: LANE_RIGHT - 6, dir: -1, z: 90, isTarget: true }, // Signal Red (Target)
      { color: 0xf59e0b, speed: 36, lane: LANE_RIGHT, dir: -1, z: 30, isTarget: false }, // Safety Amber Hauler
      { color: 0xf1f5f9, speed: 40, lane: 0, dir: 1, z: 0, isTarget: false, cross: true, x: -120 }, // Platinum White
      { color: 0x334155, speed: 35, lane: 0, dir: -1, z: 0, isTarget: false, cross: true, x: 80 } // Dark Charcoal SUV
    ];

    vehicleConfigs.forEach(cfg => {
      const v = createVehicleMesh(cfg.color, cfg.isTarget);
      v.userData = { ...cfg };
      if (cfg.cross) {
        v.position.set(cfg.x, 0.8, cfg.lane);
        v.rotation.y = cfg.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        v.position.set(cfg.lane, 0.8, cfg.z);
        v.rotation.y = cfg.dir > 0 ? 0 : Math.PI;
      }
      vehicleGroup.add(v);
      vehicles.push(v);
    });
  }

  function createVehicleMesh(colorHex, isTarget) {
    const car = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(4.2, 1.5, 8.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.65
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    car.add(body);

    // Cabin Glass
    const cabinGeo = new THREE.BoxGeometry(3.6, 1.1, 4.6);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.92
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.8, -0.4);
    car.add(cabin);

    // Headlights (Platinum White)
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.2), headMat);
    h1.position.set(-1.4, 0.7, 4.3);
    const h2 = h1.clone();
    h2.position.x = 1.4;
    car.add(h1, h2);

    // Headlight Light Cones (Amber/Orange Tinted Beam)
    const coneGeo = new THREE.ConeGeometry(3, 14, 16);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(0, 0.5, 11);
    car.add(cone);

    // Taillights (Red)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.2), tailMat);
    t1.position.set(-1.4, 0.7, -4.3);
    const t2 = t1.clone();
    t2.position.x = 1.4;
    car.add(t1, t2);

    // Hazard Bounding Wireframe (if detected vehicle)
    if (isTarget) {
      const boxEdge = new THREE.BoxHelper(body, 0xf97316);
      boxEdge.name = 'targetHelper';
      car.add(boxEdge);
    }

    return car;
  }

  function setupInteraction() {
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.005;
      targetRotationX = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, targetRotationX));
    });

    canvas.addEventListener('wheel', (e) => {
      // Only capture wheel for 3D zoom if user holds Ctrl/Cmd or explicitly intends to zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        targetZoom += e.deltaY * 0.08;
        targetZoom = Math.max(40, Math.min(220, targetZoom));
      }
      // Otherwise, let native wheel event bubble normally so page scrolling is never trapped or lagging
    }, { passive: false });
  }

  // Camera Presets Switcher with GSAP
  function setCameraPreset(mode, animate = true) {
    cameraMode = mode;
    let newPos = { x: 0, y: 70, z: 120 };
    let newLook = { x: 0, y: 0, z: 0 };

    if (mode === 'satellite') {
      newPos = { x: 0, y: 180, z: 1 };
      newLook = { x: 0, y: 0, z: 0 };
    } else if (mode === 'drone') {
      newPos = { x: 80, y: 55, z: 90 };
      newLook = { x: 0, y: 0, z: 0 };
    } else if (mode === 'chase') {
      newPos = { x: -6, y: 12, z: -80 };
      newLook = { x: -6, y: 2, z: 40 };
    } else if (mode === 'lidar') {
      newPos = { x: -50, y: 95, z: 75 };
      newLook = { x: 0, y: 0, z: 0 };
      toggleLidarMode(true);
    } else {
      toggleLidarMode(false);
    }

    if (mode !== 'lidar') toggleLidarMode(false);

    if (animate && typeof gsap !== 'undefined') {
      gsap.to(camera.position, {
        x: newPos.x,
        y: newPos.y,
        z: newPos.z,
        duration: 1.4,
        ease: 'power3.inOut'
      });
      gsap.to(camera.rotation, {
        duration: 1.4,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(newLook.x, newLook.y, newLook.z)
      });
    } else {
      camera.position.set(newPos.x, newPos.y, newPos.z);
      camera.lookAt(newLook.x, newLook.y, newLook.z);
    }

    // Update active button UI
    document.querySelectorAll('.btn-cam-mode').forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('bg-orange-500/25', 'border-orange-500', 'text-orange-400');
      } else {
        btn.classList.remove('bg-orange-500/25', 'border-orange-500', 'text-orange-400');
      }
    });
  }

  function toggleLidarMode(enable) {
    if (!roadGroup) return;
    roadGroup.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.wireframe = enable;
      }
    });
  }

  // Shockwave & Collision FX in High-Vis Hazard Orange
  function triggerCollision(impactX = 0, impactZ = 0) {
    if (!scene || !fxGroup) return;

    // Expanding Hazard Orange Shockwave Rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(0.5, 2.5, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xf97316 : 0xfbbf24,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(impactX, 0.4 + i * 0.1, impactZ);
      fxGroup.add(ring);

      if (typeof gsap !== 'undefined') {
        gsap.to(ring.scale, {
          x: 26 + i * 8,
          y: 26 + i * 8,
          z: 26 + i * 8,
          duration: 1.6 + i * 0.3,
          ease: 'power2.out',
          delay: i * 0.16
        });
        gsap.to(ringMat, {
          opacity: 0,
          duration: 1.6 + i * 0.3,
          ease: 'power2.out',
          delay: i * 0.16,
          onComplete: () => fxGroup.remove(ring)
        });
      } else {
        setTimeout(() => fxGroup.remove(ring), 2000);
      }
    }

    // Upward Volumetric Holographic Hazard Pillar
    const pillarGeo = new THREE.CylinderGeometry(1.5, 4.0, 120, 32);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(impactX, 60, impactZ);
    fxGroup.add(pillar);

    // Explosive Spark Burst (Blaze Orange / White)
    const particleCount = 50;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = impactX;
      pPositions[i * 3 + 1] = 1.0;
      pPositions[i * 3 + 2] = impactZ;

      pVelocities.push({
        x: (Math.random() - 0.5) * 2.0,
        y: Math.random() * 2.5 + 0.8,
        z: (Math.random() - 0.5) * 2.0
      });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffedd5,
      size: 1.8,
      transparent: true,
      opacity: 1
    });
    const particles = new THREE.Points(pGeo, pMat);
    fxGroup.add(particles);

    if (typeof gsap !== 'undefined') {
      const pObj = { progress: 0 };
      gsap.to(pObj, {
        progress: 1,
        duration: 2.2,
        ease: 'power3.out',
        onUpdate: () => {
          const pos = pGeo.attributes.position.array;
          for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += pVelocities[i].x;
            pos[i * 3 + 1] += pVelocities[i].y - 0.04 * (pObj.progress * 40);
            pos[i * 3 + 2] += pVelocities[i].z;
          }
          pGeo.attributes.position.needsUpdate = true;
          pMat.opacity = 1 - pObj.progress;
        },
        onComplete: () => fxGroup.remove(particles)
      });

      gsap.to(pillarMat, {
        opacity: 0,
        duration: 3.2,
        ease: 'power2.in',
        onComplete: () => fxGroup.remove(pillar)
      });
    } else {
      setTimeout(() => {
        fxGroup.remove(particles);
        fxGroup.remove(pillar);
      }, 2500);
    }

    // Flash orange/red scene lighting
    const flashLight = new THREE.PointLight(0xf97316, 6, 130);
    flashLight.position.set(impactX, 15, impactZ);
    scene.add(flashLight);
    if (typeof gsap !== 'undefined') {
      gsap.to(flashLight, {
        intensity: 0,
        duration: 1.2,
        onComplete: () => scene.remove(flashLight)
      });
    } else {
      setTimeout(() => scene.remove(flashLight), 1200);
    }
  }

  // Animation Loop
  function animate() {
    if (!isSceneVisible) {
      animationFrameId = null;
      return;
    }

    animationFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Smooth camera damping
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    currentRotationX += (targetRotationX - currentRotationX) * 0.08;
    currentZoom += (targetZoom - currentZoom) * 0.08;

    if (cameraMode === 'drone') {
      targetRotationY += 0.002;
      const radius = currentZoom;
      camera.position.x = Math.sin(currentRotationY) * Math.cos(currentRotationX) * radius;
      camera.position.y = Math.sin(currentRotationX) * radius + 15;
      camera.position.z = Math.cos(currentRotationY) * Math.cos(currentRotationX) * radius;
      camera.lookAt(0, 0, 0);
    }

    // Pulse radar ring
    const radar = roadGroup ? roadGroup.getObjectByName('radarRing') : null;
    if (radar) {
      radar.rotation.z = time * 0.65;
      radar.material.opacity = 0.20 + Math.sin(time * 3) * 0.09;
    }

    // Move vehicles
    vehicles.forEach(v => {
      const cfg = v.userData;
      if (cfg.cross) {
        v.position.x += cfg.dir * cfg.speed * delta;
        if (cfg.dir > 0 && v.position.x > ROAD_LENGTH / 2) v.position.x = -ROAD_LENGTH / 2;
        if (cfg.dir < 0 && v.position.x < -ROAD_LENGTH / 2) v.position.x = ROAD_LENGTH / 2;
      } else {
        v.position.z += cfg.dir * cfg.speed * delta;
        if (cfg.dir > 0 && v.position.z > ROAD_LENGTH / 2) v.position.z = -ROAD_LENGTH / 2;
        if (cfg.dir < 0 && v.position.z < -ROAD_LENGTH / 2) v.position.z = ROAD_LENGTH / 2;
      }

      if (cameraMode === 'chase' && cfg.isTarget) {
        camera.position.x = v.position.x;
        camera.position.y = 8;
        camera.position.z = v.position.z + 24;
        camera.lookAt(v.position.x, 2, v.position.z - 30);
      }
    });

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    if (!renderer || !camera || !canvas) return;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight || 320;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.setRadarCameraMode = setCameraPreset;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
