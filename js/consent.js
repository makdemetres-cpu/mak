/* ==========================================================================
   Ermis' Villas — cookie consent
   --------------------------------------------------------------------------
   Rules this implements, from GDPR (EU 2016/679), Greek Law 4624/2019 and
   Art. 4(5) of Greek Law 3471/2006:

   • Nothing beyond strictly necessary storage is read or written before the
     visitor has actively chosen. No pre-ticked boxes.
   • Refusing is exactly as easy as accepting — "Necessary only" sits next to
     "Accept all", same size, same prominence, one click each.
   • The choice is recorded with a timestamp and a version, so we can show
     what was consented to and when.
   • It can be withdrawn at any time, from the footer, on every page.

   ASK_EVERY_VISIT below is set to true because the client asked for the
   banner to appear every time someone opens the site. That is lawful — the
   visitor is simply asked afresh each session — but it is not the usual
   choice, and it will slightly depress opt-in rates. Set it to false and the
   answer is remembered for twelve months instead; nothing else needs to change.
   ========================================================================== */
(() => {
  "use strict";

  const ASK_EVERY_VISIT = true;

  const STORE_KEY   = 'ev_consent_v1';   // the decision itself
  const SESSION_KEY = 'ev_consent_seen'; // "already asked this visit"
  const MAX_AGE_DAYS = 365;
  const CATEGORIES = ['necessary', 'preferences', 'analytics', 'marketing'];

  /* ---------------- storage ---------------- */

  function read() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (!v || typeof v !== 'object' || !v.ts) return null;
      // An expired decision is no decision.
      const age = (Date.now() - new Date(v.ts).getTime()) / 86400000;
      if (age > MAX_AGE_DAYS) return null;
      return v;
    } catch (e) {
      return null;                       // private mode, or storage disabled
    }
  }

  function write(choice) {
    const record = { v: 1, ts: new Date().toISOString(), necessary: true };
    CATEGORIES.forEach((c) => { if (c !== 'necessary') record[c] = !!choice[c]; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(record)); } catch (e) { /* ignore */ }
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent('ev:consent', { detail: record }));
    apply(record);
    return record;
  }

  function askedThisVisit() {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; }
    catch (e) { return false; }
  }

  /* ---------------- what consent actually switches on ----------------
     Deliberately empty. This site currently loads no analytics and no
     marketing tags at all, so "accept all" genuinely does nothing today —
     which is what the banner tells people. Wire real tags in HERE, never
     as a <script> in the page, or the consent gate is decorative. */

  function apply(consent) {
    if (consent.analytics) loadAnalytics();
    if (consent.marketing) loadMarketing();
  }

  const ANALYTICS_ID = '';   // e.g. a Plausible/Matomo/GA id. Empty = nothing loads.
  let analyticsLoaded = false;

  function loadAnalytics() {
    if (!ANALYTICS_ID || analyticsLoaded) return;
    analyticsLoaded = true;
    /* Example, left commented so nothing ships by accident:
       const s = document.createElement('script');
       s.defer = true;
       s.src = 'https://example-analytics/script.js';
       s.setAttribute('data-site', ANALYTICS_ID);
       document.head.appendChild(s);
       If you enable this, add the provider to the processors table in
       privacy.html §7 — naming them is a legal requirement, not a courtesy. */
  }

  function loadMarketing() {
    /* No advertising or remarketing pixels are used on this site. */
  }

  /* ---------------- UI ---------------- */

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('consent');
    if (!root) return;

    const boxes = {};
    root.querySelectorAll('[data-cat]').forEach((el) => { boxes[el.dataset.cat] = el; });

    const existing = read();
    if (existing) apply(existing);

    function fill(from) {
      CATEGORIES.forEach((c) => {
        if (!boxes[c] || c === 'necessary') return;
        boxes[c].checked = !!(from && from[c]);
      });
    }

    /* ---- Keeping out of the page's way ----
       The banner is fixed to the foot of the window, so while it is up it
       covers whatever the page happens to have down there. On the booking
       form that was the "Send the enquiry" button: genuinely unclickable,
       not merely hidden, because the card takes the pointer events.

       So publish the card's height and let the stylesheet reserve exactly
       that much room at the end of the document. Measured rather than
       guessed: the card's height depends on its text, on the viewport, and
       on whether the preference centre is open. */
    const card = root.querySelector('.consent__card');

    function reserve() {
      const on = root.classList.contains('is-open');
      const h = on ? Math.ceil(root.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--consent-h', h + 'px');
      document.documentElement.classList.toggle('consent-open', on);
    }

    // The card grows when "Choose" opens the preference centre, and again
    // when a narrow window rewraps the buttons. Re-measure either way.
    if ('ResizeObserver' in window && card) new ResizeObserver(reserve).observe(card);
    window.addEventListener('resize', reserve, { passive: true });

    function open(showPrefs) {
      fill(read());
      root.hidden = false;
      root.classList.toggle('is-prefs', !!showPrefs);
      // A frame's delay so the transform transition has a start value to run from.
      requestAnimationFrame(() => { root.classList.add('is-open'); reserve(); });
    }

    function close() {
      root.classList.remove('is-open');
      const done = () => { root.hidden = true; root.classList.remove('is-prefs'); reserve(); };
      // Wait for the slide-out, but never hang if the transition never fires.
      let settled = false;
      root.addEventListener('transitionend', function once(e) {
        if (e.target !== root.querySelector('.consent__card')) return;
        root.removeEventListener('transitionend', once);
        settled = true; done();
      });
      setTimeout(() => { if (!settled) done(); }, 900);
    }

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-consent]');
      if (!btn) return;
      const action = btn.dataset.consent;

      if (action === 'prefs') { root.classList.add('is-prefs'); return; }
      if (action === 'accept') { write({ preferences: true, analytics: true, marketing: true }); close(); return; }
      if (action === 'reject') { write({ preferences: false, analytics: false, marketing: false }); close(); return; }
      if (action === 'save') {
        write({
          preferences: boxes.preferences ? boxes.preferences.checked : false,
          analytics:   boxes.analytics   ? boxes.analytics.checked   : false,
          marketing:   boxes.marketing   ? boxes.marketing.checked   : false
        });
        close();
      }
    });

    // "Cookie settings" in the footer of every page — this is the withdrawal
    // route the regulation requires, and it must always be available.
    document.querySelectorAll('[data-consent-open]').forEach((el) => {
      el.addEventListener('click', (e) => { e.preventDefault(); open(true); });
    });

    /* Show it. Per the client's brief this happens on every fresh visit, not
       only the first ever one — but not again on each page within a visit,
       which would be nagging rather than asking. */
    const shouldAsk = ASK_EVERY_VISIT ? !askedThisVisit() : !existing;
    if (shouldAsk) setTimeout(() => open(false), 550);
  });

  /* Let other scripts ask what was agreed without touching storage. */
  window.EV = window.EV || {};
  window.EV.consent = read;
})();
