/* ==========================================================================
   Χρόνης Πέγκας Photography — site behaviour
   --------------------------------------------------------------------------
   Navigation, language switching, scroll reveals, portfolio filtering,
   lightbox, back-to-top.

   Performance note: there is not a single scroll event listener in this
   file. Every scroll-driven state — header border, active nav link, reveal
   animations, back-to-top visibility — is driven by IntersectionObserver,
   which the browser evaluates off the main thread. Only opacity and
   transform are animated, so nothing here can cause layout thrash or the
   scroll jank that these effects are usually blamed for.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var S = window.XP_STRINGS || { el: {}, en: {} };

  function t(key) {
    var lang = root.getAttribute("lang") === "en" ? "en" : "el";
    return (S[lang] && S[lang][key]) || (S.el && S.el[key]) || "";
  }
  function fmt(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vals, k) ? vals[k] : m;
    });
  }
  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     LANGUAGE
     Both languages are present in the DOM; CSS hides the inactive one. The
     switch therefore costs one attribute write and no re-render of content.
     ====================================================================== */
  function applyLang(lang, silent) {
    root.setAttribute("lang", lang);
    store("xp_lang", lang);

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.langBtn === lang));
    });

    // Swap any element whose label differs per language but which has no
    // visible text of its own (icon buttons).
    document.querySelectorAll("[data-label-key]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.dataset.labelKey));
    });

    // <option> elements can't hold the per-language span pair the rest of the
    // page uses, so their labels are swapped here instead.
    document.querySelectorAll("option[data-el][data-en]").forEach(function (o) {
      o.textContent = lang === "en" ? o.dataset.en : o.dataset.el;
    });

    // Alternate-language links on legal pages point at the same document.
    document.querySelectorAll("[data-alt-lang]").forEach(function (el) {
      el.setAttribute("hreflang", lang === "el" ? "en" : "el");
    });

    if (!silent) announce(t("langSwitched"));
  }

  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.dataset.langBtn);
    });
  });

  /* Screen-reader announcements for state changes that have no visible text. */
  var liveRegion = document.getElementById("liveRegion");
  function announce(msg) {
    if (!liveRegion || !msg) return;
    liveRegion.textContent = "";
    window.setTimeout(function () { liveRegion.textContent = msg; }, 60);
  }
  window.XP_announce = announce;

  /* ======================================================================
     HEADER + MOBILE NAV
     ====================================================================== */
  var header = document.querySelector(".site-header");
  var sentinel = document.getElementById("topSentinel");

  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }, { rootMargin: "0px" }).observe(sentinel);
  }

  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("navMobile");
  var scrollLockY = 0;

  function lockScroll() {
    scrollLockY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = -scrollLockY + "px";
    document.body.style.width = "100%";
  }
  function unlockScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollLockY);
  }

  function setMenu(open) {
    if (!burger || !mobileNav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "menuClose" : "menuOpen"));
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    if (open) { lockScroll(); } else { unlockScroll(); }
  }

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    // Closing on resize past the breakpoint prevents a hidden fixed panel
    // keeping the scroll lock applied on a now-desktop layout.
    window.matchMedia("(min-width: 940px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (mobileNav && mobileNav.classList.contains("is-open")) setMenu(false);
  });

  /* ======================================================================
     SCROLL REVEAL
     Sections enter from alternating sides. Each element is unobserved the
     moment it has played, so the observer set shrinks to nothing as the
     visitor scrolls and costs nothing on a long page.
     ====================================================================== */
  var revealables = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    // No observer support, or the visitor asked for reduced motion: show
    // everything immediately rather than animating.
    revealables.forEach(function (el) { el.classList.add("is-in", "is-settled"); });
  } else {
    // Stagger items that share a parent group, so a grid of photographs
    // arrives as a sequence rather than all at once.
    document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
      var kids = group.querySelectorAll(":scope > .reveal");
      var step = parseInt(group.dataset.revealGroup, 10);
      if (isNaN(step)) step = 70;
      kids.forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", (i * step) + "ms");
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        io.unobserve(el);
        el.addEventListener("transitionend", function onEnd(ev) {
          if (ev.propertyName !== "opacity") return;
          el.classList.add("is-settled");
          el.removeEventListener("transitionend", onEnd);
        });
      });
    }, {
      // Fires a little before the element's top edge reaches the viewport
      // bottom, so the motion reads as part of the scroll rather than
      // something that starts after the reader has already arrived.
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.06
    });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ======================================================================
     ACTIVE NAV LINK
     ====================================================================== */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-desktop a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var visible = new Map();
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible.set(e.target.id, e.intersectionRatio); });

      var bestId = null, bestRatio = 0;
      visible.forEach(function (ratio, id) {
        if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
      });

      navLinks.forEach(function (a) {
        a.classList.toggle("is-active", bestId !== null && a.getAttribute("href") === "#" + bestId);
      });
    }, { threshold: [0, 0.25, 0.5, 0.75], rootMargin: "-20% 0px -35% 0px" });

    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ======================================================================
     PORTFOLIO FILTER
     ====================================================================== */
  var gallery = document.getElementById("gallery");
  var filterBtns = document.querySelectorAll("[data-filter]");

  function applyFilter(cat) {
    if (!gallery) return;
    gallery.querySelectorAll(".shot").forEach(function (shot) {
      var match = cat === "all" || shot.dataset.cat === cat;
      shot.hidden = !match;
    });
    filterBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.filter === cat));
    });
    refreshLightboxSet();
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () { applyFilter(btn.dataset.filter); });
  });

  /* ======================================================================
     LIGHTBOX
     ====================================================================== */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCounter = document.getElementById("lbCounter");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbClose = document.getElementById("lbClose");
  var lbSet = [];
  var lbIndex = 0;
  var lbOpener = null;

  function refreshLightboxSet() {
    if (!gallery) return;
    lbSet = Array.prototype.slice.call(gallery.querySelectorAll(".shot")).filter(function (s) {
      return !s.hidden;
    });
  }

  function showAt(i) {
    if (!lbSet.length || !lbImg) return;
    lbIndex = (i + lbSet.length) % lbSet.length;
    var shot = lbSet[lbIndex];
    var img = shot.querySelector("img");
    if (!img) return;
    // Full-size source if one is declared, otherwise the grid image itself.
    lbImg.src = img.dataset.full || img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
    if (lbCounter) {
      lbCounter.textContent = fmt(t("lightboxOf"), { n: lbIndex + 1, total: lbSet.length });
    }
    var single = lbSet.length < 2;
    if (lbPrev) lbPrev.hidden = single;
    if (lbNext) lbNext.hidden = single;
  }

  function openLightbox(shot) {
    if (!lightbox) return;
    refreshLightboxSet();
    var i = lbSet.indexOf(shot);
    if (i < 0) return;
    lbOpener = shot;
    showAt(i);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lockScroll();
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    unlockScroll();
    // Release the decoded full-size image rather than holding it in memory.
    if (lbImg) lbImg.removeAttribute("src");
    if (lbOpener) { lbOpener.focus(); lbOpener = null; }
  }

  if (gallery) {
    refreshLightboxSet();
    gallery.addEventListener("click", function (e) {
      var shot = e.target.closest(".shot");
      if (shot) openLightbox(shot);
    });
  }

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", function () { showAt(lbIndex - 1); });
  if (lbNext) lbNext.addEventListener("click", function () { showAt(lbIndex + 1); });

  if (lightbox) {
    // Clicking the backdrop (but not the photograph or a control) closes.
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") { closeLightbox(); }
      else if (e.key === "ArrowLeft") { showAt(lbIndex - 1); }
      else if (e.key === "ArrowRight") { showAt(lbIndex + 1); }
      else if (e.key === "Tab") {
        // Keep focus inside the viewer while it is open.
        var focusables = lightbox.querySelectorAll("button:not([hidden])");
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Swipe between photographs on touch devices.
    var tx = 0, ty = 0;
    lightbox.addEventListener("touchstart", function (e) {
      tx = e.changedTouches[0].clientX;
      ty = e.changedTouches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
        showAt(dx < 0 ? lbIndex + 1 : lbIndex - 1);
      }
    }, { passive: true });
  }

  /* ======================================================================
     BACK TO TOP
     ====================================================================== */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    if (sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        toTop.classList.toggle("is-visible", !entries[0].isIntersecting);
      }, { rootMargin: "400px 0px 0px 0px" }).observe(sentinel);
    } else {
      toTop.classList.add("is-visible");
    }

    toTop.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
      // Return focus to the top of the document, not just the scroll position,
      // so keyboard and screen-reader users actually go back to the start.
      var skip = document.querySelector(".skip-link");
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ======================================================================
     MISC
     ====================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Apply stored language labels on first load. Silent: boot.js already set
  // the correct language before paint, so nothing actually changed here and
  // announcing "language switched" would be a lie to a screen reader.
  applyLang(root.getAttribute("lang") === "en" ? "en" : "el", true);
})();
