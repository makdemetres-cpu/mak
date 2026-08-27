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
  const estatePick = el('estatePick');
  const servicePicks = el('servicePicks');
  const carPicks   = el('carPicks');
  const transferBlock = el('transferBlock');
  const review     = el('review');
  const done       = el('done');

  let current = 1;

  /* ------------------------------------------------------------------
     Build the options that come from data.js
     ------------------------------------------------------------------ */
  /* The hairline drawings that stand in for each estate elsewhere on the site.
     Keyed by the `glyph` field in data.js so a new estate only has to name one
     of these — or add one here alongside its entry. */
  const GLYPHS = {
    headland: '<circle cx="150" cy="20" r="9"/><path d="M0 46h200"/>' +
              '<path d="M8 46c14-2 22-10 34-19s24-11 36-4 20 20 34 23"/>' +
              '<path d="M0 54h64M84 54h52M156 54h44"/><path d="M0 60h40M60 60h84M164 60h36"/>',
    olives:   '<path d="M0 50h200M0 58h200"/><ellipse cx="34" cy="30" rx="20" ry="11"/>' +
              '<path d="M34 41v9"/><ellipse cx="96" cy="24" rx="25" ry="13"/><path d="M96 37v13"/>' +
              '<ellipse cx="160" cy="31" rx="18" ry="10"/><path d="M160 41v9"/>',
    cove:     '<path d="M0 26c26 0 44 8 56 20"/><path d="M200 20c-30 2-52 12-66 26"/>' +
              '<path d="M40 52h120"/><path d="M28 58h150"/><path d="M74 46h56"/>' +
              '<circle cx="102" cy="16" r="6"/>',
    vines:    '<path d="M0 44h200M0 56h200"/><path d="M18 44V26M42 44V22M66 44V25M90 44V21M114 44V24"/>' +
              '<path d="M10 30h112"/><path d="M150 44v-8h34v8"/><path d="M160 36V22h14v14"/>'
  };

  const money = (n) => '€' + Number(n).toLocaleString('en-GB');

  /* --------------------------------------------------------------------
     One house, or all four
     --------------------------------------------------------------------
     Arriving from an estate page — booking.html?estate=thalassa — books that
     house and only that house. Arriving at booking.html plain shows all four
     to choose between.

     The rule is the URL and nothing else, so the two states can never
     disagree with each other. An unrecognised id is ignored rather than
     locking the form to a house that does not exist.

     Every page's header "Reserve" button points at the plain page, including
     the estate pages': the header is the one control that must never lock you
     into anything.
     -------------------------------------------------------------------- */
  const wanted = new URLSearchParams(location.search).get('estate');
  const lockedTo = ESTATES.some((e) => e.id === wanted) ? wanted : '';

  function cardHTML(e, i, locked) {
    const inner = `
      <span class="estate-card__body">
        <span class="estate-card__glyph" aria-hidden="true">
          <svg viewBox="0 0 200 64" fill="none" stroke="currentColor" stroke-width="1"
               vector-effect="non-scaling-stroke">${GLYPHS[e.glyph] || ''}</svg>
        </span>
        <span class="estate-card__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <span class="estate-card__name">${e.name}</span>
        <span class="estate-card__place">${e.place}</span>
        <span class="estate-card__meta">
          <span>Sleeps ${e.sleeps}</span><span>${e.bedrooms} bedrooms</span><span>${e.baths} baths</span>
        </span>
        <span class="estate-card__from">from <b>${money(e.from)}</b> / night</span>
        <span class="estate-card__tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
               stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
        </span>
      </span>`;

    // Locked, there is no choice to make, so it is not a radio and not a
    // label. Rendering one lonely radio that cannot be unpicked would be
    // offering a decision that does not exist.
    return locked
      ? `<div class="estate-card estate-card--locked">${inner}</div>`
      : `<label class="estate-card"><input type="radio" name="estate" value="${e.id}" required>${inner}</label>`;
  }

  if (lockedTo) {
    const e = ESTATES.filter((x) => x.id === lockedTo)[0];
    const i = ESTATES.indexOf(e);
    estatePick.innerHTML = cardHTML(e, i, true);
    estatePick.removeAttribute('role');          // a group of one is not a radiogroup
    estatePick.classList.add('estate-pick--one');
  } else {
    estatePick.innerHTML = ESTATES.map((e, i) => cardHTML(e, i, false)).join('');
  }

  const getEstate = () => {
    if (lockedTo) return lockedTo;
    const hit = form.querySelector('input[name="estate"]:checked');
    return hit ? hit.value : '';
  };
  const setEstate = (id) => {
    if (lockedTo) return;                        // the URL decides, nothing else
    const hit = form.querySelector(`input[name="estate"][value="${id}"]`);
    if (hit) hit.checked = true;
  };

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

  /* ------------------------------------------------------------------
     Dates
     ------------------------------------------------------------------
     One range calendar (js/calendar.js) writing into two hidden inputs, so
     everything downstream — the draft, the summary, validation, the email —
     still reads `arrive` and `depart` exactly as it did when these were a
     pair of native date fields.

     The window is today to 90 days out, and it applies to both ends of the
     range rather than only the arrival. A stay that starts on day 88 is
     therefore necessarily a short one, which is what a hard booking window
     means.
     ------------------------------------------------------------------ */
  const BOOKING_WINDOW_DAYS = 90;

  const arrive = el('arrive'), depart = el('depart');
  const DH = window.EV.dateHelpers;
  // Local calendar day, not `new Date().toISOString()` — that is UTC, and in
  // Greece it names yesterday for the first two or three hours of the morning.
  const todayISO = DH ? DH.iso(DH.today()) : new Date().toISOString().slice(0, 10);

  const dateTrigger = el('dateTrigger');
  let calendar = null;

  function paintDates() {
    const a = arrive.value, b = depart.value;
    const pretty = (v) => (DH && v) ? DH.shortDate(DH.fromISO(v)) : '';
    el('dateFromText').textContent = a ? pretty(a) : 'Choose a date';
    el('dateToText').textContent   = b ? pretty(b) : 'Choose a date';

    const n = nightsBetween(a, b);
    el('dateNights').textContent = n ? (n + (n === 1 ? ' night' : ' nights')) : '';
    dateTrigger.classList.toggle('is-set', !!(a && b));

    el('dateReadout').textContent = (a && b)
      ? `${n} ${n === 1 ? 'night' : 'nights'}, ${prettyDate(a)} to ${prettyDate(b)}`
      : (a ? `Arriving ${prettyDate(a)}, no departure chosen yet` : 'No dates chosen yet');
  }

  if (window.EV.createRangeCalendar && dateTrigger) {
    calendar = window.EV.createRangeCalendar({
      trigger: dateTrigger,
      minDays: 0,
      maxDays: BOOKING_WINDOW_DAYS,
      onChange(a, b) {
        arrive.value = a;
        depart.value = b;
        paintDates();
        if (a && b) setError('arrive', false);
        update();
      }
    });
    el('dateHint').textContent =
      'Any dates from today up to ' + BOOKING_WINDOW_DAYS +
      ' days ahead. Beyond that, tell us in the notes and we will answer by hand.';
  }

  /* --------------------------------------------------------------------
     Wording the two states
     --------------------------------------------------------------------
     "Which house, when, and how many of you" is the wrong question when the
     house is already settled, and the hint about choosing the closest one is
     advice about a decision that is no longer on the table. So both change,
     and the hint becomes the way back to all four.

     That link is not a hedge against the lock — it is the lock working. It
     goes to the plain booking page, which is the Reserve route, and the draft
     in sessionStorage means the dates and the guest count survive the trip.
     -------------------------------------------------------------------- */
  if (lockedTo) {
    const house = ESTATES.filter((e) => e.id === lockedTo)[0];

    const lede = form.querySelector('.step[data-step="1"] > .lede');
    if (lede) lede.textContent = 'When, and how many of you.';

    const label = el('estateLabel');
    if (label) label.innerHTML = 'Your house';

    const hint = el('estateHint');
    if (hint) {
      hint.textContent = '';
      hint.appendChild(document.createTextNode('Booking ' + house.name + '. '));
      const a = document.createElement('a');
      a.className = 'link link--sm';
      a.href = 'booking.html';
      a.textContent = 'Reserve a different house';
      hint.appendChild(a);
    }

    // The house is in the address bar, so it belongs in the title too — it is
    // what a bookmark, a shared link and a browser tab will show.
    document.title = 'Book ' + house.name + ' — Ermis’ Villas';
  }

  /* ------------------------------------------------------------------
     Guest steppers
     ------------------------------------------------------------------
     The number input stays underneath and stays typeable — the buttons are an
     easier way to reach the same value, not a replacement for it. Everything
     goes through `input` events so the summary and the draft update the same
     way they do for any other field.
     ------------------------------------------------------------------ */
  function nudge(input, by) {
    const min = Number(input.min || 0), max = Number(input.max || 99);
    const now = parseInt(input.value, 10);
    const next = Math.min(max, Math.max(min, (isNaN(now) ? min : now) + by));
    if (next === now) return;
    input.value = String(next);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function paintSteppers() {
    form.querySelectorAll('[data-stepper]').forEach((wrap) => {
      const input = wrap.querySelector('.stepper__value');
      const now = parseInt(input.value, 10);
      const min = Number(input.min || 0), max = Number(input.max || 99);
      wrap.querySelector('[data-step-down]').disabled = !(now > min);
      wrap.querySelector('[data-step-up]').disabled = !(now < max);
    });
  }

  form.querySelectorAll('[data-stepper]').forEach((wrap) => {
    const input = wrap.querySelector('.stepper__value');
    wrap.addEventListener('click', (e) => {
      const down = e.target.closest('[data-step-down]');
      const up = e.target.closest('[data-step-up]');
      if (!down && !up) return;
      nudge(input, down ? -1 : 1);
    });
  });

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
    ['adults', 'children', 'pickup', 'flight',
     'name', 'country', 'email', 'phone', 'notes'].forEach((k) => {
      if (el(k) && d[k]) el(k).value = d[k];
    });
    if (d.estate) setEstate(d.estate);
    if (wanted) setEstate(wanted);          // an explicit link still wins

    /* Dates go back through the calendar rather than straight into the hidden
       inputs, because a draft can outlive the window it was made in: leave a
       tab open over a weekend and yesterday's arrival is now in the past. The
       calendar drops anything outside the window and hands back what it kept,
       so the form and the picker never disagree. */
    if (calendar) {
      const kept = calendar.setRange(d.arrive || '', d.depart || '');
      arrive.value = kept.from;
      depart.value = kept.to;
    } else {
      if (d.arrive) arrive.value = d.arrive;
      if (d.depart) depart.value = d.depart;
    }
    paintDates();
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
      estate: getEstate(),
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
      `<div class="sent__row"><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    const total = est && nights ? est.from * nights : 0;
    el('sumTotal').textContent = total ? euro(total) : '—';

    paintSteppers();
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
  /* Two of step one's fields no longer hold their own value: the house is a
     group of radios, and the dates are a button in front of two hidden inputs.
     So the field to mark and the thing to focus are looked up rather than
     assumed to be the element with that id. */
  function fieldFor(id) {
    if (id === 'estate') return el('estateField');
    if (id === 'arrive' || id === 'depart') return el('datesField');
    const input = el(id);
    return input ? input.closest('.field') : null;
  }

  function focusFor(id) {
    if (id === 'estate') {
      return form.querySelector('input[name="estate"]:checked') ||
             form.querySelector('input[name="estate"]');
    }
    if (id === 'arrive' || id === 'depart') return dateTrigger;
    return el(id);
  }

  function setError(id, on) {
    const field = fieldFor(id);
    if (field) field.classList.toggle('has-error', on);
    const target = focusFor(id);
    if (target) target.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validateStep(n) {
    const d = collect();
    let ok = true;
    let firstFail = null;
    const fail = (id) => { setError(id, true); ok = false; if (!firstFail) firstFail = id; };

    if (n === 1) {
      setError('estate', false); setError('arrive', false); setError('adults', false);

      if (!d.estate) fail('estate');

      // One message for the pair, because they are now one control. The window
      // check is belt and braces — the calendar cannot produce a date outside
      // it — but a stale draft or a hand-edited field should not slip past.
      const maxISO = calendar ? calendar.maxISO : '';
      const badDates = !d.arrive || !d.depart ||
                       nightsBetween(d.arrive, d.depart) < 1 ||
                       d.arrive < todayISO ||
                       (maxISO && (d.arrive > maxISO || d.depart > maxISO));
      if (badDates) fail('arrive');

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

    if (!ok && firstFail) {
      const target = focusFor(firstFail);
      if (target) target.focus();
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
    // Re-check the two steps that carry required fields. Send them back to the
    // step that actually failed — being bounced to step 1 to fix a missing
    // phone number on step 3 is how a form loses someone at the last hurdle.
    if (!validateStep(1)) { show(1); return; }
    if (!validateStep(3)) { show(3); return; }

    const ref = reference();
    const payload = Object.assign({ reference: ref, sentAt: new Date().toISOString() },
                                  collect());

    // If they arrived on a tagged link this visit, say which one. See
    // js/main.js → initCampaign and privacy.html §9.
    const campaign = window.EV.campaign && window.EV.campaign();
    if (campaign) payload.campaign = campaign;

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
    const from = window.EV.campaignLine && window.EV.campaignLine();
    if (from) lines.push('', from);
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

  /* ---- Copying the reference ----
     Clipboard access is refused outright on http:// origins and in some
     embedded browsers, so there is a selection-based fallback, and if even
     that fails we say so rather than pretending it worked. ---- */
  const refBtn = el('refCopy');
  if (refBtn) {
    const refLabel  = el('refCopyLabel');
    const refStatus = el('refCopyStatus');
    let revert;

    refBtn.addEventListener('click', () => {
      const text = el('doneRef').textContent.trim();
      if (!text) return;

      const say = (ok) => {
        clearTimeout(revert);
        refBtn.classList.toggle('is-done', ok);
        refLabel.textContent = ok ? 'Copied' : 'Copy reference';
        refStatus.textContent = ok
          ? 'Reference ' + text + ' copied to your clipboard.'
          : 'Could not reach the clipboard — select the reference and copy it by hand.';
        if (ok) {
          revert = setTimeout(() => {
            refBtn.classList.remove('is-done');
            refLabel.textContent = 'Copy reference';
            refStatus.textContent = '';
          }, 3200);
        }
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => say(true), () => say(legacyCopy(text)));
      } else {
        say(legacyCopy(text));
      }
    });
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    let ok = false;
    try {
      ta.select();
      ok = document.execCommand('copy');
    } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  /* ---- Go ---- */
  loadDraft();
  const t = form.querySelector('input[name="service"][value="transfer"]');
  if (t && t.checked) transferBlock.classList.add('is-shown');
  paintDates();
  update();
})();
