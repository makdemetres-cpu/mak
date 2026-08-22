/* ==========================================================================
   HydroCore — Our Story photo coverflow
   3D coverflow of 6 chronological photos in .story__art.
   - Desktop: hover scrubs continuously by cursor X (untouched, as designed).
   - Touch: drag/swipe scrubs the same way, then snaps to the nearest photo
     on release — plus visible dots and prev/next arrows (mobile-only UI)
     so the gesture is discoverable instead of a bare hover pattern ported
     onto touch.
   - Keyboard: left/right arrows step through photos when focused.
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
      updateDots();
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

    /* ---- mobile-only affordances: dots + prev/next arrows ---- */
    const controls = document.createElement("div");
    controls.className = "coverflow__controls";
    controls.innerHTML = `
      <button type="button" class="coverflow__arrow coverflow__arrow--prev" aria-label="Προηγούμενη φωτογραφία">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="coverflow__dots" role="tablist" aria-label="Φωτογραφίες ιστορίας"></div>
      <button type="button" class="coverflow__arrow coverflow__arrow--next" aria-label="Επόμενη φωτογραφία">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </button>
    `;
    const artBox = root.closest(".story__art");
    (artBox ? artBox.parentElement : root.parentElement).appendChild(controls);
    const dotsEl = controls.querySelector(".coverflow__dots");
    const dots = slides.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "coverflow__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `${i + 1}`);
      dot.addEventListener("click", () => { setPosition(i); hideHint(); });
      dotsEl.appendChild(dot);
      return dot;
    });
    function updateDots() {
      const nearest = Math.round(position);
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === nearest);
        d.setAttribute("aria-selected", i === nearest ? "true" : "false");
      });
    }
    controls.querySelector(".coverflow__arrow--prev").addEventListener("click", () => {
      setPosition(Math.round(position) - 1);
      hideHint();
    });
    controls.querySelector(".coverflow__arrow--next").addEventListener("click", () => {
      setPosition(Math.round(position) + 1);
      hideHint();
    });

    let isTouch = false;
    root.addEventListener("pointerdown", (e) => {
      isTouch = e.pointerType !== "mouse";
      if (isTouch) {
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
      root.addEventListener(evt, () => {
        root.classList.remove("is-grabbing");
        if (isTouch) setPosition(Math.round(position)); // snap to nearest photo on release
      });
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
