/* ==========================================================================
   SITRIXWEB — cursor companions
   Four interchangeable pointer effects, chosen by `cursor` in js/config.js
   (or ?cursor=<name> for the picker page in cursor-lab.html):

     "orbit"     a copper point with a dashed ring that trails and locks on
     "stardust"  a comet trail built from the same dots as the hero globe
     "reticle"   a control-room crosshair that snaps a bracket onto targets
     "field"     an aurora light that reveals a hidden dot-grid as it passes
     "off"       nothing at all (the default)

   Rules every variant obeys:
   • The real system cursor is never hidden. These effects sit behind it, so
     nobody loses the pointer, the text caret, or the resize handles.
   • Coarse pointers (phones, tablets) get nothing — there is no cursor to
     follow, and the work would only cost battery.
   • prefers-reduced-motion gets nothing. This is decoration, and decoration
     is the first thing to switch off when someone asks for less movement.
   • One shared requestAnimationFrame loop, transforms only, and the loop
     stops itself when the pointer leaves the window or the tab is hidden.
   ========================================================================== */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)");

  // The lab page overrides the configured choice from the query string.
  const param = new URLSearchParams(location.search).get("cursor");
  const configured = ((window.SITRIX || {}).cursor || "off").toLowerCase();
  let choice = (param || configured).toLowerCase();

  const VARIANTS = {};
  const INTERACTIVE = 'a[href], button, input, textarea, select, summary, [data-cursor-target]';

  /* ---------------------------------------------------------------- shared */
  const layer = document.createElement("div");
  layer.className = "cur";
  layer.setAttribute("aria-hidden", "true");

  const state = {
    x: window.innerWidth / 2, y: window.innerHeight / 2,   // true pointer
    px: window.innerWidth / 2, py: window.innerHeight / 2, // previous frame
    vx: 0, vy: 0,                                          // pointer velocity
    down: false,
    target: null,          // the interactive element under the pointer
    inside: false,
    t: 0,
  };

  const lerp = (a, b, n) => a + (b - a) * n;

  let raf = 0, active = null, running = false;

  function loop(now) {
    state.t = now;
    state.vx = state.x - state.px;
    state.vy = state.y - state.py;
    if (active && active.frame) active.frame(state);
    state.px = state.x;
    state.py = state.y;
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running || !active) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* --------------------------------------------------------- variant: orbit */
  /* A small copper point sits exactly on the pointer; a dashed ring — the
     same motif as the orbit rings behind the hero globe — trails a few
     frames behind on a spring and opens up over anything clickable. */
  VARIANTS.orbit = {
    label: "Orbit",
    build() {
      layer.innerHTML =
        '<div class="cur-orbit__ring"></div><div class="cur-orbit__dot"></div>';
      this.ring = layer.querySelector(".cur-orbit__ring");
      this.dot = layer.querySelector(".cur-orbit__dot");
      this.rx = state.x; this.ry = state.y;
      this.scale = 1; this.aim = 1;
      this.spin = 0;
    },
    frame(s) {
      // Ring lags with an eased follow; the dot is exact, so the gap between
      // them reads as speed.
      this.rx = lerp(this.rx, s.x, 0.16);
      this.ry = lerp(this.ry, s.y, 0.16);
      this.aim = s.target ? 1.9 : 1;
      if (s.down) this.aim *= 0.82;
      this.scale = lerp(this.scale, this.aim, 0.14);
      this.spin += 0.28;

      this.dot.style.transform =
        "translate3d(" + s.x + "px," + s.y + "px,0) translate(-50%,-50%)";
      this.ring.style.transform =
        "translate3d(" + this.rx + "px," + this.ry + "px,0) translate(-50%,-50%) " +
        "rotate(" + this.spin + "deg) scale(" + this.scale.toFixed(3) + ")";
    },
    hover(on) { layer.classList.toggle("is-locked", on); },
  };

  /* ------------------------------------------------------ variant: stardust */
  /* A comet trail made of the same particles the hero globe is drawn from.
     Emission is proportional to pointer speed, so it stays quiet when you
     read and flares when you move. */
  VARIANTS.stardust = {
    label: "Stardust",
    MAX: 150,
    build() {
      layer.innerHTML = '<canvas class="cur-star__canvas"></canvas>';
      this.canvas = layer.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.parts = [];
      this.resize();
      this._onResize = () => this.resize();
      window.addEventListener("resize", this._onResize);
    },
    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.canvas.style.width = this.w + "px";
      this.canvas.style.height = this.h + "px";
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    frame(s) {
      const ctx = this.ctx;
      const speed = Math.min(Math.hypot(s.vx, s.vy), 90);

      // Emit along the segment travelled, so a fast flick leaves a continuous
      // streak instead of a dotted line of frame-sized gaps.
      const emit = s.inside ? Math.min(Math.round(speed / 7), 5) : 0;
      for (let i = 0; i < emit && this.parts.length < this.MAX; i++) {
        const f = i / Math.max(emit, 1);
        this.parts.push({
          x: lerp(s.px, s.x, f) + (Math.random() - 0.5) * 6,
          y: lerp(s.py, s.y, f) + (Math.random() - 0.5) * 6,
          vx: s.vx * 0.06 + (Math.random() - 0.5) * 0.5,
          vy: s.vy * 0.06 + (Math.random() - 0.5) * 0.5 - 0.12, // drifts up
          life: 1,
          decay: 0.012 + Math.random() * 0.016,
          r: 0.6 + Math.random() * 1.7,
          copper: Math.random() < (s.target ? 0.75 : 0.4),
        });
      }

      ctx.clearRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = "lighter";

      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.965; p.vy *= 0.965;
        p.life -= p.decay;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        const a = p.life * p.life * 0.85;
        ctx.fillStyle = p.copper
          ? "rgba(200,149,108," + a.toFixed(3) + ")"
          : "rgba(239,231,249," + (a * 0.7).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // The head: a soft bloom that swells over anything clickable.
      if (s.inside) {
        const rad = s.target ? 15 : 9;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad);
        g.addColorStop(0, "rgba(200,149,108,.55)");
        g.addColorStop(1, "rgba(200,149,108,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    destroy() { window.removeEventListener("resize", this._onResize); },
  };

  /* ------------------------------------------------------- variant: reticle */
  /* Control-room framing: two hairlines across the viewport, a live coordinate
     readout, and a bracket that snaps onto whatever you are about to click. */
  VARIANTS.reticle = {
    label: "Reticle",
    build() {
      layer.innerHTML =
        '<div class="cur-ret__h"></div><div class="cur-ret__v"></div>' +
        '<div class="cur-ret__box"><i></i><i></i><i></i><i></i></div>' +
        '<div class="cur-ret__read"></div>';
      this.h = layer.querySelector(".cur-ret__h");
      this.v = layer.querySelector(".cur-ret__v");
      this.box = layer.querySelector(".cur-ret__box");
      this.read = layer.querySelector(".cur-ret__read");
      this.bx = state.x; this.by = state.y;
      this.bw = 26; this.bh = 26;
      this.hx = state.x; this.hy = state.y;
    },
    frame(s) {
      // Hairlines follow closely; the bracket eases onto its target.
      this.hx = lerp(this.hx, s.x, 0.3);
      this.hy = lerp(this.hy, s.y, 0.3);
      this.h.style.transform = "translate3d(0," + this.hy.toFixed(1) + "px,0)";
      this.v.style.transform = "translate3d(" + this.hx.toFixed(1) + "px,0,0)";

      let tx = s.x, ty = s.y, tw = 26, th = 26;
      if (s.target) {
        const r = s.target.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
        tw = r.width + 16;
        th = r.height + 12;
      }
      this.bx = lerp(this.bx, tx, 0.2);
      this.by = lerp(this.by, ty, 0.2);
      this.bw = lerp(this.bw, tw, 0.2);
      this.bh = lerp(this.bh, th, 0.2);

      this.box.style.transform =
        "translate3d(" + this.bx.toFixed(1) + "px," + this.by.toFixed(1) + "px,0) translate(-50%,-50%)";
      this.box.style.width = this.bw.toFixed(1) + "px";
      this.box.style.height = this.bh.toFixed(1) + "px";

      this.read.style.transform =
        "translate3d(" + (s.x + 18) + "px," + (s.y + 16) + "px,0)";
    },
    hover(on, el) {
      layer.classList.toggle("is-locked", on);
      const label = on
        ? (el.getAttribute("data-cursor-label") ||
           (el.textContent || "").trim().slice(0, 28) ||
           el.getAttribute("aria-label") || "target")
        : null;
      this.read.textContent = label
        ? label
        : "x " + Math.round(state.x) + " · y " + Math.round(state.y);
      this._label = label;
    },
    tick() {
      if (!this._label) {
        this.read.textContent =
          "x " + Math.round(state.x) + " · y " + Math.round(state.y);
      }
    },
  };

  /* --------------------------------------------------------- variant: field */
  /* The quietest of the four: an aurora-coloured light that lags well behind
     the pointer and uncovers a dot-grid hidden in the background as it goes. */
  VARIANTS.field = {
    label: "Field",
    build() {
      layer.innerHTML = '<div class="cur-field__grid"></div><div class="cur-field__glow"></div>';
      this.grid = layer.querySelector(".cur-field__grid");
      this.glow = layer.querySelector(".cur-field__glow");
      this.gx = state.x; this.gy = state.y;
      this.scale = 1;
    },
    frame(s) {
      // Heavy lag is the whole character here — light has weight.
      this.gx = lerp(this.gx, s.x, 0.075);
      this.gy = lerp(this.gy, s.y, 0.075);
      this.scale = lerp(this.scale, s.target ? 1.35 : 1, 0.08);

      this.glow.style.transform =
        "translate3d(" + this.gx.toFixed(1) + "px," + this.gy.toFixed(1) + "px,0) " +
        "translate(-50%,-50%) scale(" + this.scale.toFixed(3) + ")";
      // The mask follows the light, not the pointer, so the grid appears to
      // be lit rather than drawn.
      this.grid.style.setProperty("--mx", this.gx.toFixed(1) + "px");
      this.grid.style.setProperty("--my", this.gy.toFixed(1) + "px");
    },
    hover(on) { layer.classList.toggle("is-locked", on); },
  };

  /* ---------------------------------------------------------------- wiring */
  function onMove(e) {
    state.x = e.clientX;
    state.y = e.clientY;
    if (!state.inside) {
      state.inside = true;
      state.px = state.x; state.py = state.y;   // no phantom streak on entry
      layer.classList.add("is-on");
      start();
    }
    if (active && active.tick) active.tick();
  }
  function onLeave(e) {
    if (e.relatedTarget || e.toElement) return;  // still inside the document
    state.inside = false;
    layer.classList.remove("is-on");
    // Let the trail finish drawing itself out before the loop parks.
    setTimeout(() => { if (!state.inside) stop(); }, 700);
  }
  function onOver(e) {
    const el = e.target.closest ? e.target.closest(INTERACTIVE) : null;
    if (el === state.target) return;
    state.target = el;
    if (active && active.hover) active.hover(!!el, el);
  }
  function onDown() { state.down = true; layer.classList.add("is-down"); }
  function onUp() { state.down = false; layer.classList.remove("is-down"); }

  function mount(name) {
    if (active && active.destroy) active.destroy();
    stop();
    layer.className = "cur";
    layer.innerHTML = "";
    active = VARIANTS[name] || null;
    choice = name;

    if (!active) {
      if (layer.parentNode) layer.remove();
      return;
    }
    layer.classList.add("cur--" + name);
    if (!layer.parentNode) document.body.appendChild(layer);
    active.build();
    if (state.inside) { layer.classList.add("is-on"); start(); }
  }

  function enable() {
    if (coarse.matches || reduced.matches) return;
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseout", onLeave, { passive: true });
    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : (state.inside && start());
    });
    mount(choice);
  }

  // Exposed so cursor-lab.html can switch variants live, and so the site can
  // turn the effect off at runtime if it ever needs to.
  window.SitrixCursor = {
    set: (name) => { if (!coarse.matches && !reduced.matches) mount(name); },
    get: () => choice,
    names: () => Object.keys(VARIANTS),
    available: () => !coarse.matches && !reduced.matches,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enable);
  } else {
    enable();
  }
})();
