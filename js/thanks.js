/* ==========================================================================
   Χρόνης Πέγκας Photography — thank-you dialog
   --------------------------------------------------------------------------
   Opened by js/contact.js the moment an enquiry has actually gone out, via
   the one function this file publishes:

       window.XP_thanks.open()

   It is deliberately a one-function surface. A validation failure or a send
   error must NOT reach it — those stay in the form, next to the field that
   caused them, where the visitor can still fix and resend. A celebratory
   modal over a failed send would be the worst possible lie for this form to
   tell, so contact.js only calls it on its success path.

   Everything visible is already in the markup (#thanksDialog in index.html)
   in both languages; nothing here writes copy. What this file adds is the
   behaviour a dialog owes the visitor: it takes focus, keeps it, gives it
   back to wherever it came from, closes on Escape or on the backdrop, and
   locks the page behind it so the form does not scroll around underneath.

   The confetti is a plain 2D canvas — no library, which also means nothing
   to load past the CSP's script-src 'self'. It runs once, for about two and
   a half seconds, and then stops the animation frame loop dead rather than
   idling: this is a celebration, not a background effect. Under
   prefers-reduced-motion it never starts at all and the canvas stays empty.
   ========================================================================== */
(function () {
  "use strict";

  var dialog = document.getElementById("thanksDialog");
  if (!dialog) return;

  var panel = dialog.querySelector(".thanks__panel");
  var canvas = dialog.querySelector(".thanks__confetti");
  var homeBtn = dialog.querySelector("[data-thanks-home]");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

  var lastFocus = null;
  var scrollY = 0;

  /* Same technique js/main.js uses for the mobile drawer: position:fixed on
     the body rather than overflow:hidden, because iOS Safari ignores
     overflow:hidden on <body> and would happily scroll the page behind the
     dialog. The scroll position is restored by hand on close. */
  function lockScroll() {
    scrollY = window.scrollY;
    // See the lockScroll() comment in js/main.js: this flag is what keeps
    // the hero's scroll-jack from re-locking itself under the dialog once
    // the fixed body drops window.scrollY to 0.
    document.documentElement.classList.add("modal-open");
    document.body.style.position = "fixed";
    document.body.style.top = -scrollY + "px";
    document.body.style.width = "100%";
  }
  function unlockScroll(toTop) {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    // The scroll has to be restored before anything smooth is asked for,
    // or the browser animates from the top of the document rather than from
    // where the visitor actually was.
    window.scrollTo(0, scrollY);
    document.documentElement.classList.remove("modal-open");
    if (!toTop) return;
    window.scrollTo({ top: 0, behavior: reduceMQ.matches ? "auto" : "smooth" });
  }

  /* ------------------------------------------------------------- confetti */
  /* Straight off the site's own palette rather than the usual primaries —
     the two reds, the cream and the ink read as this site celebrating,
     where a rainbow would read as a plugin. */
  var COLOURS = ["#F62440", "#BA081F", "#FFFAF3", "#F1E6D2", "#241417"];
  var pieces = [];
  var rafId = 0;
  var startedAt = 0;
  var DURATION = 2600;

  function sizeCanvas() {
    if (!canvas) return 1;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    return dpr;
  }

  function makePieces(dpr) {
    var w = canvas.width, h = canvas.height;
    var out = [];
    // Two bursts from the lower corners, thrown up and inwards, the way a
    // party popper actually behaves — a single centre burst reads as a
    // firework and covers the panel's text on the way out.
    var origins = [
      { x: w * 0.06, y: h * 1.02, vx: 1 },
      { x: w * 0.94, y: h * 1.02, vx: -1 }
    ];
    for (var o = 0; o < origins.length; o++) {
      for (var i = 0; i < 90; i++) {
        var spread = (Math.random() * 0.55 + 0.15) * Math.PI;   // up and inward
        var speed = (12 + Math.random() * 16) * dpr;
        out.push({
          x: origins[o].x,
          y: origins[o].y,
          vx: Math.cos(spread) * speed * origins[o].vx + (Math.random() - 0.5) * 2 * dpr,
          vy: -Math.sin(spread) * speed - Math.random() * 6 * dpr,
          w: (5 + Math.random() * 6) * dpr,
          h: (8 + Math.random() * 9) * dpr,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.34,
          // Ribbons tumble; the flat ones fall faster. Varying drag is most
          // of what stops 140 identical rectangles looking like a grid.
          drag: 0.982 + Math.random() * 0.012,
          colour: COLOURS[(Math.random() * COLOURS.length) | 0]
        });
      }
    }
    return out;
  }

  function frame(now) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!startedAt) startedAt = now;
    var elapsed = now - startedAt;
    var gravity = 0.42 * Math.min(window.devicePixelRatio || 1, 2);
    // Fade the whole layer out over the last third rather than letting the
    // pieces simply leave the bottom of the screen at different times.
    var fade = elapsed < DURATION * 0.66 ? 1 : Math.max(0, 1 - (elapsed - DURATION * 0.66) / (DURATION * 0.34));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = fade;

    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      p.vy += gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.colour;
      // Squashing the height by the cosine of the spin fakes the piece
      // turning edge-on, which is what makes flat rectangles read as paper.
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot)));
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (elapsed < DURATION) {
      rafId = window.requestAnimationFrame(frame);
    } else {
      stopConfetti();
    }
  }

  function stopConfetti() {
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
    startedAt = 0;
    pieces = [];
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function startConfetti() {
    if (!canvas || !canvas.getContext || reduceMQ.matches) return;
    stopConfetti();
    var dpr = sizeCanvas();
    pieces = makePieces(dpr);
    rafId = window.requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------- open / close */
  function focusables() {
    return Array.prototype.filter.call(
      panel.querySelectorAll("button, a[href]"),
      function (n) { return !n.disabled && n.offsetParent !== null; }
    );
  }

  /* "sent" — the enquiry is genuinely gone (php / web3forms modes).
     "draft" — mailto mode: the visitor's own email app has been opened with
     the message in it, and they still have to press send there. */
  function setMode(mode) {
    var lines = dialog.querySelectorAll(".thanks__line[data-thanks-mode]");
    for (var i = 0; i < lines.length; i++) {
      lines[i].hidden = lines[i].getAttribute("data-thanks-mode") !== (mode === "draft" ? "draft" : "sent");
    }
  }

  function open(mode) {
    if (!dialog.hidden) return;
    setMode(mode);
    lastFocus = document.activeElement;
    lockScroll();
    dialog.hidden = false;
    // Read after the dialog is visible: an element inside a hidden ancestor
    // has no offsetParent, so focusables() would come back empty.
    if (homeBtn) homeBtn.focus();
    startConfetti();
  }

  function close(goHome) {
    if (dialog.hidden) return;
    stopConfetti();
    dialog.hidden = true;
    unlockScroll(goHome);
    if (goHome) {
      // Focus follows the scroll, or a keyboard visitor is left at the
      // bottom of a page that has visibly gone back to the top. The skip
      // link is the first focusable thing in the document.
      var skip = document.querySelector(".skip-link");
      if (skip) skip.focus({ preventScroll: true });
      else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  dialog.addEventListener("click", function (e) {
    if (e.target.closest("[data-thanks-home]")) { close(true); return; }
    if (e.target.closest("[data-thanks-close]")) { close(false); }
  });

  document.addEventListener("keydown", function (e) {
    if (dialog.hidden) return;
    if (e.key === "Escape") { e.stopPropagation(); close(false); return; }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    // Focus that has escaped the panel entirely (browser chrome, a stray
    // programmatic focus) is pulled back rather than left outside a dialog
    // that claims aria-modal.
    else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  // The canvas is sized in device pixels for the viewport it opened in.
  window.addEventListener("resize", function () {
    if (dialog.hidden || !pieces.length) return;
    sizeCanvas();
  });

  window.XP_thanks = { open: open, close: close };
})();
