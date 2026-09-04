/* ===========================================================================
   Booking request form
   ---------------------------------------------------------------------------
   Data protection notes (see privacy.html § 2–4):
     · Data minimisation (GDPR art. 5(1)(c)): the form asks for a name, one
       contact route, the type of animal and an optional preferred time. No
       address, no pet name, no medical history, no payment details.
     · The consent checkbox is never pre-ticked and the submit button stays
       disabled until it is ticked — consent has to be an affirmative act.
     · Nothing is stored in the browser and nothing is sent anywhere until the
       visitor presses Send.
   =========================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
     WHERE TO PLUG IN THE REAL BACKEND
     -------------------------------------------------------------------
     Leave ENDPOINT empty and the form falls back to opening the visitor's
     email client with everything pre-filled, addressed to the clinic — so a
     freshly deployed site is never broken.

     To have requests arrive automatically instead, set ENDPOINT to a form
     service or your own serverless function, e.g.

       Formspree:  https://formspree.io/f/XXXXXXX      (create form → copy ID)
       Netlify:    /                                    (plus data-netlify)
       Own function: /api/booking

     The payload is a plain application/json POST of the fields below.
     Anything you choose becomes a data processor: name it in privacy.html § 5
     and check whether it transfers data outside the EEA before you go live.
  ------------------------------------------------------------------- */
  var ENDPOINT = "";
  var CLINIC_EMAIL = "info@vet-care.gr";

  var form = document.getElementById("booking-form");
  if (!form) return;

  var submitBtn = document.getElementById("bf-submit");
  var consentBox = document.getElementById("bf-consent");
  var statusBox = document.getElementById("bf-status");
  var statusText = document.getElementById("bf-status-text");
  var statusIcon = statusBox ? statusBox.querySelector("use") : null;
  var dateInput = document.getElementById("bf-date");

  function t(key) {
    return window.VetCareI18n ? window.VetCareI18n.t(key) : "";
  }

  /* A date in the past is never a useful preference. */
  if (dateInput) {
    var today = new Date();
    var iso =
      today.getFullYear() +
      "-" + String(today.getMonth() + 1).padStart(2, "0") +
      "-" + String(today.getDate()).padStart(2, "0");
    dateInput.min = iso;
  }

  /* ---- submit gating: consent first, always ---- */
  function syncSubmitState() {
    var ok = consentBox && consentBox.checked;
    submitBtn.disabled = !ok;
    submitBtn.setAttribute("aria-disabled", ok ? "false" : "true");
  }
  if (consentBox) {
    consentBox.checked = false; /* survives a browser restoring form state */
    consentBox.addEventListener("change", syncSubmitState);
  }
  syncSubmitState();

  /* ---- validation ---- */
  function fieldOf(input) { return input.closest(".field") || input.closest(".consent"); }

  function setError(input, on) {
    var wrap = fieldOf(input);
    if (!wrap) return;
    wrap.classList.toggle("has-error", on);
    input.setAttribute("aria-invalid", on ? "true" : "false");
  }

  function validPhone(value) {
    /* Deliberately permissive: Greek landlines and mobiles, with or without
       +30, spaces, dots or dashes. We are not the phone network's validator. */
    var digits = value.replace(/[^\d]/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
  }

  function validate() {
    var problems = [];
    var name = form.elements.name;
    var phone = form.elements.phone;
    var email = form.elements.email;
    var animal = form.elements.animal;

    var nameOk = name.value.trim().length >= 2;
    setError(name, !nameOk);
    if (!nameOk) problems.push(name);

    var phoneOk = validPhone(phone.value);
    setError(phone, !phoneOk);
    if (!phoneOk) problems.push(phone);

    var emailOk = email.value.trim() === "" || validEmail(email.value.trim());
    setError(email, !emailOk);
    if (!emailOk) problems.push(email);

    var animalOk = animal.value !== "";
    setError(animal, !animalOk);
    if (!animalOk) problems.push(animal);

    var dateOk = true;
    if (dateInput && dateInput.value) {
      dateOk = dateInput.value >= dateInput.min;
    }
    if (dateInput) setError(dateInput, !dateOk);
    if (!dateOk) problems.push(dateInput);

    var consentOk = consentBox.checked;
    setError(consentBox, !consentOk);
    if (!consentOk) problems.push(consentBox);

    return problems;
  }

  /* Clear a field's error as soon as the visitor starts fixing it. */
  form.addEventListener("input", function (event) {
    var el = event.target;
    if (el.getAttribute("aria-invalid") === "true") setError(el, false);
  });

  /* ---- status messages ---- */
  var ICONS = { ok: "#i-check-circle", err: "#i-alert", info: "#i-info" };

  function showStatus(kind, messageKey) {
    if (!statusBox) return;
    statusBox.classList.remove("form-status--ok", "form-status--err", "form-status--info");
    statusBox.classList.add("is-visible", "form-status--" + kind);
    if (statusIcon) statusIcon.setAttribute("href", ICONS[kind] || ICONS.info);
    statusText.textContent = t(messageKey);
    statusBox.setAttribute("data-status-key", messageKey);
  }

  /* Keep a shown message translated when the language is switched. */
  document.addEventListener("vetcare:langchange", function () {
    var key = statusBox && statusBox.getAttribute("data-status-key");
    if (key && statusText) statusText.textContent = t(key);
  });

  function collect() {
    var f = form.elements;
    return {
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim(),
      animal: f.animal.options[f.animal.selectedIndex].text,
      date: dateInput ? dateInput.value : "",
      slot: f.slot.options[f.slot.selectedIndex].text,
      message: f.message.value.trim(),
      language: window.VetCareI18n ? window.VetCareI18n.lang : "el",
      to: CLINIC_EMAIL
    };
  }

  function mailtoFallback(data) {
    var subject = "Αίτημα ραντεβού — " + data.name;
    var lines = [
      "Ονοματεπώνυμο / Name: " + data.name,
      "Τηλέφωνο / Phone: " + data.phone,
      "Email: " + (data.email || "—"),
      "Ζώο / Animal: " + data.animal,
      "Ημερομηνία / Date: " + (data.date || "—"),
      "Ώρα / Time: " + data.slot,
      "",
      "Μήνυμα / Message:",
      data.message || "—"
    ];
    window.location.href =
      "mailto:" + CLINIC_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    /* Honeypot: a real person never fills a field they cannot see. Pretend
       success so a bot learns nothing, and send nothing at all. */
    if (form.elements.website && form.elements.website.value !== "") {
      showStatus("ok", "booking.status.ok");
      return;
    }

    var problems = validate();
    if (problems.length) {
      problems[0].focus();
      return;
    }

    var data = collect();

    if (!ENDPOINT) {
      showStatus("info", "booking.status.mail");
      mailtoFallback(data);
      return;
    }

    showStatus("info", "booking.status.sending");
    submitBtn.disabled = true;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        showStatus("ok", "booking.status.ok");
        form.reset();
        consentBox.checked = false;
      })
      .catch(function () {
        /* Never lose the visitor's request: offer the email route instead. */
        showStatus("err", "booking.status.err");
      })
      .then(function () {
        syncSubmitState();
      });
  });
})();
