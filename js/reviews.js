/* ==========================================================================
   SITRIXWEB — review submission
   The star input, validation, and the submitted-review flow.

   Submitted reviews are sent to me for moderation (endpoint or email
   fallback) and the writer keeps seeing their own copy on the page, flagged
   "Awaiting publication". That copy survives a reload only if the visitor
   allowed the "Preferences" cookie category; either way it lives on their
   device alone and is never shown to other visitors. Publishing a name and
   company is a separate, explicitly ticked consent (privacy.html §3).
   ========================================================================== */
(() => {
  "use strict";

  const form = document.getElementById("reviewForm");
  const strip = document.getElementById("reviewStrip");
  if (!form || !strip) return;

  const F = window.SitrixForm;
  const KEY = "sitrix_my_reviews_v1";

  /* ---------------- star input ---------------- */
  const stars = form.querySelector(".stars-input");
  const starInputs = Array.from(stars.querySelectorAll("input"));
  function paintStars() {
    const val = Number((starInputs.find((i) => i.checked) || {}).value || 0);
    stars.classList.toggle("is-set", val > 0);
    Array.from(stars.querySelectorAll("label")).forEach((l) => {
      l.classList.toggle("on", Number(l.dataset.value) <= val);
    });
  }
  starInputs.forEach((i) => i.addEventListener("change", () => {
    paintStars();
    F.clear(stars.closest(".field"));
  }));
  paintStars();

  /* ---------------- rendering ---------------- */
  function starSvg(filled) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" class="' + (filled ? "" : "off") +
      '" fill="currentColor"><path d="M12 2.6l2.6 6 6.5.5-4.9 4.2 1.5 6.3L12 16.2l-5.7 3.4 1.5-6.3L2.9 9.1l6.5-.5z"/></svg>';
  }
  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  function cardHtml(r) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += starSvg(i <= r.rating);
    return '<div class="review__stars" role="img" aria-label="' + r.rating + ' out of 5">' + s + "</div>" +
      '<p class="review__text">' + escapeHtml(r.text) + "</p>" +
      '<div class="review__who">' +
        '<span class="review__avatar" aria-hidden="true">' + escapeHtml(initials(r.name)) + "</span>" +
        "<span><span class=\"review__name\">" + escapeHtml(r.name) + "</span>" +
        (r.company ? '<span class="review__co">' + escapeHtml(r.company) + "</span>" : "") + "</span>" +
        '<span class="review__pending">Awaiting publication</span>' +
      "</div>";
  }

  function addCard(r) {
    const el = document.createElement("article");
    el.className = "review";
    el.dataset.reveal = "card";
    el.innerHTML = cardHtml(r);
    strip.prepend(el);
    requestAnimationFrame(() => el.classList.add("is-in"));
  }

  // Keeping the visitor's own copy is the "Preferences" category in the
  // cookie policy, so it only happens if they actually allowed it.
  function mayStore() {
    try {
      const c = JSON.parse(localStorage.getItem("sitrix_consent_v1") || "null");
      return !!(c && c.preferences);
    } catch (e) { return false; }
  }

  function stored() {
    if (!mayStore()) return [];
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  // Anything this visitor submitted earlier comes back on their next visit.
  stored().slice().reverse().forEach(addCard);

  /* ---------------- submit ---------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (F.isBot(form)) return;

    const name = form.querySelector("#rvName");
    const company = form.querySelector("#rvCompany");
    const text = form.querySelector("#rvText");
    const consent = form.querySelector("#rvConsent");
    [name, company, text, consent, stars].forEach((el) => F.clear(el.closest(".field")));

    const rating = Number((starInputs.find((i) => i.checked) || {}).value || 0);

    let ok = true;
    if (!rating) ok = F.invalid(stars.closest(".field"), "Pick a rating from one to five stars.");
    if (!name.value.trim()) ok = F.invalid(name.closest(".field"), "A name (or first name) please.");
    if (text.value.trim().length < 15) {
      ok = F.invalid(text.closest(".field"), "A sentence or two would help — 15 characters minimum.");
    }
    if (!consent.checked) {
      ok = F.invalid(consent.closest(".field"), "I need your permission before publishing this.");
    }
    if (!ok) return;

    const review = {
      rating,
      name: name.value.trim(),
      company: company.value.trim(),
      text: text.value.trim(),
      at: new Date().toISOString(),
    };

    const submit = form.querySelector('button[type="submit"]');
    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = "Sending…";

    try {
      const res = await F.send({
        type: "client-review",
        rating: review.rating,
        name: review.name,
        company: review.company,
        review: review.text,
        consent: "Publication consent given on " + review.at,
      }, "New review from " + review.name);

      if (mayStore()) {
        try {
          const all = stored();
          all.push(review);
          localStorage.setItem(KEY, JSON.stringify(all.slice(-5)));
        } catch (err) { /* private mode — the card still shows for this session */ }
      }

      addCard(review);
      form.hidden = true;
      const success = document.getElementById("reviewSuccess");
      success.classList.add("is-on");
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
      strip.scrollTo({ left: 0, behavior: "smooth" });
    } catch (err) {
      submit.disabled = false;
      submit.textContent = label;
      F.invalid(text.closest(".field"), "That didn't send. Please email it to me instead and I'll add it.");
    }
  });
})();
