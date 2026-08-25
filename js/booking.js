/* ==========================================================================
   Ermis' Villas — booking enquiry flow
   --------------------------------------------------------------------------
   Four steps, validated one at a time, with a running summary. Deliberately an
   enquiry rather than a checkout: no card, no payment, no availability
   calendar pretending to know things it doesn't.

   Submission has two routes. With EV.FORM_ENDPOINT set it POSTs there. With it
   empty — which is how this ships — it composes the same enquiry into an email
   and opens the visitor's mail client, so the form is genuinely usable on a
   static host with no backend at all. Both routes end in the same confirmation.
   ========================================================================== */
(() => {
  "use strict";

  const form = document.getElementById('bookingForm');
  if (!form) return;

  const ESTATES  = (window.EV && window.EV.ESTATES)  || [];
  const CARS     = (window.EV && window.EV.CARS)     || [];
  const SERVICES = (window.EV && window.EV.SERVICES) || [];
  const BUSINESS = (window.EV && window.EV.BUSINESS) || {};
  const ENDPOINT = (window.EV && window.EV.FORM_ENDPOINT) || '';

  const DRAFT_KEY = 'ev_booking_draft';

  const el = (id) => document.getElementById(id);
  const steps      = el('steps');
  const stepEls    = Array.from(form.querySelectorAll('[data-step]'));
  const estateSel  = el('estate');
  const servicePicks = el('servicePicks');
  const carPicks   = el('carPicks');
  const transferBlock = el('transferBlock');
  const review     = el('review');
  const done       = el('done');

  let current = 1;

  /* ------------------------------------------------------------------
     Build the options that come from data.js
     ------------------------------------------------------------------ */
  ESTATES.forEach((e) => {
    const o = document.createElement('option');
    o.value = e.id;
    o.textContent = `${e.name} — ${e.place} · sleeps ${e.sleeps}`;
    estateSel.appendChild(o);
  });

  servicePicks.innerHTML = SERVICES.map((s) => `
    <label class="pick">
      <input type="checkbox" name="service" value="${s.id}"${s.id === 'concierge' ? ' checked disabled' : ''}>
      <span><b>${s.label}</b><small>${s.hint}</small></span>
    </label>`).join('');

  carPicks.innerHTML = CARS.map((c, i) => `
    <label class="pick">
      <input type="radio" name="car" value="${c.id}"${i === 0 ? ' checked' : ''}>
      <span><b>${c.name}</b><small>${c.note}</small></span>
    </label>`).join('');

  /* Dates: never in the past, and departure always after arrival. */
  const arrive = el('arrive'), depart = el('depart');
  const todayISO = new Date().toISOString().slice(0, 10);
  arrive.min = todayISO;
  depart.min = todayISO;
  arrive.addEventListener('change', () => {
    depart.min = arrive.value || todayISO;
    if (depart.value && depart.value <= arrive.value) depart.value = '';
    update();
  });

  /* Pre-select an estate from the link that got them here
     (booking.html?estate=kyma). */
  const wanted = new URLSearchParams(location.search).get('estate');
  if (wanted && ESTATES.some((e) => e.id === wanted)) estateSel.value = wanted;

  /* ------------------------------------------------------------------
     Draft: keep what has been typed if the page is reloaded mid-form.
     sessionStorage, cleared on submit — this is the "strictly necessary"
     storage the consent banner describes, so it needs no opt-in.
     ------------------------------------------------------------------ */
  function saveDraft() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collect()));
    } catch (e) { /* private mode — the form still works, it just won't persist */ }
  }

  function loadDraft() {
    let d;
    try { d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { return; }
    if (!d) return;
    ['estate', 'arrive', 'depart', 'adults', 'children', 'pickup', 'flight',
     'name', 'country', 'email', 'phone', 'notes'].forEach((k) => {
      if (el(k) && d[k]) el(k).value = d[k];
    });
    if (wanted) estateSel.value = wanted;   // an explicit link still wins
    if (Array.isArray(d.services)) {
      form.querySelectorAll('input[name="service"]').forEach((i) => {
        if (!i.disabled) i.checked = d.services.indexOf(i.value) !== -1;
      });
    }
    if (d.car) {
      const c = form.querySelector(`input[name="car"][value="${d.car}"]`);
      if (c) c.checked = true;
    }
  }

  /* ------------------------------------------------------------------
     Reading the form
     ------------------------------------------------------------------ */
  function collect() {
    const services = Array.from(form.querySelectorAll('input[name="service"]'))
      .filter((i) => i.checked).map((i) => i.value);
    const car = form.querySelector('input[name="car"]:checked');
    return {
      estate: estateSel.value,
      arrive: arrive.value,
      depart: depart.value,
      adults: el('adults').value,
      children: el('children').value,
      services: services,
      car: car ? car.value : '',
      pickup: el('pickup').value.trim(),
      flight: el('flight').value.trim(),
      name: el('name').value.trim(),
      country: el('country').value.trim(),
      email: el('email').value.trim(),
      phone: el('phone').value.trim(),
      notes: el('notes').value.trim(),
      news: el('news').checked
    };
  }

  const estateById = (id) => ESTATES.filter((e) => e.id === id)[0] || null;
  const carById    = (id) => CARS.filter((c) => c.id === id)[0] || null;
  const serviceById= (id) => SERVICES.filter((s) => s.id === id)[0] || null;

  function nightsBetween(a, b) {
    if (!a || !b) return 0;
    const ms = new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00');
    return ms > 0 ? Math.round(ms / 86400000) : 0;
  }

  const euro = (n) => '€' + n.toLocaleString('en-GB');

  function prettyDate(iso) {
    if (!iso) return '';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ------------------------------------------------------------------
     Summary
     ------------------------------------------------------------------ */
  function update() {
    const d = collect();
    const est = estateById(d.estate);
    const nights = nightsBetween(d.arrive, d.depart);

    el('sumEstate').textContent = est ? est.name : 'No house chosen';
    el('sumPlace').textContent  = est ? est.place : 'Four to choose from';

    const rows = [];
    if (d.arrive && d.depart) {
      rows.push(['Dates', prettyDate(d.arrive) + ' → ' + prettyDate(d.depart)]);
      rows.push(['Nights', String(nights)]);
    }
    const guests = (parseInt(d.adults, 10) || 0) + (parseInt(d.children, 10) || 0);
    if (guests) {
      rows.push(['Guests', d.children > 0
        ? `${d.adults} adults, ${d.children} children` : `${d.adults} adults`]);
    }
    if (est && guests > est.sleeps) {
      rows.push(['Note', `${est.name} sleeps ${est.sleeps}`]);
    }
    d.services.forEach((s) => {
      const svc = serviceById(s);
      if (svc) rows.push([svc.label, s === 'concierge' ? 'Included' : 'Quoted']);
    });
    if (d.services.indexOf('transfer') !== -1 && d.car) {
      const c = carById(d.car);
      if (c) rows.push(['Car', c.name]);
    }

    el('sumRows').innerHTML = rows.map(([k, v]) =>
      `<div class="summary__row"><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    const total = est && nights ? est.from * nights : 0;
    el('sumTotal').textContent = total ? euro(total) : '—';
    el('barTotal').textContent = total ? euro(total) : '—';
    el('barLine').textContent = est
      ? (nights ? `${est.name} · ${nights} nights` : `${est.name} · choose your dates`)
      : 'Choose a house and your dates';

    saveDraft();
  }

  form.addEventListener('input', update);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'service' || e.target.name === 'car') {
      const wantsTransfer = form.querySelector('input[name="service"][value="transfer"]');
      transferBlock.classList.toggle('is-shown', !!(wantsTransfer && wantsTransfer.checked));
    }
    update();
  });

  /* ------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------ */
  function setError(id, on) {
    const input = el(id);
    if (!input) return;
    const field = input.closest('.field');
    if (field) field.classList.toggle('has-error', on);
    input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateStep(n) {
    const d = collect();
    let ok = true;
    const fail = (id) => { setError(id, true); ok = false; };

    if (n === 1) {
      setError('estate', false); setError('arrive', false);
      setError('depart', false); setError('adults', false);

      if (!d.estate) fail('estate');
      if (!d.arrive || d.arrive < todayISO) fail('arrive');
      if (!d.depart || nightsBetween(d.arrive, d.depart) < 1) fail('depart');
      if (!(parseInt(d.adults, 10) >= 1)) fail('adults');
    }

    if (n === 3) {
      setError('name', false); setError('email', false); setError('phone', false);
      if (!d.name) fail('name');
      if (!EMAIL_RE.test(d.email)) fail('email');
      // Deliberately loose: international numbers take too many shapes to
      // pattern-match without rejecting somebody real.
      if (d.phone.replace(/[^\d]/g, '').length < 6) fail('phone');
    }

    if (!ok) {
      const firstBad = form.querySelector('.step.is-active .has-error input, .step.is-active .has-error select');
      if (firstBad) { firstBad.focus(); }
    }
    return ok;
  }

  /* ------------------------------------------------------------------
     Step navigation
     ------------------------------------------------------------------ */
  function show(n, moveFocus) {
    current = n;
    stepEls.forEach((s) => {
      const on = Number(s.dataset.step) === n;
      s.classList.toggle('is-active', on);
      s.hidden = !on;
    });
    Array.from(steps.children).forEach((li, i) => {
      li.classList.toggle('is-now', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
      // Tells assistive tech which of the four we are on, rather than leaving
      // the state entirely to colour.
      if (i + 1 === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    if (n === 4) buildReview();

    // Bring the top of the form into view, but never scroll the page on the
    // very first render.
    const top = form.getBoundingClientRect().top + window.scrollY - 130;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

    // Moving focus to the new step's heading is what announces the change.
    // A live region would talk over the visitor; this just re-orients them.
    if (moveFocus) {
      const heading = stepEls[n - 1] && stepEls[n - 1].querySelector('h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) {
      if (validateStep(current)) show(Math.min(4, current + 1), true);
    }
    if (e.target.closest('[data-back]')) show(Math.max(1, current - 1), true);
  });

  /* Enter inside a field used to fire the form's implicit submission — which
     meant the submit handler ran from step 1, flagged the consent box the
     visitor could not see yet, and tried to focus a hidden checkbox. On a
     multi-step form Enter should mean "next", and only mean "send" on the last
     step where the send button actually is. */
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON') return;
    if (current < 4) {
      e.preventDefault();
      if (validateStep(current)) show(Math.min(4, current + 1), true);
    }
  });

  /* ------------------------------------------------------------------
     Review
     ------------------------------------------------------------------ */
  function reviewRows() {
    const d = collect();
    const est = estateById(d.estate);
    const nights = nightsBetween(d.arrive, d.depart);
    const rows = [
      ['The house', est ? `${est.name}, ${est.place}` : '—'],
      ['Dates', `${prettyDate(d.arrive)} → ${prettyDate(d.depart)} · ${nights} nights`],
      ['Guests', d.children > 0 ? `${d.adults} adults, ${d.children} children` : `${d.adults} adults`]
    ];

    const svcLabels = d.services.map((s) => (serviceById(s) || {}).label).filter(Boolean);
    rows.push(['Extras', svcLabels.length ? svcLabels.join(' · ') : 'None beyond the concierge line']);

    if (d.services.indexOf('transfer') !== -1) {
      const c = carById(d.car);
      rows.push(['Car', c ? c.name : '—']);
      if (d.pickup) rows.push(['Picking up from', d.pickup]);
      if (d.flight) rows.push(['Flight or crossing', d.flight]);
    }

    rows.push(['Name', d.name]);
    rows.push(['Email', d.email]);
    rows.push(['Phone', d.phone]);
    if (d.country) rows.push(['Travelling from', d.country]);
    if (d.notes) rows.push(['Notes', d.notes]);
    if (est && nights) rows.push(['Indicative', `${euro(est.from * nights)} — accommodation only, before tax`]);
    return rows;
  }

  function buildReview() {
    review.innerHTML = reviewRows().map(([k, v]) =>
      `<div class="review__row"><dt>${k}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join('');
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /* ------------------------------------------------------------------
     Submit
     ------------------------------------------------------------------ */
  function reference() {
    const d = new Date();
    const stamp = String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const tail = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `EV-${stamp}-${tail}`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Honeypot: a bot filled the invisible field, so quietly do nothing.
    if (form.querySelector('input[name="company"]').value) return;

    const consent = el('bookingConsent');
    el('consentError').style.display = consent.checked ? 'none' : 'block';
    if (!consent.checked) { consent.focus(); return; }
    if (!validateStep(1) || !validateStep(3)) { show(1); return; }

    const ref = reference();
    const payload = Object.assign({ reference: ref, sentAt: new Date().toISOString() },
                                  collect());

    const btn = el('submitBtn');
    btn.setAttribute('aria-disabled', 'true');
    btn.textContent = 'Sending…';

    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((r) => { if (!r.ok) throw new Error('bad status ' + r.status); finish(ref, false); })
        .catch(() => { openMail(ref); finish(ref, true); });
    } else {
      openMail(ref);
      finish(ref, true);
    }
  });

  function openMail(ref) {
    const lines = reviewRows().map(([k, v]) => `${k}: ${v}`);
    lines.unshift(`Reference: ${ref}`, '');
    if (collect().news) lines.push('', 'Happy to hear about dates opening up: yes');
    const body = lines.join('\n').slice(0, 1800);   // mailto URLs have limits
    const to = BUSINESS.email || '';
    const subject = `Booking enquiry ${ref}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function finish(ref, viaMail) {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    form.hidden = true;
    steps.hidden = true;
    el('doneRef').textContent = ref;
    el('mailFallback').style.display = viaMail ? 'block' : 'none';
    done.classList.add('is-shown');
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---- Go ---- */
  loadDraft();
  const t = form.querySelector('input[name="service"][value="transfer"]');
  if (t && t.checked) transferBlock.classList.add('is-shown');
  update();
})();
