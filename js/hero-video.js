/* ==========================================================================
   Χρόνης Πέγκας Photography — hero: a scroll-scrubbed video

   A real camera disassembly video (client-supplied), driven directly by
   scroll position instead of ever being played: scroll 0% sets the video's
   currentTime to 0 (its first frame — assembled), scroll 100% sets it to
   the last frame (fully exploded), and everything in between maps linearly.
   The video element's own .play() is never called anywhere in this file —
   only .currentTime is ever touched, which is what makes it "scrub" instead
   of "play" and is what makes scrolling back up reverse it for free: it's a
   pure function of scroll position on every frame, not a triggered
   animation with separate forward/reverse logic.

   Same progressive-enhancement contract as the rest of this site:
   - No JS at all → the <video> in the markup has no autoplay and no
     controls, so it just sits on its poster attribute (the exact first
     frame, assembled) forever. No separate fallback markup needed.
   - prefers-reduced-motion → unlock nav immediately, leave the video on
     its poster, never touch currentTime.
   - The video fails to load/decode for any reason → same flat treatment,
     applied via the .cam-flat class instead of the media feature (see the
     .cam-flat rules in style.css).
   ========================================================================== */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-cam-wrap]");
  if (!wrap) return;

  var videoEl = wrap.querySelector(".cam-video");
  var copyEl = wrap.querySelector(".hero-copy");
  var html = document.documentElement;
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var STAGE_COUNT = 6; // matches the 6 .cam-line elements in the markup

  /* ---- nav lock (identical to every earlier build of this hero) --------- */
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
  if (!videoEl) { unlockNav(); return; }

  lockNav();

  var fellBack = false;
  function fallbackFlat() {
    if (fellBack) return;
    fellBack = true;
    html.classList.add("cam-flat");
    unlockNav();
  }
  videoEl.addEventListener("error", fallbackFlat);
  // Belt-and-braces: nothing in this file ever calls .play(), but if some
  // browser extension or assistive tool does, undo it immediately rather
  // than let the video actually run away from the scroll position.
  videoEl.addEventListener("play", function () { videoEl.pause(); });
  videoEl.pause();

  // The "error" event above only reliably fires for some failure modes —
  // a 404 or an aborted request on a multi-<source> video can leave
  // networkState stuck at NETWORK_NO_SOURCE with readyState 0 forever,
  // with no error event ever reaching the video element itself. Without
  // this timeout, that failure mode would leave nav permanently locked,
  // since frame() below never gets past its "duration known yet?" guard.
  var loadTimer = window.setTimeout(function () {
    if (!(videoEl.duration > 0)) fallbackFlat();
  }, 6000);
  videoEl.addEventListener("durationchange", function () {
    window.clearTimeout(loadTimer);
  });

  function smoothstep(e0, e1, x) {
    if (e0 === e1) return x < e0 ? 0 : 1;
    var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }
  var stageRanges = (function () {
    var start = 0.08, span = (1 - start) / STAGE_COUNT, out = [];
    for (var i = 0; i < STAGE_COUNT; i++) out.push([start + i * span, start + (i + 1) * span]);
    return out;
  })();
  var lineEls = [];
  for (var s = 1; s <= STAGE_COUNT; s++) lineEls.push(wrap.querySelector('.cam-line[data-stage="' + s + '"]'));

  /* ---- scroll → progress -------------------------------------------------
     Driven by a continuous requestAnimationFrame loop rather than a
     "scroll" event listener — an event-driven version of this exact
     mechanism silently never fired inside this project's own Claude
     Artifact preview tool, which renders the page in a sandboxed iframe
     whose scrolling apparently doesn't dispatch "scroll" events the normal
     way even though the content visibly does scroll (CSS position: sticky
     needs no JS, so the wrapper still pinned correctly there). Polling
     getBoundingClientRect() every frame instead sidesteps the question of
     whether any given host fires scroll events correctly: it reads the
     actual current layout, which is authoritative regardless. The
     scroll-reveal system in main.js already uses the same rAF-polling
     safety-net pattern for the same class of reliability concern.

     currentTime is set directly from scroll position with no easing or
     lag — the brief for this video specifically calls for the frame to
     track scroll 1:1 and hold exactly wherever scrolling stops, which a
     lagged/eased value would only approximate. */
  var lastP = -1;
  var durationKnown = false;
  function frame() {
    requestAnimationFrame(frame);

    if (!durationKnown) {
      if (!(videoEl.duration > 0) || isNaN(videoEl.duration)) return;
      durationKnown = true;
    }

    var rect = wrap.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    if (p === lastP) return;
    lastP = p;

    var target = p * videoEl.duration;
    if (Math.abs(videoEl.currentTime - target) > 0.004) videoEl.currentTime = target;

    copyEl.style.setProperty("--copy-op", (1 - smoothstep(0, 0.08, p)).toFixed(3));
    for (var i = 0; i < STAGE_COUNT; i++) {
      var line = lineEls[i];
      if (!line) continue;
      var isLast = i === STAGE_COUNT - 1;
      var isActive = p >= stageRanges[i][0] && (isLast || p < stageRanges[i + 1][0]);
      line.classList.toggle("is-active", isActive);
    }

    if (p >= 0.985) unlockNav();
  }
  frame();
})();
