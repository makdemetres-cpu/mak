/* ==========================================================================
   Χρόνης Πέγκας Photography — enquiry form
   --------------------------------------------------------------------------
   Ships in mailto mode: with no endpoint configured the form composes the
   message in the visitor's own email client and NOTHING is transmitted to
   any third party. That is the zero-liability default, and it works the
   moment the site goes live.

   TO SWITCH ON DIRECT SENDING, put your Web3Forms access key in
   FORM_ENDPOINT_KEY below (free at https://web3forms.com, no account
   required — the key is emailed to you). Then, before publishing:

     1. Name Web3Forms as a processor in privacy.html §6 — the placeholder
        row is already written and marked, it just needs confirming.
     2. Check where that provider stores submissions. If it is outside the
        EEA you must also state the transfer safeguard (Art. 44–49 GDPR).
        An EU-hosted alternative avoids the question entirely.

   The consent checkbox is required either way. It is unticked by default
   and the form will not submit without it: pre-ticked boxes are not valid
   consent (GDPR Recital 32, and Planet49, CJEU C-673/17).
   ========================================================================== */
(function () {
  "use strict";

  var FORM_ENDPOINT_KEY = "";                      // ← Web3Forms access key
  var ENDPOINT = "https://api.web3forms.com/submit";
  var OWNER_EMAIL = "xpegkas@gmail.com";

  var form = document.getElementById("contactForm");
  if (!form) return;

  var root = document.documentElement;
  var statusEl = document.getElementById("formStatus");
  var submitBtn = form.querySelector("[type='submit']");
  var submitLabel = submitBtn ? submitBtn.querySelector("[data-btn-label]") : null;

  function t(key) {
    var S = window.XP_STRINGS || {};
    var lang = root.getAttribute("lang") === "en" ? "en" : "el";
    return (S[lang] && S[lang][key]) || "";
  }
  function fmt(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vals, k) ? vals[k] : m;
    });
  }

  /* ------------------------------------------------------------ validation */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  // Greek mobile/landline, with or without +30, spaces or dashes tolerated.
  var PHONE_RE = /^(\+?30[\s-]?)?[2-7]\d{8,9}$/;

  function setError(field, message) {
    var wrap = field.closest(".field") || field.closest(".consent-field");
    var slot = wrap ? wrap.querySelector(".field-error") : null;
    if (wrap) wrap.classList.toggle("has-error", !!message);
    if (slot) slot.textContent = message || "";
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(field) {
    var value = (field.value || "").trim();

    if (field.type === "checkbox") {
      if (field.required && !field.checked) { setError(field, t("fieldConsent")); return false; }
      setError(field, ""); return true;
    }
    if (field.required && !value) { setError(field, t("fieldRequired")); return false; }
    if (!value) { setError(field, ""); return true; }   // optional and empty

    if (field.type === "email" && !EMAIL_RE.test(value)) {
      setError(field, t("fieldEmail")); return false;
    }
    if (field.type === "tel" && !PHONE_RE.test(value.replace(/[\s-]/g, ""))) {
      setError(field, t("fieldPhone")); return false;
    }
    if (field.type === "date" && value) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(value) < today) { setError(field, t("fieldDate")); return false; }
    }
    setError(field, ""); return true;
  }

  var fields = Array.prototype.slice.call(
    form.querySelectorAll("input:not([type='hidden']):not(.hp-field), textarea, select")
  );

  fields.forEach(function (f) {
    // Validate on blur, then live once the field has already been marked bad,
    // so the visitor is not scolded while still typing their first character.
    f.addEventListener("blur", function () { validateField(f); });
    f.addEventListener("input", function () {
      var wrap = f.closest(".field") || f.closest(".consent-field");
      if (wrap && wrap.classList.contains("has-error")) validateField(f);
    });
    f.addEventListener("change", function () {
      if (f.type === "checkbox") validateField(f);
    });
  });

  /* --------------------------------------------------------------- status */
  function showStatus(title, body, ok) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.innerHTML = "";
    // textContent, never innerHTML — the visitor's own input is never
    // reflected here, and this keeps it that way if it ever is.
    var strong = document.createElement("strong");
    strong.textContent = title;
    var p = document.createElement("span");
    p.textContent = body;
    statusEl.appendChild(strong);
    statusEl.appendChild(p);
    statusEl.setAttribute("role", ok ? "status" : "alert");
    statusEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    if (submitLabel) submitLabel.textContent = busy ? t("formSending") : t("formSend");
  }

  /* ------------------------------------------------------------- fallback */
  function sendByMail(data) {
    var lines = [
      "Όνομα / Name: " + data.name,
      "Email: " + data.email,
      "Τηλέφωνο / Phone: " + (data.phone || "—"),
      "Ημερομηνία / Date: " + (data.date || "—"),
      "Τύπος / Type: " + (data.type || "—"),
      "",
      data.message
    ];
    var subject = "Website enquiry — " + data.name;
    window.location.href = "mailto:" + OWNER_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(lines.join("\n"));

    showStatus(t("formOkTitle"), fmt(t("formMailtoBody"), { email: OWNER_EMAIL }), true);
    setBusy(false);
  }

  /* --------------------------------------------------------------- submit */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: a real person never fills a field they cannot see.
    // Silently pretend success so a bot gets no signal about what happened.
    var hp = form.querySelector(".hp-field");
    if (hp && hp.value) {
      showStatus(t("formOkTitle"), t("formOkBody"), true);
      form.reset();
      return;
    }

    var valid = true;
    var firstBad = null;
    fields.forEach(function (f) {
      if (!validateField(f)) {
        valid = false;
        if (!firstBad) firstBad = f;
      }
    });
    if (!valid) {
      if (firstBad) firstBad.focus();
      return;
    }

    var data = {
      name:    (form.elements.name    || {}).value || "",
      email:   (form.elements.email   || {}).value || "",
      phone:   (form.elements.phone   || {}).value || "",
      date:    (form.elements.date    || {}).value || "",
      type:    (form.elements.type    || {}).value || "",
      message: (form.elements.message || {}).value || ""
    };

    setBusy(true);

    if (!FORM_ENDPOINT_KEY) {
      sendByMail(data);
      return;
    }

    var payload = {
      access_key: FORM_ENDPOINT_KEY,
      subject: "Website enquiry — " + data.name,
      from_name: "Πέγκας Photography website",
      name: data.name,
      email: data.email,
      phone: data.phone,
      wedding_date: data.date,
      enquiry_type: data.type,
      message: data.message,
      // Recorded alongside the message so the lawful basis for holding this
      // enquiry can be evidenced later (GDPR Art. 7(1) — the controller must
      // be able to demonstrate consent).
      consent_given_at: new Date().toISOString(),
      privacy_policy_version: "1.0"
    };

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json().catch(function () { return {}; }); })
      .then(function (out) {
        if (out && out.success) {
          showStatus(t("formOkTitle"), t("formOkBody"), true);
          form.reset();
          fields.forEach(function (f) { setError(f, ""); });
        } else {
          showStatus(t("formErrTitle"), fmt(t("formErrBody"), { email: OWNER_EMAIL }), false);
        }
      })
      .catch(function () {
        showStatus(t("formErrTitle"), fmt(t("formErrBody"), { email: OWNER_EMAIL }), false);
      })
      .then(function () { setBusy(false); });
  });
})();
