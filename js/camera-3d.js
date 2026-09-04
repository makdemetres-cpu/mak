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
  var RIG_BASE_DEG = -26; // permanent 3/4 product-shot starting angle
  var RIG_MAX_DEG = 52;   // "noticeable but tasteful" turntable turn ADDED on
                           // top of the base angle as you scroll — safe to go
                           // this far because real geometry never vanishes
                           // edge-on the way the old flat SVG plane did.

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
  var bodyMat = new THREE.MeshStandardMaterial({ color: 0x232228, metalness: 0.55, roughness: 0.42 });
  var darkMat = new THREE.MeshStandardMaterial({ color: 0x131215, metalness: 0.7, roughness: 0.32 });
  var glassMat = new THREE.MeshStandardMaterial({ color: 0x050508, metalness: 0.9, roughness: 0.08 });
  var goldMat = new THREE.MeshStandardMaterial({ color: 0xc2a05f, metalness: 0.85, roughness: 0.3 });
  var goldBrightMat = new THREE.MeshStandardMaterial({ color: 0xe7c888, metalness: 0.9, roughness: 0.2 });

  function buildRig() {
    var rig = new THREE.Group();

    var body = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.02, 0.62), bodyMat);
    rig.add(body);

    [-0.78, 0.78].forEach(function (x) {
      // Torus faces Z (its hole) by default — turn it 90° around Y so the
      // hole faces outward along X, like a strap lug you could thread
      // something through, instead of facing the camera edge-on.
      var lug = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 20), goldMat);
      lug.position.set(x, 0.48, 0.02);
      lug.rotation.y = Math.PI / 2;
      rig.add(lug);
    });

    var lens = new THREE.Group();
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.58, 28), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.29;
    lens.add(barrel);
    var glass = new THREE.Mesh(new THREE.CircleGeometry(0.33, 28), glassMat);
    glass.position.z = 0.585;
    lens.add(glass);
    // Torus already faces Z by default — that's forward, toward the
    // viewer, exactly right for a lens ring. No rotation needed (rotating
    // it like the cylinder above turned it edge-on into a flat line).
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.028, 10, 36), goldMat);
    ring.position.z = 0.29;
    lens.add(ring);
    lens.position.set(0, -0.14, 0.31);
    rig.add(lens);

    var vf = new THREE.Group();
    var vfBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.34, 4), darkMat);
    vfBody.rotation.y = Math.PI / 4;
    vf.add(vfBody);
    vf.position.set(-0.05, 0.6, -0.02);
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
    dial.position.set(0.62, 0.56, 0.08);
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

    scene.add(new THREE.HemisphereLight(0x9a9aa2, 0x141018, 1.6));
    var key = new THREE.DirectionalLight(0xffe6c2, 5.5); key.position.set(2.4, 3, 2.8); scene.add(key);
    var fill = new THREE.DirectionalLight(0xffe2c0, 1.4); fill.position.set(-2.6, 0.6, -0.6); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xfff2df, 2.6); rim.position.set(-1.2, 2.2, -3.2); scene.add(rim);

    var built = buildRig();
    rig = built.rig;
    parts = built.parts;
    // A permanent 3/4 product-shot angle — flat-on made the lens read as a
    // giant disc and hid the body's top/side entirely. The scroll-driven
    // turntable turn (see frame() below) is added on top of this, not
    // instead of it.
    rig.rotation.x = THREE.MathUtils.degToRad(-10);
    scene.add(rig);

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

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

    rig.rotation.y = THREE.MathUtils.degToRad(RIG_BASE_DEG + p * RIG_MAX_DEG);
    // A slight dolly-back as the parts spread out, so the whole exploded
    // arrangement stays inside frame instead of the outer pieces drifting
    // past the edge of the canvas.
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
