/* ==========================================================================
   Χρόνης Πέγκας Photography — hero camera disassembly
   --------------------------------------------------------------------------
   Drives the pinned-scroll camera in the hero. Nothing here uses
   preventDefault on wheel or touch input — the "cannot reach the next
   section without scrolling through it" requirement is satisfied structurally
   by index.html's #top being many viewport-heights tall (see the HERO CAMERA
   block in css/style.css), not by intercepting scroll events. That is a
   deliberate choice: trapping the scroll wheel is a well-known source of
   exactly the kind of bug this project has spent a lot of effort fixing —
   it fights trackpad momentum and is close to unfixable reliably on mobile
   Safari. A tall pinned section uses the browser's native scrolling the
   whole way, on every device, and is naturally reversible: since the
   animation is a pure function of scroll position rather than a triggered
   sequence, scrolling back up undoes it with no extra code.

   Nav lock: per the client's explicit choice, every path — including a
   direct click on a header or menu link — is blocked until the visitor has
   scrolled through the sequence once in this page load. That is enforced
   three ways at once: the links carry aria-disabled + tabindex="-1" (so
   assistive tech and Tab both skip them), CSS removes their pointer events
   (see body[data-nav-locked] in style.css), and a capturing click listener
   is a backstop in case something still manages to activate one anyway.

   Reduced motion is the one bypass kept regardless, because it is an
   accessibility floor rather than a convenience: those visitors get the
   camera already assembled, every line of text visible at once, and nav
   never locked at all. See the prefers-reduced-motion rules in
   css/style.css — this file simply does not attach a scroll listener for
   them, so the CSS fallback state is all they ever see.
   ========================================================================== */
(function () {
  "use strict";

  var wrap = document.querySelector("[data-cam-wrap]");
  if (!wrap) return;

  var rig = wrap.querySelector(".cam-rig");
  var copy = wrap.querySelector(".hero-copy");
  var navLinks = document.querySelectorAll(".nav-desktop a, .nav-mobile a");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isMobile = window.matchMedia("(max-width: 899px)");

  var STAGES_DESKTOP = ["lens", "viewfinder", "back", "dial"];
  var STAGES_MOBILE = ["lens", "viewfinder"];

  var hasPlayed = false;

  function unlockNav() {
    if (hasPlayed) return;
    hasPlayed = true;
    document.body.removeAttribute("data-nav-locked");
    navLinks.forEach(function (a) {
      a.removeAttribute("aria-disabled");
      a.removeAttribute("tabindex");
    });
  }

  function lockNav() {
    document.body.setAttribute("data-nav-locked", "true");
    navLinks.forEach(function (a) {
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("tabindex", "-1");
    });
  }

  /* ---------------------------------------------------------- reduced motion */
  if (reduce.matches) {
    unlockNav();
    return; // No listener at all; the CSS fallback state is the only state.
  }

  lockNav();

  // Backstop against a click reaching a "disabled" link some other way —
  // aria-disabled is advisory, not enforced by the browser the way the
  // native disabled attribute is.
  document.addEventListener(
    "click",
    function (e) {
      if (document.body.getAttribute("data-nav-locked") !== "true") return;
      var a = e.target.closest(".nav-desktop a, .nav-mobile a");
      if (a) e.preventDefault();
    },
    true
  );

  function smoothstep(edge0, edge1, x) {
    var t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /* Evenly spaced ranges across the post-copy-fade portion of the scroll,
     one per stage. Returns [[start,end], ...] each 0..1. */
  function ranges(count) {
    var out = [];
    var copyEnd = 0.08;
    var span = (1 - copyEnd) / count;
    for (var i = 0; i < count; i++) {
      out.push([copyEnd + i * span, copyEnd + (i + 1) * span]);
    }
    return out;
  }

  var queued = false;

  function frame() {
    queued = false;

    var rect = wrap.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    // total <= 0 means the wrapper is not actually tall (e.g. no-JS-styled
    // fallback height got applied for some reason) — treat as fully played
    // rather than divide by zero or lock nav on a section with no scroll
    // room to escape from.
    var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;

    var stageNames = isMobile.matches ? STAGES_MOBILE : STAGES_DESKTOP;
    var rr = ranges(stageNames.length);

    // Capped well short of 90°. This is flat 2D line art rotated on its Y
    // axis, not a solid 3D model — as the rotation approaches 90° it
    // presents almost zero width to the camera and the whole drawing
    // collapses to a near-invisible sliver. A full sweep (the first version
    // of this used 140°) passes straight through that dead zone. 26° reads
    // as a confident turntable tilt without ever going edge-on.
    rig.style.setProperty("--rig-rot", (p * 26).toFixed(2) + "deg");
    copy.style.setProperty("--copy-op", (1 - smoothstep(0, 0.08, p)).toFixed(3));

    stageNames.forEach(function (name, i) {
      var part = wrap.querySelector(".cam-" + name);
      var line = wrap.querySelector('.cam-line[data-stage="' + (i + 1) + '"]');
      if (!part) return;

      var t = smoothstep(rr[i][0], rr[i][1], p);
      part.style.setProperty("--t", t.toFixed(3));

      if (!line) return;
      // The final stage's text stays active all the way to p = 1, not just
      // to the end of its own range, so the visitor is never looking at a
      // fully-exploded camera with no text on screen.
      var isLast = i === stageNames.length - 1;
      var active = p >= rr[i][0] && (isLast || p < rr[i + 1][0]);
      line.classList.toggle("is-active", active);
    });

    if (p >= 0.985) unlockNav();
  }

  function onScrollOrResize() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  isMobile.addEventListener("change", onScrollOrResize);

  frame(); // paint the correct state immediately, e.g. after a page reload
           // part-way down the sequence.
})();
