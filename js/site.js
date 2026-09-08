/* ==========================================================================
   SITRIXWEB — page behaviour
   Preloader, sticky nav, fullscreen menu, scroll reveals, the directional
   link underline, the portfolio hover-peek (desktop) / tap-to-expand
   (touch), and the small shared helpers the forms reuse.
   ========================================================================== */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = window.matchMedia("(hover: none)");
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- config fan-out ---------------- */
  // One value in js/config.js drives every Instagram button on the site.
  const cfg = window.SITRIX || {};
  if (cfg.instagram) {
    $$("[data-ig]").forEach((a) => { a.href = cfg.instagram; });
  }
  $$("[data-mail]").forEach((a) => {
    if (cfg.email) {
      a.href = "mailto:" + cfg.email;
      if (a.dataset.mail === "text") a.textContent = cfg.email;
    }
  });
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------------- preloader ---------------- */
  // The hero entrance only starts once the first paint is genuinely ready,
  // so the staggered reveal is never half-missed on a slow connection.
  const pre = $("#preloader");
  function ready() {
    document.body.classList.add("is-ready");
    if (pre) {
      pre.classList.add("is-gone");
      setTimeout(() => pre.remove(), 700);
    }
    const aurora = $(".aurora");
    if (aurora) {
      aurora.classList.add("is-lit");
      // Counter-motion: hero content enters leftward, the aurora drifts right.
      setTimeout(() => aurora.classList.add("is-drifted"), 120);
    }
  }
  if (document.readyState === "complete") requestAnimationFrame(ready);
  else window.addEventListener("load", () => requestAnimationFrame(ready));
  // Never let a stalled asset hold the page hostage.
  setTimeout(ready, 2200);

  /* ---------------- sticky nav ---------------- */
  const nav = $("#nav");
  function onScroll() {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- fullscreen menu ---------------- */
  const menu = $("#menu");
  const burger = $("#burger");
  let lastFocus = null;

  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("is-locked", open);
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      lastFocus = document.activeElement;
      const first = menu.querySelector("a");
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    } else if (lastFocus) {
      lastFocus.focus({ preventScroll: true });
    }
  }
  if (burger) burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("is-open")) setMenu(false);
  });

  /* ---------------- scroll reveals ---------------- */
  // Primary layer. Stagger is capped so a group never takes longer than
  // ~500ms to finish arriving (tighter on touch, per the motion system).
  const stepMs = coarse.matches ? 45 : 70;
  const items = $$("[data-reveal]");

  if (!("IntersectionObserver" in window) || reduced.matches) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      // Group everything that crossed in the same tick, then stagger it.
      const shown = entries.filter((en) => en.isIntersecting);
      shown.forEach((en, i) => {
        const el = en.target;
        const own = parseInt(el.dataset.delay || "", 10);
        const d = Number.isFinite(own) ? own : Math.min(i * stepMs, 420);
        el.style.setProperty("--rd", d + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------------- directional link underline ---------------- */
  $$(".ulink").forEach((a) => {
    a.addEventListener("pointerenter", (e) => {
      const r = a.getBoundingClientRect();
      a.style.setProperty("--from", e.clientX < r.left + r.width / 2 ? "left" : "right");
    });
  });

  /* ---------------- portfolio: hover peek / tap to expand ---------------- */
  const peek = $("#peek");
  const works = $$(".work");

  if (peek && !coarse.matches) {
    let rafId = 0, tx = 0, ty = 0, active = null;

    const move = (e) => {
      // Slide in from the cursor's side of the row, and never let the
      // thumbnail push the layout around — it is fixed and transform-only.
      const w = peek.offsetWidth || 260;
      const h = peek.offsetHeight || 195;
      const side = e.clientX > window.innerWidth / 2 ? -1 : 1;
      tx = e.clientX + side * 28 - (side === -1 ? w : 0);
      ty = Math.min(Math.max(e.clientY - h / 2, 90), window.innerHeight - h - 20);
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          peek.style.transform = "translate3d(" + tx + "px," + ty + "px,0) scale(1)";
          rafId = 0;
        });
      }
    };

    works.forEach((row) => {
      row.addEventListener("pointerenter", (e) => {
        active = row;
        const art = peek.querySelector(".work-peek__art");
        const label = peek.querySelector(".work-peek__label");
        art.style.background = row.dataset.art || "linear-gradient(140deg,#2b2830,#191720)";
        label.textContent = row.dataset.name || "";
        peek.classList.add("is-on");
        move(e);
      });
      row.addEventListener("pointermove", move);
      row.addEventListener("pointerleave", () => {
        if (active === row) {
          peek.classList.remove("is-on");
          active = null;
        }
      });
    });
  }

  // Touch: rows expand in place instead — no hover to depend on.
  $$(".work__toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const row = btn.closest(".work");
      const open = row.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      const label = btn.querySelector("span");
      if (label) label.textContent = open ? "Close" : "Preview";
    });
  });

  /* ---------------- shared form helpers ---------------- */
  // Exposed so booking.js and reviews.js share one validation vocabulary.
  window.SitrixForm = {
    invalid(field, message) {
      field.classList.add("is-invalid");
      const err = field.querySelector(".err");
      if (err && message) err.textContent = message;
      field.classList.remove("shake");
      void field.offsetWidth;               // restart the animation
      if (!reduced.matches) field.classList.add("shake");
      return false;
    },
    clear(field) {
      field.classList.remove("is-invalid", "shake");
    },
    email(v) {
      return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || "").trim());
    },
    // Honeypot: real people never fill a field they cannot see.
    isBot(form) {
      const hp = form.querySelector('input[name="website"]');
      return !!(hp && hp.value);
    },
    /* Sends the payload to config.formEndpoint when one is configured;
       otherwise resolves with { mailto } so the caller can offer an email
       fallback. Either way nothing is sent anywhere until the visitor has
       ticked the consent box — that check lives in the callers. */
    async send(payload, subject) {
      const endpoint = (window.SITRIX || {}).formEndpoint;
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return { sent: true };
      }
      const to = (window.SITRIX || {}).email || "";
      const body = Object.keys(payload)
        .map((k) => k + ": " + payload[k])
        .join("\n");
      return {
        sent: false,
        mailto: "mailto:" + to +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body),
      };
    },
  };

  /* ---------------- smooth in-page links with a sticky-nav offset -------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: reduced.matches ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });
})();
