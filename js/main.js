(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initNav();
    renderServices();
    initReveal();
    initCounters();
    initTestimonials();
    initLocations();
    initFooterYear();
  });

  /* ---------------- Services grid ---------------- */
  const SERVICE_ICONS = {
    bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    pipe: '<path d="M4 6h9a4 4 0 0 1 4 4v8"/><path d="M20 6h-4"/><circle cx="4" cy="6" r="2"/><circle cx="17" cy="18" r="2"/>',
    drain: '<circle cx="12" cy="12" r="9"/><path d="M8 10c1 2 2 3 4 3s3-1 4-3M8 14c1-1 2-1.5 4-1.5s3 .5 4 1.5"/>',
    flame: '<path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-3 2 1 3 4 3 6a6 6 0 0 1-12 0c0-3 1.5-6 4-10Z"/>',
    bath: '<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2Z"/><path d="M7 12V6a2 2 0 0 1 3-1.7M5 21h14"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
  };

  function renderServices() {
    const grid = document.getElementById("servicesGrid");
    if (!grid || !window.HC_DATA) return;
    function paint() {
      const lang = document.documentElement.getAttribute("data-lang") || "el";
      grid.innerHTML = window.HC_DATA.services.map((s, i) => `
        <article class="service-card" data-reveal style="--i:${i % 4}">
          <div class="service-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SERVICE_ICONS[s.icon] || ""}</svg>
          </div>
          <h3>${s.name[lang]}</h3>
          <p>${s.desc[lang]}</p>
          <a class="service-card__link" href="booking.html?service=${encodeURIComponent(s.id)}">
            ${lang === "el" ? "Κλείστε Ραντεβού" : "Book this"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </article>`).join("");
      initReveal();
    }
    paint();
    document.addEventListener("hc:langchange", paint);
  }

  /* ---------------- Preloader ---------------- */
  function initPreloader() {
    const pre = document.getElementById("preloader");
    if (!pre) return;
    const done = () => pre.classList.add("is-done");
    if (document.readyState === "complete") {
      setTimeout(done, 500);
    } else {
      window.addEventListener("load", () => setTimeout(done, 500));
    }
    // safety net so it never gets stuck
    setTimeout(done, 2600);
  }

  /* ---------------- Nav ---------------- */
  function initNav() {
    const nav = document.getElementById("siteNav");
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    const scrim = document.getElementById("navScrim");
    if (!nav) return;

    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && links) {
      const closeMenu = () => {
        toggle.setAttribute("aria-expanded", "false");
        links.classList.remove("is-open");
        scrim && scrim.classList.remove("is-open");
        document.body.style.overflow = "";
      };
      const openMenu = () => {
        toggle.setAttribute("aria-expanded", "true");
        links.classList.add("is-open");
        scrim && scrim.classList.add("is-open");
        document.body.style.overflow = "hidden";
      };
      toggle.addEventListener("click", () => {
        const isOpen = links.classList.contains("is-open");
        isOpen ? closeMenu() : openMenu();
      });
      scrim && scrim.addEventListener("click", closeMenu);
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
      window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
    }

    // active link by current path
    const path = location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("[data-nav]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.startsWith(path) || (path === "" && href.startsWith("index.html"))) {
        a.classList.add("is-active");
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    document.querySelectorAll("[data-reveal-group]").forEach((group) => {
      Array.from(group.querySelectorAll("[data-reveal]")).forEach((el, i) => {
        el.style.setProperty("--i", i);
      });
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach((el) => io.observe(el));
  }

  /* ---------------- Animated counters ---------------- */
  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const noGroup = "noGroup" in el.dataset;
      const decimals = el.dataset.count.includes(".") ? 1 : 0;
      const duration = 1600;
      const start = performance.now();
      const from = 0;
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = from + (target - from) * eased;
        const rounded = decimals ? val.toFixed(decimals) : Math.round(val);
        el.textContent = (noGroup ? String(rounded) : rounded.toLocaleString(document.documentElement.lang === "el" ? "el-GR" : "en-US")) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      els.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------- Testimonials carousel ---------------- */
  function initTestimonials() {
    const track = document.getElementById("testiTrack");
    if (!track) return;
    const prev = document.getElementById("testiPrev");
    const next = document.getElementById("testiNext");
    let index = 0;

    const cardWidth = () => {
      const card = track.querySelector(".testi-card");
      if (!card) return 0;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.gap || 22);
      return card.getBoundingClientRect().width + gap;
    };
    const maxIndex = () => Math.max(0, track.children.length - visibleCount());
    const visibleCount = () => Math.max(1, Math.floor(track.parentElement.getBoundingClientRect().width / cardWidth()));

    const update = () => {
      track.style.transform = `translateX(-${index * cardWidth()}px)`;
    };
    prev && prev.addEventListener("click", () => { index = Math.max(0, index - 1); update(); });
    next && next.addEventListener("click", () => { index = Math.min(maxIndex(), index + 1); update(); });
    window.addEventListener("resize", update);
  }

  /* ---------------- Locations ---------------- */
  function initLocations() {
    const listEl = document.getElementById("locationList");
    const tabsEl = document.getElementById("locationTabs");
    const mapPinsEl = document.getElementById("mapPins");
    if (!listEl || !window.HC_DATA) return;

    const data = window.HC_DATA;
    let activeRegion = "all";

    function lang() { return document.documentElement.getAttribute("data-lang") || "el"; }

    function renderTabs() {
      if (!tabsEl) return;
      const allLabel = lang() === "el" ? "Όλα τα καταστήματα" : "All branches";
      tabsEl.innerHTML = "";
      const allBtn = document.createElement("button");
      allBtn.textContent = allLabel;
      allBtn.className = activeRegion === "all" ? "is-active" : "";
      allBtn.addEventListener("click", () => { activeRegion = "all"; renderAll(); });
      tabsEl.appendChild(allBtn);
      data.regions.forEach((r) => {
        const btn = document.createElement("button");
        btn.textContent = r.label[lang()];
        btn.className = activeRegion === r.id ? "is-active" : "";
        btn.addEventListener("click", () => { activeRegion = r.id; renderAll(); });
        tabsEl.appendChild(btn);
      });
    }

    function renderList() {
      const items = activeRegion === "all" ? data.locations : data.locations.filter((l) => l.region === activeRegion);
      listEl.innerHTML = items.map((loc) => `
        <div class="location-card" data-id="${loc.id}">
          <div class="location-card__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <h4>${loc.name[lang()]}</h4>
            <p>${loc.address[lang()]}</p>
            <p>${loc.phone} · ${loc.hours[lang()]}</p>
            <a class="dir" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}">${window.HC_LANG ? window.HC_LANG.t("getDirections") : "Directions"} →</a>
          </div>
        </div>`).join("");
    }

    function renderPins() {
      if (!mapPinsEl) return;
      mapPinsEl.querySelectorAll(".map-pin").forEach((pin) => {
        const show = activeRegion === "all" || pin.dataset.region === activeRegion;
        pin.style.opacity = show ? "1" : ".25";
      });
    }

    function renderAll() { renderTabs(); renderList(); renderPins(); }
    document.addEventListener("hc:langchange", renderAll);
    renderAll();
  }

  function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------------- Toast (shared) ---------------- */
  window.HCToast = function (msg) {
    let toast = document.getElementById("hcToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hcToast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("is-visible"), 3600);
  };
})();
