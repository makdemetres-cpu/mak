(() => {
  "use strict";

  /* ---------- preloader ---------- */
  const preloader = document.getElementById("preloader");
  const hero = document.querySelector(".hero");
  window.addEventListener("load", () => {
    setTimeout(() => {
      preloader && preloader.classList.add("is-hidden");
      hero && hero.classList.add("is-ready");
    }, 500);
  });
  // Fallback in case 'load' is slow/never fires in odd environments
  setTimeout(() => {
    preloader && preloader.classList.add("is-hidden");
    hero && hero.classList.add("is-ready");
  }, 2500);

  /* ---------- nav scroll state ---------- */
  const nav = document.getElementById("siteNav");
  const toTop = document.getElementById("toTop");
  const onScroll = () => {
    const y = window.scrollY;
    nav && nav.classList.toggle("is-scrolled", y > 40);
    toTop && toTop.classList.toggle("is-visible", y > 600);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop && toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- custom cursor (desktop only) ---------- */
  const cursorDot = document.getElementById("cursorDot");
  if (cursorDot && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("mousemove", (e) => {
      cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
      cursorDot.classList.add("is-active");
    });
    document.querySelectorAll("a, button, .gallery__card").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorDot.classList.add("is-grown"));
      el.addEventListener("mouseleave", () => cursorDot.classList.remove("is-grown"));
    });
  }

  /* ---------- scroll reveal ---------- */
  const revealTargets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- animated stat counters ---------- */
  const stats = document.querySelectorAll(".stat__num");
  if (stats.length && "IntersectionObserver" in window) {
    const countUp = (el) => {
      const target = parseFloat(el.dataset.count || "0");
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
    };
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            statIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    stats.forEach((el) => statIO.observe(el));
  }

  /* ---------- menu tabs ---------- */
  const tabs = document.querySelectorAll(".menu__tab");
  const panels = document.querySelectorAll(".menu__panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      panels.forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      const target = document.querySelector(`.menu__panel[data-panel="${tab.dataset.tab}"]`);
      target && target.classList.add("is-active");
    });
  });

  /* ---------- testimonial slider ---------- */
  const track = document.getElementById("sliderTrack");
  const dotsWrap = document.getElementById("sliderDots");
  if (track && dotsWrap) {
    const slides = Array.from(track.querySelectorAll(".slide"));
    let current = 0;
    let timer;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(index, manual) {
      slides[current].classList.remove("is-active");
      dots[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      dots[current].classList.add("is-active");
      if (manual) restart();
    }
    function next() { goTo(current + 1); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 6000);
    }
    if (slides.length > 1) restart();
  }

  /* ---------- reservation form (static demo) ---------- */
  const form = document.getElementById("reserveForm");
  const note = document.getElementById("formNote");
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        note.textContent = "Please fill in the required fields.";
        return;
      }
      const name = document.getElementById("fname").value.trim();
      note.textContent = `Thank you, ${name.split(" ")[0] || "friend"} — we'll confirm your table by email shortly.`;
      form.reset();
    });
  }

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- subtle hero parallax ---------- */
  const rays = document.querySelector(".hero__rays");
  const leaves = document.querySelectorAll(".hero__leaf");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (rays) rays.style.transform = `translateY(${y * 0.15}px)`;
      leaves.forEach((leaf, i) => {
        leaf.style.transform = `translateY(${y * (0.08 + i * 0.04)}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
})();
