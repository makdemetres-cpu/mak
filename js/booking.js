/* ==========================================================================
   SITRIXWEB — consultation booking
   A dark-themed date picker + 30-minute slot grid. On desktop the three
   panels (date / time / details) sit side by side; on phones the same DOM
   runs as a stepped flow — date, then time, then details — driven by the
   `data-step` attribute the stylesheet keys off.

   Availability comes from js/config.js. There is no backend here: the form
   either POSTs to your configured endpoint or falls back to a pre-filled
   email, and nothing leaves the browser before the GDPR consent box is
   ticked (Art. 6(1)(a)/(b) — see privacy.html §3).
   ========================================================================== */
(() => {
  "use strict";

  const panel = document.getElementById("bookingPanel");
  if (!panel) return;

  const F = window.SitrixForm;
  const cfg = (window.SITRIX && window.SITRIX.booking) || {};
  const WORKDAYS = cfg.workdays || [1, 2, 3, 4, 5];
  const SLOTS = cfg.slots || ["10:00", "11:00", "12:00", "15:00", "16:00"];
  const LEAD = Number.isFinite(cfg.leadDays) ? cfg.leadDays : 1;
  const HORIZON = cfg.horizonDays || 60;

  const $ = (s, r = panel) => r.querySelector(s);
  const $$ = (s, r = panel) => Array.from(r.querySelectorAll(s));

  const monthLabel = $("#calMonth");
  const grid = $("#calGrid");
  const prevBtn = $("#calPrev");
  const nextBtn = $("#calNext");
  const slotBox = $("#slotBox");
  const summary = $("#bookSummary");
  const form = document.getElementById("bookForm");
  const success = document.getElementById("bookSuccess");
  const stepBar = $$("#bookSteps span");

  /* Names and messages come from js/strings.js so the calendar speaks
     whichever language is on screen. Greek needs two forms of the month:
     genitive inside a date ("9 Σεπτεμβρίου") and nominative as a heading
     ("Σεπτέμβριος 2026"). */
  const T = (k) => window.SitrixLang.t(window.SITRIX_STRINGS[k]);

  const today = startOfDay(new Date());
  const minDate = addDays(today, LEAD);
  const maxDate = addDays(today, HORIZON);

  let view = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let chosenDate = null;
  let chosenSlot = null;

  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")
      + "-" + String(d.getDate()).padStart(2, "0");
  }
  function pretty(d) {
    return T("days")[(d.getDay() + 6) % 7] + " " + d.getDate() + " " +
           T("months")[d.getMonth()] + " " + d.getFullYear();
  }
  function bookable(d) {
    if (d < minDate || d > maxDate) return false;
    return WORKDAYS.indexOf(d.getDay()) !== -1;
  }

  /* ---------------- calendar ---------------- */
  function renderMonth() {
    monthLabel.textContent = T("monthsStandalone")[view.getMonth()] + " " + view.getFullYear();
    grid.innerHTML = "";

    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;              // weeks start Monday
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

    for (let i = 0; i < lead; i++) {
      const blank = document.createElement("span");
      blank.className = "cal__day is-empty";
      blank.setAttribute("aria-hidden", "true");
      grid.appendChild(blank);
    }

    for (let day = 1; day <= days; day++) {
      const d = new Date(view.getFullYear(), view.getMonth(), day);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day";
      btn.textContent = String(day);
      btn.dataset.date = iso(d);
      if (sameDay(d, today)) btn.classList.add("is-today");
      if (sameDay(d, chosenDate)) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      }
      if (!bookable(d)) {
        btn.disabled = true;
        btn.setAttribute("aria-label", pretty(d) + T("unavailable"));
      } else {
        btn.setAttribute("aria-label", pretty(d));
        btn.addEventListener("click", () => pickDate(d));
      }
      grid.appendChild(btn);
    }

    const viewStart = new Date(view.getFullYear(), view.getMonth(), 1);
    const viewEnd = new Date(view.getFullYear(), view.getMonth() + 1, 0);
    prevBtn.disabled = viewStart <= new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    nextBtn.disabled = viewEnd >= maxDate;
  }

  function pickDate(d) {
    chosenDate = d;
    chosenSlot = null;
    renderMonth();
    renderSlots();
    updateSummary();
    goStep(2);
  }

  /* ---------------- time slots ---------------- */
  function renderSlots() {
    if (!chosenDate) {
      slotBox.innerHTML = '<p class="slots__empty">' + T("pickDayFirst") + "</p>";
      return;
    }
    const now = new Date();
    const wrap = document.createElement("div");
    wrap.className = "slots";

    SLOTS.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot";
      btn.textContent = time;
      btn.dataset.time = time;

      // Same-day slots that have already passed are never offered.
      const [h, m] = time.split(":").map(Number);
      const when = new Date(chosenDate);
      when.setHours(h, m, 0, 0);
      if (when <= now) {
        btn.disabled = true;
        btn.setAttribute("aria-label", time + T("slotGone"));
      } else {
        btn.addEventListener("click", () => {
          chosenSlot = time;
          $$(".slot", slotBox).forEach((b) => {
            b.classList.toggle("is-selected", b === btn);
            b.setAttribute("aria-pressed", String(b === btn));
          });
          updateSummary();
          goStep(3);
        });
      }
      if (time === chosenSlot) btn.classList.add("is-selected");
      wrap.appendChild(btn);
    });

    slotBox.innerHTML = "";
    slotBox.appendChild(wrap);
    if (!wrap.querySelector(".slot:not([disabled])")) {
      const p = document.createElement("p");
      p.className = "slots__empty";
      p.style.marginTop = "14px";
      p.textContent = T("dayFull");
      slotBox.appendChild(p);
    }
  }

  function updateSummary() {
    if (!summary) return;
    if (!chosenDate || !chosenSlot) { summary.innerHTML = T("summaryEmpty"); return; }
    const d = "<b>" + pretty(chosenDate) + "</b>", t = "<b>" + chosenSlot + "</b>";
    summary.innerHTML = window.SitrixLang.get() === "el"
      ? "Κλήση 30 λεπτών στις " + d + " στις " + t + "."
      : "A 30-minute call on " + d + " at " + t + ".";
  }

  /* ---------------- stepped flow (phones) ---------------- */
  const isStepped = window.matchMedia("(max-width: 720px)");
  function goStep(n) {
    if (!isStepped.matches) return;
    panel.dataset.step = String(n);
    stepBar.forEach((s, i) => s.classList.toggle("is-done", i < n));
    const head = panel.querySelector('[data-step-panel="' + n + '"] .bstep__head');
    if (head) head.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  $$(".bstep__back").forEach((btn) => {
    btn.addEventListener("click", () => goStep(Number(btn.dataset.back)));
  });
  isStepped.addEventListener("change", () => {
    panel.dataset.step = "1";
    stepBar.forEach((s, i) => s.classList.toggle("is-done", i < 1));
  });

  /* ---------------- submit ---------------- */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (F.isBot(form)) return;                       // silent drop

      const fields = {
        name: form.querySelector("#bkName"),
        email: form.querySelector("#bkEmail"),
        project: form.querySelector("#bkProject"),
        consent: form.querySelector("#bkConsent"),
      };
      Object.values(fields).forEach((el) => F.clear(el.closest(".field")));

      let ok = true;
      if (!chosenDate || !chosenSlot) {
        ok = F.invalid($("#bkSlotField") || fields.name.closest(".field"), T("bkNoSlot"));
        goStep(1);
      }
      if (!fields.name.value.trim()) {
        ok = F.invalid(fields.name.closest(".field"), T("bkName"));
      }
      if (!F.email(fields.email.value)) {
        ok = F.invalid(fields.email.closest(".field"), T("bkEmail"));
      }
      if (!fields.consent.checked) {
        ok = F.invalid(fields.consent.closest(".field"), T("bkConsent"));
      }
      if (!ok) return;

      const submit = form.querySelector('button[type="submit"]');
      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = T("bkSending");

      const payload = {
        type: "consultation-booking",
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        project: fields.project.value.trim(),
        date: iso(chosenDate),
        time: chosenSlot,
        timezone: cfg.timezoneLabel || "Europe/Athens",
        consent: "Given on " + new Date().toISOString(),
      };

      try {
        const res = await F.send(payload, "Consultation request — " + payload.date + " " + payload.time);
        form.hidden = true;
        success.classList.add("is-on");
        const line = success.querySelector("[data-slot]");
        if (line) line.textContent = pretty(chosenDate) + " at " + chosenSlot + " (" + payload.timezone + ")";
        const fallback = success.querySelector("[data-fallback]");
        if (fallback) {
          if (res.mailto) {
            fallback.hidden = false;
            const link = fallback.querySelector("a");
            if (link) link.href = res.mailto;
          } else {
            fallback.hidden = true;
          }
        }
        success.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch (err) {
        submit.disabled = false;
        submit.textContent = label;
        F.invalid(fields.email.closest(".field"), T("bkFailed"));
      }
    });
  }

  /* ---------------- go ---------------- */
  prevBtn.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderMonth();
  });
  nextBtn.addEventListener("click", () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderMonth();
  });

  function renderDows() {
    const box = panel.querySelector(".cal__dows");
    if (!box) return;
    const ini = T("dayInitials");
    Array.from(box.children).forEach((el, i) => { el.textContent = ini[i]; });
  }

  function renderAll() {
    renderDows();
    renderMonth();
    renderSlots();
    updateSummary();
    const prev = panel.querySelector("#calPrev"), next = panel.querySelector("#calNext");
    if (prev) prev.setAttribute("aria-label", T("prevMonth"));
    if (next) next.setAttribute("aria-label", T("nextMonth"));
  }

  // Rebuild in place when the visitor switches language.
  document.addEventListener("sitrix:lang", renderAll);

  renderAll();
})();
