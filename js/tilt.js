/* ==========================================================================
   Χρόνης Πέγκας Photography — card lift, cursor-tracked tilt, touch press
   --------------------------------------------------------------------------
   On a mouse: the card lifts slightly and tips in 3D so that the corner
   nearest the cursor presses AWAY into the screen, as though being pushed.

   On a touchscreen there is no cursor to track, so cards instead dip under
   the finger and spring back — a response designed for touch rather than a
   hover effect with its input removed.

   Three things this has to get right, all of them load-bearing:

   1. The scroll reveal in main.js animates the SAME transform property on
      these same elements. Tilting a card that is still sliding in would
      fight it and snap. So the tilt CSS is gated behind .is-settled, which
      main.js adds only once a card's entrance has finished, and this file
      never touches a card before then.

   2. Reading getBoundingClientRect() on every pointermove forces a layout
      recalculation per event, and pointer events fire far faster than the
      screen refreshes. Everything here is throttled to one animation frame,
      so the browser measures at most once per painted frame.

   3. prefers-reduced-motion disables the tilt completely. Cursor-tracked 3D
      motion is a genuine nausea trigger, not a taste preference.
   ========================================================================== */
(function () {
  "use strict";

  var SELECTOR = ".assure-item, .package, .quote, .cat-card";

  var MAX_TILT = 6;      // degrees at the very corner — "subtle"
  // The lift and the scale live in css/style.css under "CARD HOVER", so they
  // still happen when this file cannot run at all.

  var cards = document.querySelectorAll(SELECTOR);
  if (!cards.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine   = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");

  /* ------------------------------------------------------------- helpers */
  function setVars(el, rx, ry) {
    el.style.setProperty("--rx", rx.toFixed(2) + "deg");
    el.style.setProperty("--ry", ry.toFixed(2) + "deg");
  }

  function rest(el) {
    el.classList.remove("is-tilting");
    // Remove, do not zero. An inline "--lift: 0px" beats the CSS :hover rule
    // on specificity, so zeroing here would permanently disable the CSS
    // fallback on every card the pointer had ever touched.
    ["--rx", "--ry", "--lift", "--tscale"].forEach(function (v) {
      el.style.removeProperty(v);
    });
  }

  /* --------------------------------------------------------- mouse tilt */
  var frame = 0;
  var queued = null;   // { el, x, y }

  function apply() {
    frame = 0;
    if (!queued) return;
    var el = queued.el, x = queued.x, y = queued.y;
    queued = null;

    // Measured inside the frame, so at most one layout read per paint even
    // if the pointer fired twenty times in between.
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;

    // -1 → 1 across the card, 0 at the centre.
    var px = ((x - r.left) / r.width) * 2 - 1;
    var py = ((y - r.top) / r.height) * 2 - 1;
    px = Math.max(-1, Math.min(1, px));
    py = Math.max(-1, Math.min(1, py));

    /* The corner under the cursor must go AWAY from the viewer.
       A positive rotateY pushes the card's RIGHT edge back, so a cursor on
       the right (px > 0) wants a positive rotateY.
       A positive rotateX pushes the card's TOP edge back, and py grows
       downward, so a cursor at the bottom wants a NEGATIVE rotateX. */
    // Only the rotation. The lift and the scale belong to the CSS :hover
    // rule, which works with no JavaScript at all; writing them here too
    // would mean two owners for the same value.
    setVars(el, -py * MAX_TILT, px * MAX_TILT);
  }

  function onMove(e) {
    queued = { el: e.currentTarget, x: e.clientX, y: e.clientY };
    if (!frame) frame = requestAnimationFrame(apply);
  }

  function onEnter(e) {
    var el = e.currentTarget;
    // Never take over a card that is still playing its entrance.
    if (!el.classList.contains("is-settled")) return;
    el.classList.add("is-tilting");
    // Apply straight away from the enter event's own coordinates. Waiting for
    // the first pointermove looks broken whenever the cursor arrives without
    // then moving — most obviously when the page is scrolled with the mouse
    // held still, so cards slide underneath a stationary pointer and simply
    // sit there doing nothing.
    onMove(e);
  }

  function onLeave(e) {
    var el = e.currentTarget;
    if (queued && queued.el === el) queued = null;
    rest(el);
  }

  /* --------------------------------------------------------- touch press */
  function onDown(e) { e.currentTarget.classList.add("is-pressed"); }
  function onUp(e)   { e.currentTarget.classList.remove("is-pressed"); }

  /* ------------------------------------------------------------- binding */
  var bound = null;   // "fine" | "coarse" | null

  function unbind() {
    cards.forEach(function (el) {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.classList.remove("is-pressed");
      rest(el);
    });
    bound = null;
  }

  function bind() {
    // Reduced motion: no lift, no tilt, no press. The CSS still gives these
    // cards a border and shadow change so they never feel inert.
    if (reduce.matches) { if (bound) unbind(); return; }

    var want = fine.matches ? "fine" : "coarse";
    if (bound === want) return;
    if (bound) unbind();

    cards.forEach(function (el) {
      if (want === "fine") {
        el.addEventListener("pointerenter", onEnter);
        el.addEventListener("pointermove", onMove, { passive: true });
        el.addEventListener("pointerleave", onLeave);
      } else {
        // Pointer events cover touch and pen; pointercancel matters because
        // a scroll started on a card steals the gesture and no pointerup
        // ever arrives, which would otherwise leave it stuck pressed.
        el.addEventListener("pointerdown", onDown, { passive: true });
        el.addEventListener("pointerup", onUp, { passive: true });
        el.addEventListener("pointercancel", onUp, { passive: true });
      }
    });
    bound = want;
  }

  bind();

  // A laptop with a touchscreen can switch between the two, and plugging in
  // a mouse changes the answer, so re-evaluate rather than deciding once.
  ["change"].forEach(function (evt) {
    fine.addEventListener(evt, bind);
    reduce.addEventListener(evt, bind);
  });
})();
