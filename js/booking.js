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

  const MONTHS = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const DOWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    return DOWS[(d.getDay() + 6) % 7] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function bookable(d) {
    if (d < minDate || d > maxDate) return false;
    return WORKDAYS.indexOf(d.getDay()) !== -1;
  }

  /* ---------------- calendar ---------------- */
  function renderMonth() {
    monthLabel.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
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
        btn.setAttribute("aria-label", pretty(d) + " — unavailable");
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
      slotBox.innerHTML = '<p class="slots__empty">Pick a day first and the open times will appear here.</p>';
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
        btn.setAttribute("aria-label", time + " — no longer available");
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
      p.textContent = "Nothing left on this day — try the next one.";
      slotBox.appendChild(p);
    }
  }

  function updateSummary() {
    if (!summary) return;
    summary.innerHTML = chosenDate && chosenSlot
      ? "A 30-minute call on <b>" + pretty(chosenDate) + "</b> at <b>" + chosenSlot + "</b>."
      : "Choose a day and a time and your slot will be summarised here.";
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
        ok = F.invalid($("#bkSlotField") || fields.name.closest(".field"),
          "Pick a day and a time above first.");
        goStep(1);
      }
      if (!fields.name.value.trim()) {
        ok = F.invalid(fields.name.closest(".field"), "Please tell me what to call you.");
      }
      if (!F.email(fields.email.value)) {
        ok = F.invalid(fields.email.closest(".field"), "That email address doesn't look right.");
      }
      if (!fields.consent.checked) {
        ok = F.invalid(fields.consent.closest(".field"),
          "I need your consent to store these details and contact you about the call.");
      }
      if (!ok) return;

      const submit = form.querySelector('button[type="submit"]');
      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Booking…";

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
        F.invalid(fields.email.closest(".field"),
          "Something went wrong sending that. Please email me directly instead.");
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

  renderMonth();
  renderSlots();
  updateSummary();
})();
