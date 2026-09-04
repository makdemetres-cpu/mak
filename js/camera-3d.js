/* ==========================================================================
   Χρόνης Πέγκας Photography — hero: a real 3D camera, built from geometry
   (Three.js, self-hosted — no CDN call, consistent with how every other
   asset on this site is served from this origin), that comes apart at the
   seams and turns as the visitor scrolls through the pinned hero stage.

   Why geometry instead of a photo: a flat photograph has no depth data, so
   it cannot become genuinely rotatable 3D — that's not a technique choice,
   it's what a photograph is. A licensed CC0 reference model exists (the
   Khronos glTF sample "Antique Camera") but ships as a single fused mesh
   with no separate lens/back/viewfinder/dial to pull apart, and no tool
   available here can re-segment a mesh. Building the camera from primitives
   sidesteps both problems: every part is separable by construction, there
   is no license to track, and the file size is predictable.

   Same contract as every other progressive-enhancement layer on this site:
   - No JS at all → the flat SVG glyph in the markup is all that ever shows,
     assembled and static. This script never runs.
   - prefers-reduced-motion → unlock nav immediately, leave the SVG in
     place, never build a scene.
   - JS runs, motion is fine, but WebGL is unavailable (or a context is lost
     mid-session) → same flat treatment, applied via the .cam-flat class
     instead of the media feature. See the .cam-flat rules in style.css.
   - Only once a WebGL scene has actually rendered a frame does .has-3d go
     on <html>, which is what swaps the canvas in for the SVG in CSS.

   The scroll-to-progress math (smoothstep, per-stage windows, nav lock,
   stage-text crossfade) is unchanged from the plain-CSS version this
   replaces — only what happens to the camera model itself is different:
   real Three.js position/rotation on each part instead of a CSS custom
   property, because the parts now travel through actual depth (toward and
   away from the viewer), which a flat SVG plane never could.
   ========================================================================== */
import * as THREE from "./vendor/three.module.min.js";

(function () {
  "use strict";

  var wrap = document.querySelector("[data-cam-wrap]");
  if (!wrap) return;

  var stageEl = wrap.querySelector(".cam-stage");
  var canvasEl = wrap.querySelector(".cam-canvas");
  var copyEl = wrap.querySelector(".hero-copy");
  var html = document.documentElement;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileMQ = window.matchMedia("(max-width: 899px)");

  var STAGE_NAMES_DESKTOP = ["lens", "viewfinder", "back", "dial"];
  var STAGE_NAMES_MOBILE = ["lens", "viewfinder"];

  /* ---- nav lock (identical to the previous CSS-only build) -------------- */
  function navLinks() { return document.querySelectorAll(".nav-desktop a, .nav-mobile a"); }
  function lockNav() {
    document.body.setAttribute("data-nav-locked", "true");
    navLinks().forEach(function (a) { a.setAttribute("aria-disabled", "true"); a.setAttribute("tabindex", "-1"); });
  }
  function unlockNav() {
    document.body.removeAttribute("data-nav-locked");
    navLinks().forEach(function (a) { a.removeAttribute("aria-disabled"); a.removeAttribute("tabindex"); });
  }
  document.addEventListener("click", function (e) {
    if (document.body.getAttribute("data-nav-locked") !== "true") return;
    var a = e.target.closest(".nav-desktop a, .nav-mobile a");
    if (a) e.preventDefault();
  }, true);

  if (reduceMQ.matches) { unlockNav(); return; }
  lockNav();

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }
  function fallbackFlat() {
    html.classList.remove("has-3d");
    html.classList.add("cam-flat");
    unlockNav();
  }
  if (!hasWebGL()) { fallbackFlat(); return; }

  /* ---- scene construction ------------------------------------------------ */
  // Flat, evenly-lit "illustrated diagram" materials — soft matte surfaces
  // with restrained specular, closer to a clean architectural render than
  // a moody metal product shot. Glass/screens stay glossier on purpose:
  // that contrast against the matte body is what reads as "material" at
  // a glance, the same way the reference villa render uses glossy glazing
  // against flat matte walls.
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c2b31, metalness: 0.12, roughness: 0.62 });
  var darkMat = new THREE.MeshStandardMaterial({ color: 0x18171c, metalness: 0.16, roughness: 0.58 });
  var gripMat = new THREE.MeshStandardMaterial({ color: 0x201f24, metalness: 0.05, roughness: 0.85 });
  var glassMat = new THREE.MeshStandardMaterial({ color: 0x040406, metalness: 0.55, roughness: 0.18 });
  var goldMat = new THREE.MeshStandardMaterial({ color: 0xc2a05f, metalness: 0.35, roughness: 0.48 });
  var goldBrightMat = new THREE.MeshStandardMaterial({ color: 0xe7c888, metalness: 0.4, roughness: 0.38 });
  // Noticeably lighter than the body/dark tones on purpose — the pentaprism
  // hump needs to read as its own distinct part breaking the body's top
  // silhouette, not blend into shadow against the dark background.
  var vfMat = new THREE.MeshStandardMaterial({ color: 0x48474e, metalness: 0.1, roughness: 0.55 });

  function buildRig() {
    var rig = new THREE.Group();

    var body = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.02, 0.62), bodyMat);
    rig.add(body);

    // Grip: a raised block on the body's right edge, proud of the front
    // face — the single detail that most sells "camera" over "box" at a
    // glance.
    var grip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.86, 0.5), gripMat);
    grip.position.set(0.75, -0.02, 0.16);
    rig.add(grip);

    var shutterBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 16), goldBrightMat);
    shutterBtn.position.set(0.73, 0.53, 0.3);
    shutterBtn.rotation.x = -0.35;
    rig.add(shutterBtn);

    // Sits on top of the pentaprism's roof ridge (built below, peak at
    // y≈0.81) — it was previously embedded inside the prism's base and
    // z-fighting with it, which made both look like a single dark smear.
    var hotShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.14), darkMat);
    hotShoe.position.set(0, 0.855, -0.02);
    rig.add(hotShoe);

    // Pushed out to the body's far corners, clear of the dial/shutter
    // cluster on the right — three separate details reading as three
    // separate details instead of one cluttered blob.
    [-0.84, 0.84].forEach(function (x) {
      // Torus faces Z (its hole) by default — turn it 90° around Y so the
      // hole faces outward along X, like a strap lug you could thread
      // something through, instead of facing the camera edge-on.
      var lug = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 20), goldMat);
      lug.position.set(x, 0.38, 0.05);
      lug.rotation.y = Math.PI / 2;
      rig.add(lug);
    });

    // Lens: built up in visible layers front-to-back (mount collar → main
    // barrel → grip-ridge detail → aperture-ring section → gold accent
    // ring → front rim → glass) instead of one plain cylinder, so it
    // reads as an assembled optic rather than a single tube.
    var lens = new THREE.Group();
    var mount = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 28), darkMat);
    mount.rotation.x = Math.PI / 2; mount.position.z = 0.035;
    lens.add(mount);
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.3, 28), darkMat);
    barrel.rotation.x = Math.PI / 2; barrel.position.z = 0.22;
    lens.add(barrel);
    var gripRidge = new THREE.Mesh(new THREE.TorusGeometry(0.425, 0.018, 8, 32), gripMat);
    gripRidge.position.z = 0.2;
    lens.add(gripRidge);
    var apertureBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.41, 0.1, 28), darkMat);
    apertureBarrel.rotation.x = Math.PI / 2; apertureBarrel.position.z = 0.42;
    lens.add(apertureBarrel);
    // Torus already faces Z by default — that's forward, toward the
    // viewer, exactly right for a lens ring. No rotation needed (rotating
    // it like the cylinders above turned it edge-on into a flat line).
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.026, 10, 36), goldMat);
    ring.position.z = 0.42;
    lens.add(ring);
    var frontRim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.03, 28), darkMat);
    frontRim.rotation.x = Math.PI / 2; frontRim.position.z = 0.485;
    lens.add(frontRim);
    var glass = new THREE.Mesh(new THREE.CircleGeometry(0.33, 28), glassMat);
    glass.position.z = 0.505;
    lens.add(glass);
    lens.position.set(0, -0.14, 0.31);
    rig.add(lens);

    // Viewfinder: a proper pentaprism silhouette — flat front/back and
    // bottom, sloped roof up to an off-centre ridge — built as a 2D
    // profile extruded to a width, then turned so the extrusion runs
    // along the camera's X axis instead of the shape's own.
    var vf = new THREE.Group();
    var prismShape = new THREE.Shape();
    prismShape.moveTo(-0.17, 0);
    prismShape.lineTo(0.17, 0);
    prismShape.lineTo(0.17, 0.15);
    prismShape.lineTo(0.02, 0.3);
    prismShape.lineTo(-0.17, 0.15);
    prismShape.closePath();
    var prismGeo = new THREE.ExtrudeGeometry(prismShape, { depth: 0.4, bevelEnabled: false });
    prismGeo.translate(0, 0, -0.2);
    var vfBody = new THREE.Mesh(prismGeo, vfMat);
    vfBody.rotation.y = Math.PI / 2;
    vf.add(vfBody);
    vf.position.set(0, 0.51, -0.02);
    rig.add(vf);

    var back = new THREE.Group();
    var backPanel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.82, 0.06), bodyMat);
    back.add(backPanel);
    var backWindow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.02), glassMat);
    backWindow.position.set(-0.35, 0.05, -0.04);
    back.add(backWindow);
    back.position.set(0, 0, -0.34);
    rig.add(back);

    var dial = new THREE.Group();
    var dialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 24), goldBrightMat);
    dial.add(dialBase);
    var dialNub = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.03), goldMat);
    dialNub.position.set(0.09, 0.03, 0);
    dial.add(dialNub);
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      var tick = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.006), goldMat);
      tick.position.set(Math.cos(a) * 0.125, 0, Math.sin(a) * 0.125);
      tick.rotation.y = -a;
      dial.add(tick);
    }
    dial.position.set(0.5, 0.545, 0.16);
    rig.add(dial);

    return {
      rig: rig,
      parts: {
        lens: { obj: lens, rest: lens.position.clone(), dPos: new THREE.Vector3(-0.55, -0.42, 0.65), dRot: new THREE.Vector3(0.55, 0, -0.95) },
        viewfinder: { obj: vf, rest: vf.position.clone(), dPos: new THREE.Vector3(0.22, 0.5, -0.32), dRot: new THREE.Vector3(0.7, 0.3, 0.2) },
        back: { obj: back, rest: back.position.clone(), dPos: new THREE.Vector3(0.06, -0.03, -0.38), dRot: new THREE.Vector3(0, -2.05, 0) },
        dial: { obj: dial, rest: dial.position.clone(), dPos: new THREE.Vector3(0.32, 0.3, 0.26), dRot: new THREE.Vector3(0, 0, 5.6) }
      }
    };
  }

  var scene, camera, renderer, rig, parts, webglAlive = false;

  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 100);
    camera.position.set(0, 0.55, 4.4);
    camera.lookAt(0, 0, 0);

    // Soft, mostly-ambient lighting on purpose: a moody, high-contrast
    // product-shot rig (what an earlier version of this used) fights the
    // flat, evenly-lit "illustrated diagram" look this is going for — a
    // clean geometric render closer to an architectural elevation than a
    // studio photo. One gentle key light for a touch of form-defining
    // shadow, nothing more.
    scene.add(new THREE.HemisphereLight(0xaeaeb6, 0x201c22, 2.4));
    var key = new THREE.DirectionalLight(0xfff3e2, 1.6); key.position.set(2, 2.6, 2.4); scene.add(key);

    var built = buildRig();
    rig = built.rig;
    parts = built.parts;
    // A permanent, gentle 3/4 angle — flat-on made the lens read as a giant
    // disc and hid the body's top/side entirely, and a pure elevation view
    // would make the exploded parts overlap each other on screen. This is
    // a fixed camera-diagram angle, not a turntable: nothing here changes
    // with scroll position.
    rig.rotation.x = THREE.MathUtils.degToRad(-9);
    rig.rotation.y = THREE.MathUtils.degToRad(-16);
    scene.add(rig);

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    canvasEl.addEventListener("webglcontextlost", function (e) { e.preventDefault(); webglAlive = false; fallbackFlat(); }, false);

    webglAlive = true;
  } catch (e) {
    fallbackFlat();
    return;
  }

  function sizeRenderer() {
    var r = stageEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  sizeRenderer();
  if (window.ResizeObserver) {
    new ResizeObserver(sizeRenderer).observe(stageEl);
  } else {
    window.addEventListener("resize", sizeRenderer, { passive: true });
  }

  /* ---- scroll → progress (identical math to the previous build) --------- */
  function smoothstep(e0, e1, x) {
    if (e0 === e1) return x < e0 ? 0 : 1;
    var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }
  function ranges(count) {
    var start = 0.08, span = (1 - start) / count, out = [];
    for (var i = 0; i < count; i++) out.push([start + i * span, start + (i + 1) * span]);
    return out;
  }
  function applyPart(p, t) {
    p.obj.position.set(p.rest.x + p.dPos.x * t, p.rest.y + p.dPos.y * t, p.rest.z + p.dPos.z * t);
    p.obj.rotation.set(p.dRot.x * t, p.dRot.y * t, p.dRot.z * t);
  }

  var queued = false;
  function frame() {
    queued = false;
    if (!webglAlive) return;

    var rect = wrap.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;

    var stageNames = mobileMQ.matches ? STAGE_NAMES_MOBILE : STAGE_NAMES_DESKTOP;
    var rr = ranges(stageNames.length);
    var active = {};
    stageNames.forEach(function (name, i) { active[name] = true; });

    Object.keys(parts).forEach(function (name) {
      var idx = stageNames.indexOf(name);
      var t = idx === -1 ? 0 : smoothstep(rr[idx][0], rr[idx][1], p);
      applyPart(parts[name], t);
    });

    // The rig's own orientation is fixed (set once, above) — no
    // whole-camera turntable turn. A slight dolly-back as the parts spread
    // out keeps the whole exploded arrangement inside frame instead of the
    // outer pieces drifting past the edge of the canvas.
    camera.position.z = 4.4 + p * 0.9;

    copyEl.style.setProperty("--copy-op", (1 - smoothstep(0, 0.08, p)).toFixed(3));
    stageNames.forEach(function (name, i) {
      var line = wrap.querySelector('.cam-line[data-stage="' + (i + 1) + '"]');
      if (!line) return;
      var isLast = i === stageNames.length - 1;
      var isActive = p >= rr[i][0] && (isLast || p < rr[i + 1][0]);
      line.classList.toggle("is-active", isActive);
    });

    try {
      renderer.render(scene, camera);
      if (!html.classList.contains("has-3d")) html.classList.add("has-3d");
    } catch (e) {
      webglAlive = false;
      fallbackFlat();
      return;
    }

    if (p >= 0.985) unlockNav();
  }
  function onScrollOrResize() { if (queued) return; queued = true; requestAnimationFrame(frame); }
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  mobileMQ.addEventListener("change", onScrollOrResize);

  frame();
})();
