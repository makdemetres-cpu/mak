/* ==========================================================================
   SITRIXWEB — hero globe
   A dotted/particle wireframe sphere drawn on a 2D canvas (no WebGL, no
   library, ~6KB) so it starts instantly and runs cool on phones.

   Motion, in the three layers the rest of the site uses:
     primary   — a continuous auto-rotation, ~10s per revolution, with a
                 sine term so the loop never reads as a hard mechanical spin
     secondary — pointer tilt (desktop, max ~9°, spring-settled) or
                 drag-to-rotate (touch)
     ambient   — parallax drift at 20% of scroll speed (desktop only)

   It pauses when scrolled out of view or when the tab is hidden, and honours
   prefers-reduced-motion by rendering one still frame.
   ========================================================================== */
(() => {
  "use strict";

  const canvas = document.getElementById("globe");
  if (!canvas || !canvas.getContext) return;

  const wrap = canvas.closest(".globe-wrap") || canvas.parentElement;
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(hover: none)");

  /* ---------------- geometry ---------------- */
  // A Fibonacci sphere gives an even, organic point spread — no seams.
  function fibonacciSphere(n) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, k: 0 });
    }
    return pts;
  }

  // Latitude + longitude rings read as "wireframe" behind the particle cloud.
  function rings() {
    const pts = [];
    const lats = [-56, -28, 0, 28, 56];
    lats.forEach((deg) => {
      const phi = (deg * Math.PI) / 180;
      const y = Math.sin(phi);
      const r = Math.cos(phi);
      const steps = Math.round(46 * r) + 14;
      for (let i = 0; i < steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, k: 1 });
      }
    });
    for (let m = 0; m < 6; m++) {
      const rot = (m / 6) * Math.PI;
      for (let i = 0; i < 44; i++) {
        const th = (i / 44) * Math.PI * 2;
        const x0 = Math.cos(th), y0 = Math.sin(th);
        pts.push({ x: x0 * Math.cos(rot), y: y0, z: x0 * Math.sin(rot), k: 1 });
      }
    }
    return pts;
  }

  const dots = fibonacciSphere(360).concat(rings());

  /* ---------------- state ---------------- */
  let W = 0, H = 0, dpr = 1;
  let running = false, visible = true, inView = true;
  let raf = 0, t0 = 0;

  let spin = 0;              // accumulated primary rotation (radians)
  let renderSpin = 0;        // spin actually drawn this frame (spin + sine term)
  let tiltX = 0, tiltY = 0;  // current tilt
  let aimX = 0, aimY = 0;    // tilt target (pointer or drag)
  let vX = 0, vY = 0;        // tilt velocity, for the spring settle
  let parallax = 0;          // scroll drift
  let dragSpin = 0;          // extra rotation contributed by touch drags

  const MAX_TILT = 0.16;     // ~9 degrees
  const SPIN_PERIOD = 10000; // ms per revolution

  function resize() {
    const rect = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.44;

    const sy = Math.sin(renderSpin + dragSpin), cyr = Math.cos(renderSpin + dragSpin);
    const sx = Math.sin(tiltY), cxr = Math.cos(tiltY);
    const sz = Math.sin(tiltX), czr = Math.cos(tiltX);

    // Painter's algorithm: sort back-to-front so near dots overlap far ones.
    const projected = [];
    for (let i = 0; i < dots.length; i++) {
      const p = dots[i];
      // rotate around Y (spin)
      let x = p.x * cyr - p.z * sy;
      let z = p.x * sy + p.z * cyr;
      let y = p.y;
      // rotate around X (vertical tilt)
      const y2 = y * cxr - z * sx;
      z = y * sx + z * cxr;
      y = y2;
      // rotate around Z (horizontal lean)
      const x2 = x * czr - y * sz;
      y = x * sz + y * czr;
      x = x2;

      // Weak perspective — enough depth to read as a solid volume.
      const persp = 1 / (1.9 - z * 0.55);
      projected.push({
        sx: cx + x * R * persp * 1.6,
        sy: cy + y * R * persp * 1.6,
        z,
        k: p.k,
      });
    }
    projected.sort((a, b) => a.z - b.z);

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const depth = (p.z + 1) / 2;                 // 0 = far, 1 = near
      const alpha = p.k ? 0.06 + depth * 0.26 : 0.12 + depth * 0.72;
      const size = p.k ? 0.7 + depth * 0.7 : 0.75 + depth * 1.5;

      // The copper accent rides the leading edge; the rest stays cool white.
      ctx.fillStyle = !p.k && depth > 0.78
        ? "rgba(200,149,108," + alpha.toFixed(3) + ")"
        : "rgba(239,231,249," + alpha.toFixed(3) + ")";

      ctx.beginPath();
      ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    if (!t0) t0 = now;
    const dt = Math.min(now - t0, 50);
    t0 = now;

    // Primary: constant sweep + a sine term, so the loop is seamless and
    // never reads as a mechanical, linear spin.
    spin += (dt / SPIN_PERIOD) * Math.PI * 2;
    const eased = Math.sin(spin * 0.5) * 0.06;

    // Secondary: critically-damped spring toward the pointer/drag target.
    const stiff = 0.055, damp = 0.82;
    vX = (vX + (aimX - tiltX) * stiff) * damp;
    vY = (vY + (aimY - tiltY) * stiff) * damp;
    tiltX += vX;
    tiltY += vY;

    renderSpin = spin + eased;
    draw();

    // Ambient: parallax drift, applied to the wrapper (not the canvas) so the
    // glow and orbit rings move with it.
    wrap.style.transform = "translate3d(0," + parallax.toFixed(2) + "px,0)";

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced.matches || !visible || !inView) return;
    running = true;
    t0 = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* ---------------- input ---------------- */
  // Desktop: the globe leans toward the cursor anywhere on the hero.
  function onPointerMove(e) {
    if (coarse.matches) return;
    const r = wrap.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
    aimX = Math.max(-1, Math.min(1, dx)) * MAX_TILT;
    aimY = Math.max(-1, Math.min(1, dy)) * -MAX_TILT;
  }

  // Touch: drag to rotate, with a little inertia on release.
  let dragging = false, lastX = 0, lastY = 0, flick = 0;
  function dragStart(e) {
    const p = e.touches ? e.touches[0] : e;
    dragging = true;
    lastX = p.clientX;
    lastY = p.clientY;
    flick = 0;
  }
  function dragMove(e) {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - lastX;
    const dy = p.clientY - lastY;
    lastX = p.clientX;
    lastY = p.clientY;
    dragSpin += dx * 0.008;
    flick = dx * 0.008;
    aimY = Math.max(-MAX_TILT, Math.min(MAX_TILT, aimY + dy * -0.004));
    if (e.cancelable) e.preventDefault();
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    // Let the flick decay instead of stopping dead.
    let v = flick;
    (function decay() {
      v *= 0.94;
      dragSpin += v;
      if (Math.abs(v) > 0.0004) requestAnimationFrame(decay);
    })();
  }

  function onScroll() {
    if (coarse.matches) return;               // parallax off on mobile
    parallax = window.scrollY * 0.2 * -1 * 0.35;
  }

  /* ---------------- wiring ---------------- */
  resize();
  draw();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); draw(); }, 150);
  });

  const hero = document.querySelector(".hero") || document;
  hero.addEventListener("pointermove", onPointerMove, { passive: true });

  wrap.addEventListener("touchstart", dragStart, { passive: true });
  wrap.addEventListener("touchmove", dragMove, { passive: false });
  wrap.addEventListener("touchend", dragEnd, { passive: true });
  wrap.addEventListener("touchcancel", dragEnd, { passive: true });

  window.addEventListener("scroll", onScroll, { passive: true });

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    visible ? start() : stop();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      inView ? start() : stop();
    }, { rootMargin: "120px" }).observe(wrap);
  }

  // Reduced motion: one still, slightly tilted frame — no loop at all.
  function applyMotionPref() {
    if (reduced.matches) {
      stop();
      tiltX = 0.06; tiltY = -0.05; spin = renderSpin = 0.6;
      wrap.style.transform = "none";
      draw();
    } else {
      start();
    }
  }
  if (reduced.addEventListener) reduced.addEventListener("change", applyMotionPref);
  applyMotionPref();
})();
