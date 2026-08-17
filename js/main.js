(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initNav();
    renderServices();
    initReveal();
    initCounters();
    initLocationSwitcher();
    initFooterYear();
    initReviewFlow();
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
        <div class="service-flip" data-reveal style="--i:${i % 4}">
          <div class="service-flip__inner">
            <div class="service-flip__face service-flip__face--back" aria-hidden="true">
              <svg viewBox="0 0 100 100" width="46" height="46">
                <path d="M50 5 C69 32 85 53 85 70 A35 35 0 1 1 15 70 C15 53 31 32 50 5 Z" fill="#00308F"/>
                <circle cx="50" cy="68" r="17" fill="none" stroke="#fff" stroke-width="6"/>
                <path d="M50 51 L50 42" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="service-flip__face service-flip__face--front">
              <article class="service-card">
                <div class="service-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SERVICE_ICONS[s.icon] || ""}</svg>
                </div>
                <h3>${s.name[lang]}</h3>
                <p>${s.desc[lang]}</p>
                <a class="service-card__link" href="booking.html?service=${encodeURIComponent(s.id)}">
                  ${lang === "el" ? "Κλείστε Ραντεβού" : "Book this"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </article>
            </div>
          </div>
        </div>`).join("");
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

    // active link by current path (exact match on the page path, ignoring in-page #anchors)
    const path = location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("[data-nav]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const hasHash = href.includes("#");
      const hrefPath = href.split("#")[0] || "index.html";
      const isMatch = !hasHash && (hrefPath === path || (path === "" && hrefPath === "index.html"));
      a.classList.toggle("is-active", isMatch);
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

  /* ---------------- Location switcher (hover a branch, its photo crossfades in) ---------------- */
  function initLocationSwitcher() {
    const bgEl = document.getElementById("locationSwitcherBg");
    const listEl = document.getElementById("locationSwitcherList");
    if (!bgEl || !listEl || !window.HC_DATA) return;

    const locations = window.HC_DATA.locations;
    function lang() { return document.documentElement.getAttribute("data-lang") || "el"; }

    const pinIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

    bgEl.innerHTML = locations.map((loc, i) => `
      <div class="location-switcher__bg-layer${i === 0 ? " is-active" : ""}" data-idx="${i}">${pinIcon}</div>
    `).join("");
    const layers = Array.from(bgEl.children);

    function setActive(idx) {
      layers.forEach((el, i) => el.classList.toggle("is-active", i === idx));
      Array.from(listEl.children).forEach((el, i) => el.classList.toggle("is-active", i === idx));
    }

    function renderList() {
      listEl.innerHTML = locations.map((loc) => `
        <button type="button" class="location-switcher__item">
          <strong>${loc.name[lang()]}</strong>
          <span>${loc.hours[lang()]}</span>
        </button>
      `).join("");
      Array.from(listEl.children).forEach((btn, i) => {
        btn.addEventListener("mouseenter", () => setActive(i));
        btn.addEventListener("focus", () => setActive(i));
        btn.addEventListener("click", () => setActive(i));
      });
      setActive(0);
    }
    listEl.addEventListener("mouseleave", () => setActive(0));

    renderList();
    document.addEventListener("hc:langchange", renderList);
  }

  function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------------- Reviews: write-a-review + confetti ---------------- */
  function initReviewFlow() {
    const openBtn = document.getElementById("openReviewModal");
    const overlay = document.getElementById("reviewModalOverlay");
    const modal = document.getElementById("reviewModal");
    const closeBtn = document.getElementById("reviewModalClose");
    const cancelBtn = document.getElementById("reviewCancel");
    const form = document.getElementById("reviewForm");
    const nameField = document.getElementById("reviewName");
    const textField = document.getElementById("reviewText");
    const starPicker = document.getElementById("starPicker");
    const stars = starPicker ? starPicker.querySelectorAll(".star-picker__star") : [];
    const track = document.getElementById("testiTrack");
    const thanksOverlay = document.getElementById("thanksOverlay");
    if (!openBtn || !modal || !form || !track || !thanksOverlay) return;

    const openModal = () => {
      overlay.classList.add("is-visible");
      modal.classList.add("is-visible");
      document.body.style.overflow = "hidden";
      nameField.focus();
    };
    const closeModal = () => {
      overlay.classList.remove("is-visible");
      modal.classList.remove("is-visible");
      document.body.style.overflow = "";
    };

    openBtn.addEventListener("click", openModal);
    closeBtn && closeBtn.addEventListener("click", closeModal);
    cancelBtn && cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-visible")) closeModal();
    });

    let rating = 0;
    function paintStars() {
      stars.forEach((s) => s.classList.toggle("is-filled", Number(s.dataset.value) <= rating));
    }
    stars.forEach((s) => {
      s.addEventListener("click", () => {
        rating = Number(s.dataset.value);
        paintStars();
        starPicker.closest(".field").classList.remove("has-error");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      [nameField, textField].forEach((f) => {
        const wrap = f.closest(".field");
        if (!f.value.trim()) { wrap.classList.add("has-error"); valid = false; }
        else wrap.classList.remove("has-error");
      });
      const starsWrap = starPicker.closest(".field");
      if (rating < 1) { starsWrap.classList.add("has-error"); valid = false; }
      else starsWrap.classList.remove("has-error");
      if (!valid) return;

      addReviewCard({ name: nameField.value.trim(), rating, text: textField.value.trim() });

      form.reset();
      rating = 0;
      paintStars();
      closeModal();
      showThanks();
    });

    function initials(name) {
      const parts = name.trim().split(/\s+/).slice(0, 2);
      return parts.map((w) => w[0]).join("").toUpperCase();
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    function addReviewCard({ name, rating, text }) {
      const card = document.createElement("article");
      card.className = "testi-card testi-card--new";
      const starsMarkup = "★".repeat(rating) + "☆".repeat(5 - rating);
      card.innerHTML = `
        <div class="testi-stars" aria-hidden="true">${starsMarkup}</div>
        <p>«${escapeHtml(text)}»</p>
        <div class="testi-person">
          <div class="testi-avatar">${initials(name) || "?"}</div>
          <div><strong>${escapeHtml(name)}</strong><span data-lang-el>Νέα κριτική</span><span data-lang-en>New review</span></div>
        </div>`;
      track.prepend(card);
      track.scrollTo({ left: 0, behavior: "smooth" });
    }

    function showThanks() {
      thanksOverlay.classList.add("is-visible");
      runConfetti();
      clearTimeout(thanksOverlay._t);
      thanksOverlay._t = setTimeout(hideThanks, 3800);
    }
    function hideThanks() {
      thanksOverlay.classList.remove("is-visible");
    }
    thanksOverlay.addEventListener("click", hideThanks);

    function runConfetti() {
      const canvas = document.getElementById("confettiCanvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const colors = ["#7CB9E8", "#72A0C1", "#00308F", "#8B8C89", "#FFFFFF"];
      const count = 140;
      const particles = Array.from({ length: count }, () => ({
        x: w / 2 + (Math.random() - 0.5) * 140,
        y: h / 2 - 20,
        vx: (Math.random() - 0.5) * 9,
        vy: -(Math.random() * 9 + 4),
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? "rect" : "circle"
      }));

      const gravity = 0.18;
      const start = performance.now();
      const duration = 3200;

      function frame(now) {
        const t = now - start;
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p) => {
          p.vy += gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          const fade = Math.max(0, 1 - t / duration);
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
        });
        if (t < duration) requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, w, h);
      }
      requestAnimationFrame(frame);
    }
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
