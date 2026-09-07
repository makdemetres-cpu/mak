/* ==========================================================================
   Χρόνης Πέγκας Photography — hero: a scroll-locked, scroll-scrubbed video

   A real camera disassembly video (client-supplied), driven directly by
   progress instead of ever being played: progress 0 sets the video's
   currentTime to 0 (its first frame — assembled), progress 1 sets it to the
   last frame (fully exploded), and everything in between maps linearly.
   The video element's own .play() is never called anywhere in this file —
   only .currentTime is ever touched.

   Unlike the previous build of this file, progress is NOT read from native
   scroll position. It is a genuine scroll-jack: while "locked", every
   wheel/touch/keyboard scroll input is captured (preventDefault) and its
   delta is converted directly into progress instead of moving the page —
   backed by html.scroll-locked in style.css, which disables scrolling
   outright. That combination is what makes it physically impossible to
   reach the next section before the sequence has played through, not just
   unlikely with a fast flick. Scrolling back up out of the next section
   re-engages the lock the instant the page returns to scrollY 0, and the
   same input handlers then walk progress back down to 0.

   Same progressive-enhancement contract as the rest of this site:
   - No JS at all → the <video> in the markup has no autoplay and no
     controls, so it just sits on its poster attribute (the exact first
     frame, assembled) forever. No separate fallback markup needed, and
     nothing is ever locked.
   - prefers-reduced-motion → unlock nav immediately, leave the video on
     its poster, never touch currentTime, never lock scroll.
   - The video fails to load/decode for any reason → same flat treatment,
     applied via the .cam-flat class instead of the media feature (see the
     .cam-flat rules in style.css) — and any lock already in effect is
     released immediately.
   ========================================================================== */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-cam-wrap]");
  if (!wrap) return;

  var stage = wrap.querySelector(".hero-stage");
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
  if (!videoEl || !stage) { unlockNav(); return; }

  lockNav();

  /* ---- scroll lock --------------------------------------------------------
     setLocked(true) is the only thing that ever hides page scroll or pins
     the stage; setLocked(false) is the only thing that ever gives either
     back. Every input handler below just feeds progress — none of them
     touch locking directly except at the two edges. */
  var locked = false;
  function setLocked(v) {
    if (locked === v) return;
    locked = v;
    stage.classList.toggle("is-locked", v);
    html.classList.toggle("scroll-locked", v);
  }

  var fellBack = false;
  function fallbackFlat() {
    if (fellBack) return;
    fellBack = true;
    html.classList.add("cam-flat");
    unlockNav();
    setLocked(false);
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
  // this timeout, that failure mode would leave both nav and scroll
  // permanently locked, since seekFrame() below never gets past its
  // "duration known yet?" guard.
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

  /* ---- progress → video frame / copy / stage text ------------------------
     progress itself is still written synchronously by every input event, so
     it always holds the very latest input. What changed is WHEN that value
     is pushed at the two consumers, because they cost wildly different
     things:

       - The overlay (copy opacity, which stage line is showing) is pure
         CSS and is repainted once per animation frame from whatever
         progress currently is.

       - The video frame is a decoder seek, and this file's earlier build
         issued one per input event. A single trackpad flick fires 20+
         wheel events inside one 16ms frame, so it queued 20 seeks the
         decoder then had to grind through one after another — which is
         exactly the "laggy" feel: the frame trailed the finger and kept
         moving after the finger stopped. Worse, this particular file is
         encoded with a single keyframe across all 8 seconds (verified by
         reading its stss box), so every backward seek re-decodes from
         frame 0 and is genuinely expensive.

     seekFrame() therefore does nothing at all while videoEl.seeking is
     true, and is called once per animation frame from poll(). The newest
     target always wins, so the frame still lands exactly where input
     stopped — the 1:1 hold the brief asks for is preserved — it just gets
     there by doing one seek instead of twenty. Gating on the element's own
     .seeking flag rather than a variable of our own means there is no
     private state that can wedge shut if a seek never completes. */
  var progress = 0;
  var durationKnown = false;
  var overlayDirty = true;

  function renderOverlay() {
    copyEl.style.setProperty("--copy-op", (1 - smoothstep(0, 0.08, progress)).toFixed(3));
    for (var i = 0; i < STAGE_COUNT; i++) {
      var line = lineEls[i];
      if (!line) continue;
      var isLast = i === STAGE_COUNT - 1;
      var isActive = progress >= stageRanges[i][0] && (isLast || progress < stageRanges[i + 1][0]);
      line.classList.toggle("is-active", isActive);
    }

    // One-way: once seen, nav stays unlocked even if the visitor scrolls
    // back up and re-locks the stage to replay the sequence.
    if (progress >= 0.985) unlockNav();
  }

  function seekFrame() {
    if (!durationKnown || videoEl.seeking) return;
    var target = progress * videoEl.duration;
    // ~half a frame at this video's 24fps. Anything closer than this would
    // land on the frame already on screen, so the seek would be pure cost
    // for no visible change.
    if (Math.abs(videoEl.currentTime - target) < 0.02) return;
    videoEl.currentTime = target;
  }

  /* ---- input capture -------------------------------------------------------
     Three input sources feed the same applyDelta(): wheel (desktop mouse/
     trackpad), touch (mobile drag), and keyboard (arrows/space/page keys,
     for anyone not using a pointing device to scroll). All three only ever
     act while locked — the moment setLocked(false) runs, every handler
     below becomes a no-op and native scrolling takes over untouched. */
  function lockDistance() { return Math.max(window.innerHeight * 3, 1400); }

  function applyDelta(deltaPx) {
    var next = progress + deltaPx / lockDistance();
    progress = Math.min(1, Math.max(0, next));
    // Both consumers are driven from poll() on the next animation frame —
    // see the comment above renderOverlay() for why nothing is pushed
    // straight at the video here.
    overlayDirty = true;
    if (locked && progress >= 1 && deltaPx > 0) setLocked(false);
  }

  function normalizeWheelDelta(e) {
    var d = e.deltaY;
    // deltaMode: 0 = pixels (most browsers/trackpads), 1 = lines (Firefox
    // default with a physical wheel), 2 = pages. Without this a Firefox
    // wheel notch and a Chrome trackpad flick would drive progress at
    // wildly different rates for the same physical scroll gesture.
    if (e.deltaMode === 1) d *= 18;
    else if (e.deltaMode === 2) d *= window.innerHeight;
    return d;
  }
  window.addEventListener("wheel", function (e) {
    if (!locked || modalOwnsPage()) return;
    e.preventDefault();
    applyDelta(normalizeWheelDelta(e));
  }, { passive: false });

  var touchY = null;
  window.addEventListener("touchstart", function (e) {
    if (!locked || !e.touches.length) return;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (!locked || modalOwnsPage() || touchY === null || !e.touches.length) return;
    e.preventDefault();
    var y = e.touches[0].clientY;
    // A drag needs to feel like it moves the sequence faster than a
    // one-to-one wheel pixel would: real touch drags cover far fewer
    // pixels than a scroll gesture does on desktop.
    applyDelta((touchY - y) * 2.4);
    touchY = y;
  }, { passive: false });
  window.addEventListener("touchend", function () { touchY = null; });
  window.addEventListener("touchcancel", function () { touchY = null; });

  /* html.scroll-locked disables scrolling outright (see style.css), which
     also defeats the browser's native "scroll the newly focused element
     into view" behaviour — so Tabbing forward from the header would move
     focus onto content buried under the locked fullscreen stage: visually
     invisible, but still focused. Trapping Tab within the header and
     cookie banner (the only two things actually on screen while locked)
     keeps keyboard navigation honest instead of leaking focus onto content
     the visitor can't see. Skipped while the cookie *preferences* modal is
     open — that already runs its own trap (see consent.js) and is a
     different overlay layered on top of this one. */
  function lockFocusables() {
    var nodes = document.querySelectorAll(
      ".site-header a, .site-header button, #cookieBanner a, #cookieBanner button"
    );
    return Array.prototype.filter.call(nodes, function (el) {
      return el.tabIndex !== -1 && !el.disabled && el.offsetParent !== null;
    });
  }
  function cookieModalOpen() {
    var modal = document.querySelector(".cookie-modal");
    return !!modal && !modal.hidden;
  }
  /* Any overlay that has scroll-locked the page (the mobile nav drawer, the
     thank-you dialog) sets html.modal-open — see lockScroll() in js/main.js.
     Those locks work by pinning the body with position:fixed, which drops
     window.scrollY to 0; without this check the poll below would read that
     as "back at the very top" and re-lock this stage underneath whatever
     just opened, pinning a fullscreen video over it and stealing Tab. */
  function modalOwnsPage() {
    return html.classList.contains("modal-open");
  }
  window.addEventListener("keydown", function (e) {
    if (!locked || modalOwnsPage()) return;
    if (e.key === "Tab") {
      if (cookieModalOpen()) return;
      var items = lockFocusables();
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      var at = items.indexOf(document.activeElement);
      if (e.shiftKey ? (at <= 0) : (at === -1 || at === items.length - 1)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    var key = e.key;
    if (key === "ArrowDown" || key === "PageDown" || key === " " || key === "Spacebar") {
      e.preventDefault();
      applyDelta(0.09 * lockDistance());
    } else if (key === "ArrowUp" || key === "PageUp") {
      e.preventDefault();
      applyDelta(-0.09 * lockDistance());
    } else if (key === "End") {
      e.preventDefault();
      applyDelta(lockDistance());
    } else if (key === "Home") {
      e.preventDefault();
      applyDelta(-lockDistance());
    }
  });

  /* ---- re-lock on returning to the very top --------------------------------
     Polled via requestAnimationFrame rather than a "scroll" event listener
     — an event-driven version of an earlier build of this file silently
     never fired inside this project's own Claude Artifact preview tool,
     which renders the page in a sandboxed iframe whose scrolling doesn't
     dispatch "scroll" events the normal way even though the content
     visibly does scroll. Polling window.scrollY sidesteps the question of
     whether any given host fires scroll events correctly.

     Re-locking only triggers on the transition from scrollY > 0 down to
     scrollY <= 0 while unlocked — not merely "scrollY is currently 0" —
     because scrollY is also exactly 0 for one tick immediately *after*
     setLocked(false) fires (native scroll hasn't moved yet at that
     instant). Triggering on the bare value would re-lock the stage the
     instant it released, trapping the visitor at progress 1 forever. */
  var prevScrollY = window.scrollY;
  function poll() {
    requestAnimationFrame(poll);

    if (!durationKnown && videoEl.duration > 0 && !isNaN(videoEl.duration)) {
      durationKnown = true;
      overlayDirty = true;
    }

    if (overlayDirty) { overlayDirty = false; renderOverlay(); }
    seekFrame();

    if (modalOwnsPage()) return;
    var y = window.scrollY;
    if (!fellBack && !locked && prevScrollY > 0 && y <= 0) setLocked(true);
    prevScrollY = y;
  }

  setLocked(true);
  renderOverlay();
  poll();
})();
