/* ==========================================================================
   HydroCore — Our Story photo coverflow
   3D coverflow of 6 chronological photos in .story__art. Desktop: hover
   scrubs continuously by cursor X. Touch: drag/swipe scrubs the same way.
   Keyboard: left/right arrows step through photos when focused.
   ========================================================================== */
(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("storyCoverflow");
    const stage = document.getElementById("coverflowStage");
    const hint = document.getElementById("coverflowHint");
    if (!root || !stage) return;

    const slides = Array.from(stage.querySelectorAll(".coverflow__slide"));
    const count = slides.length;
    if (!count) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let position = 0; // continuous, 0..count-1 (0 = oldest/leftmost)
    let rect = root.getBoundingClientRect();
    const measure = () => { rect = root.getBoundingClientRect(); };

    function render() {
      const w = rect.width || root.offsetWidth || 1;
      const spacing = w * 0.30;
      const depth = w * 0.11;
      const maxAngle = 42;
      slides.forEach((slide, i) => {
        const offset = i - position;
        const abs = Math.abs(offset);
        const tx = offset * spacing;
        const tz = -Math.min(abs, 5) * depth;
        const angle = reduceMotion ? 0 : Math.max(-maxAngle, Math.min(maxAngle, -offset * maxAngle));
        const scale = Math.max(0.52, 1 - abs * 0.16);
        const opacity = Math.max(0.12, 1 - abs * 0.30);
        const blur = Math.min(4, abs * 1.1);
        slide.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${angle}deg) scale(${scale})`;
        slide.style.opacity = String(opacity);
        slide.style.filter = blur > 0.05 ? `blur(${blur}px)` : "none";
        slide.style.zIndex = String(Math.round(100 - abs * 10));
        slide.setAttribute("aria-hidden", abs < 0.5 ? "false" : "true");
      });
    }

    function setPosition(p) {
      position = Math.max(0, Math.min(count - 1, p));
      render();
    }

    let hintTimer = null;
    function hideHint() {
      if (!hint) return;
      hint.classList.add("is-hidden");
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    }
    hintTimer = setTimeout(hideHint, 3000);

    function xToPosition(clientX) {
      const w = rect.width || 1;
      const fraction = (clientX - rect.left) / w;
      return Math.max(0, Math.min(1, fraction)) * (count - 1);
    }

    root.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") {
        try { root.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
      root.classList.add("is-grabbing");
      measure();
      setPosition(xToPosition(e.clientX));
      hideHint();
    });
    root.addEventListener("pointermove", (e) => {
      measure();
      setPosition(xToPosition(e.clientX));
      hideHint();
    });
    ["pointerup", "pointercancel"].forEach((evt) => {
      root.addEventListener(evt, () => root.classList.remove("is-grabbing"));
    });

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition(Math.round(position) - 1);
        hideHint();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition(Math.round(position) + 1);
        hideHint();
      }
    });

    window.addEventListener("resize", () => { measure(); render(); });

    measure();
    setPosition(0);
  });
})();
