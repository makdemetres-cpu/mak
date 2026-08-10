/* ==========================================================================
   HydroCore — Booking form logic
   Works with zero configuration (falls back to a pre-filled mailto: to
   appointments@hydrocore.gr). To send real emails automatically, create a
   free account at https://www.emailjs.com, then fill in EMAILJS_CONFIG
   below — full steps are in README.md.
   ========================================================================== */
(() => {
  "use strict";

  const EMAILJS_CONFIG = {
    publicKey: "",   // e.g. "AbCdEfGhIjKlMnOp"
    serviceId: "",   // e.g. "service_hydrocore"
    templateId: ""   // e.g. "template_booking"
  };
  const isEmailJsConfigured = () =>
    EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.serviceId && EMAILJS_CONFIG.templateId;

  const BOOKING_EMAIL = "appointments@hydrocore.gr";
  const TOTAL_STEPS = 4;

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    const data = window.HC_DATA;
    let step = 1;

    /* ---------- prefill from ?service= query param ---------- */
    const params = new URLSearchParams(location.search);
    const preselect = params.get("service");
    if (preselect) {
      const radio = form.querySelector(`input[name="service"][value="${CSS.escape(preselect)}"]`);
      if (radio) radio.checked = true;
    }

    /* ---------- populate branch select & radios from data.js ---------- */
    const branchSelect = document.getElementById("branch");
    if (branchSelect && data) {
      data.locations.forEach((loc) => {
        const opt = document.createElement("option");
        opt.value = loc.id;
        opt.textContent = `${loc.name.el} / ${loc.name.en}`;
        branchSelect.appendChild(opt);
      });
    }

    /* ---------- custom-styled dropdowns (visual layer over the native <select>) ---------- */
    enhanceSelect(branchSelect);
    enhanceSelect(document.getElementById("time"));

    function enhanceSelect(selectEl) {
      if (!selectEl || selectEl.dataset.enhanced) return;
      selectEl.dataset.enhanced = "true";

      const wrap = document.createElement("div");
      wrap.className = "hc-select";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "hc-select__trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      const associatedLabel = selectEl.id ? document.querySelector(`label[for="${selectEl.id}"]`) : null;
      if (associatedLabel) {
        if (!associatedLabel.id) associatedLabel.id = `${selectEl.id}-label`;
        trigger.setAttribute("aria-labelledby", associatedLabel.id);
      }

      const labelSpan = document.createElement("span");
      labelSpan.className = "hc-select__trigger-label";

      const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      chevron.setAttribute("class", "hc-select__chevron");
      chevron.setAttribute("viewBox", "0 0 24 24");
      chevron.setAttribute("fill", "none");
      chevron.setAttribute("stroke", "currentColor");
      chevron.setAttribute("stroke-width", "2.4");
      chevron.setAttribute("stroke-linecap", "round");
      chevron.setAttribute("stroke-linejoin", "round");
      chevron.innerHTML = '<path d="m6 9 6 6 6-6"/>';

      trigger.appendChild(labelSpan);
      trigger.appendChild(chevron);

      const panel = document.createElement("div");
      panel.className = "hc-select__panel";
      panel.setAttribute("role", "listbox");
      if (selectEl.id) {
        panel.id = `${selectEl.id}-listbox`;
        trigger.setAttribute("aria-controls", panel.id);
      }

      const optionEls = Array.from(selectEl.options).map((opt) => {
        const optEl = document.createElement("div");
        optEl.className = "hc-select__option";
        optEl.setAttribute("role", "option");
        optEl.setAttribute("aria-selected", "false");
        optEl.dataset.value = opt.value;
        const checkSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        checkSvg.setAttribute("viewBox", "0 0 24 24");
        checkSvg.setAttribute("fill", "none");
        checkSvg.setAttribute("stroke", "currentColor");
        checkSvg.setAttribute("stroke-width", "2.6");
        checkSvg.setAttribute("stroke-linecap", "round");
        checkSvg.setAttribute("stroke-linejoin", "round");
        checkSvg.innerHTML = '<path d="m5 13 4 4L19 7"/>';
        const textSpan = document.createElement("span");
        textSpan.textContent = opt.textContent;
        optEl.appendChild(textSpan);
        optEl.appendChild(checkSvg);
        panel.appendChild(optEl);
        return optEl;
      });

      selectEl.insertAdjacentElement("afterend", panel);
      selectEl.insertAdjacentElement("afterend", trigger);
      selectEl.insertAdjacentElement("afterend", wrap);
      wrap.appendChild(trigger);
      wrap.appendChild(panel);
      selectEl.classList.add("hc-select__native");

      function syncFromValue() {
        const selected = Array.from(selectEl.options).find((o) => o.value === selectEl.value) || selectEl.options[0];
        const isPlaceholder = !selectEl.value;
        trigger.dataset.placeholder = String(isPlaceholder);
        labelSpan.textContent = selected ? selected.textContent : "";
        optionEls.forEach((el) => {
          const isSelected = el.dataset.value === selectEl.value;
          el.classList.toggle("is-selected", isSelected);
          el.setAttribute("aria-selected", String(isSelected));
        });
      }

      function openPanel() {
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        const activeEl = optionEls.find((el) => el.classList.contains("is-selected")) || optionEls[0];
        setActive(activeEl);
      }
      function closePanel() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
      function setActive(el) {
        optionEls.forEach((o) => o.classList.remove("is-active"));
        if (el) { el.classList.add("is-active"); el.scrollIntoView({ block: "nearest" }); }
      }

      trigger.addEventListener("click", () => {
        wrap.classList.contains("is-open") ? closePanel() : openPanel();
      });

      // all keyboard handling stays on the trigger — focus never actually
      // moves into the panel (roving "active" option is visual-only, like
      // a standard aria-activedescendant combobox)
      trigger.addEventListener("keydown", (e) => {
        const isOpen = wrap.classList.contains("is-open");
        if (!isOpen && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          e.preventDefault();
          openPanel();
          return;
        }
        if (!isOpen) return;
        const activeEl = optionEls.find((el) => el.classList.contains("is-active"));
        const idx = optionEls.indexOf(activeEl);
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(optionEls[Math.min(optionEls.length - 1, idx + 1)]); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(optionEls[Math.max(0, idx - 1)]); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (activeEl) selectOption(activeEl); }
        else if (e.key === "Escape") { e.preventDefault(); closePanel(); }
        else if (e.key === "Tab") { closePanel(); }
      });

      function selectOption(optEl) {
        selectEl.value = optEl.dataset.value;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        syncFromValue();
        closePanel();
        trigger.focus();
      }

      optionEls.forEach((optEl) => {
        optEl.addEventListener("click", () => selectOption(optEl));
        optEl.addEventListener("mouseenter", () => setActive(optEl));
      });

      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) closePanel();
      });

      syncFromValue();
    }

    /* ---------- stepper UI ---------- */
    const nodes = Array.from(document.querySelectorAll(".step-node"));
    const fill = document.getElementById("stepperFill");
    const steps = Array.from(document.querySelectorAll(".form-step"));

    function renderStepper() {
      nodes.forEach((n, i) => {
        const idx = i + 1;
        n.classList.toggle("is-active", idx === step);
        n.classList.toggle("is-done", idx < step);
      });
      if (fill) fill.style.width = `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`;
      steps.forEach((s) => s.classList.toggle("is-active", Number(s.dataset.step) === step));
      window.scrollTo({ top: form.closest(".booking-card").offsetTop - 130, behavior: "smooth" });
    }

    function showError(fieldEl, show) {
      const wrap = fieldEl.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("has-error", show);
    }

    function validStep1() {
      const service = form.querySelector('input[name="service"]:checked');
      let ok = true;
      if (!service) { document.getElementById("serviceError").style.display = "block"; ok = false; }
      else document.getElementById("serviceError").style.display = "none";
      if (!branchSelect.value) { showError(branchSelect, true); ok = false; } else showError(branchSelect, false);
      return ok;
    }

    function validStep2() {
      const urgency = form.querySelector('input[name="urgency"]:checked');
      let ok = true;
      if (!urgency) { document.getElementById("urgencyError").style.display = "block"; return false; }
      document.getElementById("urgencyError").style.display = "none";
      if (urgency.value === "standard") {
        const dateEl = document.getElementById("date");
        const timeEl = document.getElementById("time");
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const chosen = dateEl.value ? new Date(dateEl.value + "T00:00:00") : null;
        if (!chosen || chosen < today) { showError(dateEl, true); ok = false; } else { showError(dateEl, false); }
        if (!timeEl.value) { showError(timeEl, true); ok = false; } else showError(timeEl, false);
      }
      return ok;
    }

    function validStep3() {
      let ok = true;
      const name = document.getElementById("fullName");
      const phone = document.getElementById("phone");
      const email = document.getElementById("email");
      const address = document.getElementById("address");
      const consent = document.getElementById("consentPrivacy");

      if (!name.value.trim()) { showError(name, true); ok = false; } else showError(name, false);

      const phoneDigits = phone.value.replace(/[\s-]/g, "");
      const phoneOk = /^(\+30)?(69\d{8}|2\d{9})$/.test(phoneDigits);
      if (!phoneOk) { showError(phone, true); ok = false; } else showError(phone, false);

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!emailOk) { showError(email, true); ok = false; } else showError(email, false);

      if (!address.value.trim()) { showError(address, true); ok = false; } else showError(address, false);

      if (!consent.checked) {
        consent.closest(".consent-row").classList.add("has-error");
        window.HCToast && window.HCToast(window.HC_LANG.t("consentRequired"));
        ok = false;
      } else {
        consent.closest(".consent-row").classList.remove("has-error");
      }
      return ok;
    }

    function findLabel(list, id, lang) {
      const item = list.find((x) => x.id === id);
      return item ? item.name[lang] || item.name.el : id;
    }

    function renderReview() {
      const lang = document.documentElement.getAttribute("data-lang") || "el";
      const serviceId = form.querySelector('input[name="service"]:checked').value;
      const branchId = branchSelect.value;
      const urgency = form.querySelector('input[name="urgency"]:checked').value;
      const branch = data.locations.find((l) => l.id === branchId);
      const when = urgency === "emergency"
        ? (lang === "el" ? "Άμεση αναχώρηση συνεργείου" : "Immediate dispatch")
        : `${document.getElementById("date").value} · ${document.getElementById("time").value}`;

      const rows = [
        [lang === "el" ? "Υπηρεσία" : "Service", findLabel(data.services, serviceId, lang)],
        [lang === "el" ? "Κατάστημα" : "Branch", branch ? branch.name[lang] : ""],
        [lang === "el" ? "Πότε" : "When", when],
        [lang === "el" ? "Ονοματεπώνυμο" : "Full name", document.getElementById("fullName").value],
        [lang === "el" ? "Τηλέφωνο" : "Phone", document.getElementById("phone").value],
        [lang === "el" ? "Email" : "Email", document.getElementById("email").value],
        [lang === "el" ? "Διεύθυνση" : "Address", document.getElementById("address").value]
      ];
      document.getElementById("reviewList").innerHTML = rows
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`)
        .join("");
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    document.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (step === 1 && !validStep1()) return;
        if (step === 2 && !validStep2()) return;
        if (step === 3 && !validStep3()) return;
        step = Math.min(TOTAL_STEPS, step + 1);
        if (step === TOTAL_STEPS) renderReview();
        renderStepper();
      });
    });
    document.querySelectorAll("[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => { step = Math.max(1, step - 1); renderStepper(); });
    });

    // toggle urgency schedule block visibility
    form.querySelectorAll('input[name="urgency"]').forEach((r) => {
      r.addEventListener("change", () => {
        document.getElementById("scheduleBlock").style.display = r.value === "standard" ? "block" : "none";
      });
    });

    // bookable window: today .. +60 days
    const dateInput = document.getElementById("date");
    if (dateInput) {
      const today = new Date();
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 60);
      dateInput.min = today.toISOString().slice(0, 10);
      dateInput.max = maxDate.toISOString().slice(0, 10);
      enhanceDateField(dateInput, { disableSundays: true });
    }

    function enhanceDateField(inputEl, opts) {
      if (!inputEl || inputEl.dataset.enhanced) return;
      inputEl.dataset.enhanced = "true";
      const disableSundays = !!(opts && opts.disableSundays);

      const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
      const stripTime = (d) => { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; };

      const minDate = inputEl.min ? stripTime(parseISO(inputEl.min)) : stripTime(new Date());
      const maxDate = inputEl.max ? stripTime(parseISO(inputEl.max)) : null;

      function currentLang() { return document.documentElement.getAttribute("data-lang") || "el"; }
      function locale() { return currentLang() === "el" ? "el-GR" : "en-GB"; }

      const wrap = document.createElement("div");
      wrap.className = "hc-select";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "hc-select__trigger";
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      const associatedLabel = inputEl.id ? document.querySelector(`label[for="${inputEl.id}"]`) : null;
      if (associatedLabel) {
        if (!associatedLabel.id) associatedLabel.id = `${inputEl.id}-label`;
        trigger.setAttribute("aria-labelledby", associatedLabel.id);
      }

      const labelSpan = document.createElement("span");
      labelSpan.className = "hc-select__trigger-label";

      const calIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      calIcon.setAttribute("class", "hc-select__chevron");
      calIcon.setAttribute("viewBox", "0 0 24 24");
      calIcon.setAttribute("fill", "none");
      calIcon.setAttribute("stroke", "currentColor");
      calIcon.setAttribute("stroke-width", "2.2");
      calIcon.setAttribute("stroke-linecap", "round");
      calIcon.setAttribute("stroke-linejoin", "round");
      calIcon.innerHTML = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>';

      trigger.appendChild(labelSpan);
      trigger.appendChild(calIcon);

      const panel = document.createElement("div");
      panel.className = "hc-select__panel hc-date__panel";
      panel.setAttribute("role", "dialog");
      if (inputEl.id) {
        panel.id = `${inputEl.id}-calendar`;
        trigger.setAttribute("aria-controls", panel.id);
      }

      const head = document.createElement("div");
      head.className = "hc-date__head";
      const prevBtn = document.createElement("button");
      prevBtn.type = "button"; prevBtn.className = "hc-date__nav"; prevBtn.setAttribute("aria-label", "Previous month");
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>';
      const nextBtn = document.createElement("button");
      nextBtn.type = "button"; nextBtn.className = "hc-date__nav"; nextBtn.setAttribute("aria-label", "Next month");
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
      const monthLabel = document.createElement("strong");
      head.appendChild(prevBtn); head.appendChild(monthLabel); head.appendChild(nextBtn);

      const weekdaysRow = document.createElement("div");
      weekdaysRow.className = "hc-date__weekdays";
      const grid = document.createElement("div");
      grid.className = "hc-date__grid";

      panel.appendChild(head);
      panel.appendChild(weekdaysRow);
      panel.appendChild(grid);

      inputEl.insertAdjacentElement("afterend", panel);
      inputEl.insertAdjacentElement("afterend", trigger);
      inputEl.insertAdjacentElement("afterend", wrap);
      wrap.appendChild(trigger);
      wrap.appendChild(panel);
      inputEl.classList.add("hc-select__native");

      let selectedDate = inputEl.value ? stripTime(parseISO(inputEl.value)) : null;
      let viewDate = selectedDate ? new Date(selectedDate) : new Date(minDate);
      let activeDate = selectedDate ? new Date(selectedDate) : new Date(minDate);

      function isDisabled(d) {
        if (d < minDate) return true;
        if (maxDate && d > maxDate) return true;
        if (disableSundays && d.getDay() === 0) return true;
        return false;
      }

      function syncTriggerLabel() {
        const isPlaceholder = !selectedDate;
        trigger.dataset.placeholder = String(isPlaceholder);
        labelSpan.textContent = isPlaceholder
          ? inputEl.getAttribute("data-placeholder") || (currentLang() === "el" ? "Επιλέξτε ημερομηνία…" : "Select date…")
          : new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(selectedDate);
      }

      function renderCalendar() {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        monthLabel.textContent = new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }).format(new Date(year, month, 1));

        weekdaysRow.innerHTML = "";
        const weekStart = new Date(2024, 0, 1); // a Monday
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart); d.setDate(d.getDate() + i);
          const span = document.createElement("span");
          span.textContent = new Intl.DateTimeFormat(locale(), { weekday: "narrow" }).format(d);
          weekdaysRow.appendChild(span);
        }

        grid.innerHTML = "";
        const firstOfMonth = new Date(year, month, 1);
        const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first grid
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startOffset; i++) {
          const empty = document.createElement("div");
          empty.className = "hc-date__day is-empty";
          grid.appendChild(empty);
        }
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(year, month, day);
          const cell = document.createElement("button");
          cell.type = "button";
          cell.className = "hc-date__day";
          cell.textContent = String(day);
          cell.setAttribute("role", "gridcell");
          const disabled = isDisabled(d);
          if (disabled) { cell.classList.add("is-disabled"); cell.disabled = true; cell.tabIndex = -1; }
          if (stripTime(d).getTime() === stripTime(new Date()).getTime()) cell.classList.add("is-today");
          if (selectedDate && stripTime(d).getTime() === selectedDate.getTime()) cell.classList.add("is-selected");
          if (activeDate && stripTime(d).getTime() === stripTime(activeDate).getTime()) cell.classList.add("is-active");
          cell.addEventListener("click", () => { if (!disabled) selectDate(d); });
          cell.addEventListener("mouseenter", () => { if (!disabled) { activeDate = d; refreshActive(); } });
          grid.appendChild(cell);
        }

        const prevMonthEnd = new Date(year, month, 0);
        prevBtn.disabled = prevMonthEnd < minDate;
        const nextMonthStart = new Date(year, month + 1, 1);
        nextBtn.disabled = !!maxDate && nextMonthStart > maxDate;
      }

      function refreshActive() {
        Array.from(grid.children).forEach((cell) => {
          if (cell.classList.contains("is-empty")) return;
          const day = Number(cell.textContent);
          const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          cell.classList.toggle("is-active", !!activeDate && stripTime(d).getTime() === stripTime(activeDate).getTime());
        });
      }

      function selectDate(d) {
        selectedDate = stripTime(d);
        activeDate = new Date(selectedDate);
        inputEl.value = toISO(selectedDate);
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        syncTriggerLabel();
        closePanel();
        trigger.focus();
      }

      function openPanel() {
        viewDate = activeDate ? new Date(activeDate) : new Date(minDate);
        wrap.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        renderCalendar();
      }
      function closePanel() {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }

      trigger.addEventListener("click", () => {
        wrap.classList.contains("is-open") ? closePanel() : openPanel();
      });

      trigger.addEventListener("keydown", (e) => {
        const isOpen = wrap.classList.contains("is-open");
        if (!isOpen && ["ArrowDown", "Enter", " "].includes(e.key)) { e.preventDefault(); openPanel(); return; }
        if (!isOpen) return;
        if (e.key === "Escape") { e.preventDefault(); closePanel(); return; }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (activeDate && !isDisabled(activeDate)) selectDate(activeDate); return; }
        const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        if (deltas[e.key] !== undefined) {
          e.preventDefault();
          const next = new Date(activeDate || minDate);
          next.setDate(next.getDate() + deltas[e.key]);
          activeDate = next;
          if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
            viewDate = new Date(next);
            renderCalendar();
          } else {
            refreshActive();
          }
        }
      });

      prevBtn.addEventListener("click", () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        renderCalendar();
      });
      nextBtn.addEventListener("click", () => {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
        renderCalendar();
      });

      document.addEventListener("click", (e) => {
        if (!wrap.contains(e.target)) closePanel();
      });

      document.addEventListener("hc:langchange", () => { syncTriggerLabel(); if (wrap.classList.contains("is-open")) renderCalendar(); });

      syncTriggerLabel();
    }

    /* ---------- submit ---------- */
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const honeypot = document.getElementById("companyWebsite");
      const genRef = () => "HC-" + Date.now().toString(36).toUpperCase();
      const ref = genRef();

      const lang = document.documentElement.getAttribute("data-lang") || "el";
      const submitBtn = document.getElementById("submitBooking");
      submitBtn.disabled = true;

      if (honeypot && honeypot.value) {
        // silently "succeed" for bots without sending anything
        showSuccess(ref, lang, true);
        submitBtn.disabled = false;
        return;
      }

      const payload = collectPayload(ref, lang);
      persistLocally(payload);

      if (isEmailJsConfigured()) {
        ensureEmailJs()
          .then(() => window.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, payload))
          .then(() => showSuccess(ref, lang, false))
          .catch(() => sendViaMailto(payload, ref, lang))
          .finally(() => { submitBtn.disabled = false; });
      } else {
        sendViaMailto(payload, ref, lang);
        submitBtn.disabled = false;
      }
    });

    function collectPayload(ref, lang) {
      const serviceId = form.querySelector('input[name="service"]:checked').value;
      const urgency = form.querySelector('input[name="urgency"]:checked').value;
      const branch = data.locations.find((l) => l.id === branchSelect.value);
      return {
        reference: ref,
        service: findLabel(data.services, serviceId, lang),
        branch: branch ? branch.name[lang] : "",
        urgency,
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        full_name: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        notes: document.getElementById("notes").value.trim(),
        marketing_opt_in: document.getElementById("consentMarketing").checked,
        to_email: BOOKING_EMAIL
      };
    }

    function persistLocally(payload) {
      try {
        const key = "hc_bookings";
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(payload);
        localStorage.setItem(key, JSON.stringify(list.slice(-20)));
      } catch (e) { /* storage unavailable — non-critical */ }
    }

    function ensureEmailJs() {
      if (window.emailjs) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        s.onload = () => { window.emailjs.init(EMAILJS_CONFIG.publicKey); resolve(); };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    function sendViaMailto(payload, ref, lang) {
      const subject = `${lang === "el" ? "Νέο αίτημα ραντεβού" : "New booking request"} — ${ref}`;
      const bodyLines = [
        `${lang === "el" ? "Κωδικός" : "Reference"}: ${ref}`,
        `${lang === "el" ? "Υπηρεσία" : "Service"}: ${payload.service}`,
        `${lang === "el" ? "Κατάστημα" : "Branch"}: ${payload.branch}`,
        `${lang === "el" ? "Πότε" : "When"}: ${payload.urgency === "emergency" ? (lang === "el" ? "Άμεσα (επείγον)" : "ASAP (emergency)") : payload.date + " " + payload.time}`,
        `${lang === "el" ? "Ονοματεπώνυμο" : "Name"}: ${payload.full_name}`,
        `${lang === "el" ? "Τηλέφωνο" : "Phone"}: ${payload.phone}`,
        `Email: ${payload.email}`,
        `${lang === "el" ? "Διεύθυνση" : "Address"}: ${payload.address}`,
        `${lang === "el" ? "Σημειώσεις" : "Notes"}: ${payload.notes || "-"}`
      ];
      const mailto = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
      const a = document.createElement("a");
      a.href = mailto;
      a.click();
      showSuccess(ref, lang, true);
    }

    function showSuccess(ref, lang, viaMailto) {
      document.querySelectorAll(".form-step").forEach((s) => s.classList.remove("is-active"));
      document.getElementById("stepSuccess").classList.add("is-active");
      document.getElementById("successRef").textContent = ref;
      document.getElementById("successNote").textContent = viaMailto
        ? window.HC_LANG.t("bookingFallbackMail")
        : window.HC_LANG.t("bookingSuccessMail");
      const stepperEl = document.querySelector(".stepper");
      if (stepperEl) stepperEl.style.display = "none";
    }

    renderStepper();
  });
})();
