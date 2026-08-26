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

import { Vector3 } from '../vendor/three.slim.js?v=260826';
import { createRig, detectTier, hasWebGL, makeResizer } from './scene.js?v=260826';
import { buildVilla, makeMaterials } from './villa.js?v=260826';
import { CHAPTERS, chapterAt, clamp01, doorAngle, evaluate } from './path.js?v=260826';

const hero    = document.getElementById('hero');
const stage   = document.getElementById('heroStage');
const canvas  = document.getElementById('heroCanvas');
const railEl  = document.getElementById('heroRail');
const panelEls = Array.from(document.querySelectorAll('[data-chapter]'));
const railEls  = Array.from(document.querySelectorAll('[data-rail]'));

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
  const mats = makeMaterials();
  const { doorPivot } = buildVilla(scene, mats, settings);

  // Shared between the resizer (which decides how much wider a tall screen
  // needs to be) and the draw loop (which applies it to each shot's fov).
  const view = { fovScale: 1, portrait: false };
  const resize = makeResizer(renderer, camera, settings, view);

  const pos = new Vector3();
  const look = new Vector3();
  let lastFov = 0;

  let target = 0;       // where the scroll says we should be
  let smooth = 0;       // where the camera actually is
  let lastChapter = -1;
  let lastRail = -1;
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
    const dt = Math.min(0.05, (now - lastTime) / 1000) || 0.016;
    lastTime = now;

    const gap = target - smooth;
    if (Math.abs(gap) < 0.00012) {
      // Settled. Land exactly on the target, draw the final frame, and stop.
      smooth = target;
      draw();
      running = false;
      return;
    }

    // Frame-rate independent damping. 11 ≈ 90ms to close most of the gap:
    // enough to take the stutter out of a mouse wheel, not enough to feel
    // like the camera is lagging behind the finger on a trackpad.
    smooth += gap * (1 - Math.exp(-11 * dt));
    draw();
    requestAnimationFrame(frame);
  }

  function draw() {
    const fov = evaluate(smooth, pos, look) * view.fovScale;
    if (Math.abs(fov - lastFov) > 0.01) {
      lastFov = camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.position.copy(pos);
    camera.lookAt(look);

    // Portrait framing: on the approach shots a phone's tall frame is nearly
    // half empty sky, so the camera is tipped down a few degrees to bring the
    // house up out of it. The tilt fades to nothing by the time we are through
    // the door — indoors it would only buy us more floor.
    if (view.portrait) {
      const fade = 1 - clamp01(smooth / 0.6);
      if (fade > 0) camera.rotateX(-0.14 * fade);
    }

    doorPivot.rotation.y = doorAngle(smooth);
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
     what make scroll-driven pages feel gummy, so we do none. ---- */
  function syncUI(t) {
    const { index, local } = chapterAt(t);

    if (index !== lastChapter) {
      lastChapter = index;
      const id = CHAPTERS[index].id;
      for (const el of panelEls) {
        el.classList.toggle('is-active', el.dataset.chapter === id);
      }
      hero.dataset.chapter = id;
    }

    // The rail marker moves continuously, but it's one custom property on one
    // element — a compositor-only change, no layout.
    if (railEl) {
      const p = (index + local) / CHAPTERS.length;
      const rounded = Math.round(p * 500) / 500;
      if (rounded !== lastRail) {
        lastRail = rounded;
        railEl.style.setProperty('--rail', rounded);
      }
      for (let i = 0; i < railEls.length; i++) {
        railEls[i].classList.toggle('is-on', i === index);
      }
    }

    hero.classList.toggle('is-moving', t > 0.015);
    hero.classList.toggle('is-inside', t > 0.55);
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
  renderer.shadowMap.needsUpdate = true; // bake the one and only shadow pass
  draw();

  // A second measure once layout has fully settled catches late-loading CSS.
  requestAnimationFrame(() => { measure(); readScroll(); wake(); });
}
