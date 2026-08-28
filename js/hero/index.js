/* ==========================================================================
   Ermis' Villas — hero controller
   --------------------------------------------------------------------------
   Binds scroll position to the camera, and nothing else to anything.

   The brief was specific: the move must run only while the visitor scrolls,
   stop exactly where they stop, and reverse exactly on the way back up. So:

   • There is no timeline and no autoplay. `target` is derived purely from
     scrollY; `smooth` chases it with an exponential damp. When they coincide
     the loop shuts down entirely — no rAF, no GPU work, a genuinely still
     frame. Scroll again and it wakes.

   • Because the camera is a pure function of scroll, reverse is free. Running
     the scroll backwards runs the tour backwards. Nothing is playing, so
     there is nothing to rewind.

   • The exponential damp is frame-rate independent (it uses dt, not a fixed
     per-frame fraction), so a 120Hz iPad and a 60Hz laptop travel at the same
     speed rather than the iPad arriving twice as fast.
   ========================================================================== */

import { createRig, detectTier, hasWebGL, makeResizer } from './scene.js?v=260828f';
import { buildWalk } from './walk.js?v=260828f';
import { CHAPTERS, chapterAt, clamp01 } from './path.js?v=260828f';

/* The hero is now a walk through seven photographs of one house — see
   walk.js. The modelled villa it used to fly through is still in this folder
   (villa.js, path.js's camera keyframes, photos.js) and is not imported; the
   camera choreography that drove it lives on only as the chapter boundaries
   in path.js, which the walk uses to know which room it is in.
   See README → "The hero". */

const hero    = document.getElementById('hero');
const stage   = document.getElementById('heroStage');
const canvas  = document.getElementById('heroCanvas');
const panelEls = Array.from(document.querySelectorAll('[data-chapter]'));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* If we can't do this justice, don't do it at all: fall back to the flat
   layout, which is a complete, designed experience in its own right. */
if (!hero || !stage || !canvas || reduced || !hasWebGL()) {
  if (hero) hero.classList.add('hero--static');
  document.documentElement.classList.add('hero-fallback');
} else {
  boot();
}

function boot() {
  const tier = detectTier();
  hero.dataset.tier = tier;

  let rig;
  try {
    rig = createRig(canvas, tier);
  } catch (err) {
    // Context creation can still fail on locked-down or GPU-blacklisted
    // devices even after hasWebGL() passed. Same graceful exit.
    hero.classList.add('hero--static');
    document.documentElement.classList.add('hero-fallback');
    return;
  }

  const { renderer, scene, camera, settings } = rig;

  // Nothing behind the photographs: they cover the frame, so a sky or a fog
  // would only be a texture upload nobody ever sees.
  scene.background = null;
  scene.environment = null;
  scene.fog = null;

  // The walk. Photographs arrive one chapter ahead of where the visitor is,
  // and each arrival has to wake a loop that has almost certainly already
  // shut itself down.
  const walk = buildWalk(scene, camera, () => wake());

  // Shared between the resizer (which decides how much wider a tall screen
  // needs to be) and the draw loop (which applies it to each shot's fov).
  // dprScale is the quality governor's dial — see below.
  const view = { fovScale: 1, portrait: false, dprScale: 1 };
  const resize = makeResizer(renderer, camera, settings, view);

  let lastFov = 0;

  let target = 0;       // where the scroll says we should be
  let smooth = 0;       // where the camera actually is
  let lastChapter = -1;
  let lastMoving = null;
  let running = false;
  let visible = true;
  let lastTime = 0;
  let firstFrameDone = false;

  /* ---- Scroll geometry, cached. Recomputed on resize only, so the scroll
     handler itself never touches layout. ---- */
  let stageTop = 0, travel = 1;

  function measure() {
    const rect = stage.getBoundingClientRect();
    stageTop = rect.top + window.scrollY;
    travel = Math.max(1, stage.offsetHeight - window.innerHeight);
  }

  function readScroll() {
    target = clamp01((window.scrollY - stageTop) / travel);
  }

  /* ---- The loop ---- */
  function wake() {
    if (running || !visible) return;
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const raw = (now - lastTime) / 1000;
    const dt = Math.min(0.05, raw) || 0.016;
    lastTime = now;

    const gap = target - smooth;
    if (Math.abs(gap) < 0.00012) {
      // Settled. Land exactly on the target, draw the final frame, and stop.
      smooth = target;
      draw();
      running = false;
      return;
    }

    // Frame-rate independent damping. Lower means a longer, softer glide: at
    // 7 the camera takes about 140ms to close most of the gap, against 90ms
    // at the 11 this used to run at. That is the difference between the move
    // stopping when the wheel stops and it coming to rest.
    //
    // There is a floor to how low this can go. Much under 6 and the camera is
    // visibly behind the finger on a trackpad, which reads as lag rather than
    // as smoothness — the opposite of the point. One number, easy to try.
    smooth += gap * (1 - Math.exp(-7 * dt));
    draw();
    judge(raw);
    requestAnimationFrame(frame);
  }

  /* ---- Quality governor ----
     The tier chosen at boot is a guess made from core count and pointer type,
     and a guess is all it can be: a four-core desktop with a good GPU and a
     twelve-core laptop throttling on battery both slip through it. So the
     guess is checked against the only thing that actually matters — how long
     real frames are taking while the camera is moving.

     It only ever steps down. A hero that oscillates between sharp and soft as
     the load changes is worse than one that is quietly a little softer, and
     stepping back up would guarantee that oscillation on any device sitting
     near the threshold.

     Resolution goes first because with the walk it is very nearly the only
     cost: two textured quads shading several million pixels a frame, with no
     lights and no shading model behind them. The film grain goes second — a
     full-screen blend the compositor redoes every time the canvas under it
     redraws, and the only other thing here that can be given up without
     changing the composition.

     Texture size is deliberately NOT on this list. Dropping to the smaller
     set mid-scroll would mean re-fetching and re-uploading every photograph
     already seen: network, plus a GPU stall, spent to fix a stall. That
     choice is made once at boot from the pointing device. ---- */
  const STEPS = [
    { dpr: 1,    grain: true  },   // as shipped
    { dpr: 0.78, grain: true  },   // ~40% fewer pixels
    { dpr: 0.62, grain: false }    // ~60% fewer, and no blend layer
  ];
  const BUDGET_MS = 20;            // slower than ~50fps is not good enough
  const SAMPLE = 45;               // frames of real movement before judging
  const WARMUP = 25;               // first frames are compile and upload, not steady state

  let step = 0;
  let warm = 0;
  let samples = [];

  function judge(seconds) {
    if (step >= STEPS.length - 1) return;      // nothing left to give up
    if (warm < WARMUP) { warm++; return; }
    if (!(seconds > 0) || seconds > 0.5) return;   // a tab-switch is not a slow frame

    samples.push(seconds * 1000);
    if (samples.length < SAMPLE) return;

    samples.sort((a, b) => a - b);
    const median = samples[samples.length >> 1];
    samples.length = 0;
    if (median <= BUDGET_MS) return;

    step++;
    view.dprScale = STEPS[step].dpr;
    hero.classList.toggle('is-plain', !STEPS[step].grain);
    resize(true);
    // Deliberately not re-baking the shadow map here. It is rendered in the
    // light's space, not the canvas's, so the buffer changing size does not
    // invalidate it — and re-baking would spend a full shadow pass on the one
    // device that has just told us it has nothing to spare.
  }

  function draw() {
    /* One focal length for the whole walk. The old hero changed it shot by
       shot because it was composing a modelled scene; a photograph already
       has the lens the photographer used baked into it, and changing ours on
       top of that only distorts what they framed.

       Still quantised and only written on a change: a tolerance would be
       hysteresis, and hysteresis means the frame at a given scroll position
       depends on which way you arrived. Far too small to see, but "reverses
       exactly" is the premise of this hero and rounding costs nothing. */
    const fov = Math.round(42 * view.fovScale * 100) / 100;
    if (fov !== lastFov) {
      lastFov = camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // The walk places the camera itself: it is the one thing that knows how
    // far down the corridor a given scroll position is.
    walk.update(smooth);

    renderer.render(scene, camera);
    syncUI(smooth);

    if (!firstFrameDone) {
      firstFrameDone = true;
      hero.classList.add('is-ready');
      document.documentElement.classList.add('hero-ready');
    }
  }

  /* ---- UI in the left column ----
     Written only when something actually changes. Per-frame DOM writes are
     what make scroll-driven pages feel gummy, so we do none.

     There used to be a chapter rail here as well — seven dashes on a phone, a
     labelled index down the right on a desktop — tracking progress through the
     tour. Removed at the owner's request; the panels and the scroll cue are
     what say where you are now. `local` from chapterAt() was only ever used to
     move its marker, so it is no longer read. ---- */
  function syncUI(t) {
    const { index } = chapterAt(t);

    if (index !== lastChapter) {
      lastChapter = index;
      const id = CHAPTERS[index].id;
      for (const el of panelEls) {
        el.classList.toggle('is-active', el.dataset.chapter === id);
      }
      hero.dataset.chapter = id;
    }

    /* This was written on every single frame. classList.toggle with an
       unchanged value still touches the element, and touching an element that
       an ancestor of the canvas is composited with invites style work in the
       middle of the frame. Written only when it actually flips now.

       There was a second flag beside it, `is-inside`, set when the old camera
       crossed the front door at t > 0.55. Nothing has read it since that
       camera was replaced by the walk — no stylesheet, no script — so it was
       a class toggle and a comparison per scroll for nobody. Removed. */
    const moving = t > 0.015;
    if (moving !== lastMoving) { lastMoving = moving; hero.classList.toggle('is-moving', moving); }
  }

  /* ---- Wiring ---- */
  window.addEventListener('scroll', () => { readScroll(); wake(); }, { passive: true });

  window.addEventListener('resize', () => {
    if (resize(false)) { measure(); readScroll(); smooth = target; wake(); }
  }, { passive: true });

  // Orientation change resizes in two stages on iOS; re-measure after it lands.
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { resize(true); measure(); readScroll(); smooth = target; wake(); }, 260);
  });

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) wake();
  });

  // Don't animate a hero nobody is looking at.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting && !document.hidden;
      if (visible) wake();
    }, { rootMargin: '10% 0px' }).observe(stage);
  }

  // Fonts landing can change the stage's measured height on some browsers.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { measure(); readScroll(); wake(); });
  }

  /* ---- Go ---- */
  resize(true);
  measure();
  readScroll();
  smooth = target;                       // no fly-in on a restored scroll position
  draw();

  // A second measure once layout has fully settled catches late-loading CSS.
  requestAnimationFrame(() => { measure(); readScroll(); wake(); });
}
