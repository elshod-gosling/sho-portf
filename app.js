/**
 * ERGASHEVA SHOHINUR - FIRST-PERSON SCUBA DIVER POV ENGINE (Three.js)
 * 
 * Concept: "You are the Diver"
 * - Surface: Floating on sunset ocean swells at 17:00
 * - The Plunge: Tilting head-first forward through breaking waves
 * - Scuba Kinematics: Flipper-kick sinusoidal swimming heave & sway
 * - Tactical Dive Torch: 3D SpotLight attached to your helmet/hands that follows your cursor
 * - Regulator Bubbles: Translucent 3D air bubbles rising from your mouth past the visor
 * - Abyssal Titan: Swimming face-to-face beside the 33-meter Luminous Leviathan Whale
 */

document.addEventListener('DOMContentLoaded', () => {
  initDiverExperience();
  initBathymeter();
  initWebAudio();
  initModalsAndForms();
  initTiltCards();
});

/* ==========================================================================
   1. THREE.JS FIRST-PERSON DIVER POV WORLD
   ========================================================================== */
let diverEngine = null;

function initDiverExperience() {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    console.warn('Three.js or canvas not available');
    return;
  }

  // --- Scene, Renderer ---
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // Initialize on-surface class for the document body
  document.body.classList.add('on-surface');
  document.body.classList.remove('submerged');

  // Fog setup (Warm golden-hour horizon above water)
  const initialFogColor = new THREE.Color(0xb45309); // 17:00 Warm Golden Sunset
  scene.fog = new THREE.FogExp2(initialFogColor, 0.0012); // Clear and open horizon!
  scene.background = new THREE.Color(0xb45309); // Radiant 17:00 Golden Hour Amber

  // --- FIRST-PERSON DIVER CAMERA RIG ---
  const diverRig = new THREE.Group();
  diverRig.position.set(0, 6.5, 52); // Standing firmly on the surface (+6.5m above water)
  scene.add(diverRig);

  const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(0, 0, 0); // Camera is the diver's eyes
  diverRig.add(camera);

  // Tactical Underwater Dive Torch (Starts OFF while on the surface)
  const diveTorch = new THREE.SpotLight(0xf0fdf4, 0, 180, Math.PI / 4.8, 0.45, 1.1);
  diveTorch.position.set(0.6, -0.4, 0.2);
  camera.add(diveTorch);

  const diveTorchTarget = new THREE.Object3D();
  diveTorchTarget.position.set(0, 0, -40);
  scene.add(diveTorchTarget);
  diveTorch.target = diveTorchTarget;

  // Volumetric Dive Torch Beam Cone (visible light cutting through water, off at surface)
  const beamGeo = new THREE.CylinderGeometry(0.3, 14, 60, 16, 1, true);
  beamGeo.rotateX(-Math.PI / 2);
  beamGeo.translate(0, 0, -30);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x99f6e4,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.visible = false; // Off at surface
  diveTorch.add(beamMesh);

  // --- Lighting System ---
  const ambientLight = new THREE.AmbientLight(0xffecd2, 1.4); // Warm golden hour
  scene.add(ambientLight);

  const sunDirLight = new THREE.DirectionalLight(0xff944d, 3.4); // Brilliant setting sun rays
  sunDirLight.position.set(10, 50, -140);
  scene.add(sunDirLight);

  const underwaterPointLight = new THREE.PointLight(0x38bdf8, 0, 180); // 0 at surface!
  underwaterPointLight.position.set(0, -60, 10);
  scene.add(underwaterPointLight);

  // ==========================================================================
  // A. 17:00 SUNFALL ELEMENTS (Elevated Sun, Coronas & Volumetric Sunburst)
  // ==========================================================================
  const sunGroup = new THREE.Group();
  // Elevated high in the sky so it shines majestically above the hero text without obstruction
  sunGroup.position.set(0, 68, -130);

  // Core Solar Disk (Brilliant Golden-White)
  const sunGeo = new THREE.SphereGeometry(22, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfffcf0,
    transparent: true,
    opacity: 1
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  // Outer Corona Glow Layer 1 (Amber Radiance)
  const corona1Geo = new THREE.SphereGeometry(32, 32, 32);
  const corona1Mat = new THREE.MeshBasicMaterial({
    color: 0xffa034,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  sunGroup.add(new THREE.Mesh(corona1Geo, corona1Mat));

  // Outer Corona Glow Layer 2 (Warm Sunset Crimson)
  const corona2Geo = new THREE.SphereGeometry(48, 32, 32);
  const corona2Mat = new THREE.MeshBasicMaterial({
    color: 0xea580c,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  sunGroup.add(new THREE.Mesh(corona2Geo, corona2Mat));

  // Outer Corona Glow Layer 3 (Twilight Lavender Haze)
  const corona3Geo = new THREE.SphereGeometry(72, 32, 32);
  const corona3Mat = new THREE.MeshBasicMaterial({
    color: 0x9333ea,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  sunGroup.add(new THREE.Mesh(corona3Geo, corona3Mat));

  // Rotating Volumetric Sunburst Rays (Vinland Saga Golden Radiance)
  const sunRaysGroup = new THREE.Group();
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const numRays = 16;
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const rayLength = 100 + (i % 2 === 0 ? 40 : 0);
    const rayGeo = new THREE.ConeGeometry(4.5, rayLength, 4);
    rayGeo.translate(0, rayLength / 2, 0);
    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    rayMesh.rotation.z = angle;
    sunRaysGroup.add(rayMesh);
  }
  sunGroup.add(sunRaysGroup);

  scene.add(sunGroup);

  // ==========================================================================
  // B. VINLAND SAGA 17:00 SUNSET SKY DOME & 3D OCEAN SURFACE (Y = 0)
  // ==========================================================================
  // Panoramic Anime Sunset Sky Dome
  const skyDomeGeo = new THREE.SphereGeometry(260, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const sunsetCanvas = document.createElement('canvas');
  sunsetCanvas.width = 16;
  sunsetCanvas.height = 512;
  const domeCtx = sunsetCanvas.getContext('2d');
  const domeGrad = domeCtx.createLinearGradient(0, 0, 0, 512);
  domeGrad.addColorStop(0, '#150624');   // Deep twilight zenith
  domeGrad.addColorStop(0.20, '#310c3b'); // Amethyst violet
  domeGrad.addColorStop(0.42, '#701944'); // Sunset rose
  domeGrad.addColorStop(0.65, '#c2410c'); // Radiant amber
  domeGrad.addColorStop(0.82, '#ea580c'); // Warm sunfall crimson
  domeGrad.addColorStop(0.94, '#f59e0b'); // Golden horizon
  domeGrad.addColorStop(1.0, '#fef08a');  // Blazing sun horizon
  domeCtx.fillStyle = domeGrad;
  domeCtx.fillRect(0, 0, 16, 512);
  const skyDomeTex = new THREE.CanvasTexture(sunsetCanvas);

  const skyDomeMat = new THREE.MeshBasicMaterial({
    map: skyDomeTex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const skyDome = new THREE.Mesh(skyDomeGeo, skyDomeMat);
  skyDome.position.set(0, 0, 0);
  scene.add(skyDome);

  const waterWidth = 340;
  const waterSegments = 64;
  const waterGeo = new THREE.PlaneGeometry(waterWidth, waterWidth, waterSegments, waterSegments);
  waterGeo.rotateX(-Math.PI / 2);

  const posAttribute = waterGeo.attributes.position;
  const originalY = new Float32Array(posAttribute.count);
  for (let i = 0; i < posAttribute.count; i++) {
    originalY[i] = posAttribute.getY(i);
  }

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x071e3d, // Deep twilight ocean reflecting the evening sky
    roughness: 0.12,
    metalness: 0.75,
    transparent: true,
    opacity: 0.88,
    flatShading: true,
    side: THREE.FrontSide // Front side only so from surface it reflects, not a see-through glass box
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = 0;
  scene.add(waterMesh);

  // ==========================================================================
  // C. DUAL-REALM PARTICULATE SYSTEMS (Vinland Golden Dust vs Oceanic Snow)
  // ==========================================================================
  
  // 1. Vinland Saga Golden Wind Motes (Sky Realm: Y = 0 to 45)
  const skyDustCount = 450;
  const skyDustGeo = new THREE.BufferGeometry();
  const skyDustPos = new Float32Array(skyDustCount * 3);
  const skyDustVel = new Float32Array(skyDustCount * 3);

  for (let i = 0; i < skyDustCount; i++) {
    const i3 = i * 3;
    skyDustPos[i3] = (Math.random() - 0.5) * 160;
    skyDustPos[i3 + 1] = Math.random() * 42 + 1.0; // Strictly in the sky above water!
    skyDustPos[i3 + 2] = (Math.random() - 0.5) * 130;

    skyDustVel[i3] = Math.random() * 0.08 + 0.04;      // Gentle drift along wind (X)
    skyDustVel[i3 + 1] = -(Math.random() * 0.015 + 0.005); // Very gentle slow fall
    skyDustVel[i3 + 2] = (Math.random() - 0.5) * 0.03;
  }
  skyDustGeo.setAttribute('position', new THREE.BufferAttribute(skyDustPos, 3));

  // Warm Golden Sun-Dust Texture
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 32;
  skyCanvas.height = 32;
  const sCtx = skyCanvas.getContext('2d');
  const sGrad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  sGrad.addColorStop(0, 'rgba(255, 255, 240, 1)');      // Pure golden white center
  sGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.95)'); // Glowing gold
  sGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.5)');    // Sunset amber halo
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 32, 32);
  const skyDustTexture = new THREE.CanvasTexture(skyCanvas);

  const skyDustMat = new THREE.PointsMaterial({
    size: 2.8,
    map: skyDustTexture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const skyDustSystem = new THREE.Points(skyDustGeo, skyDustMat);
  scene.add(skyDustSystem);

  // 2. Oceanic Marine Snow & Abyssal Bubbles (Underwater: Y = -1 to -240)
  const seaParticleCount = 550;
  const seaParticleGeo = new THREE.BufferGeometry();
  const seaParticlePos = new Float32Array(seaParticleCount * 3);
  const seaParticleVel = new Float32Array(seaParticleCount * 3);

  for (let i = 0; i < seaParticleCount; i++) {
    const i3 = i * 3;
    seaParticlePos[i3] = (Math.random() - 0.5) * 160;
    seaParticlePos[i3 + 1] = -Math.random() * 240 - 2; // Strictly below water!
    seaParticlePos[i3 + 2] = (Math.random() - 0.5) * 120;

    seaParticleVel[i3] = (Math.random() - 0.5) * 0.04;
    seaParticleVel[i3 + 1] = Math.random() * 0.14 + 0.04; // Rising slowly underwater
    seaParticleVel[i3 + 2] = (Math.random() - 0.5) * 0.04;
  }
  seaParticleGeo.setAttribute('position', new THREE.BufferAttribute(seaParticlePos, 3));

  // Oceanic Azure & Cyan Pearl Glow Texture
  const seaCanvas = document.createElement('canvas');
  seaCanvas.width = 32;
  seaCanvas.height = 32;
  const seaCtx = seaCanvas.getContext('2d');
  const seaGrad = seaCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  seaGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  seaGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.8)');
  seaGrad.addColorStop(0.8, 'rgba(3, 105, 161, 0.3)');
  seaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  seaCtx.fillStyle = seaGrad;
  seaCtx.fillRect(0, 0, 32, 32);
  const seaParticleTexture = new THREE.CanvasTexture(seaCanvas);

  const seaParticleMat = new THREE.PointsMaterial({
    size: 2.0,
    map: seaParticleTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const seaParticleSystem = new THREE.Points(seaParticleGeo, seaParticleMat);
  scene.add(seaParticleSystem);

  // ==========================================================================
  // E. 3D BIOLUMINESCENT JELLYFISH (Twilight & Midnight: Y = -90 to -140)
  // ==========================================================================
  const jellyfishGroup = new THREE.Group();
  const jellyObjs = [];

  for (let j = 0; j < 3; j++) {
    const jellyRoot = new THREE.Group();
    jellyRoot.position.set((j - 1) * 35 + (Math.random() - 0.5) * 10, -100 - j * 15, -10 + (Math.random() - 0.5) * 20);

    const bellGeo = new THREE.SphereGeometry(6, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const bellMat = new THREE.MeshStandardMaterial({
      color: j % 2 === 0 ? 0x22d3ee : 0xc084fc,
      emissive: j % 2 === 0 ? 0x0891b2 : 0x7e22ce,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.rotation.x = Math.PI;
    jellyRoot.add(bellMesh);

    const coreGeo = new THREE.SphereGeometry(2.2, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    jellyRoot.add(new THREE.Mesh(coreGeo, coreMat));

    const tentacleLines = [];
    for (let t = 0; t < 6; t++) {
      const angle = (t / 6) * Math.PI * 2;
      const points = [];
      for (let p = 0; p < 8; p++) {
        points.push(new THREE.Vector3(Math.cos(angle) * 3.5, -p * 3.2, Math.sin(angle) * 3.5));
      }
      const tGeo = new THREE.BufferGeometry().setFromPoints(points);
      const tMat = new THREE.LineBasicMaterial({
        color: j % 2 === 0 ? 0x67e8f9 : 0xd8b4fe,
        transparent: true,
        opacity: 0.5
      });
      const tLine = new THREE.Line(tGeo, tMat);
      jellyRoot.add(tLine);
      tentacleLines.push({ line: tLine, points: points, origAngle: angle });
    }

    jellyObjs.push({ root: jellyRoot, bell: bellMesh, tentacles: tentacleLines, phase: j * 1.5 });
    jellyfishGroup.add(jellyRoot);
  }
  scene.add(jellyfishGroup);

  // ==========================================================================
  // F. 3D DIVER REGULATOR BUBBLES
  // ==========================================================================
  const diverBubbleCount = 20;
  const diverBubbleGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const diverBubbleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.7
  });

  const diverBubblePool = [];
  for (let db = 0; db < diverBubbleCount; db++) {
    const bubbleMesh = new THREE.Mesh(diverBubbleGeo, diverBubbleMat);
    bubbleMesh.visible = false;
    scene.add(bubbleMesh);
    diverBubblePool.push({
      mesh: bubbleMesh,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 60
    });
  }

  function spawnDiverBreathBubbles() {
    diverBubblePool.forEach(b => {
      b.mesh.position.set(
        diverRig.position.x + (Math.random() - 0.5) * 1.2,
        diverRig.position.y - 0.7,
        diverRig.position.z - 1.5 + (Math.random() - 0.5) * 0.5
      );
      b.vx = (Math.random() - 0.5) * 0.08;
      b.vy = Math.random() * 0.35 + 0.25;
      b.vz = -(Math.random() * 0.08);
      b.life = 0;
      b.maxLife = Math.random() * 45 + 30;
      b.mesh.visible = true;
      b.mesh.scale.setScalar(Math.random() * 0.6 + 0.4);
    });
  }

  // ==========================================================================
  // G. THE 3D MASSIVE LUMINOUS LEVIATHAN (COLOSSAL 50M ABYSSAL TITAN)
  // ==========================================================================
  const WHALE_DEPTH_Y = -185;
  const whaleRoot = new THREE.Group();
  whaleRoot.position.set(0, WHALE_DEPTH_Y, -8); // Positioned directly in front of the diver!
  scene.add(whaleRoot);

  // Dedicated High-Luminance Multi-Point Lighting Rig on the Whale
  const whaleHeadLight = new THREE.PointLight(0x38bdf8, 7.5, 120, 1.2);
  whaleHeadLight.position.set(22, 4, 0);
  whaleRoot.add(whaleHeadLight);

  const whaleDorsalLight = new THREE.PointLight(0x00f5ff, 6.5, 110, 1.2);
  whaleDorsalLight.position.set(0, 14, 0);
  whaleRoot.add(whaleDorsalLight);

  const whaleBellyLight = new THREE.PointLight(0x2dd4bf, 7.0, 100, 1.2);
  whaleBellyLight.position.set(0, -12, 0);
  whaleRoot.add(whaleBellyLight);

  const whaleTailLight = new THREE.PointLight(0x818cf8, 5.5, 90, 1.2);
  whaleTailLight.position.set(-25, 2, 0);
  whaleRoot.add(whaleTailLight);

  const whaleAbyssalFill = new THREE.PointLight(0x0284c7, 5.0, 200, 1.0);
  whaleAbyssalFill.position.set(0, 0, 30);
  whaleRoot.add(whaleAbyssalFill);

  // Whale Bioluminescent Aura (Abyssal Spirit Plankton)
  const auraCount = 85;
  const auraGeo = new THREE.BufferGeometry();
  const auraPos = new Float32Array(auraCount * 3);
  const auraAngles = new Float32Array(auraCount);
  const auraRadii = new Float32Array(auraCount);
  const auraSpeeds = new Float32Array(auraCount);
  const auraYOffsets = new Float32Array(auraCount);

  for (let i = 0; i < auraCount; i++) {
    auraAngles[i] = Math.random() * Math.PI * 2;
    auraRadii[i] = Math.random() * 26 + 12;
    auraSpeeds[i] = (Math.random() * 0.4 + 0.2) * (Math.random() < 0.5 ? 1 : -1);
    auraYOffsets[i] = (Math.random() - 0.5) * 18;
    auraPos[i * 3] = Math.cos(auraAngles[i]) * auraRadii[i];
    auraPos[i * 3 + 1] = auraYOffsets[i];
    auraPos[i * 3 + 2] = Math.sin(auraAngles[i]) * auraRadii[i];
  }
  auraGeo.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
  const auraMat = new THREE.PointsMaterial({
    size: 2.5,
    color: 0x5eead4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const whaleAura = new THREE.Points(auraGeo, auraMat);
  whaleRoot.add(whaleAura);

  const whaleKinematics = create3DWhale(whaleRoot);

  // 3D Sonar Wave Rings
  const sonarRingGeo = new THREE.RingGeometry(1, 4, 32);
  const sonarRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const sonarRing = new THREE.Mesh(sonarRingGeo, sonarRingMat);
  sonarRing.position.set(0, WHALE_DEPTH_Y, -8);
  sonarRing.rotation.x = Math.PI / 2;
  scene.add(sonarRing);

  // ==========================================================================
  // H. DIVER STATE & SECTION PROGRESSION
  // ==========================================================================
  const state = {
    clock: new THREE.Clock(),
    scrollProgress: 0,
    targetRigX: 0,
    targetRigY: 4.5,
    targetRigZ: 52,
    targetPitch: -0.04,
    currentPitch: -0.04,
    targetYaw: 0,
    currentYaw: 0,
    targetRoll: 0,
    currentRoll: 0,
    mouseX: 0,
    mouseY: 0,
    // Free Look Drag System
    isDragging: false,
    dragYaw: 0,
    dragPitch: 0,
    dragYawTarget: 0,
    dragPitchTarget: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    wasSubmerged: false,
    isTorchOn: false,
    lastBreathTime: 0,
    whaleSwimCadence: 0.42,
    whaleRoll: 0,
    whaleTargetRoll: 0,
    sonarExpanding: false,
    sonarScale: 1
  };

  diverEngine = {
    toggleTorch() {
      state.isTorchOn = !state.isTorchOn;
      diveTorch.intensity = state.isTorchOn ? 5.5 : 0;
      beamMesh.visible = state.isTorchOn;
      const torchBtn = document.getElementById('torch-toggle');
      if (torchBtn) {
        torchBtn.classList.toggle('off', !state.isTorchOn);
        torchBtn.querySelector('span').innerText = `TORCH: ${state.isTorchOn ? 'ON' : 'OFF'}`;
      }
      playWhaleSound(500, 300, 0.2);
    },
    triggerSpiral() {
      state.whaleTargetRoll += Math.PI * 2;
      playWhaleSound(340, 160, 1.4);
    },
    triggerSonar() {
      state.sonarExpanding = true;
      state.sonarScale = 1;
      sonarRing.visible = true;
      playWhaleSound(260, 120, 1.6);
    },
    triggerBubbles() {
      spawnDiverBreathBubbles();
      playWhaleSound(420, 280, 0.8);
    },
    toggleSpeed() {
      state.whaleSwimCadence = state.whaleSwimCadence > 0.6 ? 0.42 : 0.85;
      const cadenceEl = document.getElementById('hud-whale-cadence');
      if (cadenceEl) cadenceEl.innerText = `${state.whaleSwimCadence.toFixed(2)} HZ`;
    },
    focusWhale() {
      const whaleStageEl = document.getElementById('whale-stage') || document.getElementById('abyss');
      if (whaleStageEl) {
        whaleStageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      state.targetRigX = 0;
      state.targetRigY = WHALE_DEPTH_Y;
      state.targetRigZ = 22;
      state.targetPitch = 0.02;
      state.targetYaw = 0;
      state.dragYawTarget = 0;
      state.dragPitchTarget = 0;
      diverEngine.triggerSonar();
      diverEngine.triggerBubbles();
      playWhaleSound(280, 140, 1.5);
    }
  };

  // Submersion visual and acoustic transition
  function triggerWaterBoundaryCross(isSubmerged) {
    const visorSplash = document.getElementById('visor-splash');
    if (visorSplash) {
      visorSplash.classList.remove('submerged');
      void visorSplash.offsetWidth;
      visorSplash.classList.add('submerged');
      setTimeout(() => visorSplash.classList.remove('submerged'), 1200);
    }
    playSplashSound();
    if (isSubmerged) {
      document.body.classList.remove('on-surface');
      document.body.classList.add('submerged');
      state.isTorchOn = true;
      diveTorch.intensity = 5.5;
      beamMesh.visible = true;
      const torchBtn = document.getElementById('torch-toggle');
      if (torchBtn) {
        torchBtn.classList.remove('off');
        torchBtn.querySelector('span').innerText = 'TORCH: ON';
      }
      spawnDiverBreathBubbles();
    } else {
      document.body.classList.add('on-surface');
      document.body.classList.remove('submerged');
      state.isTorchOn = false;
      diveTorch.intensity = 0;
      beamMesh.visible = false;
      const torchBtn = document.getElementById('torch-toggle');
      if (torchBtn) {
        torchBtn.classList.add('off');
        torchBtn.querySelector('span').innerText = 'TORCH: OFF';
      }
    }
  }

  // Section-based curved 3D flight calculator:
  function calculateSectionTarget() {
    const scrollY = window.scrollY || window.pageYOffset;
    const eduEl = document.getElementById('education');
    const heroEl = document.getElementById('hero');

    const eduTop = eduEl ? eduEl.offsetTop : window.innerHeight * 1.1;
    // Surface realm: strictly hold diver firmly above water (+6.5m in open air) while on Hero!
    const diveThreshold = eduTop * 0.48;

    // 1. Strictly hold diver on the surface (+6.5m in open air) while in Hero:
    if (scrollY < diveThreshold) {
      return { x: 0, y: 6.5, z: 52, pitch: -0.02, yaw: 0, roll: 0 };
    }

    // 2. Diving plunge from diveThreshold to eduTop: swoops forward through water plane (Y = 0)
    if (scrollY < eduTop) {
      const frac = (scrollY - diveThreshold) / Math.max(eduTop - diveThreshold, 1);
      const ease = frac * frac * (3 - 2 * frac);
      return {
        x: THREE.MathUtils.lerp(0, 10, ease),
        y: THREE.MathUtils.lerp(6.5, -45, ease), // Smoothly dives through water surface (Y = 0)
        z: THREE.MathUtils.lerp(52, 34, ease),
        pitch: THREE.MathUtils.lerp(-0.02, -0.25, ease),
        yaw: THREE.MathUtils.lerp(0, -0.16, ease),
        roll: THREE.MathUtils.lerp(0, -0.08, ease)
      };
    }

    // 3. Submerged zones:
    const sections = [
      { id: 'education', x: 10, y: -45, z: 34, pitch: -0.25, yaw: -0.16, roll: -0.08 },
      { id: 'experience', x: -14, y: -92, z: 26, pitch: -0.20, yaw: 0.20, roll: 0.10 },
      { id: 'leadership', x: 8, y: -138, z: 22, pitch: -0.14, yaw: -0.12, roll: -0.05 },
      { id: 'whale-stage', x: 0, y: WHALE_DEPTH_Y, z: 22, pitch: 0.02, yaw: 0, roll: 0 },
      { id: 'abyss', x: 0, y: WHALE_DEPTH_Y, z: 22, pitch: 0.02, yaw: 0, roll: 0 },
      { id: 'contact', x: -4, y: -205, z: 28, pitch: 0.08, yaw: 0.04, roll: 0.02 }
    ];

    const scrollMid = scrollY + window.innerHeight * 0.45;

    for (let i = 0; i < sections.length - 1; i++) {
      const el1 = document.getElementById(sections[i].id);
      const el2 = document.getElementById(sections[i + 1].id);
      if (!el1 || !el2) continue;

      const top1 = el1.offsetTop;
      const top2 = el2.offsetTop;

      if (scrollMid >= top1 && scrollMid <= top2) {
        const rawFrac = Math.min(Math.max((scrollMid - top1) / Math.max(top2 - top1, 1), 0), 1);
        const frac = rawFrac * rawFrac * (3 - 2 * rawFrac);
        return {
          x: THREE.MathUtils.lerp(sections[i].x, sections[i + 1].x, frac),
          y: THREE.MathUtils.lerp(sections[i].y, sections[i + 1].y, frac),
          z: THREE.MathUtils.lerp(sections[i].z, sections[i + 1].z, frac),
          pitch: THREE.MathUtils.lerp(sections[i].pitch, sections[i + 1].pitch, frac),
          yaw: THREE.MathUtils.lerp(sections[i].yaw, sections[i + 1].yaw, frac),
          roll: THREE.MathUtils.lerp(sections[i].roll, sections[i + 1].roll, frac)
        };
      }
    }

    // Default at bottom: directly face-to-face with the whale!
    return { x: 0, y: WHALE_DEPTH_Y, z: 22, pitch: 0.02, yaw: 0, roll: 0 };
  }

  // --- Scroll Tracking for Diver POV ---
  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    state.scrollProgress = Math.min(Math.max(scrollY / (docHeight || 1), 0), 1);

    const p = state.scrollProgress;
    const target = calculateSectionTarget();

    state.targetRigX = target.x;
    state.targetRigY = target.y;
    state.targetRigZ = target.z;
    state.targetPitch = target.pitch;
    state.targetYaw = target.yaw;
    state.targetRoll = target.roll;

    // Gently ease free-look back toward flight heading when user scrolls
    state.dragYawTarget *= 0.992;

    // Dynamic Fog & Lighting
    interpolateFogAndLighting(p, scene.fog, ambientLight, sunDirLight, underwaterPointLight, scene, sunGroup, skyDome);

    // Update Visor O2 meter
    const o2El = document.getElementById('diver-o2');
    if (o2El) {
      const o2Val = Math.round(99 - p * 13);
      o2El.innerHTML = `<i class="fa-solid fa-lungs"></i> O₂: ${o2Val}%`;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Free-Look Mouse / Touch Drag Controls
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, input, textarea, select, .modal-dialog, [role="button"]')) {
      return;
    }
    state.isDragging = true;
    state.lastPointerX = e.clientX;
    state.lastPointerY = e.clientY;
    document.body.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', (e) => {
    state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    if (state.isDragging) {
      const dx = e.clientX - state.lastPointerX;
      const dy = e.clientY - state.lastPointerY;
      state.lastPointerX = e.clientX;
      state.lastPointerY = e.clientY;

      state.dragYawTarget -= dx * 0.0055;
      state.dragPitchTarget -= dy * 0.0045;
      state.dragPitchTarget = Math.max(Math.min(state.dragPitchTarget, 1.25), -1.25);
    }
  });

  const stopPointerDrag = () => {
    if (state.isDragging) {
      state.isDragging = false;
      document.body.style.cursor = '';
    }
  };
  window.addEventListener('pointerup', stopPointerDrag);
  window.addEventListener('pointercancel', stopPointerDrag);

  const recenterBtn = document.getElementById('recenter-btn');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', () => {
      state.dragYawTarget = 0;
      state.dragPitchTarget = 0;
      playWhaleSound(480, 240, 0.2);
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const torchBtn = document.getElementById('torch-toggle');
  if (torchBtn) {
    torchBtn.addEventListener('click', () => diverEngine.toggleTorch());
  }

  // Focus on Whale buttons
  const btnFocusWhale = document.getElementById('btn-focus-whale');
  if (btnFocusWhale) {
    btnFocusWhale.addEventListener('click', () => diverEngine.focusWhale());
  }

  const whaleNavLinks = document.querySelectorAll('.whale-jump-link');
  whaleNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => diverEngine.focusWhale(), 300);
    });
  });

  // --- Main Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = state.clock.getElapsedTime();
    const p = state.scrollProgress;

    // Submersion boundary crossing detection
    const isCurrentlySubmerged = diverRig.position.y < 0;
    if (isCurrentlySubmerged !== state.wasSubmerged) {
      state.wasSubmerged = isCurrentlySubmerged;
      triggerWaterBoundaryCross(isCurrentlySubmerged);
    }

    // 1. Diver Locomotion & Buoyancy Sway
    let flipperCycle = 0;
    let swayHeave = 0;
    let swayRoll = 0;
    let swayPitch = 0;

    if (p < 0.18) {
      swayHeave = Math.sin(elapsedTime * 1.8) * 0.45;
      swayRoll = Math.sin(elapsedTime * 1.2) * 0.025;
      swayPitch = Math.cos(elapsedTime * 1.0) * 0.02;
    } else {
      flipperCycle = elapsedTime * 2.8;
      swayHeave = Math.sin(flipperCycle) * 0.32;
      swayPitch = Math.cos(flipperCycle) * 0.045;
      swayRoll = Math.sin(flipperCycle * 0.5) * 0.035;

      if (elapsedTime - state.lastBreathTime > 3.2) {
        state.lastBreathTime = elapsedTime;
        spawnDiverBreathBubbles();
        playRegulatorSound();
      }
    }

    // Diver Rig Position Lerp (Curved 3D flight along X, Y, Z)
    diverRig.position.x += (state.targetRigX + (state.mouseX * 3) - diverRig.position.x) * 0.065;
    diverRig.position.y += (state.targetRigY + swayHeave - diverRig.position.y) * 0.065;
    diverRig.position.z += (state.targetRigZ - diverRig.position.z) * 0.065;

    // Free look drag interpolation
    state.dragYaw += (state.dragYawTarget - state.dragYaw) * 0.12;
    state.dragPitch += (state.dragPitchTarget - state.dragPitch) * 0.12;

    // Diver Head Rotation (Target flight yaw/pitch + Free-Look Drag + Responsive Gaze + Real Diver Banking)
    const targetHeadYaw = state.targetYaw + state.dragYaw + (-state.mouseX * 0.40);
    const targetHeadPitch = state.targetPitch + state.dragPitch + (-state.mouseY * 0.30) + swayPitch;
    const yawDelta = targetHeadYaw - state.currentYaw;
    const targetHeadRoll = state.targetRoll + (-yawDelta * 0.35) + swayRoll;

    state.currentPitch += (targetHeadPitch - state.currentPitch) * 0.09;
    state.currentYaw += (targetHeadYaw - state.currentYaw) * 0.09;
    state.currentRoll += (targetHeadRoll - state.currentRoll) * 0.09;

    camera.rotation.set(state.currentPitch, state.currentYaw, state.currentRoll, 'YXZ');

    // Aim Dive Torch into 3D Space along diver's actual look orientation
    const torchOffset = new THREE.Vector3(0, 0, -45);
    torchOffset.applyEuler(camera.rotation);
    diveTorchTarget.position.copy(diverRig.position).add(torchOffset);

    // Update Visor Heading (live 360° tactical compass)
    const headingEl = document.getElementById('diver-heading');
    if (headingEl) {
      const headingDeg = Math.round(((-state.currentYaw * 180 / Math.PI) % 360 + 360) % 360);
      const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirIndex = Math.round(headingDeg / 45) % 8;
      headingEl.innerHTML = `<i class="fa-solid fa-compass"></i> HDG: ${headingDeg}° ${dirs[dirIndex]}`;
    }

    // 0. Slow Golden Sunburst Rays Rotation (Sky Realm)
    if (sunRaysGroup) {
      sunRaysGroup.rotation.z = elapsedTime * 0.035;
    }
    if (skyDome) {
      skyDome.position.x = diverRig.position.x;
      skyDome.position.z = diverRig.position.z;
    }

    // 2. 3D Wave Surface Undulation
    if (diverRig.position.y > -35) {
      const pos = waterGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getZ(i);
        const wave =
          Math.sin(u * 0.06 + elapsedTime * 1.6) * Math.cos(v * 0.05 + elapsedTime * 1.3) * 2.2 +
          Math.sin(u * 0.12 + elapsedTime * 2.2) * 0.7;
        pos.setY(i, originalY[i] + wave);
      }
      pos.needsUpdate = true;
      waterGeo.computeVertexNormals();
    }

    // 3. Dual-Realm Particles Update
    // A. Vinland Saga Golden Wind Motes (Sky Realm)
    const sPos = skyDustGeo.attributes.position.array;
    for (let i = 0; i < skyDustCount; i++) {
      const i3 = i * 3;
      sPos[i3] += Math.sin(elapsedTime * 0.45 + i) * 0.05 + skyDustVel[i3]; // Gentle wind drift
      sPos[i3 + 1] += skyDustVel[i3 + 1]; // Very slow floating fall
      sPos[i3 + 2] += Math.cos(elapsedTime * 0.35 + i) * 0.03;

      if (sPos[i3] > 80) sPos[i3] = -80;
      if (sPos[i3 + 1] < 0.2) {
        sPos[i3 + 1] = 42;
        sPos[i3] = (Math.random() - 0.5) * 160;
      }
    }
    skyDustGeo.attributes.position.needsUpdate = true;

    // B. Oceanic Marine Snow & Abyssal Bubbles
    const seaPos = seaParticleGeo.attributes.position.array;
    for (let i = 0; i < seaParticleCount; i++) {
      const i3 = i * 3;
      seaPos[i3 + 1] += seaParticleVel[i3 + 1];
      seaPos[i3] += Math.sin(elapsedTime * 0.8 + i) * 0.03;
      if (seaPos[i3 + 1] > -1) {
        seaPos[i3 + 1] = -240;
      }
    }
    seaParticleGeo.attributes.position.needsUpdate = true;

    // 4. Jellyfish Pulsation
    jellyObjs.forEach(j => {
      const pulse = Math.sin(elapsedTime * 2.2 + j.phase);
      j.bell.scale.set(1 - pulse * 0.12, 1 + pulse * 0.15, 1 - pulse * 0.12);
      j.root.position.y += Math.sin(elapsedTime * 1.2 + j.phase) * 0.06;

      j.tentacles.forEach((t, idx) => {
        const positions = t.line.geometry.attributes.position;
        for (let k = 1; k < t.points.length; k++) {
          const wave = Math.sin(elapsedTime * 3 + k * 0.6 + idx) * (k * 0.4);
          positions.setX(k, Math.cos(t.origAngle) * 3.5 + wave);
          positions.setZ(k, Math.sin(t.origAngle) * 3.5 + Math.cos(elapsedTime * 2.5 + k) * 0.3);
        }
        positions.needsUpdate = true;
      });
    });

    // 5. Diver Regulator Bubbles
    diverBubblePool.forEach(b => {
      if (b.mesh.visible) {
        b.life++;
        b.mesh.position.x += b.vx;
        b.mesh.position.y += b.vy;
        b.mesh.position.z += b.vz;
        const progress = b.life / b.maxLife;
        b.mesh.scale.setScalar((1 + progress * 1.5) * 0.5);
        b.mesh.material.opacity = 0.75 * (1 - progress);

        if (b.life >= b.maxLife) {
          b.mesh.visible = false;
        }
      }
    });

    // 6. Whale 3D Active Patrol Movement & Kinematics
    whaleRoot.position.x = Math.sin(elapsedTime * 0.22) * 9;
    whaleRoot.position.y = WHALE_DEPTH_Y + Math.cos(elapsedTime * 0.20) * 3.0;
    whaleRoot.position.z = -8 + Math.sin(elapsedTime * 0.15) * 5;
    whaleRoot.rotation.y = Math.PI / 2 + Math.cos(elapsedTime * 0.22) * 0.28;

    // Orbiting Whale Bioluminescent Aura
    if (whaleAura) {
      const aPos = auraGeo.attributes.position.array;
      for (let i = 0; i < auraCount; i++) {
        auraAngles[i] += auraSpeeds[i] * 0.02;
        const i3 = i * 3;
        aPos[i3] = Math.cos(auraAngles[i]) * auraRadii[i];
        aPos[i3 + 1] = auraYOffsets[i] + Math.sin(elapsedTime * 1.2 + i) * 1.5;
        aPos[i3 + 2] = Math.sin(auraAngles[i]) * auraRadii[i];
      }
      auraGeo.attributes.position.needsUpdate = true;
    }

    animate3DWhale(whaleKinematics, whaleRoot, elapsedTime, state);

    // 7. Sonar Wave
    if (state.sonarExpanding) {
      state.sonarScale += 0.45;
      sonarRing.scale.set(state.sonarScale, state.sonarScale, 1);
      sonarRingMat.opacity = Math.max(1 - state.sonarScale / 18, 0);
      if (sonarRingMat.opacity <= 0.01) {
        state.sonarExpanding = false;
        sonarRing.visible = false;
      }
    }

    renderer.render(scene, camera);
  }

  animate();

  // Attach interactive triggers
  const btnSpiral = document.getElementById('btn-whale-spiral');
  const btnSonar = document.getElementById('btn-whale-sonar');
  const btnBubbles = document.getElementById('btn-whale-bubbles');
  const btnSpeed = document.getElementById('btn-whale-speed');
  const viewport = document.getElementById('whale-viewport');

  if (btnSpiral) btnSpiral.addEventListener('click', () => diverEngine.triggerSpiral());
  if (btnSonar) btnSonar.addEventListener('click', () => diverEngine.triggerSonar());
  if (btnBubbles) btnBubbles.addEventListener('click', () => diverEngine.triggerBubbles());
  if (btnSpeed) btnSpeed.addEventListener('click', () => diverEngine.toggleSpeed());
  if (viewport) {
    viewport.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        diverEngine.triggerBubbles();
        diverEngine.triggerSonar();
      }
    });
  }
}

/* ==========================================================================
   CONSTRUCT 3D LUMINOUS LEVIATHAN WHALE MODEL
   ========================================================================== */
function create3DWhale(root) {
  const whaleGroup = new THREE.Group();
  // Colossal 50-meter Leviathan Titan
  whaleGroup.scale.set(1.9, 1.9, 1.9);
  root.add(whaleGroup);

  // Radiant Bioluminescent Materials
  const whaleSkinMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Vibrant deep royal azure
    emissive: 0x0c4a6e, // Intense luminous inner cyan-blue glow
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.35,
    flatShading: false
  });

  const ventralMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff, // Electric neon cyan
    emissive: 0x00e5ff, // Vivid glowing underbelly throat grooves
    emissiveIntensity: 2.8,
    roughness: 0.15,
    metalness: 0.2
  });

  const runeMat = new THREE.MeshBasicMaterial({
    color: 0x4ef2bb, // Radiant neon emerald/cyan
    blending: THREE.AdditiveBlending
  });

  const edgeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Brilliant glowing edge piping
    blending: THREE.AdditiveBlending
  });

  const eyeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9, // Celestial blinding eye glow
    blending: THREE.AdditiveBlending
  });

  // 1. Thorax / Main Hull
  const bodyGeo = new THREE.CylinderGeometry(5.2, 6.8, 22, 28);
  bodyGeo.rotateZ(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, whaleSkinMat);
  whaleGroup.add(bodyMesh);

  // 2. Head / Brow (Streamlined Rostrum)
  const headGeo = new THREE.ConeGeometry(5.8, 16, 28);
  headGeo.rotateZ(-Math.PI / 2);
  const headMesh = new THREE.Mesh(headGeo, whaleSkinMat);
  headMesh.position.set(18, -0.3, 0);
  whaleGroup.add(headMesh);

  // 3. Ventral Pleats (Underbelly throat grooves)
  const ventralGeo = new THREE.CylinderGeometry(4.8, 6.2, 18, 20, 1, false, 0, Math.PI);
  ventralGeo.rotateZ(Math.PI / 2);
  ventralGeo.rotateX(Math.PI);
  const ventralMesh = new THREE.Mesh(ventralGeo, ventralMat);
  ventralMesh.position.set(2, -2.0, 0);
  whaleGroup.add(ventralMesh);

  // Ventral Glowing Rib Arcs
  for (let v = 0; v < 6; v++) {
    const vRibGeo = new THREE.TorusGeometry(5.2, 0.18, 8, 24, Math.PI);
    vRibGeo.rotateZ(Math.PI / 2);
    vRibGeo.rotateY(Math.PI / 2);
    const vRibMesh = new THREE.Mesh(vRibGeo, edgeGlowMat);
    vRibMesh.position.set(8 - v * 2.8, -1.9, 0);
    whaleGroup.add(vRibMesh);
  }

  // 4. Bioluminescent Glowing Eyes
  const eyeGeo = new THREE.SphereGeometry(1.2, 20, 20);
  const eyeL = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeL.position.set(17, 1.1, 4.8);
  whaleGroup.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeR.position.set(17, 1.1, -4.8);
  whaleGroup.add(eyeR);

  // Eye Point Lights
  const eyeLightL = new THREE.PointLight(0x38bdf8, 3.5, 30);
  eyeLightL.position.set(17, 1.1, 5.5);
  whaleGroup.add(eyeLightL);

  const eyeLightR = new THREE.PointLight(0x38bdf8, 3.5, 30);
  eyeLightR.position.set(17, 1.1, -5.5);
  whaleGroup.add(eyeLightR);

  // 5. Pectoral Fins (Left & Right Flippers with glowing leading edges)
  const finGeo = new THREE.BoxGeometry(18, 0.7, 4.5);
  finGeo.translate(-9, 0, 0);

  const finLeftPivot = new THREE.Group();
  finLeftPivot.position.set(7, -2.2, 5.8);
  finLeftPivot.rotation.y = (Math.PI / 180) * 35;
  finLeftPivot.rotation.z = -(Math.PI / 180) * 15;
  finLeftPivot.add(new THREE.Mesh(finGeo, whaleSkinMat));

  const finEdgeL = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.9, 0.8), edgeGlowMat);
  finEdgeL.position.set(-9, 0, 2.3);
  finLeftPivot.add(finEdgeL);
  whaleGroup.add(finLeftPivot);

  const finRightPivot = new THREE.Group();
  finRightPivot.position.set(7, -2.2, -5.8);
  finRightPivot.rotation.y = -(Math.PI / 180) * 35;
  finRightPivot.rotation.z = -(Math.PI / 180) * 15;
  finRightPivot.add(new THREE.Mesh(finGeo, whaleSkinMat));

  const finEdgeR = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.9, 0.8), edgeGlowMat);
  finEdgeR.position.set(-9, 0, -2.3);
  finRightPivot.add(finEdgeR);
  whaleGroup.add(finRightPivot);

  // 6. Dorsal Fin with Glowing Ridge
  const dorsalGeo = new THREE.ConeGeometry(2.8, 5.5, 14);
  dorsalGeo.rotateZ(-(Math.PI / 180) * 35);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, whaleSkinMat);
  dorsalMesh.position.set(-6, 6.2, 0);
  whaleGroup.add(dorsalMesh);

  const dorsalTrimGeo = new THREE.BoxGeometry(1.0, 5.6, 0.7);
  dorsalTrimGeo.rotateZ(-(Math.PI / 180) * 35);
  const dorsalTrim = new THREE.Mesh(dorsalTrimGeo, edgeGlowMat);
  dorsalTrim.position.set(-5.6, 6.2, 0);
  whaleGroup.add(dorsalTrim);

  // 7. Articulated Tail Peduncle & Fluke
  const tailJoint1 = new THREE.Group();
  tailJoint1.position.set(-11, 0, 0);
  whaleGroup.add(tailJoint1);

  const tailSeg1Geo = new THREE.CylinderGeometry(3.8, 5.2, 11, 18);
  tailSeg1Geo.rotateZ(Math.PI / 2);
  const tailSeg1Mesh = new THREE.Mesh(tailSeg1Geo, whaleSkinMat);
  tailSeg1Mesh.position.set(-5.5, 0, 0);
  tailJoint1.add(tailSeg1Mesh);

  const tailJoint2 = new THREE.Group();
  tailJoint2.position.set(-11, 0, 0);
  tailJoint1.add(tailJoint2);

  const tailSeg2Geo = new THREE.ConeGeometry(3.8, 10, 18);
  tailSeg2Geo.rotateZ(Math.PI / 2);
  const tailSeg2Mesh = new THREE.Mesh(tailSeg2Geo, whaleSkinMat);
  tailSeg2Mesh.position.set(-5, 0, 0);
  tailJoint2.add(tailSeg2Mesh);

  // Massive 24-meter Tail Fluke with full-span bioluminescent edge
  const flukeGeo = new THREE.BoxGeometry(5.5, 0.8, 24);
  const flukeMesh = new THREE.Mesh(flukeGeo, whaleSkinMat);
  flukeMesh.position.set(-10, 0, 0);
  tailJoint2.add(flukeMesh);

  const flukeTrimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 24.2), edgeGlowMat);
  flukeTrimMesh.position.set(-12.8, 0, 0);
  tailJoint2.add(flukeTrimMesh);

  // 8. Bioluminescent Constellations & Lateral Lines
  const runeGroup = new THREE.Group();
  const runeSpheres = [];

  // Spine Runes
  for (let r = 0; r < 14; r++) {
    const rGeo = new THREE.SphereGeometry(0.65, 14, 14);
    const rMesh = new THREE.Mesh(rGeo, runeMat);
    rMesh.position.set(15 - r * 2.8, 4.8 - Math.abs(r - 6) * 0.25, 0);
    runeGroup.add(rMesh);
    runeSpheres.push(rMesh);
  }

  // Left & Right Flank Lateral Constellation Dots
  for (let f = 0; f < 10; f++) {
    const fGeo = new THREE.SphereGeometry(0.48, 12, 12);
    // Left flank
    const fMeshL = new THREE.Mesh(fGeo, runeMat);
    fMeshL.position.set(12 - f * 2.5, 0.8 - Math.sin(f * 0.5) * 0.8, 5.4);
    runeGroup.add(fMeshL);
    runeSpheres.push(fMeshL);

    // Right flank
    const fMeshR = new THREE.Mesh(fGeo, runeMat);
    fMeshR.position.set(12 - f * 2.5, 0.8 - Math.sin(f * 0.5) * 0.8, -5.4);
    runeGroup.add(fMeshR);
    runeSpheres.push(fMeshR);
  }

  whaleGroup.add(runeGroup);

  return {
    group: whaleGroup,
    finLeft: finLeftPivot,
    finRight: finRightPivot,
    tailJoint1: tailJoint1,
    tailJoint2: tailJoint2,
    runes: runeSpheres,
    eyes: [eyeL, eyeR]
  };
}

/* ==========================================================================
   ANIMATE 3D WHALE KINEMATICS
   ========================================================================== */
function animate3DWhale(k, root, time, state) {
  const cadence = state.whaleSwimCadence;
  const cycle = time * cadence * Math.PI * 2;

  const tailAngle1 = Math.sin(cycle) * 0.22;
  const tailAngle2 = Math.sin(cycle - 0.9) * 0.32;

  k.tailJoint1.rotation.y = tailAngle1;
  k.tailJoint2.rotation.y = tailAngle2;

  k.tailJoint1.rotation.z = Math.cos(cycle) * 0.08;
  k.tailJoint2.rotation.z = Math.cos(cycle - 0.7) * 0.12;

  k.finLeft.rotation.z = -(Math.PI / 180) * 15 + Math.sin(cycle * 0.8) * 0.22;
  k.finRight.rotation.z = -(Math.PI / 180) * 15 - Math.sin(cycle * 0.8) * 0.22;

  state.whaleRoll += (state.whaleTargetRoll - state.whaleRoll) * 0.05;
  k.group.rotation.x = state.whaleRoll;

  k.runes.forEach((rune, idx) => {
    const pulse = Math.sin(time * 3.5 + idx * 0.4) * 0.45 + 0.95;
    rune.scale.setScalar(pulse);
  });
}

/* ==========================================================================
   INTERPOLATE FOG & LIGHTING WITH SCROLL DEPTH
   ========================================================================== */
function interpolateFogAndLighting(p, fog, ambientLight, sunLight, underwaterPointLight, scene, sunGroup, skyDome) {
  if (!fog) return;

  const cSunset = new THREE.Color(0xb45309);   // Warm golden amber 17:00 sunset horizon
  const cShallows = new THREE.Color(0x0284c7); // Epipelagic azure
  const cTwilight = new THREE.Color(0x0c4a6e); // Mesopelagic indigo
  const cMidnight = new THREE.Color(0x021729); // Bathypelagic deep navy
  const cAbyss = new THREE.Color(0x02162e);    // Luminous deep oceanic abyssal midnight

  const currentColor = new THREE.Color();

  if (p < 0.18) {
    const f = p / 0.18;
    currentColor.copy(cSunset).lerp(cShallows, f);
    fog.density = 0.0009 + f * 0.0047; // Clear open sky horizon smoothly becoming ocean depth
    ambientLight.color.setHex(0xffecd2);
    ambientLight.intensity = 1.6 - f * 0.8; // Radiant golden hour
    sunLight.intensity = 3.6 * (1 - f);
    if (underwaterPointLight) underwaterPointLight.intensity = f * 2.2;
    if (sunGroup) {
      sunGroup.visible = true;
      sunGroup.position.y = 68 - f * 20; // Poetic sunfall sinking towards horizon before diving
    }
    if (skyDome) skyDome.visible = true;
  } else if (p < 0.38) {
    const f = (p - 0.18) / 0.20;
    currentColor.copy(cShallows).lerp(cTwilight, f);
    fog.density = 0.0056;
    ambientLight.color.setHex(0x38bdf8);
    ambientLight.intensity = 0.8 - f * 0.35;
    sunLight.intensity = 0;
    if (underwaterPointLight) underwaterPointLight.intensity = 2.2;
    if (sunGroup) sunGroup.visible = false;
    if (skyDome) skyDome.visible = false;
  } else if (p < 0.60) {
    const f = (p - 0.38) / 0.22;
    currentColor.copy(cTwilight).lerp(cMidnight, f);
    fog.density = 0.005;
    ambientLight.color.setHex(0x0284c7);
    ambientLight.intensity = 0.45 - f * 0.15;
    if (underwaterPointLight) underwaterPointLight.intensity = 1.8;
    if (sunGroup) sunGroup.visible = false;
    if (skyDome) skyDome.visible = false;
  } else {
    const f = Math.min((p - 0.60) / 0.40, 1);
    currentColor.copy(cMidnight).lerp(cAbyss, f);
    fog.density = 0.0018; // Very clear abyssal depth so the colossal Leviathan is crystal clear!
    ambientLight.color.setHex(0x38bdf8);
    ambientLight.intensity = 1.3; // Generous luminous ambient light
    if (underwaterPointLight) underwaterPointLight.intensity = 2.8;
    if (sunGroup) sunGroup.visible = false;
    if (skyDome) skyDome.visible = false;
  }

  fog.color.copy(currentColor);
  if (scene && scene.background) {
    scene.background.copy(currentColor);
  }
}

/* ==========================================================================
   2. BATHYMETER & TELEMETRY
   ========================================================================== */
function initBathymeter() {
  const hudDepth = document.getElementById('hud-depth');
  const hudStratum = document.getElementById('hud-stratum');
  const hudPressure = document.getElementById('hud-pressure');
  const hudLux = document.getElementById('hud-lux');
  const hudDepthBar = document.getElementById('hud-depth-bar');
  const hudNeedle = document.getElementById('hud-needle');
  const hudNeedleText = document.getElementById('hud-needle-text');
  const quickAscentBtn = document.getElementById('quick-ascent');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateTelemetry() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollY / (docHeight || 1), 0), 1);

    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    if (scrollY > 400) {
      quickAscentBtn.classList.add('visible');
    } else {
      quickAscentBtn.classList.remove('visible');
    }

    if (hudDepthBar) hudDepthBar.style.height = `${progress * 100}%`;
    if (hudNeedle) hudNeedle.style.top = `${progress * 100}%`;

    let depthMeters = 0;
    let stratumText = '';
    let pressureAtm = 1.0;
    let luxText = '';
    let needleLabel = '';

    if (progress < 0.18) {
      const skyProg = progress / 0.18;
      depthMeters = (1 - skyProg) * 20;
      stratumText = '17:00 SUNSET (SKY)';
      pressureAtm = 1.0;
      luxText = '100% GOLDEN';
      needleLabel = '17:00';
      if (hudDepth) hudDepth.innerText = `+${depthMeters.toFixed(1)} m`;
    } else if (progress < 0.38) {
      const p = (progress - 0.18) / 0.20;
      depthMeters = -p * 200;
      stratumText = 'EPIPELAGIC SHALLOWS';
      pressureAtm = 1.0 + Math.abs(depthMeters) / 10;
      luxText = `${Math.round((1 - p * 0.7) * 100)}% AZURE`;
      needleLabel = `${Math.round(depthMeters)}m`;
      if (hudDepth) hudDepth.innerText = `${depthMeters.toFixed(0)} m`;
    } else if (progress < 0.60) {
      const p = (progress - 0.38) / 0.22;
      depthMeters = -200 - p * 800;
      stratumText = 'MESOPELAGIC TWILIGHT';
      pressureAtm = 1.0 + Math.abs(depthMeters) / 10;
      luxText = `${(30 * (1 - p)).toFixed(1)}% DIM`;
      needleLabel = `${(depthMeters / 1000).toFixed(1)}km`;
      if (hudDepth) hudDepth.innerText = `${depthMeters.toFixed(0)} m`;
    } else if (progress < 0.82) {
      const p = (progress - 0.60) / 0.22;
      depthMeters = -1000 - p * 3000;
      stratumText = 'BATHYPELAGIC MIDNIGHT';
      pressureAtm = 1.0 + Math.abs(depthMeters) / 10;
      luxText = '0.01% BIOLUM.';
      needleLabel = `${(depthMeters / 1000).toFixed(1)}km`;
      if (hudDepth) hudDepth.innerText = `${depthMeters.toFixed(0)} m`;
    } else {
      const p = (progress - 0.82) / 0.18;
      depthMeters = -4000 - p * 6928;
      stratumText = 'HADAL ABYSS FLOOR';
      pressureAtm = 1.0 + Math.abs(depthMeters) / 10;
      luxText = '0.00% 3D LEVIATHAN';
      needleLabel = `${(depthMeters / 1000).toFixed(1)}km`;
      if (hudDepth) hudDepth.innerText = `${depthMeters.toFixed(0)} m`;
    }

    if (hudStratum) hudStratum.innerText = stratumText;
    if (hudPressure) hudPressure.innerText = `${pressureAtm.toFixed(1)} ATM`;
    if (hudLux) hudLux.innerText = luxText;
    if (hudNeedleText) hudNeedleText.innerText = needleLabel;

    const sections = ['hero', 'education', 'experience', 'leadership', 'abyss'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      }
    });

    if (window.updateAudioStratum) {
      window.updateAudioStratum(progress);
    }
  }

  window.addEventListener('scroll', updateTelemetry, { passive: true });
  window.addEventListener('resize', updateTelemetry, { passive: true });
  updateTelemetry();

  if (quickAscentBtn) {
    quickAscentBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   3. PROCEDURAL WEB AUDIO ENGINE
   ========================================================================== */
let globalAudioCtx = null;
let globalMasterGain = null;

function initWebAudio() {
  const audioBtn = document.getElementById('audio-toggle');
  const audioState = document.getElementById('audio-state');
  if (!audioBtn) return;

  let isPlaying = false;
  let oceanNoiseNode = null;
  let noiseFilter = null;
  let subDroneOsc = null;
  let subDroneGain = null;

  function createProceduralAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    globalAudioCtx = new AudioContext();

    globalMasterGain = globalAudioCtx.createGain();
    globalMasterGain.gain.setValueAtTime(0.16, globalAudioCtx.currentTime);
    globalMasterGain.connect(globalAudioCtx.destination);

    const bufferSize = globalAudioCtx.sampleRate * 2;
    const noiseBuffer = globalAudioCtx.createBuffer(1, bufferSize, globalAudioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    oceanNoiseNode = globalAudioCtx.createBufferSource();
    oceanNoiseNode.buffer = noiseBuffer;
    oceanNoiseNode.loop = true;

    noiseFilter = globalAudioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, globalAudioCtx.currentTime);

    oceanNoiseNode.connect(noiseFilter);
    noiseFilter.connect(globalMasterGain);
    oceanNoiseNode.start();

    subDroneOsc = globalAudioCtx.createOscillator();
    subDroneOsc.type = 'sine';
    subDroneOsc.frequency.setValueAtTime(50, globalAudioCtx.currentTime);

    subDroneGain = globalAudioCtx.createGain();
    subDroneGain.gain.setValueAtTime(0.01, globalAudioCtx.currentTime);

    subDroneOsc.connect(subDroneGain);
    subDroneGain.connect(globalMasterGain);
    subDroneOsc.start();
  }

  window.updateAudioStratum = function(progress) {
    if (!globalAudioCtx || !isPlaying) return;
    const time = globalAudioCtx.currentTime;
    if (progress < 0.2) {
      noiseFilter.frequency.setTargetAtTime(750, time, 0.5);
      subDroneGain.gain.setTargetAtTime(0.01, time, 0.5);
    } else if (progress < 0.6) {
      noiseFilter.frequency.setTargetAtTime(340, time, 0.5);
      subDroneGain.gain.setTargetAtTime(0.08, time, 0.5);
    } else {
      noiseFilter.frequency.setTargetAtTime(130, time, 0.5);
      subDroneGain.gain.setTargetAtTime(0.2, time, 0.5);
    }
  };

  audioBtn.addEventListener('click', () => {
    if (!globalAudioCtx) {
      createProceduralAudio();
      isPlaying = true;
      audioBtn.classList.add('active');
      audioState.innerText = 'LIVE';
    } else if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
      isPlaying = true;
      audioBtn.classList.add('active');
      audioState.innerText = 'LIVE';
    } else if (isPlaying) {
      globalMasterGain.gain.setTargetAtTime(0, globalAudioCtx.currentTime, 0.2);
      setTimeout(() => globalAudioCtx.suspend(), 200);
      isPlaying = false;
      audioBtn.classList.remove('active');
      audioState.innerText = 'OFF';
    } else {
      globalAudioCtx.resume();
      globalMasterGain.gain.setTargetAtTime(0.16, globalAudioCtx.currentTime, 0.2);
      isPlaying = true;
      audioBtn.classList.add('active');
      audioState.innerText = 'LIVE';
    }
  });
}

function playWhaleSound(startFreq = 300, endFreq = 160, duration = 1.2) {
  if (!globalAudioCtx || globalAudioCtx.state !== 'running') return;
  try {
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.type = 'sine';

    const now = globalAudioCtx.currentTime;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(globalMasterGain);
    osc.start();
    osc.stop(now + duration);
  } catch (err) {
    console.warn('Audio call error:', err);
  }
}

function playRegulatorSound() {
  if (!globalAudioCtx || globalAudioCtx.state !== 'running') return;
  try {
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.type = 'sine';

    const now = globalAudioCtx.currentTime;
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(globalMasterGain);
    osc.start();
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Regulator audio error:', err);
  }
}

function playSplashSound() {
  if (!globalAudioCtx || globalAudioCtx.state !== 'running') return;
  try {
    const bufferSize = Math.floor(globalAudioCtx.sampleRate * 0.45);
    const buffer = globalAudioCtx.createBuffer(1, bufferSize, globalAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * 0.08));
    }
    const noise = globalAudioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = globalAudioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, globalAudioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, globalAudioCtx.currentTime + 0.4);
    filter.Q.value = 2.5;

    const gain = globalAudioCtx.createGain();
    gain.gain.setValueAtTime(0.09, globalAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(globalMasterGain);
    noise.start();
  } catch (err) {
    console.warn('Splash audio error:', err);
  }
}

/* ==========================================================================
   4. MODALS & FORMS
   ========================================================================= */
function initModalsAndForms() {
  const btnPrintCv = document.getElementById('btn-print-cv');
  const terminalPrintCv = document.getElementById('terminal-print-cv');
  const cvModal = document.getElementById('cv-modal');
  const modalClose = document.getElementById('modal-close');
  const modalDoPrint = document.getElementById('modal-do-print');

  function openModal() {
    if (cvModal) cvModal.classList.add('open');
  }

  function closeModal() {
    if (cvModal) cvModal.classList.remove('open');
  }

  if (btnPrintCv) btnPrintCv.addEventListener('click', openModal);
  if (terminalPrintCv) terminalPrintCv.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalDoPrint) {
    modalDoPrint.addEventListener('click', () => window.print());
  }

  if (cvModal) {
    cvModal.addEventListener('click', (e) => {
      if (e.target === cvModal) closeModal();
    });
  }

  window.handleTransmissionSubmit = function(event) {
    event.preventDefault();
    const btn = document.getElementById('transmit-btn');
    const status = document.getElementById('transmission-status');
    const name = document.getElementById('sender-name').value;

    if (btn) btn.disabled = true;
    if (status) {
      status.className = 'transmission-status';
      status.innerText = 'Broadcasting sonar packet to Syrdarya beacon...';
    }

    playWhaleSound(400, 200, 0.6);

    setTimeout(() => {
      if (btn) btn.disabled = false;
      if (status) {
        status.className = 'transmission-status success';
        status.innerText = `Transmission confirmed from ${name}! Thank you. Direct contact: shohinurergasheva@gmail.com`;
      }
      document.getElementById('transmission-form').reset();
    }, 1200);
  };
}

/* ==========================================================================
   5. 3D CARD TILT EFFECT
   ========================================================================== */
function initTiltCards() {
  const cards = document.querySelectorAll('.glass-card, .initiative-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
