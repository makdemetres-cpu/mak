/* ===========================================================================
   Site behaviour: reveals, sticky header, mobile drawer, scroll-to-top,
   language switching, live opening status.
   Everything degrades: with JS off the page is fully readable and every link,
   phone number and the map all still work.
   =========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------ *
   * 1. Scroll reveals
   * ------------------------------------------------------------------ */
  (function reveals() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (var j = 0; j < items.length; j++) observer.observe(items[j]);
  })();

  /* ------------------------------------------------------------------ *
   * 2. Header state + scroll-to-top + scrollspy, on one rAF-throttled
   *    scroll listener so nothing fights for the main thread.
   * ------------------------------------------------------------------ */
  (function scrollUi() {
    var header = document.getElementById("site-header");
    var toTop = document.getElementById("to-top");
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__link[href^='#']"));
    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute("href")); })
      .filter(Boolean);

    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || window.pageYOffset;

      if (header) header.classList.toggle("is-stuck", y > 12);
      if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight * 0.6);

      if (sections.length) {
        var line = y + window.innerHeight * 0.32;
        var active = -1;
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= line) active = i;
        }
        for (var j = 0; j < links.length; j++) {
          links[j].classList.toggle("is-current", j === active);
        }
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
        var brand = document.querySelector(".brand");
        if (brand) brand.focus({ preventScroll: true });
      });
    }
  })();

  /* ------------------------------------------------------------------ *
   * 3. Mobile drawer
   * ------------------------------------------------------------------ */
  (function drawer() {
    var toggle = document.getElementById("nav-toggle");
    var panel = document.getElementById("drawer");
    var header = document.getElementById("site-header");
    if (!toggle || !panel) return;

    var lastFocus = null;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    /* The button is the only affordance on a touch screen, so its label has to
       describe what the next tap does — and stay right through a language
       switch, which re-applies the markup's default label. */
    function syncLabel() {
      var key = isOpen() ? "nav.closeMenu" : "nav.openMenu";
      var fallback = isOpen() ? "Close menu" : "Open menu";
      toggle.setAttribute(
        "aria-label",
        window.VetCareI18n ? window.VetCareI18n.t(key) : fallback
      );
    }

    function open() {
      lastFocus = document.activeElement;
      panel.hidden = false;
      /* next frame, so the transition has a start state to animate from */
      window.requestAnimationFrame(function () { panel.classList.add("is-open"); });
      toggle.setAttribute("aria-expanded", "true");
      syncLabel();
      if (header) header.classList.add("is-drawer-open");
      document.body.style.overflow = "hidden";
      var first = panel.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }

    function close(restoreFocus) {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      syncLabel();
      if (header) header.classList.remove("is-drawer-open");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        if (!panel.classList.contains("is-open")) panel.hidden = true;
      }, 320);
      /* Closing leaves the page exactly where it was; only the focus ring moves,
         and only when the visitor closed the menu rather than followed a link. */
      if (restoreFocus !== false && lastFocus) lastFocus.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close();
      else open();
    });

    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) close(false);
    });

    /* The header stays on top of the open drawer, so its own links are live:
       tapping the logo or the phone number should take the menu down with it.
       The language buttons deliberately do not close it. */
    if (header) {
      header.addEventListener("click", function (event) {
        if (event.target.closest("#nav-toggle")) return;
        if (event.target.closest("a") && isOpen()) close(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close();
    });

    document.addEventListener("vetcare:langchange", syncLabel);

    /* Keep the drawer in step with the layout it belongs to. */
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (mq) {
      if (mq.matches && isOpen()) close();
    });

    syncLabel();
  })();

  /* ------------------------------------------------------------------ *
   * 4. Language switch
   * ------------------------------------------------------------------ */
  (function language() {
    document.addEventListener("click", function (event) {
      if (!window.VetCareI18n) return;
      var target = event.target.closest
        ? event.target.closest("[data-lang-set], [data-lang-toggle]")
        : null;
      if (!target) return;
      if (target.hasAttribute("data-lang-toggle")) {
        /* The compact phone switch simply flips to the other language. */
        window.VetCareI18n.set(window.VetCareI18n.lang === "el" ? "en" : "el");
      } else {
        window.VetCareI18n.set(target.getAttribute("data-lang-set"));
      }
    });
  })();

  /* ------------------------------------------------------------------ *
   * 5. Live opening status — computed in the clinic's own timezone so it is
   *    correct for a visitor reading the page from anywhere.
   *    Hours: Mon–Fri 09:00–14:00 and 18:00–21:00. Sat/Sun closed.
   * ------------------------------------------------------------------ */
  (function openingStatus() {
    var chip = document.querySelector("[data-status-chip]");
    var text = document.querySelector("[data-status-text]");
    var table = document.getElementById("hours-table");
    if (!chip && !table) return;

    var MORNING = [9 * 60, 14 * 60];
    var EVENING = [18 * 60, 21 * 60];

    function athens() {
      var parts;
      try {
        parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Athens",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).formatToParts(new Date());
      } catch (e) {
        /* No Intl timezone support: fall back to the visitor's own clock. */
        var now = new Date();
        return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
      }

      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var day = 0, hour = 0, minute = 0;
      parts.forEach(function (part) {
        if (part.type === "weekday") day = map[part.value] !== undefined ? map[part.value] : 0;
        if (part.type === "hour") hour = parseInt(part.value, 10) % 24;
        if (part.type === "minute") minute = parseInt(part.value, 10);
      });
      return { day: day, minutes: hour * 60 + minute };
    }

    function t(key) { return window.VetCareI18n ? window.VetCareI18n.t(key) : ""; }

    function render() {
      var now = athens();
      var weekday = now.day >= 1 && now.day <= 5;
      var inMorning = now.minutes >= MORNING[0] && now.minutes < MORNING[1];
      var inEvening = now.minutes >= EVENING[0] && now.minutes < EVENING[1];
      var isOpen = weekday && (inMorning || inEvening);

      if (chip && text) {
        chip.classList.toggle("chip--open", isOpen);
        chip.classList.toggle("chip--closed", !isOpen);

        if (isOpen) {
          text.textContent = t("status.open");
        } else if (weekday && now.minutes < MORNING[0]) {
          text.textContent = t("status.opensAt").replace("{time}", "09:00");
        } else if (weekday && now.minutes >= MORNING[1] && now.minutes < EVENING[0]) {
          text.textContent = t("status.opensAt").replace("{time}", "18:00");
        } else if (now.day >= 1 && now.day <= 4) {
          text.textContent = t("status.opensTomorrow");
        } else {
          text.textContent = t("status.opensMon");
        }
      }

      if (table) {
        var rows = table.querySelectorAll("tr[data-day]");
        for (var i = 0; i < rows.length; i++) {
          rows[i].classList.toggle(
            "is-today",
            parseInt(rows[i].getAttribute("data-day"), 10) === now.day
          );
        }
      }
    }

    render();
    document.addEventListener("vetcare:langchange", render);
    /* Re-check on the minute boundary so a page left open stays honest. */
    window.setInterval(render, 60 * 1000);
  })();

  /* ------------------------------------------------------------------ *
   * 6. Footer year
   * ------------------------------------------------------------------ */
  (function year() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
