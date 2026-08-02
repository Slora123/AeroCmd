import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ======================================================================
   ASSET MANIFEST
====================================================================== */
const MODELS = {
  airplane1: '/assets/glb/airplane1.glb',
  airplane2: '/assets/glb/airplane2.glb',
  airplane3: '/assets/glb/airplane3.glb',
  airplane4: '/assets/glb/airplane4.glb',
  airplane5: '/assets/glb/airplane5.glb',
  airplane6: '/assets/glb/airplane6.glb',
  airplane7: '/assets/glb/airplane7.glb',
  airport: '/assets/glb/airport.glb',
  terminal: '/assets/glb/airport_terminal.glb',
  tower: '/assets/glb/control_tower.glb',
  jetway: '/assets/glb/jetway.glb',
  fuelTruck: '/assets/glb/airport_fuel_truck.glb',
  bus: '/assets/glb/airport_passenger_bus.glb',
  tug: '/assets/glb/airport_tug.glb',
  pushback: '/assets/glb/pushback.glb',
  baggageCart: '/assets/glb/airport_baggage_cart.glb',
  cargoContainer: '/assets/glb/cargo_container.glb',
  barrier: '/assets/glb/barrier.glb',
  cone: '/assets/glb/traffic_cone.glb',
};

// Loaded first, blocking the boot sequence.
const INTRO_KEY = 'airplane2';
// Loaded in the background during the 10s boot sequence, ready by the time
// the user hits START.
const CORE_KEYS = ['airport', 'terminal', 'jetway', 'airplane1', 'airplane2', 'airplane3', 'airplane4', 'airplane5', 'airplane6', 'airplane7', 'fuelTruck', 'barrier', 'cone', 'baggageCart'];
// Streamed in after the simulation is already interactive.
const STREAM_KEYS = ['airplane3', 'airplane4', 'airplane5', 'airplane7', 'tug', 'pushback', 'bus', 'cargoContainer', 'tower'];

const cache = new Map(); // key -> THREE.Group (raw, normalized, un-parented)
const pendingPromises = new Map(); // key -> Promise
const gltfLoader = new GLTFLoader();

function loadModel(key) {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (pendingPromises.has(key)) return pendingPromises.get(key);

  const promise = new Promise((resolve, reject) => {
    gltfLoader.load(
      MODELS[key],
      (gltf) => {
        const wrapped = normalizeAndWrap(gltf.scene, key);
        cache.set(key, wrapped);
        pendingPromises.delete(key);
        resolve(wrapped);
      },
      (xhr) => {
        if (key === 'airport' && xhr.lengthComputable) {
           const percent = Math.round((xhr.loaded / xhr.total) * 100);
           const el = document.getElementById('vp-loading-text');
           if (el) el.innerText = `DOWNLOADING 3D AIRPORT... ${percent}%`;
        }
      },
      (err) => { 
        console.warn('Failed to load', key, err); 
        pendingPromises.delete(key);
        resolve(null); 
      }
    );
  });
  pendingPromises.set(key, promise);
  return promise;
}

/** Center a loaded scene on X/Z, sit it on the ground plane (y=0), and scale
 *  it uniformly so its largest dimension equals a sensible target size. */
function normalizeAndWrap(scene, key) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);

  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;

  scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const target = TARGET_SIZE[key] ?? 8;
  const scale = target / maxDim;

  const group = new THREE.Group();
  group.name = key;
  group.add(scene);
  group.scale.setScalar(scale);
  group.userData.baseScale = scale;
  return group;
}

const TARGET_SIZE = {
  airplane1: 22, airplane2: 20, airplane3: 24, airplane4: 26, airplane5: 28, airplane6: 16, airplane7: 22,
  airport: 300, terminal: 90, tower: 46, jetway: 16,
  fuelTruck: 9, bus: 10, tug: 5, pushback: 4, baggageCart: 6, cargoContainer: 6,
  barrier: 1.6, cone: 0.9,
};

function cloneModel(key) {
  const src = cache.get(key);
  if (!src) return null;
  const clone = src.clone(true);
  clone.userData.baseScale = src.userData.baseScale;
  return clone;
}

/* ======================================================================
   SHARED HELPERS
====================================================================== */
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

function tweenValue(duration, onUpdate, onComplete, ease = easeInOutCubic) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    onUpdate(ease(t));
    if (t < 1) requestAnimationFrame(step);
    else if (onComplete) onComplete();
  }
  requestAnimationFrame(step);
}

function updateClocks() {
  const now = new Date();
  const str = now.toISOString().substr(11, 8) + 'Z';
  const c1 = document.getElementById('clock');
  const c2 = document.getElementById('sim-clock');
  if (c1) c1.textContent = str;
  if (c2) c2.textContent = str;
}
setInterval(updateClocks, 1000);
updateClocks();

/* ======================================================================
   INTRO SEQUENCE
====================================================================== */
const introCanvas = document.getElementById('intro-canvas');
const introScene = new THREE.Scene();
introScene.fog = new THREE.FogExp2(0x05080c, 0.012);

const introCamera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);
const introRenderer = new THREE.WebGLRenderer({ canvas: introCanvas, antialias: true, alpha: true });
introRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
introRenderer.setSize(window.innerWidth, window.innerHeight);
introRenderer.outputColorSpace = THREE.SRGBColorSpace;

/* Sky dome — the plane should read against an actual sky, not a void.
   Kept in the same dusk/cyan HUD palette so it still feels like the
   AEROCMD instrument aesthetic rather than a plain daytime sky. */
function buildIntroSky() {
  const skyGeo = new THREE.SphereGeometry(1200, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor:    { value: new THREE.Color(0x0a0c27) },     // Deep space blue
      midColor:    { value: new THREE.Color(0x1a3b5c) },     // Rich night blue
      bottomColor: { value: new THREE.Color(0x0088aa) },     // Vibrant cyan horizon
      offset:      { value: 30 },
      exponent:    { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 midColor; uniform vec3 bottomColor;
      uniform float offset; uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        vec3 col = h > 0.0 ? mix(midColor, topColor, pow(clamp(h,0.0,1.0), exponent))
                            : mix(midColor, bottomColor, pow(clamp(-h*3.0,0.0,1.0), 0.9));
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  introScene.add(sky);

  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xffeebb, transparent: true, opacity: 0.95, depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sunSprite.scale.set(220, 220, 1);
  sunSprite.position.set(-320, 180, -420);
  introScene.add(sunSprite);

  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xffaa44, transparent: true, opacity: 0.45, depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sunGlow.scale.set(500, 500, 1);
  sunGlow.position.copy(sunSprite.position);
  introScene.add(sunGlow);

  // Add beautiful starfield
  const starGeo = new THREE.BufferGeometry();
  const starPos = [];
  for(let i = 0; i < 400; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = 300 + Math.random() * 800; // stars only in the upper sky
    const z = (Math.random() - 0.5) * 2000;
    starPos.push(x, y, z);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, transparent: true, opacity: 0.8, sizeAttenuation: false });
  const stars = new THREE.Points(starGeo, starMat);
  introScene.add(stars);
}
buildIntroSky();
// Fog now matches the sky's horizon color instead of fading to black, and is
// light enough that the dome stays visible behind the plane.
introScene.fog.color.set(0x123648);
introScene.fog.density = 0.0032;

introScene.add(new THREE.HemisphereLight(0x8fd3ff, 0x0a0e14, 0.55));
const keyLight = new THREE.DirectionalLight(0x9fe8ff, 1.6);
keyLight.position.set(20, 30, 15);
introScene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x4fd8e8, 1.1);
rimLight.position.set(-25, 10, -20);
introScene.add(rimLight);

// Faint ground disc replaced with beautiful lush green grass plane!
const discGeo = new THREE.PlaneGeometry(4000, 4000);
const discMat = new THREE.MeshStandardMaterial({ 
  color: 0x1d472c,       // beautiful dark lush green
  emissive: 0x051a0d,    // slight emissive glow so it doesn't get completely pitch black
  roughness: 0.9, 
  metalness: 0.0 
});
const disc = new THREE.Mesh(discGeo, discMat);
disc.rotation.x = -Math.PI / 2;
disc.position.y = 0;
disc.receiveShadow = true;
introScene.add(disc);

let introPlane = null;

const bootLines = [
  'BOOT// AEROCMD KERNEL v2.3.1',
  'LINK// GROUND-OPS SATELLITE UPLINK.......OK',
  'NAV// RUNWAY DATASET SYNC..............OK',
  'SYS// LOADING FLEET GEOMETRY...........',
];
const bootReadout = document.getElementById('boot-readout');
bootLines.forEach((line, i) => {
  const el = document.createElement('div');
  el.className = 'line';
  el.style.animationDelay = `${0.3 + i * 0.35}s`;
  el.innerHTML = i < bootLines.length - 1 ? `<span class="ok">›</span> ${line}` : `<span class="ok">›</span> ${line}`;
  bootReadout.appendChild(el);
});

const loadingBarFill = document.getElementById('loading-bar-fill');
const loadingPct = document.getElementById('loading-pct');
const loadingStatus = document.getElementById('loading-status');
const statusMessages = [
  'ESTABLISHING UPLINK…', 'CALIBRATING RADAR ARRAY…', 'LOADING TERMINAL GEOMETRY…',
  'SYNCING TAXIWAY GRID…', 'SPOOLING FLEET TELEMETRY…', 'FINALIZING BOOT SEQUENCE…'
];
let statusIdx = 0;
const statusTimer = setInterval(() => {
  statusIdx = (statusIdx + 1) % statusMessages.length;
  loadingStatus.textContent = statusMessages[statusIdx];
}, 1600);

let realProgress = 0; // 0..1 driven by actual asset loads (weighted)
function setProgress(p) {
  realProgress = Math.max(realProgress, p);
  loadingBarFill.style.width = `${Math.round(realProgress * 100)}%`;
  loadingPct.textContent = `${Math.round(realProgress * 100)}%`;
}

let introBoxSize = new THREE.Vector3(1, 1, 1);

/* Discrete zoom-out "shots" — first held longest, each next one a little
   wider, matching a slow reference-photo style zoom-out rather than one
   continuous drift. Values are fractions of the model's own bounding box,
   so this adapts to whatever the hero model's actual size turns out to be.
   radius/height are camera offsets from center; azimuth gently rotates the
   framing stage to stage so it doesn't feel like a locked-off shot. */
const INTRO_ANGLE_STAGES = [
  // Stage 0: Front-Left, looking directly at the nose (Z = -0.45)
  { duration: 4000, radiusF: 0.55, heightF: 0.22, azimuth: 3.5, lookHeightF: 0.18, lookXF: -0.05, lookZF: -0.45 },
  // Stage 1: Panning slightly back along the left side
  { duration: 3000, radiusF: 0.75, heightF: 0.28, azimuth: 3.9, lookHeightF: 0.18, lookXF: 0.0, lookZF: -0.25 },
  // Stage 2: Mid fuselage
  { duration: 3000, radiusF: 1.00, heightF: 0.35, azimuth: 4.3, lookHeightF: 0.18, lookXF: 0.0, lookZF: -0.10 },
  // Stage 3: Full left profile, looking at center, zoomed out to fill screen
  { duration: 3000, radiusF: 1.30, heightF: 0.45, azimuth: 4.71, lookHeightF: -0.10, lookXF: 0.0, lookZF: 0.0 },
];

function fitIntroCameraStart(box) {
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  introBoxSize = size;
  const s0 = INTRO_ANGLE_STAGES[0];
  const maxHoriz = Math.max(size.x, size.z);
  introCamera.position.set(
    center.x + Math.sin(s0.azimuth) * maxHoriz * s0.radiusF,
    center.y + size.y * s0.heightF,
    center.z + Math.cos(s0.azimuth) * maxHoriz * s0.radiusF
  );
  introCamera.lookAt(
    center.x + size.x * s0.lookXF, 
    center.y + size.y * s0.lookHeightF, 
    center.z + size.z * (s0.lookZF || 0)
  );
}

/* Plays through INTRO_ANGLE_STAGES in sequence — a slow, continuous
   zoom-out between each held framing — then hands off to the flyover. */
function animateIntroCamera(box) {
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const maxHoriz = Math.max(size.x, size.z);

  const shots = INTRO_ANGLE_STAGES.map(s => ({
    duration: s.duration,
    pos: new THREE.Vector3(
      center.x + Math.sin(s.azimuth) * maxHoriz * s.radiusF,
      center.y + size.y * s.heightF,
      center.z + Math.cos(s.azimuth) * maxHoriz * s.radiusF
    ),
    target: new THREE.Vector3(center.x + size.x * s.lookXF, center.y + size.y * s.lookHeightF, center.z + size.z * (s.lookZF || 0)),
  }));

  let prevPos = introCamera.position.clone();
  let prevTarget = shots.length ? shots[0].target.clone() : center.clone();
  const totalDuration = shots.reduce((sum, s) => sum + s.duration, 0);
  let elapsedBefore = 0;

  function playStage(i) {
    if (i >= shots.length) { startFlyoverPhase(box); return; }
    const shot = shots[i];
    const fromPos = prevPos.clone();
    const fromTarget = prevTarget.clone();
    tweenValue(shot.duration, (t) => {
      introCamera.position.lerpVectors(fromPos, shot.pos, t);
      const currT = new THREE.Vector3().lerpVectors(fromTarget, shot.target, t);
      introCamera.lookAt(currT);
      
      const overallT = (elapsedBefore + t * shot.duration) / totalDuration;
      document.getElementById('loading-pct').innerText = Math.round(overallT * 100) + '%';
      document.querySelector('.loading-bar-fill').style.width = (overallT * 100) + '%';
    }, () => {
      prevPos = shot.pos.clone();
      prevTarget = shot.target.clone();
      elapsedBefore += shot.duration;
      playStage(i + 1);
    });
  }
  playStage(0);
}

/* ---------------- Cloud sprites (procedural, no external texture) ------ */
let introCloudTexture = null;
function getCloudTexture() {
  if (introCloudTexture) return introCloudTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.55, 'rgba(210,235,240,0.4)');
  grad.addColorStop(1, 'rgba(210,235,240,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  introCloudTexture = new THREE.CanvasTexture(canvas);
  return introCloudTexture;
}

const introClouds = []; // { sprite, speed, spanX }
function buildIntroClouds(center, spanX) {
  if (introClouds.length) return;
  const tex = getCloudTexture();
  const count = 40; // many small subtle clouds
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({ 
      map: tex, 
      transparent: true, 
      depthWrite: false, 
      opacity: 0.05 + Math.random() * 0.15, // much more subtle!
      blending: THREE.AdditiveBlending 
    });
    const sprite = new THREE.Sprite(mat);
    const scaleX = 200 + Math.random() * 300; // very wide!
    const scaleY = 20 + Math.random() * 30;   // very thin!
    sprite.scale.set(scaleX, scaleY, 1);
    const x = -spanX + Math.random() * spanX * 2;
    const y = center.y + 150 + Math.random() * 200; // higher up
    const z = center.z - 200 - Math.random() * 400; // pushed further back
    sprite.position.set(x, y, z);
    introScene.add(sprite);
    introClouds.push({ sprite, speed: 5 + Math.random() * 10, spanX });
  }
}
function updateIntroClouds(dt) {
  for (const c of introClouds) {
    c.sprite.position.x -= c.speed * dt; // drift right -> left
    if (c.sprite.position.x < -c.spanX) c.sprite.position.x = c.spanX;
  }
}

/* ---------------- Flyover phase: plane crosses the frame, logo fades in - */
let flyoverStarted = false;
function startFlyoverPhase(box) {
  if (flyoverStarted) return;
  flyoverStarted = true;

  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const spanX = Math.max(size.x, size.z) * 2.4 + 60;

  // Wide side-on framing so the plane can travel the full width of the shot.
  introCamera.position.set(center.x, center.y + size.y * 1.4, center.z + spanX * 0.85);
  introCamera.lookAt(center.x, center.y + size.y * 0.6, center.z);

  if (introPlane) {
    introPlane.rotation.set(0, Math.PI / 2, 0); // face along +X, its direction of travel
    introPlane.position.y = size.y * 0.35;
  }

  buildIntroClouds(center, spanX);
  onIntroReveal(); // reveal logo/tagline/start button as the flyover begins

  function loopPlane() {
    if (!introPlane) return;
    introPlane.position.x = -spanX * 0.95;
    tweenValue(7000, (t) => {
      introPlane.position.x = lerp(-spanX * 0.95, spanX * 0.95, t);
      introPlane.position.y = size.y * 1.2 + Math.sin(t * Math.PI * 4) * size.y * 0.05;
    }, loopPlane, (t) => t); // linear, loops indefinitely
  }
  loopPlane();
}

let lastIntroFrame = performance.now();
function renderIntroLoop() {
  requestAnimationFrame(renderIntroLoop);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastIntroFrame) / 1000);
  lastIntroFrame = now;
  if (introClouds.length) updateIntroClouds(dt);
  introRenderer.render(introScene, introCamera);
}
renderIntroLoop();

window.addEventListener('resize', () => {
  introCamera.aspect = window.innerWidth / window.innerHeight;
  introCamera.updateProjectionMatrix();
  introRenderer.setSize(window.innerWidth, window.innerHeight);
  if (simActive) onSimResize();
});

let introRevealed = false;
function onIntroReveal() {
  if (introRevealed) return;
  introRevealed = true;
  clearInterval(statusTimer);
  
  document.getElementById('boot-readout').style.opacity = '0';
  document.querySelectorAll('.hud-topline').forEach(el => el.style.opacity = '0');
  document.getElementById('logo-wrap').classList.add('visible');

  // Notify React parent that loading is done and we are ready for the button
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'SIMULATION_READY' }, '*');
  }
}

/* Kick off intro: load hero plane (blocking), then background-preload core
   assets for the simulation while the staged camera reveal plays out. */
(async function bootIntro() {
  const heroKey = INTRO_KEY;
  gltfLoader.load(MODELS[heroKey], (gltf) => {
    const wrapped = normalizeAndWrap(gltf.scene, heroKey);
    cache.set(heroKey, wrapped);
    introPlane = wrapped;
    introScene.add(introPlane);
    const box = new THREE.Box3().setFromObject(introPlane);
    fitIntroCameraStart(box);
    setProgress(0.35);
    animateIntroCamera(box);
    window.corePreloadPromise = preloadCore();
  }, (xhr) => {
    if (xhr.total) setProgress((xhr.loaded / xhr.total) * 0.35);
  });
})();

async function preloadCore() {
  let done = 0;
  for (const key of CORE_KEYS) {
    await loadModel(key);
    done++;
    setProgress(0.35 + 0.65 * (done / CORE_KEYS.length));
    logAsset(key);
  }
  setProgress(1);
  const lw = document.getElementById('loading-wrap');
  if (lw) {
    lw.style.opacity = '0';
    lw.style.pointerEvents = 'none';
  }
}

/* ======================================================================
   START BUTTON -> TRANSITION TO SIMULATION
====================================================================== */
window.triggerStart = async function triggerStart() {
  const introEl = document.getElementById('intro');
  if (!introEl || introEl.style.display === 'none') return;
  introEl.style.pointerEvents = 'none'; // prevent double clicks
  
  // Show loading feedback on the button
  const btnLabel = document.querySelector('.start-btn-label');
  if (btnLabel) btnLabel.innerText = 'CONFIGURING...';
  
  introEl.classList.add('fade-out');
  
  ensureSim();
  
  // Post message to React parent directly
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'SIMULATION_STARTED' }, '*');
  }

  setTimeout(() => {
    introEl.style.display = 'none';
    const simEl = document.getElementById('sim');
    if (simEl) {
      simEl.classList.remove('hidden');
      simEl.style.display = 'flex';
      requestAnimationFrame(() => simEl.classList.add('visible'));
    }
    onSimResize();
  }, 500);
}


// Listen for React parent to trigger start
window.addEventListener('message', (e) => {
  if (e.data?.type === 'START_SIMULATION') window.triggerStart();
});

// Also bind directly to the button if it exists
const startBtn = document.getElementById('start-btn');
if (startBtn) {
  startBtn.addEventListener('click', window.triggerStart);
}

/* ======================================================================
   SIMULATION SCENE
====================================================================== */
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

let simActive = false;
let simInitPromise = null;

const simCanvas = document.getElementById('sim-canvas');
const simScene = new THREE.Scene();

const simCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
const simRenderer = new THREE.WebGLRenderer({ canvas: simCanvas, antialias: true });
simRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
simRenderer.outputColorSpace = THREE.SRGBColorSpace;

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
document.getElementById('label-layer').appendChild(labelRenderer.domElement);

let controls;
const DEFAULT_CAM_POS = new THREE.Vector3(180, 150, 280);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 0, 0);

const planes = [];       // { key, group, gateIndex, altitude }
let selected = null;     // plane entry
let fuelTruckObj = null;
let tugObj = null;
const barriers = [];
let barrierMode = false;
let actionMode = 'none'; // 'none' | 'taxi' | 'flight'
let cameraMode = 'orbit'; // 'orbit' | 'chase'
const keysDown = new Set();

// Populated once the real airport geometry is inspected in initSim().
let AIRPORT_LAYOUT = null;

const assetLogEl = document.getElementById('asset-log');
function logAsset(key) {
  if (!assetLogEl) return;
  const el = document.createElement('div');
  el.className = 'ok';
  el.textContent = key.toUpperCase();
  assetLogEl.appendChild(el);
  assetLogEl.scrollTop = assetLogEl.scrollHeight;
}


function ensureSim() {
  if (simInitPromise) return simInitPromise;
  simInitPromise = initSim();
  return simInitPromise;
}

/* ---------------- Sky dome ---------------- */
function buildSky() {
  const skyGeo = new THREE.SphereGeometry(1400, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x1c4f86) },
      midColor: { value: new THREE.Color(0x8fc3e0) },
      bottomColor: { value: new THREE.Color(0xdcecf2) },
      offset: { value: 40 },
      exponent: { value: 0.55 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 topColor; uniform vec3 midColor; uniform vec3 bottomColor;
      uniform float offset; uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        vec3 col = h > 0.0 ? mix(midColor, topColor, pow(clamp(h,0.0,1.0), exponent))
                            : mix(midColor, bottomColor, pow(clamp(-h*3.0,0.0,1.0), 0.9));
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  simScene.add(sky);

  // soft sun glow
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xfff3d6, transparent: true, opacity: 0.9, depthWrite: false,
  }));
  sunSprite.scale.set(120, 120, 1);
  sunSprite.position.set(-500, 260, -650);
  simScene.add(sunSprite);
}

/* ---------------- Floating HUD labels ---------------- */
function addLabel(target, text, dim = false) {
  const div = document.createElement('div');
  div.className = 'tag-label' + (dim ? ' dim' : '');
  div.textContent = text;
  const label = new CSS2DObject(div);
  const box = new THREE.Box3().setFromObject(target);
  const localTop = Math.max(1.5, (box.max.y - target.position.y)) + 2.2;
  label.position.set(0, localTop, 0);
  target.add(label);
  return label;
}

/* ---------------- Derive a proper airport layout from the model ------
   Rather than scattering objects at arbitrary coordinates, we read the
   real "runway" node baked into airport.glb, then lay the taxiway,
   apron/gates, terminal, tower and support vehicles out relative to it. */
function computeAirportLayout(airportGroup) {
  if (!airportGroup) {
    // Return a default hardcoded layout if the model isn't loaded yet
    const zDir = new THREE.Vector3(0, 0, 1);
    const xDir = new THREE.Vector3(1, 0, 0);
    const center = new THREE.Vector3(0, 0, 0);
    const axis = 'z';
    const RUNWAY_LENGTH = 1600;
    const RUNWAY_WIDTH = 50;
    const apron = new THREE.Vector3(150, 0, 0);
    const terminalPos = new THREE.Vector3(250, 0, 0);
    
    // Create dummy gates
    const gates = [];
    for (let i = 0; i < 5; i++) {
      gates.push(new THREE.Vector3(200, 0, -200 + i * 100));
    }

    return {
      axis,
      center,
      size: new THREE.Vector3(2000, 10, 500),
      RUNWAY_LENGTH,
      RUNWAY_WIDTH,
      apron,
      gates,
      terminalPos,
      terminalHeading: -Math.PI / 2,
      parkHeading: -Math.PI / 2,
      towerPos: new THREE.Vector3(200, 0, 150),
      cargoPos: new THREE.Vector3(200, 0, 300),
      serviceYard: new THREE.Vector3(200, 0, -300),
      runwayObj: null,
      airportGroup: null
    };
  }

  airportGroup.updateMatrixWorld(true);
  const runwayObj = airportGroup.getObjectByName('runway');
  const box = runwayObj
    ? new THREE.Box3().setFromObject(runwayObj)
    : new THREE.Box3().setFromObject(airportGroup);

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const axis = size.z >= size.x ? 'z' : 'x'; // long axis of the runway

  const RUNWAY_LENGTH = 260;
  const RUNWAY_WIDTH = 15;
  const APRON_GAP = 46;
  const GATE_COUNT = 7;
  const GATE_SPAN = 175;

  // Apron sits on the -axis-perpendicular side, clear of the model's own
  // buildings (which sit on the opposite side in the source asset).
  const apron = axis === 'z'
    ? new THREE.Vector3(center.x - (size.x / 2 + APRON_GAP), 0, center.z)
    : new THREE.Vector3(center.x, 0, center.z - (size.z / 2 + APRON_GAP));

  const gates = [];
  for (let i = 0; i < GATE_COUNT; i++) {
    const t = (i / (GATE_COUNT - 1)) - 0.5;
    gates.push(axis === 'z'
      ? new THREE.Vector3(apron.x, 0, center.z + t * GATE_SPAN)
      : new THREE.Vector3(center.x + t * GATE_SPAN, 0, apron.z));
  }

  const terminalPos = axis === 'z'
    ? new THREE.Vector3(apron.x - 62, 0, center.z)
    : new THREE.Vector3(center.x, 0, apron.z - 62);
  const terminalHeading = axis === 'z' ? -Math.PI / 2 : 0;
  const parkHeading = axis === 'z' ? Math.PI / 2 : Math.PI;

  const towerPos = axis === 'z'
    ? new THREE.Vector3(apron.x - 10, 0, center.z - RUNWAY_LENGTH / 2 - 45)
    : new THREE.Vector3(center.x - RUNWAY_LENGTH / 2 - 45, 0, apron.z - 10);

  const cargoPos = gates[GATE_COUNT - 1].clone().add(
    axis === 'z' ? new THREE.Vector3(-30, 0, 20) : new THREE.Vector3(20, 0, -30)
  );

  const serviceYard = gates[0].clone().add(
    axis === 'z' ? new THREE.Vector3(25, 0, -35) : new THREE.Vector3(-35, 0, -25)
  );

  return { axis, center, size, RUNWAY_LENGTH, RUNWAY_WIDTH, apron, gates, terminalPos, terminalHeading, parkHeading, towerPos, cargoPos, serviceYard };
}

function axisVec(axis, along, across) {
  return axis === 'z' ? new THREE.Vector3(across, 0, along) : new THREE.Vector3(along, 0, across);
}

/* ---------------- Procedural runway, taxiway & apron surfaces -------- */
function buildGroundSurfaces(layout) {
  const { axis, center, RUNWAY_LENGTH, RUNWAY_WIDTH, apron, gates } = layout;

  // Grass field
  const grass = new THREE.Mesh(
    new THREE.CircleGeometry(650, 72),
    new THREE.MeshStandardMaterial({ color: 0x3c5a3a, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  simScene.add(grass);

  // Runway slab
  const rwDims = axis === 'z' ? [RUNWAY_WIDTH, 0.12, RUNWAY_LENGTH] : [RUNWAY_LENGTH, 0.12, RUNWAY_WIDTH];
  const runway = new THREE.Mesh(
    new THREE.BoxGeometry(...rwDims),
    new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.9 })
  );
  runway.position.set(center.x, 0.06, center.z);
  runway.receiveShadow = true;
  simScene.add(runway);

  // Centerline dashes
  const dashLen = 7, dashGap = 6, dashCount = Math.floor(RUNWAY_LENGTH / (dashLen + dashGap));
  for (let i = 0; i < dashCount; i++) {
    const along = -RUNWAY_LENGTH / 2 + i * (dashLen + dashGap) + dashLen / 2;
    const dashDims = axis === 'z' ? [1, 0.03, dashLen] : [dashLen, 0.03, 1];
    const dash = new THREE.Mesh(new THREE.BoxGeometry(...dashDims), new THREE.MeshStandardMaterial({ color: 0xe8e8e0 }));
    const p = center.clone().add(axisVec(axis, along, 0));
    dash.position.set(p.x, 0.13, p.z);
    simScene.add(dash);
  }

  // Threshold markings at both runway ends
  [-1, 1].forEach((dir) => {
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const stripeDims = axis === 'z' ? [0.9, 0.03, 6] : [6, 0.03, 0.9];
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(...stripeDims), new THREE.MeshStandardMaterial({ color: 0xe8e8e0 }));
      const along = dir * (RUNWAY_LENGTH / 2 - 10);
      const across = i * 1.8;
      const p = center.clone().add(axisVec(axis, along, across));
      stripe.position.set(p.x, 0.13, p.z);
      simScene.add(stripe);
    }
  });

  // Taxiway connecting apron to runway
  const taxiDims = axis === 'z' ? [22, 0.1, 10] : [10, 0.1, 22];
  const taxiway = new THREE.Mesh(new THREE.BoxGeometry(...taxiDims), new THREE.MeshStandardMaterial({ color: 0x282c31, roughness: 0.9 }));
  const taxiMid = apron.clone().lerp(center, 0.5);
  taxiway.position.set(taxiMid.x, 0.05, taxiMid.z);
  simScene.add(taxiway);

  // Apron slab behind the gate row
  const apronDims = axis === 'z' ? [46, 0.1, 210] : [210, 0.1, 46];
  const apronSlab = new THREE.Mesh(new THREE.BoxGeometry(...apronDims), new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.95 }));
  apronSlab.position.set(apron.x, 0.04, apron.z);
  apronSlab.receiveShadow = true;
  simScene.add(apronSlab);

  // Gate stand markers (yellow boxes)
  gates.forEach((g) => {
    const mark = new THREE.Mesh(new THREE.RingGeometry(3.6, 4, 24), new THREE.MeshBasicMaterial({ color: 0xd9b34a, side: THREE.DoubleSide }));
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(g.x, 0.08, g.z);
    simScene.add(mark);
  });
}

async function initSim() {
  simActive = true;
  buildSky();

  simScene.add(new THREE.HemisphereLight(0xbfe0f2, 0x33422f, 0.75));
  const sun = new THREE.DirectionalLight(0xfff3dd, 1.5);
  sun.position.set(160, 220, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -260; sun.shadow.camera.right = 260;
  sun.shadow.camera.top = 260; sun.shadow.camera.bottom = -260;
  sun.shadow.camera.far = 700;
  simScene.add(sun);
  simScene.fog = new THREE.FogExp2(0xbfd9e6, 0.0016);

  controls = new OrbitControls(simCamera, simCanvas);
  controls.target.copy(DEFAULT_CAM_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 15;
  controls.maxDistance = 900;
  controls.maxPolarAngle = Math.PI * 0.49;
  
  // Very slow gentle zoom — user can scroll many times to zoom instead of jumping
  controls.zoomSpeed = 0.2;
  controls.rotateSpeed = 0.5;
  controls.panSpeed = 0.6;
  controls.enablePan = true;
  controls.screenSpacePanning = true;

  simCamera.position.copy(DEFAULT_CAM_POS);
  controls.update();

  document.getElementById('viewport-loading').classList.remove('hidden');
  
  // Fast, non-blocking fallback layout if models aren't ready
  AIRPORT_LAYOUT = computeAirportLayout(null);
  const layout = AIRPORT_LAYOUT;

  buildGroundSurfaces(layout);

  // Instantly reveal the ground surfaces so the simulation feels like it loaded in 0 seconds
  const vpLoading = document.getElementById('viewport-loading');
  if (vpLoading) vpLoading.classList.add('hidden');

  Promise.all([
    loadModel('airport'),
    loadModel('terminal')
  ]).then(([mAirport, mTerminal]) => {
    if (mAirport) {
      const airport = cloneModel('airport');
      simScene.add(airport);
      addLabel(airport, 'RUNWAY 09/27', true);

      // NOW recompute layout from the REAL airport model geometry
      const realLayout = computeAirportLayout(airport);
      AIRPORT_LAYOUT = realLayout; // Update global layout with real positions

      if (mTerminal) {
        const term = cloneModel('terminal');
        term.position.copy(realLayout.terminalPos);
        term.rotation.y = realLayout.terminalHeading;
        simScene.add(term);
      }

      const jetwayPositions = [0, 1, 2];
      jetwayPositions.forEach((gi) => {
        loadModel('jetway').then((m) => {
          if (m) {
            const jw = cloneModel('jetway');
            const p = realLayout.gates[gi].clone().lerp(realLayout.terminalPos, 0.42);
            jw.position.set(p.x, 0, p.z);
            jw.rotation.y = realLayout.terminalHeading;
            simScene.add(jw);
          }
        });
      });

      const heroKey = 'airplane1';
      const otherKeys = ['airplane2', 'airplane3', 'airplane4', 'airplane5', 'airplane6', 'airplane7'];
      const allKeys = [heroKey, ...otherKeys];

      allKeys.forEach((key, i) => {
        placePlaneWhenReady(key, realLayout.gates[i % realLayout.gates.length], i, i === 0);
      });

      fuelTruckObj = cloneModel('fuelTruck');
      if (fuelTruckObj) {
        fuelTruckObj.position.copy(realLayout.serviceYard);
        fuelTruckObj.userData.home = fuelTruckObj.position.clone();
        simScene.add(fuelTruckObj);
        addLabel(fuelTruckObj, 'FUEL TRUCK');
      }

      const bagCart = cloneModel('baggageCart');
      if (bagCart) {
        const p = realLayout.terminalPos.clone().add(realLayout.axis === 'z' ? new THREE.Vector3(-12, 0, 10) : new THREE.Vector3(10, 0, -12));
        bagCart.position.set(p.x, 0, p.z);
        simScene.add(bagCart);
        addLabel(bagCart, 'BAGGAGE TRACTOR', true);
      }

      for (let i = 0; i < realLayout.gates.length; i += 2) {
        const cone = cloneModel('cone');
        if (!cone) break;
        const g = realLayout.gates[i];
        const offset = realLayout.axis === 'z' ? new THREE.Vector3(6, 0, 0) : new THREE.Vector3(0, 0, 6);
        cone.position.copy(g.clone().add(offset));
        simScene.add(cone);
      }

      // Smooth fly-in to the real airport center once layout is known
      flyCamera(
        realLayout.center.clone().add(new THREE.Vector3(90, 70, 130)),
        realLayout.center.clone()
      );
    } else if (mTerminal) {
      // Airport didn't load but terminal did - use current layout
      const term = cloneModel('terminal');
      term.position.copy(layout.terminalPos);
      term.rotation.y = layout.terminalHeading;
      simScene.add(term);
    }
  });

  buildPlaneList();
  wireControls();
  animateSim();

  streamRemaining();
  return true;
}

function placePlaneWhenReady(key, gatePos, gateIndex, isHero) {
  const attach = (group) => {
    group.position.set(gatePos.x, 0, gatePos.z);
    group.rotation.y = AIRPORT_LAYOUT.parkHeading;
    group.userData.homePos = group.position.clone();
    group.userData.homeRotY = group.rotation.y;
    group.userData.altitude = 0;
    group.userData.pitch = 0;
    group.userData.bank = 0;
    simScene.add(group);
    const entry = { key, group, gateIndex, isHero };
    planes.push(entry);
    addLabel(group, `${key.toUpperCase()} · GATE ${gateIndex + 1}`);
    buildPlaneList();
    if (isHero) selectPlane(entry);
  };
  if (cache.has(key)) {
    attach(cloneModel(key));
  } else {
    loadModel(key).then((m) => { if (m) attach(cloneModel(key)); logAsset(key); });
  }
}

async function streamRemaining() {
  const layout = AIRPORT_LAYOUT;
  for (const key of STREAM_KEYS) {
    if (cache.has(key)) continue;
    await loadModel(key);
    logAsset(key);
    if (key === 'tug' && !tugObj) {
      tugObj = cloneModel('tug');
      tugObj.position.copy(layout.serviceYard.clone().add(new THREE.Vector3(10, 0, 10)));
      tugObj.userData.home = tugObj.position.clone();
      simScene.add(tugObj);
      addLabel(tugObj, 'PUSHBACK TUG', true);
    }
    if (key === 'bus') {
      const bus = cloneModel('bus');
      const p = layout.terminalPos.clone().add(layout.axis === 'z' ? new THREE.Vector3(-16, 0, 30) : new THREE.Vector3(30, 0, -16));
      bus.position.set(p.x, 0, p.z);
      simScene.add(bus);
      addLabel(bus, 'PASSENGER BUS', true);
    }
    if (key === 'cargoContainer') {
      const marker = new THREE.Object3D();
      marker.position.copy(layout.cargoPos);
      simScene.add(marker);
      for (let i = 0; i < 2; i++) {
        const c = cloneModel('cargoContainer');
        const off = layout.axis === 'z' ? new THREE.Vector3(0, 0, i * 9) : new THREE.Vector3(i * 9, 0, 0);
        c.position.copy(layout.cargoPos.clone().add(off));
        simScene.add(c);
      }
      addLabel(marker, 'CARGO APRON', true);
    }
    if (key === 'tower') {
      const tower = cloneModel('tower');
      tower.position.copy(layout.towerPos);
      simScene.add(tower);
      addLabel(tower, 'CONTROL TOWER');
    }
  }
}
/* ---------------- Fleet list / selection ---------------- */
function buildPlaneList() {
  const el = document.getElementById('plane-list');
  el.innerHTML = '';
  planes.forEach((entry) => {
    const chip = document.createElement('div');
    chip.className = 'plane-chip' + (selected === entry ? ' active' : '');
    chip.innerHTML = `<span>${entry.key.toUpperCase()}${entry.isHero ? ' · ACTIVE' : ''}</span><span class="status-dot"></span>`;
    chip.addEventListener('click', () => selectPlane(entry));
    el.appendChild(chip);
  });
}

function selectPlane(entry) {
  selected = entry;
  buildPlaneList();
  refreshSelectionInfo();
}

function refreshSelectionInfo() {
  if (!selected) { document.getElementById('selection-info').textContent = 'NO UNIT SELECTED'; return; }
  const g = selected.group;
  const alt = g.userData.altitude || 0;
  document.getElementById('selection-info').textContent =
    `UNIT: ${selected.key.toUpperCase()}\n` +
    `STATUS: ${alt > 1 ? 'IN FLIGHT' : (actionMode === 'taxi' && selected ? 'TAXIING' : 'PARKED · GATE ' + (selected.gateIndex + 1))}\n` +
    `HEADING: ${((g.rotation.y * 180 / Math.PI) % 360).toFixed(0)}°\n` +
    `ALTITUDE: ${alt.toFixed(0)} m`;
}

/* ---------------- Raycast: select plane / place barrier ---------------- */
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

simCanvas.addEventListener('pointerdown', (e) => {
  const rect = simCanvas.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, simCamera);

  if (barrierMode) {
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      const barrier = cloneModel('barrier');
      if (barrier) {
        barrier.position.copy(hit);
        simScene.add(barrier);
        barriers.push(barrier);
      }
    }
    return;
  }

  const planeGroups = planes.map(p => p.group);
  const hits = raycaster.intersectObjects(planeGroups, true);
  if (hits.length) {
    let obj = hits[0].object;
    while (obj.parent && !planes.find(p => p.group === obj)) obj = obj.parent;
    const entry = planes.find(p => p.group === obj);
    if (entry) selectPlane(entry);
  }
});

/* ---------------- Control panel wiring ---------------- */
function setModeLabel(text) { document.getElementById('mode-label').textContent = `MODE: ${text}`; }

function clearActionModes() {
  barrierMode = false;
  actionMode = 'none';
  document.getElementById('btn-barrier')?.classList.remove('active');
  document.getElementById('btn-move')?.classList.remove('active');
  document.getElementById('btn-flight')?.classList.remove('active');
  document.getElementById('taxi-hint')?.classList.add('hidden');
  document.getElementById('flight-hint')?.classList.add('hidden');
}

function wireControls() {
  document.getElementById('btn-orbit')?.addEventListener('click', () => {
    cameraMode = 'orbit';
    controls.enabled = true;
    document.getElementById('btn-runwaycam')?.classList.remove('active');
    setModeLabel('FREE ORBIT');
  });

  document.getElementById('btn-runwaycam')?.addEventListener('click', () => {
    const willEnable = cameraMode !== 'chase';
    document.getElementById('btn-runwaycam')?.classList.toggle('active', willEnable);
    if (willEnable) {
      cameraMode = 'chase';
      controls.enabled = false;
      setModeLabel('RUNWAY CAM — ' + (selected ? selected.key.toUpperCase() : 'SELECT A PLANE'));
    } else {
      cameraMode = 'orbit';
      controls.enabled = true;
      setModeLabel('FREE ORBIT');
    }
  });

  document.getElementById('btn-overview')?.addEventListener('click', () => {
    flyCamera(new THREE.Vector3(AIRPORT_LAYOUT.center.x, 210, AIRPORT_LAYOUT.center.z + 260), new THREE.Vector3(AIRPORT_LAYOUT.center.x, 0, AIRPORT_LAYOUT.center.z));
  });

  document.getElementById('btn-move')?.addEventListener('click', () => {
    const willEnable = actionMode !== 'taxi';
    clearActionModes();
    if (willEnable) {
      actionMode = 'taxi';
      document.getElementById('btn-move')?.classList.add('active');
      document.getElementById('taxi-hint')?.classList.remove('hidden');
      setModeLabel('TAXI — ' + (selected ? selected.key.toUpperCase() : 'SELECT A PLANE'));
    } else setModeLabel('FREE ORBIT');
  });

  document.getElementById('btn-flight')?.addEventListener('click', () => {
    const willEnable = actionMode !== 'flight';
    clearActionModes();
    if (willEnable) {
      actionMode = 'flight';
      document.getElementById('btn-flight')?.classList.add('active');
      document.getElementById('flight-hint')?.classList.remove('hidden');
      setModeLabel('FLIGHT — ' + (selected ? selected.key.toUpperCase() : 'SELECT A PLANE'));
    } else setModeLabel('FREE ORBIT');
  });

  document.getElementById('btn-barrier')?.addEventListener('click', () => {
    const willEnable = !barrierMode;
    clearActionModes();
    if (willEnable) {
      barrierMode = true;
      document.getElementById('btn-barrier')?.classList.add('active');
      setModeLabel('PLACE BARRIER — CLICK APRON');
    } else setModeLabel('FREE ORBIT');
  });

  document.getElementById('btn-clear-barrier')?.addEventListener('click', () => {
    barriers.forEach(b => simScene.remove(b));
    barriers.length = 0;
  });

  document.getElementById('btn-fuel')?.addEventListener('click', () => dispatchFuelTruck());
  document.getElementById('btn-pushback')?.addEventListener('click', () => dispatchPushback());

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    clearActionModes();
    cameraMode = 'orbit';
    controls.enabled = true;
    document.getElementById('btn-runwaycam')?.classList.remove('active');
    setModeLabel('FREE ORBIT');
    flyCamera(DEFAULT_CAM_POS, DEFAULT_CAM_TARGET);
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(k)) {
      if (simActive) e.preventDefault();
    }
    keysDown.add(k);
  });
  window.addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()));
}

function flyCamera(pos, target) {
  cameraMode = 'orbit';
  controls.enabled = true;
  document.getElementById('btn-runwaycam')?.classList.remove('active');
  const startPos = simCamera.position.clone();
  const startTarget = controls.target.clone();
  tweenValue(1100, (t) => {
    simCamera.position.lerpVectors(startPos, pos, t);
    controls.target.lerpVectors(startTarget, target, t);
    controls.update();
  });
}

/* ---------------- Fuel truck dispatch ---------------- */
let fuelBusy = false;
function dispatchFuelTruck() {
  if (fuelBusy || !fuelTruckObj) return;
  const target = selected || planes[0];
  if (!target) return;
  fuelBusy = true;
  setModeLabel('FUEL TRUCK EN ROUTE — ' + target.key.toUpperCase());

  const destOffset = new THREE.Vector3(6, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), target.group.rotation.y);
  const dest = target.group.position.clone().add(destOffset);

  const start = fuelTruckObj.position.clone();
  tweenValue(1800, (t) => { fuelTruckObj.position.lerpVectors(start, dest, t); }, () => {
    const hud = document.getElementById('fuel-hud');
    hud.classList.remove('hidden');
    document.getElementById('fuel-target-name').textContent = target.key.toUpperCase();
    const fill = document.getElementById('fuel-bar-fill');
    fill.style.width = '0%';
    tweenValue(3200, (t) => { fill.style.width = `${Math.round(t * 100)}%`; }, () => {
      setTimeout(() => {
        hud.classList.add('hidden');
        const home = fuelTruckObj.userData.home;
        tweenValue(1800, (t2) => { fuelTruckObj.position.lerpVectors(dest, home, t2); },
          () => { fuelBusy = false; setModeLabel('FREE ORBIT'); }, easeOutQuad);
      }, 500);
    }, (t) => t);
  }, easeOutQuad);
}

/* ---------------- Pushback tug ---------------- */
let pushbackBusy = false;
function dispatchPushback() {
  if (pushbackBusy || !tugObj) { setModeLabel(tugObj ? 'FREE ORBIT' : 'TUG NOT YET ON APRON'); return; }
  const target = selected || planes[0];
  if (!target) return;
  pushbackBusy = true;
  setModeLabel('PUSHBACK — ' + target.key.toUpperCase());

  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), target.group.rotation.y);
  const attachPoint = target.group.position.clone().add(forward.clone().multiplyScalar(-4));
  const start = tugObj.position.clone();

  tweenValue(1200, (t) => { tugObj.position.lerpVectors(start, attachPoint, t); }, () => {
    const planeStart = target.group.position.clone();
    const pull = forward.clone().multiplyScalar(-16);
    const planeEnd = planeStart.clone().add(pull);
    const tugStart = tugObj.position.clone();
    const tugEnd = tugStart.clone().add(pull);

    tweenValue(2400, (t) => {
      target.group.position.lerpVectors(planeStart, planeEnd, t);
      tugObj.position.lerpVectors(tugStart, tugEnd, t);
    }, () => {
      const home = tugObj.userData.home;
      tweenValue(1400, (t2) => { tugObj.position.lerpVectors(tugEnd, home, t2); },
        () => { pushbackBusy = false; setModeLabel('FREE ORBIT'); }, easeOutQuad);
    }, easeInOutCubic);
  }, easeOutQuad);
}

/* ---------------- Taxi movement (WASD on selected plane, ground only) --- */
const TAXI_SPEED = 22;
const TAXI_TURN = 1.6;

function updateTaxi(dt) {
  if (actionMode !== 'taxi' || !selected) return;
  const g = selected.group;
  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
  let moved = false;
  if (keysDown.has('w') || keysDown.has('arrowup')) { g.position.addScaledVector(forward, TAXI_SPEED * dt); moved = true; }
  if (keysDown.has('s') || keysDown.has('arrowdown')) { g.position.addScaledVector(forward, -TAXI_SPEED * dt); moved = true; }
  if (keysDown.has('a') || keysDown.has('arrowleft') || keysDown.has('q')) { g.rotation.y += TAXI_TURN * dt; moved = true; }
  if (keysDown.has('d') || keysDown.has('arrowright') || keysDown.has('e')) { g.rotation.y -= TAXI_TURN * dt; moved = true; }
  if (moved) refreshSelectionInfo();
}

/* ---------------- Flight (climb, throttle, bank) ---------------- */
const FLIGHT_SPEED = 34;
const FLIGHT_TURN = 1.2;
const CLIMB_RATE = 14;

function updateFlight(dt) {
  if (actionMode !== 'flight' || !selected) return;
  const g = selected.group;
  const ud = g.userData;
  let turningInput = 0, throttleInput = 0, climbInput = 0;

  if (keysDown.has('w') || keysDown.has('arrowup')) throttleInput = 1;
  if (keysDown.has('s') || keysDown.has('arrowdown')) throttleInput = -1;
  if (keysDown.has('a') || keysDown.has('arrowleft')) turningInput = 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) turningInput = -1;
  if (keysDown.has(' ')) climbInput = 1;
  if (keysDown.has('shift')) climbInput = -1;

  g.rotation.y += turningInput * FLIGHT_TURN * dt;
  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
  g.position.addScaledVector(forward, throttleInput * FLIGHT_SPEED * dt);

  ud.altitude = Math.max(0, (ud.altitude || 0) + climbInput * CLIMB_RATE * dt);
  g.position.y = ud.altitude * 0.6;

  ud.pitch = lerp(ud.pitch || 0, climbInput * 0.22, 0.08);
  ud.bank = lerp(ud.bank || 0, -turningInput * 0.3, 0.08);
  g.rotation.x = ud.pitch;
  g.rotation.z = ud.bank;

  if (throttleInput || turningInput || climbInput) refreshSelectionInfo();
}

/* ---------------- Chase / runway camera ---------------- */
function updateChaseCamera() {
  if (cameraMode !== 'chase' || !selected) return;
  const g = selected.group;
  const back = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y);
  const desired = g.position.clone()
    .addScaledVector(back, 20)
    .add(new THREE.Vector3(0, 9 + (g.userData.altitude || 0) * 0.15, 0));
  simCamera.position.lerp(desired, 0.06);
  const lookTarget = g.position.clone().add(new THREE.Vector3(0, 3, 0));
  simCamera.lookAt(lookTarget);
}

/* ---------------- Render loop ---------------- */
let lastTime = performance.now();
function animateSim() {
  requestAnimationFrame(animateSim);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  updateTaxi(dt);
  updateFlight(dt);

  const hero = planes.find(p => p.isHero);
  if (hero && actionMode !== 'flight') {
    hero.group.position.y = 0.15 + Math.sin(now * 0.0012) * 0.06;
  }

  if (cameraMode === 'chase') {
    updateChaseCamera();
  } else {
    controls.update();
  }

  simRenderer.render(simScene, simCamera);
  labelRenderer.render(simScene, simCamera);
}

function onSimResize() {
  const wrap = document.getElementById('sim-canvas');
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  simCamera.aspect = w / h;
  simCamera.updateProjectionMatrix();
  simRenderer.setSize(w, h, false);
  labelRenderer.setSize(w, h);
}
window.addEventListener('resize', onSimResize);
