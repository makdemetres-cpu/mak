/* ==========================================================================
   Ermis' Villas — hero scene rig
   --------------------------------------------------------------------------
   Renderer, camera, lighting and environment for the scroll-driven villa.

   Two decisions drive everything in here:

   1. The scene is STATIC apart from the front door. Nothing idles, nothing
      loops. That lets us render strictly on demand — when the scroll-driven
      camera is moving and at no other time — and bake the shadow map exactly
      once instead of every frame. A parked visitor costs zero GPU.

   2. Quality is tiered at boot from what the device says about itself, and
      then checked against what it actually does. The tier below sets a
      starting ceiling; the governor in index.js measures real frame times and
      steps the resolution down if the machine cannot hold them.

      It steps down only, never back up. Adapting in both directions is what
      makes a hero visibly pop between sharp and soft the first time a phone
      thermal-throttles; going one way means it settles once and stays there.
   ========================================================================== */

import {
  ACESFilmicToneMapping, Color, EquirectangularReflectionMapping, Fog,
  HemisphereLight, DirectionalLight, PerspectiveCamera, PMREMGenerator,
  Scene, SRGBColorSpace, Texture, WebGLRenderer
} from '../vendor/three.slim.js?v=260828e';

/* --------------------------------------------------------------------------
   Quality tiers
   -------------------------------------------------------------------------- */
export function detectTier() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 900;
  const cores = navigator.hardwareConcurrency || 4;
  const lowPower = coarse || narrow || cores <= 4;
  return lowPower ? 'low' : 'high';
}

/* `dpr` is a starting ceiling, not a promise: the quality governor in
   js/hero/index.js watches real frames and scales it down if the device
   cannot hold the budget. The high tier used to sit at 2.0, which on a
   1440×900 retina window is 5.2 million pixels shaded every frame; 1.75 is
   23% fewer for a scene that is flat-shaded and carries no fine texture
   detail to lose. */
const TIERS = {
  low:  { dpr: 1.5,  shadows: false, antialias: true,  trees: 26, shrubs: 34, slatStep: 0.42 },
  high: { dpr: 1.75, shadows: true,  antialias: true,  trees: 46, shrubs: 62, slatStep: 0.30 }
};

export function tierSettings(tier) { return TIERS[tier] || TIERS.low; }

/* --------------------------------------------------------------------------
   WebGL capability check — run before anything else is imported or built.
   -------------------------------------------------------------------------- */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

/* --------------------------------------------------------------------------
   Sky / environment
   --------------------------------------------------------------------------
   A late-afternoon sky painted into a 2D canvas and used for three things at
   once: the background, the image-based lighting (via PMREM) and the
   reflections in the glass and the pool. One 512×256 canvas replaces an HDR
   download entirely — no request, no decode, no licensing.
   -------------------------------------------------------------------------- */
function makeSkyTexture() {
  const w = 512, h = 256;
  const cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');

  // Zenith → horizon gradient. Warm at the bottom, deep at the top.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.52);
  sky.addColorStop(0.00, '#2E4A63');
  sky.addColorStop(0.45, '#7C9CAC');
  sky.addColorStop(0.80, '#D6C7AA');
  sky.addColorStop(1.00, '#F0DCBA');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.52);

  // Ground half — foliage and warm earth bouncing light back up.
  const ground = ctx.createLinearGradient(0, h * 0.5, 0, h);
  ground.addColorStop(0.00, '#9E9270');
  ground.addColorStop(0.35, '#5C6647');
  ground.addColorStop(1.00, '#2C3324');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  // The sun: a soft warm disc low on the horizon, front-left of the villa.
  const sunX = w * 0.68, sunY = h * 0.40;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.42);
  glow.addColorStop(0.00, '#FFF6E2');
  glow.addColorStop(0.12, '#FFE3B0');
  glow.addColorStop(0.42, 'rgba(255, 204, 150, 0.35)');
  glow.addColorStop(1.00, 'rgba(255, 204, 150, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // A couple of soft cloud bands so the glass has something to catch.
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = '#FFF4E4';
  for (let i = 0; i < 5; i++) {
    const cy = h * (0.12 + i * 0.06);
    const cw = w * (0.35 + (i % 3) * 0.22);
    const cx = (i * 137) % w;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw * 0.5, h * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new Texture(cvs);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* --------------------------------------------------------------------------
   Rig
   -------------------------------------------------------------------------- */
export function createRig(canvas, tier) {
  const s = tierSettings(tier);

  const renderer = new WebGLRenderer({
    canvas,
    antialias: s.antialias,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
  });
  renderer.setClearColor(0x0F110E, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.outputColorSpace = SRGBColorSpace;

  if (s.shadows) {
    renderer.shadowMap.enabled = true;
    // Type 1 == PCFShadowMap. Softer variants cost more than they give here.
    renderer.shadowMap.type = 1;
    // The scene never changes after the door settles, so the shadow map is
    // baked once by index.js rather than re-rendered on every frame.
    renderer.shadowMap.autoUpdate = false;
  }

  const scene = new Scene();
  const sky = makeSkyTexture();

  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(sky);
  scene.environment = envRT.texture;
  scene.background = sky;
  pmrem.dispose();

  // Aerial haze. Starts well beyond the villa so interiors stay crisp.
  scene.fog = new Fog(new Color(0xC8BCA2), 55, 190);

  const camera = new PerspectiveCamera(38, 1, 0.1, 320);

  /* Lighting: one sun, one sky/bounce fill. Interior warmth comes from
     emissive materials rather than extra lights — far cheaper, and it can't
     blow out the exposure. */
  const sun = new DirectionalLight(0xFFE0B4, 2.55);
  sun.position.set(-34, 30, 40);
  if (s.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    // A tight frustum around the house — a loose one wastes the whole map on
    // empty lawn and the contact shadows go mushy.
    const c = sun.shadow.camera;
    c.left = -34; c.right = 34; c.top = 34; c.bottom = -26;
    c.near = 8; c.far = 130;
    sun.shadow.bias = -0.0016;
    sun.shadow.normalBias = 0.05;
  }
  scene.add(sun);

  // Kept low on purpose. A bright fill flattens the interior into something
  // that reads as a showroom; letting the rooms fall away into shadow, lit by
  // the emissive fittings, is what makes them feel like evening.
  const fill = new HemisphereLight(0xCFE0EA, 0x53593C, 0.78);
  scene.add(fill);

  return { renderer, scene, camera, sun, settings: s };
}

/* --------------------------------------------------------------------------
   Resize
   --------------------------------------------------------------------------
   Mobile browsers fire resize when the URL bar slides away, which would
   otherwise re-allocate the drawing buffer mid-scroll. We ignore height-only
   changes under 140px, which is exactly that case and nothing else.
   -------------------------------------------------------------------------- */
export function makeResizer(renderer, camera, settings, view) {
  let lastW = 0, lastH = 0;

  return function resize(force) {
    const el = renderer.domElement;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return false;

    const widthSame = w === lastW;
    const heightNudge = Math.abs(h - lastH) < 140;
    if (!force && widthSame && heightNudge) return false;

    lastW = w; lastH = h;
    // view.dprScale is the quality governor's dial — 1 until it decides this
    // device cannot afford full resolution. See js/hero/index.js.
    const cap = settings.dpr * (view.dprScale || 1);
    renderer.setPixelRatio(Math.max(0.75, Math.min(window.devicePixelRatio || 1, cap)));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    // A portrait phone sees far too little of the frame the path was composed
    // for, so every shot's field of view is scaled up on tall screens — same
    // choreography, wider lens, no second set of keyframes.
    //
    // The scale is kept modest on purpose. three.js fov is *vertical*, so
    // opening it far enough to fit the whole 27m facade horizontally also adds
    // a great deal of empty sky and foreground, and the villa ends up a small
    // object in the middle of a lot of nothing. 1.16 is the point where the
    // building still fills the width and the wings are only just cropped.
    view.fovScale = h / w > 1.3 ? 1.16 : (h > w ? 1.08 : 1);
    view.portrait = h / w > 1.3;
    camera.updateProjectionMatrix();
    return true;
  };
}
