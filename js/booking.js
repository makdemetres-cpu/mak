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
     Leave ENDPOINT empty and the form works in "email app" mode: it opens the
     visitor's own mail client with everything pre-filled, and shows a copy /
     email / phone escape hatch in case no mail client answers. Nothing is ever
     silently lost, but nothing arrives automatically either.

     To have requests arrive by themselves, point ENDPOINT at something that
     accepts a JSON POST. On Hostinger (or any PHP host) that is one line:

       var ENDPOINT = "send.php";

     send.php ships with this site, ready to use — see the comments at the top
     of that file for the two things to check before switching it on. Other
     options, if you ever move host:

       Formspree:  https://formspree.io/f/XXXXXXX      (create form → copy ID)
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
  var fallback = document.getElementById("bf-fallback");
  var copyBtn = document.getElementById("bf-copy");
  var copiedMsg = document.getElementById("bf-copied");
  var mailLink = document.getElementById("bf-mailto");
  var mailNote = document.getElementById("bf-mail-note");

  /* The "we'll open your email app" note only makes sense in email-app mode. */
  if (mailNote && ENDPOINT) mailNote.hidden = true;

  function t(key) {
    return window.VetCareI18n ? window.VetCareI18n.t(key) : "";
  }

  /* How far ahead the clinic takes appointments through the website. Beyond
     this the visitor is asked to phone instead — the diary that far out is not
     something a form can sensibly hold. This is the single source of truth:
     the calendar in js/ui-controls.js reads it back off the input. */
  var MAX_DAYS_AHEAD = 45;

  function isoOf(date) {
    return date.getFullYear() +
      "-" + String(date.getMonth() + 1).padStart(2, "0") +
      "-" + String(date.getDate()).padStart(2, "0");
  }

  /* A date in the past is never a useful preference, and neither is one past
     the booking window. */
  if (dateInput) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    dateInput.min = isoOf(today);
    dateInput.max = isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_DAYS_AHEAD));
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

    /* Checked again here, not just in the calendar: the underlying input can
       still be set directly, and the message differs for each end. */
    var dateOk = true;
    var dateTooFar = false;
    if (dateInput && dateInput.value) {
      if (dateInput.value < dateInput.min) {
        dateOk = false;
      } else if (dateInput.max && dateInput.value > dateInput.max) {
        dateOk = false;
        dateTooFar = true;
      }
    }
    if (dateInput) {
      var dateErr = document.getElementById("bf-date-err");
      if (dateErr) dateErr.textContent = t(dateTooFar ? "booking.err.dateMax" : "booking.err.date");
      setError(dateInput, !dateOk);
    }
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

  /* One plain-text rendering of the request, reused by the mail body and by
     the copy button — so whatever route the visitor takes, we send the same
     thing and the clinic sees a consistent message. */
  function asText(data) {
    return [
      "Ονοματεπώνυμο / Name: " + data.name,
      "Τηλέφωνο / Phone: " + data.phone,
      "Email: " + (data.email || "—"),
      "Ζώο / Animal: " + data.animal,
      "Ημερομηνία / Date: " + (data.date || "—"),
      "Ώρα / Time: " + data.slot,
      "",
      "Μήνυμα / Message:",
      data.message || "—"
    ].join("\n");
  }

  function mailtoUrl(data) {
    return "mailto:" + CLINIC_EMAIL +
      "?subject=" + encodeURIComponent("Αίτημα ραντεβού — " + data.name) +
      "&body=" + encodeURIComponent(asText(data));
  }

  /* Opening a mailto: by assigning location.href can leave the page in a
     half-navigated state in some browsers; a synthetic anchor click does not. */
  function openMailClient(url) {
    var a = document.createElement("a");
    a.href = url;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    window.setTimeout(function () { document.body.removeChild(a); }, 0);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    /* Fallback for plain-http previews, where the async clipboard is blocked. */
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var okCopy = false;
      try { okCopy = document.execCommand("copy"); } catch (e) { okCopy = false; }
      document.body.removeChild(ta);
      okCopy ? resolve() : reject(new Error("copy unavailable"));
    });
  }

  var lastRequestText = "";

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (!lastRequestText) return;
      copyText(lastRequestText).then(
        function () {
          if (copiedMsg) copiedMsg.hidden = false;
        },
        function () {
          /* Could not copy: select the message so the visitor can do it. */
          showStatus("err", "booking.status.mailNone");
        }
      );
    });
  }

  function showFallback(data) {
    lastRequestText = asText(data);
    if (mailLink) mailLink.href = mailtoUrl(data);
    if (copiedMsg) copiedMsg.hidden = true;
    if (fallback) fallback.hidden = false;
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
      /* Selects and the date input are hidden behind branded controls; focus
         has to land on the visible button, not the element behind it. */
      var first = problems[0];
      (first.customFocusTarget || first).focus();
      return;
    }

    var data = collect();

    /* ---- email-app mode: no server, so be honest about what happened ---- */
    if (!ENDPOINT) {
      showFallback(data);

      /* If a mail client takes over, the page loses focus or is hidden. If
         neither happens within a moment, nothing opened — say so plainly
         instead of claiming an email is on its way. */
      var handedOff = false;
      var noteHandoff = function () { handedOff = true; };
      window.addEventListener("blur", noteHandoff, { once: true });
      window.addEventListener("pagehide", noteHandoff, { once: true });
      document.addEventListener("visibilitychange", function onVis() {
        if (document.hidden) {
          handedOff = true;
          document.removeEventListener("visibilitychange", onVis);
        }
      });

      openMailClient(mailtoUrl(data));

      showStatus("info", "booking.status.mailOpened");
      window.setTimeout(function () {
        window.removeEventListener("blur", noteHandoff);
        window.removeEventListener("pagehide", noteHandoff);
        if (!handedOff) showStatus("err", "booking.status.mailNone");
      }, 1500);
      return;
    }

    /* ---- endpoint mode: a real submission ---- */
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
        if (fallback) fallback.hidden = true;
        form.reset();
        consentBox.checked = false;
      })
      .catch(function () {
        /* Never lose the visitor's request: offer every other route instead. */
        showStatus("err", "booking.status.err");
        showFallback(data);
      })
      .then(function () {
        syncSubmitState();
      });
  });
})();
