/* ==========================================================================
   Ermis' Villas — guest reviews
   --------------------------------------------------------------------------
   The four most recent reviews, and the form that adds one.

   Where they live
   ---------------
   Supabase, configured in js/data.js. Two calls and no library: a GET for the
   newest few and a POST to add one, both against the PostgREST endpoint every
   Supabase project exposes. Pulling in the JS client would be 40KB to save
   about thirty lines.

   With the keys empty the section runs in **preview mode**: the form works and
   the rolling four behave exactly as they will once it is live, but everything
   is held in this browser's own storage and nobody else sees a word of it. A
   visible note says so, on screen, because a review box that silently talks
   only to itself is the kind of thing you discover six months later.

   Seeds
   -----
   The section never looks empty. Real reviews are shown newest first and the
   placeholder ones from data.js fill whatever is left of the four, falling off
   the end one at a time as real ones arrive. Seeds are excluded from the
   average and the count — inventing "4.9 from 23 stays" would be exactly the
   thing EU law now treats as a misleading practice.

   Motion
   ------
   Transform and opacity only, so the compositor does all of it and a phone
   does not drop frames: the cards use the same reveal as the rest of the site,
   and each card's stars are one filled row clipped by a scaleX sweep. A new
   review eases in at the front while the fourth eases out. All of it is off
   under prefers-reduced-motion.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.getElementById('reviews');
  if (!root) return;

  const CFG = Object.assign(
    { url: '', anonKey: '', show: 4, moderated: false, cooldownHours: 12 },
    (window.EV && window.EV.REVIEWS) || {}
  );
  const SEEDS = ((window.EV && window.EV.SEED_REVIEWS) || []).slice();

  const live = !!(CFG.url && CFG.anonKey);
  const LOCAL_KEY = 'ev_reviews_preview';
  const LAST_KEY = 'ev_review_last';

  const el = (id) => document.getElementById(id);
  const listEl = el('reviewList');
  const scoreEl = el('reviewScore');
  const noteEl = el('reviewNote');
  const openBtn = el('reviewOpen');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Text from strangers goes into the DOM as text, never as markup. */
  function textNode(s) { return document.createTextNode(String(s == null ? '' : s)); }

  const MAX = { name: 60, body: 600 };

  /* ------------------------------------------------------------------
     Reading and writing
     ------------------------------------------------------------------ */
  function endpoint(path) {
    return CFG.url.replace(/\/+$/, '') + '/rest/v1/' + path;
  }
  function headers(extra) {
    return Object.assign({
      apikey: CFG.anonKey,
      Authorization: 'Bearer ' + CFG.anonKey
    }, extra || {});
  }

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveLocal(rows) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 40))); }
    catch (e) { /* private mode: the review is still shown this session */ }
  }

  function fetchReviews() {
    if (!live) return Promise.resolve(loadLocal());

    // A few more than we show, so moderation or a deletion does not leave a gap.
    let q = 'reviews?select=name,rating,body,created_at&order=created_at.desc&limit=' +
            (CFG.show + 6);
    if (CFG.moderated) q += '&approved=eq.true';

    return fetch(endpoint(q), { headers: headers() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((rows) => (Array.isArray(rows) ? rows : []))
      .catch(() => null);          // null means "could not reach", not "none"
  }

  function submitReview(review) {
    if (!live) {
      const rows = loadLocal();
      rows.unshift(Object.assign({ created_at: new Date().toISOString() }, review));
      saveLocal(rows);
      return Promise.resolve(rows);
    }
    return fetch(endpoint('reviews'), {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify(review)
    }).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return fetchReviews();
    });
  }

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */
  function stars(rating, animate) {
    // One row of outline stars with a filled row clipped over it. The sweep is
    // a single scaleX on one element per card rather than five, which keeps it
    // to one compositor layer.
    const pct = Math.max(0, Math.min(5, Number(rating) || 0)) / 5;
    const wrap = document.createElement('span');
    wrap.className = 'stars';
    wrap.setAttribute('aria-hidden', 'true');

    const row = (cls) => {
      const s = document.createElement('span');
      s.className = 'stars__row ' + cls;
      for (let i = 0; i < 5; i++) {
        s.insertAdjacentHTML('beforeend',
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"/></svg>');
      }
      return s;
    };

    wrap.appendChild(row('stars__row--track'));
    const fill = row('stars__row--fill');
    fill.style.setProperty('--fill', pct);
    if (animate && !reduced) fill.classList.add('is-sweeping');
    wrap.appendChild(fill);
    return wrap;
  }

  function card(review, isNew) {
    const fig = document.createElement('figure');
    fig.className = 'review' + (review.seed ? ' review--seed' : '');
    if (isNew && !reduced) fig.classList.add('is-new');

    const head = document.createElement('div');
    head.className = 'review__head';
    head.appendChild(stars(review.rating, true));

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.appendChild(textNode('Rated ' + review.rating + ' out of 5.'));
    head.appendChild(sr);
    fig.appendChild(head);

    const quote = document.createElement('blockquote');
    quote.appendChild(textNode(review.body));
    fig.appendChild(quote);

    const cap = document.createElement('figcaption');
    const b = document.createElement('b');
    b.appendChild(textNode(review.name));
    cap.appendChild(b);
    cap.appendChild(textNode(review.meta || whenText(review.created_at)));
    fig.appendChild(cap);

    return fig;
  }

  function whenText(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  /* Real reviews first, seeds filling whatever is left of the four. */
  function merge(real) {
    const rows = (real || []).slice(0, CFG.show);
    return rows.concat(SEEDS.slice(0, Math.max(0, CFG.show - rows.length)));
  }

  function paintScore(real) {
    const n = (real || []).length;
    if (!n) { scoreEl.hidden = true; return; }
    const sum = real.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    const avg = Math.round((sum / n) * 10) / 10;
    scoreEl.hidden = false;
    scoreEl.textContent = '';
    scoreEl.appendChild(stars(avg, false));
    const t = document.createElement('span');
    t.className = 'review-score__text';
    t.appendChild(textNode(avg.toFixed(1) + ' from ' + n + (n === 1 ? ' review' : ' reviews')));
    scoreEl.appendChild(t);
  }

  let shown = [];

  function render(real, newest) {
    shown = merge(real);
    paintScore(real);

    const frag = document.createDocumentFragment();
    shown.forEach((r, i) => {
      const isNew = !!(newest && i === 0 && !r.seed);
      const c = card(r, isNew);
      c.style.setProperty('--i', i);
      frag.appendChild(c);
    });

    listEl.textContent = '';
    listEl.appendChild(frag);
    sweep();
  }

  /* The star sweep runs when the cards are actually on screen, not when the
     page loads — otherwise it happens above the fold of a section nobody has
     scrolled to yet and is simply never seen. */
  let observer = null;
  function sweep() {
    const fills = listEl.querySelectorAll('.stars__row--fill.is-sweeping');
    if (!fills.length) return;
    if (!('IntersectionObserver' in window)) {
      fills.forEach((f) => f.classList.add('is-full'));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-full');
          observer.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
    }
    fills.forEach((f) => observer.observe(f));
  }

  /* ------------------------------------------------------------------
     The form
     ------------------------------------------------------------------ */
  const dialog = el('reviewDialog');

  /* A modal has to be a direct child of <body>. While it is open every other
     child of <body> is marked `inert` so the page behind cannot be tabbed
     into — and if the dialog itself is sitting inside one of those children,
     it inerts itself: perfectly visible, correctly positioned, and deaf to
     every click and keystroke. Moving it up here means the markup can live
     next to the section it belongs to without that being a trap. */
  if (dialog.parentNode !== document.body) document.body.appendChild(dialog);

  const form = el('reviewForm');
  const behind = Array.from(document.body.children).filter((n) => n !== dialog);
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function setOpen(open) {
    dialog.hidden = !open;
    document.body.classList.toggle('is-locked', open);
    behind.forEach((n) => { if (open) n.setAttribute('inert', ''); else n.removeAttribute('inert'); });
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      const first = dialog.querySelector(FOCUSABLE);
      if (first) first.focus();
    } else {
      openBtn.focus();
    }
  }

  openBtn.addEventListener('click', () => {
    const wait = cooldownLeft();
    if (wait > 0) {
      say('You left a review recently. You can leave another in about ' +
          wait + (wait === 1 ? ' hour' : ' hours') + '.', false);
      return;
    }
    setOpen(true);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-review-close]')) setOpen(false);
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key !== 'Tab') return;
    const items = Array.from(dialog.querySelectorAll(FOCUSABLE))
      .filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function cooldownLeft() {
    if (!CFG.cooldownHours) return 0;
    try {
      const last = Number(localStorage.getItem(LAST_KEY) || 0);
      if (!last) return 0;
      const hrs = (Date.now() - last) / 3600000;
      return hrs >= CFG.cooldownHours ? 0 : Math.max(1, Math.ceil(CFG.cooldownHours - hrs));
    } catch (e) { return 0; }
  }

  const statusEl = el('reviewStatus');
  function say(msg, ok) {
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-bad', ok === false);
  }

  function fieldError(id, on) {
    const input = el(id);
    const field = input ? input.closest('.field') : el(id + 'Field');
    if (field) field.classList.toggle('has-error', on);
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.querySelector('input[name="website"]').value) return;   // honeypot

    const name = el('rvName').value.trim().slice(0, MAX.name);
    const body = el('rvBody').value.trim().slice(0, MAX.body);
    const picked = form.querySelector('input[name="rating"]:checked');
    const rating = picked ? Number(picked.value) : 0;
    const consent = el('rvConsent');

    // All three, plus permission to publish the name. The button stays enabled
    // and the reasons are announced — a greyed-out button that will not say
    // why is the most annoying pattern in forms.
    fieldError('rvName', !name);
    fieldError('rvBody', body.length < 10);
    el('ratingField').classList.toggle('has-error', !rating);
    el('rvConsentError').style.display = consent.checked ? 'none' : 'block';

    const problems = [];
    if (!name) problems.push('your name');
    if (!rating) problems.push('a rating');
    if (body.length < 10) problems.push('a few words about your stay');
    if (problems.length) {
      say('Still needed: ' + problems.join(', ') + '.', false);
      const firstBad = !name ? el('rvName')
                     : !rating ? form.querySelector('input[name="rating"]')
                     : el('rvBody');
      if (firstBad) firstBad.focus();
      return;
    }
    if (!consent.checked) { say('Please agree to your first name being published.', false); consent.focus(); return; }

    const btn = el('rvSubmit');
    btn.setAttribute('aria-disabled', 'true');
    btn.textContent = 'Publishing…';
    say('', true);

    submitReview({ name: name, rating: rating, body: body })
      .then((rows) => {
        try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (err) { /* fine */ }
        render(rows === null ? [] : rows, true);
        setOpen(false);
        form.reset();
        el('rvConsentError').style.display = 'none';
        say(live ? 'Thank you — your review is on the page.'
                 : 'Thank you. In preview mode this is only visible in your own browser.', true);
        root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      })
      .catch(() => {
        say('That did not send. Please try again, or email it to us and we will add it.', false);
      })
      .then(() => {
        btn.removeAttribute('aria-disabled');
        btn.textContent = 'Publish review';
      });
  });

  /* Live character count, so nobody writes 900 words and loses 300 of them. */
  const bodyEl = el('rvBody');
  const countEl = el('rvCount');
  bodyEl.setAttribute('maxlength', String(MAX.body));
  const paintCount = () => {
    const left = MAX.body - bodyEl.value.length;
    countEl.textContent = left < 120 ? left + ' characters left' : '';
  };
  bodyEl.addEventListener('input', paintCount);

  /* ------------------------------------------------------------------
     Go
     ------------------------------------------------------------------ */
  if (!live) {
    noteEl.hidden = false;      // the "not connected yet" note, removed by config
  }

  fetchReviews().then((rows) => {
    if (rows === null) {
      // Reachable but refused, or offline. Show the seeds rather than an
      // apology: the section is not the point of the page.
      render([], false);
      return;
    }
    render(rows, false);
  });
})();
