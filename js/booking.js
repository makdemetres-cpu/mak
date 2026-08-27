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
     Arrival
     ------------------------------------------------------------------
     A driver has to be sent somewhere real, at a time, to meet a named
     flight or boat. This used to be two empty text boxes, and an empty text
     box takes "jtyi45oy4" as readily as "Paros Airport" — which is exactly
     what came through. So nothing here is typed except the flight's number,
     and that is digits.

     What the lists prove: the airport is an airport, the airline is an
     airline, and "A3 352" is a well-formed designator. What they cannot
     prove is that A3 352 flies that day — see js/travel.js.
     ------------------------------------------------------------------ */
  const TRAVEL   = (window.EV && window.EV.travel) || null;
  const AIRLINES = (window.EV && window.EV.AIRLINES) || [];
  const FERRIES  = (window.EV && window.EV.FERRY_LINES) || [];

  const MODES = [
    { id: 'plane', label: 'By plane', kind: 'air' },
    { id: 'ferry', label: 'By boat',  kind: 'sea' },
    { id: 'own',   label: 'We are making our own way', kind: '' }
  ];

  const modePicks  = el('modePicks');
  const pointPicks = el('pointPicks');
  const ferryPicks = el('ferryPicks');
  let airlinePicker = null;

  if (modePicks) {
    modePicks.innerHTML = MODES.map((m) => `
      <label class="chip">
        <input type="radio" name="arriveBy" value="${m.id}">
        <span>${m.label}</span>
      </label>`).join('');
  }

  if (ferryPicks) {
    ferryPicks.innerHTML = FERRIES.map((f) => `
      <label class="chip">
        <input type="radio" name="ferryLine" value="${f.id}">
        <span>${f.name}</span>
      </label>`).join('');
  }

  const getMode  = () => { const i = form.querySelector('input[name="arriveBy"]:checked'); return i ? i.value : ''; };
  const getPoint = () => { const i = form.querySelector('input[name="arrivalPoint"]:checked'); return i ? i.value : ''; };
  const getFerry = () => { const i = form.querySelector('input[name="ferryLine"]:checked'); return i ? i.value : ''; };
  const modeById = (id) => MODES.filter((m) => m.id === id)[0] || null;

  /* The points on offer depend on both the house and the mode: a guest
     arriving at Villa Kyma is never shown a Cretan port, and someone flying
     is never shown a harbour. Rebuilt whenever either changes, keeping the
     current choice if it survives the new list. */
  function paintPoints() {
    if (!pointPicks || !TRAVEL) return;
    const mode = modeById(getMode());
    const kind = mode ? mode.kind : '';
    if (!kind) { pointPicks.innerHTML = ''; return; }

    const keep = getPoint();
    const list = TRAVEL.pointsFor(getEstate()).filter((p) => p.kind === kind);

    pointPicks.innerHTML = list.map((p) => `
      <label class="chip chip--two">
        <input type="radio" name="arrivalPoint" value="${p.id}"${p.id === keep ? ' checked' : ''}>
        <span>
          <b>${p.name}${p.code ? ` <i>${p.code}</i>` : ''}</b>
          <small>${p.sub}</small>
        </span>
      </label>`).join('');

    el('pointLegend').textContent = kind === 'air'
      ? 'Which airport are you landing at?'
      : 'Which port are you docking at?';
    el('timeField').querySelector('.field-label').textContent = kind === 'air'
      ? 'What time do you land?'
      : 'What time do you dock?';
  }

  /* Show only the parts that the chosen mode actually needs. Everything is
     hidden outright rather than disabled, so nothing half-relevant is left on
     screen for someone to wonder about. */
  function paintArrival() {
    const mode = getMode();
    const kind = (modeById(mode) || {}).kind || '';
    const on = (id, show) => { const n = el(id); if (n) n.hidden = !show; };

    on('pointField', !!kind);
    on('airField',  mode === 'plane');
    on('seaField',  mode === 'ferry');
    on('timeField', !!kind);

    const a = airlinePicker && airlinePicker.item;
    el('airlineValue').textContent = a ? `${a.label} (${a.badge})` : 'Choose your airline';
    el('airlineValue').classList.toggle('is-empty', !a);
    el('flightPrefix').textContent = a ? a.badge : '—';
  }

  if (el('airlineTrigger') && window.EV.createPicker && AIRLINES.length) {
    airlinePicker = window.EV.createPicker({
      trigger: el('airlineTrigger'),
      eyebrow: 'Your flight',
      title: 'Which airline?',
      hint: 'Name or code — "aegean", "A3"',
      empty: 'No airline of that name here. Tell us in the notes on the next step and it reaches us just the same.',
      items: AIRLINES.map((a) => ({ id: a.code, label: a.name, badge: a.code, group: a.group })),
      onChange() { paintArrival(); update(); }
    });
  }

  /* The flight number is digits, so the field only ever holds digits — a
     wrong character is refused at the keystroke rather than argued about at
     the end of the form.

     With one courtesy: almost nobody reads "A3 352" off a booking
     confirmation and then retypes half of it. Paste the whole designator and
     if the front of it is an airline we know, that airline is selected and
     the digits stay. Anything else falls through to "keep the digits". */
  if (el('flightNo')) {
    el('flightNo').addEventListener('input', (e) => {
      const raw = e.target.value;
      let out = raw.replace(/[^0-9]/g, '');

      const whole = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const m = whole.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])([1-9][0-9]{0,3})$/);
      if (m && airlinePicker && TRAVEL && TRAVEL.airlineByCode(m[1])) {
        airlinePicker.set(m[1]);
        paintArrival();
        out = m[2];
      }

      out = out.slice(0, 4);
      if (out !== raw) e.target.value = out;
    });
  }

  /* The arrival time, formatted as it is typed: digits only, a colon put in
     after the second one, and hours and minutes each held to what a clock can
     actually show. 24-hour, because "9:40" without a PM is how a driver ends
     up at the airport twelve hours early. */
  if (el('arriveTime')) {
    el('arriveTime').addEventListener('input', (e) => {
      const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
      let out = digits;
      if (digits.length >= 3) {
        let h = digits.slice(0, 2);
        let m = digits.slice(2);
        if (Number(h) > 23) h = '23';
        if (m.length === 2 && Number(m) > 59) m = '59';
        out = h + ':' + m;
      } else if (digits.length === 2 && Number(digits) > 23) {
        out = '23';
      }
      if (out !== e.target.value) e.target.value = out;
    });
  }

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
    ['adults', 'children', 'flightNo', 'arriveTime',
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

    /* The arrival, in the order the fields depend on each other: the mode
       decides which points exist, so it has to be restored before the point
       can be. An airline that has since been dropped from the list, or a
       point that does not serve the house any more, simply does not come
       back — better an empty field than a stale one. */
    if (d.arriveBy) {
      const m = form.querySelector(`input[name="arriveBy"][value="${d.arriveBy}"]`);
      if (m) m.checked = true;
    }
    paintPoints();
    if (d.point) {
      const p = form.querySelector(`input[name="arrivalPoint"][value="${d.point}"]`);
      if (p) p.checked = true;
    }
    if (d.ferryLine) {
      const f = form.querySelector(`input[name="ferryLine"][value="${d.ferryLine}"]`);
      if (f) f.checked = true;
    }
    if (d.airline && airlinePicker) airlinePicker.set(d.airline);
    paintArrival();
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
      arriveBy: getMode(),
      point: getPoint(),
      airline: airlinePicker ? airlinePicker.value : '',
      flightNo: el('flightNo').value.trim(),
      ferryLine: getFerry(),
      arriveTime: el('arriveTime').value.trim(),
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

  /* How the arrival reads on both dockets. One function so the panel you
     check before sending and the record you are left with afterwards can
     never word the same thing two different ways. */
  function arrivalRows(d) {
    const rows = [];
    if (!TRAVEL || d.services.indexOf('transfer') === -1) return rows;

    const kind = (modeById(d.arriveBy) || {}).kind || '';
    if (d.arriveBy === 'own') { rows.push(['Arriving', 'Making their own way']); return rows; }

    const pt = d.point ? TRAVEL.pointById(d.estate, d.point) : null;
    if (pt) rows.push(['Meeting you at', pt.code ? `${pt.name} (${pt.code})` : pt.name]);

    if (kind === 'air') {
      const air = d.airline ? TRAVEL.airlineByCode(d.airline) : null;
      if (air && d.flightNo) rows.push(['Flight', `${air.code} ${d.flightNo} · ${air.name}`]);
      else if (air) rows.push(['Airline', air.name]);
    }
    if (kind === 'sea') {
      const line = d.ferryLine ? TRAVEL.ferryById(d.ferryLine) : null;
      if (line) rows.push(['Crossing', line.name]);
    }
    if (kind && d.arriveTime) {
      rows.push([kind === 'air' ? 'Landing at' : 'Docking at', d.arriveTime]);
    }
    return rows;
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
    arrivalRows(d).forEach((r) => rows.push(r));

    paintRows(el('sumRows'), rows);

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
    // The house decides which airports and ports exist, and the mode decides
    // whether they are airports or ports. Either changing rebuilds the list.
    if (e.target.name === 'arriveBy' || e.target.name === 'estate') {
      paintPoints();
      paintArrival();
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
    if (id === 'point')   return el('pointField');
    if (id === 'airline') return el('airlineTrigger').closest('.field');
    const input = el(id);
    return input ? input.closest('.field') : null;
  }

  function focusFor(id) {
    if (id === 'estate') {
      return form.querySelector('input[name="estate"]:checked') ||
             form.querySelector('input[name="estate"]');
    }
    if (id === 'arrive' || id === 'depart') return dateTrigger;
    if (id === 'point') {
      return form.querySelector('input[name="arrivalPoint"]:checked') ||
             form.querySelector('input[name="arrivalPoint"]');
    }
    if (id === 'airline') return el('airlineTrigger');
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

    /* Step two is all optional — right up until somebody asks to be met.
       Then it stops being decoration: a car, a driver and an hour of someone's
       day get committed against whatever is in these fields, so they have to
       describe a place that exists and a flight that is at least shaped like
       one. Everything is chosen from a list except the flight's number. */
    if (n === 2) {
      setError('point', false); setError('airline', false);
      setError('flightNo', false); setError('arriveTime', false);

      const wantsTransfer = d.services.indexOf('transfer') !== -1;
      const kind = (modeById(d.arriveBy) || {}).kind || '';

      if (wantsTransfer && kind && !d.point) fail('point');
      if (d.flightNo && !d.airline) fail('airline');
      if (d.flightNo && TRAVEL && !TRAVEL.validFlightNumber(d.flightNo)) fail('flightNo');
      if (TRAVEL && !TRAVEL.validTime(d.arriveTime)) fail('arriveTime');
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
  /* `full` is for the email, which has no docket around it and so has to
     carry the house and the price in the list itself. On screen those two
     are the docket's masthead and its footing, and repeating them in the
     rows is how a clean document starts looking like a spreadsheet. */
  function reviewRows(full) {
    const d = collect();
    const est = estateById(d.estate);
    const nights = nightsBetween(d.arrive, d.depart);
    const rows = [];

    if (full) rows.push(['The house', est ? `${est.name}, ${est.place}` : '—']);
    rows.push(['Dates', `${prettyDate(d.arrive)} → ${prettyDate(d.depart)} · ${nights} nights`]);
    rows.push(['Guests', d.children > 0 ? `${d.adults} adults, ${d.children} children` : `${d.adults} adults`]);

    const svcLabels = d.services.map((s) => (serviceById(s) || {}).label).filter(Boolean);
    rows.push(['Extras', svcLabels.length ? svcLabels.join(' · ') : 'None beyond the concierge line']);

    if (d.services.indexOf('transfer') !== -1) {
      const c = carById(d.car);
      rows.push(['Car', c ? c.name : '—']);
      arrivalRows(d).forEach((r) => rows.push(r));
    }

    rows.push(['Name', d.name]);
    rows.push(['Email', d.email]);
    rows.push(['Phone', d.phone]);
    if (d.country) rows.push(['Travelling from', d.country]);
    if (d.notes) rows.push(['Notes', d.notes]);
    if (full && est && nights) rows.push(['Indicative', `${euro(est.from * nights)} — accommodation only, before tax`]);
    return rows;
  }

  function buildReview() {
    const d = collect();
    const est = estateById(d.estate);
    const nights = nightsBetween(d.arrive, d.depart);

    el('revEstate').textContent = est ? est.name : 'No house chosen';
    el('revPlace').textContent  = est ? est.place : 'Four to choose from';
    const total = est && nights ? est.from * nights : 0;
    el('revTotal').textContent = total ? euro(total) : '—';

    paintRows(review, reviewRows(false));
  }

  /* One row writer for both dockets. --i drives the stagger: each row is one
     step further into the same animation, which is transform and opacity
     only — compositor work, no layout, nothing that can make the scroll
     stutter on a phone. */
  function paintRows(target, rows) {
    target.innerHTML = rows.map(([k, v], i) =>
      `<div class="docket__row" style="--i:${i}">` +
        `<dt>${escapeHtml(String(k))}</dt>` +
        `<dd>${escapeHtml(String(v))}</dd>` +
      `</div>`).join('');
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

  /* "Sending…" is written with aria-disabled, and css/base.css turns that into
     pointer-events: none. That is right while the request is in flight and
     wrong for a second longer: an attribute that outlives its request leaves a
     dead button on the screen with no way back. So every path that sets it has
     a path that clears it. */
  function setSending(btn, on) {
    if (on) {
      btn.dataset.idle = btn.dataset.idle || btn.textContent;
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Sending…';
    } else {
      btn.removeAttribute('aria-disabled');
      btn.textContent = btn.dataset.idle || 'Send the enquiry';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Honeypot: a bot filled the invisible field, so quietly do nothing.
    if (form.querySelector('input[name="company"]').value) return;

    // Already in flight — don't send it twice.
    if (el('submitBtn').getAttribute('aria-disabled') === 'true') return;

    const consent = el('bookingConsent');
    el('consentError').style.display = consent.checked ? 'none' : 'block';
    if (!consent.checked) { consent.focus(); return; }
    // Re-check the two steps that carry required fields. Send them back to the
    // step that actually failed — being bounced to step 1 to fix a missing
    // phone number on step 3 is how a form loses someone at the last hurdle.
    if (!validateStep(1)) { show(1); return; }
    if (!validateStep(2)) { show(2); return; }
    if (!validateStep(3)) { show(3); return; }

    const ref = reference();
    const payload = Object.assign({ reference: ref, sentAt: new Date().toISOString() },
                                  collect());

    // If they arrived on a tagged link this visit, say which one. See
    // js/main.js → initCampaign and privacy.html §9.
    const campaign = window.EV.campaign && window.EV.campaign();
    if (campaign) payload.campaign = campaign;

    setSending(el('submitBtn'), true);

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
    const lines = reviewRows(true).map(([k, v]) => `${k}: ${v}`);
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
    setSending(el('submitBtn'), false);
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
  paintPoints();
  paintArrival();
  update();
})();
