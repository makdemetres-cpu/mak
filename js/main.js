/* ==========================================================================
   Ermis' Villas — site behaviour
   Header state, mobile menu, disclosures, reveals, and hydrating the shared
   business details from js/data.js so contact details live in exactly one file.
   ========================================================================== */
(() => {
  "use strict";

  document.addEventListener('DOMContentLoaded', () => {
    hydrate();
    initHeader();
    initMenu();
    initDisclosures();
    initFieldErrors();
    initReveal();
    initYear();
    initSocial();
    initCampaign();
    initReadingProgress();
    initBackToTop();
  });

  /* ------------------------------------------------------------------
     Social profiles
     Rendered from EV.BUSINESS.social, and only for platforms with a URL
     actually set. An icon that links nowhere is worse than no icon: it
     looks like a broken site rather than a deliberate absence. Add a URL
     in js/data.js and the icon appears; leave it empty and the row
     silently shrinks. If none are set the whole block is removed.
     ------------------------------------------------------------------ */
  const SOCIAL_ICONS = {
    whatsapp: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6Z"/>' +
              '<path d="M9.2 9.1c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.2-.3.3-.1.6a7 7 0 0 0 3 2.6c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .5-.3 1.4-1.5 1.7-1 .2-2.3.1-4.4-1.2a8.6 8.6 0 0 1-3.2-3.6c-.4-.9-.4-2 .3-2.8Z"/>',
    instagram: '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/>' +
               '<circle cx="12" cy="12" r="4"/>' +
               '<circle cx="17.1" cy="6.9" r="1.05" fill="currentColor" stroke="none"/>',
    facebook: '<circle cx="12" cy="12" r="9.3"/>' +
              '<path d="M14.9 7.7h-1.4c-1.1 0-1.8.7-1.8 1.9V11h3l-.4 3h-2.6v6.9"/>' +
              '<path d="M9.1 11h2.6"/>'
  };
  const SOCIAL_LABELS = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook' };

  function initSocial() {
    const hosts = document.querySelectorAll('[data-social]');
    if (!hosts.length) return;
    const cfg = (window.EV && window.EV.BUSINESS && window.EV.BUSINESS.social) || {};

    const links = Object.keys(SOCIAL_ICONS)
      .filter((k) => typeof cfg[k] === 'string' && cfg[k].trim())
      .map((k) => {
        const url = cfg[k].trim();
        return '<a class="social__link" href="' + url + '" target="_blank" rel="me noopener noreferrer" ' +
               'aria-label="' + SOCIAL_LABELS[k] + ' — opens in a new tab">' +
               '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" ' +
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
               SOCIAL_ICONS[k] + '</svg></a>';
      });

    hosts.forEach((host) => {
      if (!links.length) { host.remove(); return; }
      host.querySelector('[data-social-list]').innerHTML = links.join('');
      host.hidden = false;
    });
  }

  /* ------------------------------------------------------------------
     Campaign attribution
     Reads utm_* (and the click ids the ad platforms append) from the URL
     and keeps them for this visit only, so that an enquiry sent three
     pages later still knows which link brought the visitor. First-party
     sessionStorage, never shared, gone when the tab closes. Disclosed in
     privacy.html §9. EV.TRACK_CAMPAIGN = false switches it off entirely.
     ------------------------------------------------------------------ */
  const CAMPAIGN_KEY = 'ev_campaign';
  const CAMPAIGN_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign',
                           'utm_term', 'utm_content', 'gclid', 'fbclid'];

  function initCampaign() {
    if (!window.EV || window.EV.TRACK_CAMPAIGN === false) return;
    let params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }

    const found = {};
    CAMPAIGN_FIELDS.forEach((f) => {
      const v = params.get(f);
      // Cap the length: these end up in an email, and a hostile or broken
      // link should not be able to paste a novel into it.
      if (v) found[f] = v.slice(0, 120);
    });
    if (!Object.keys(found).length) return;

    found.landedOn = window.location.pathname.split('/').pop() || 'index.html';
    found.at = new Date().toISOString();
    try { sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(found)); } catch (e) { /* private mode */ }
  }

  /* Read by booking.js and contact.js when an enquiry is sent. */
  window.EV = window.EV || {};
  window.EV.campaign = function () {
    if (window.EV.TRACK_CAMPAIGN === false) return null;
    try { return JSON.parse(sessionStorage.getItem(CAMPAIGN_KEY) || 'null'); }
    catch (e) { return null; }
  };

  /* The same thing as one line of plain text, for the email fallback — where
     a JSON blob at the bottom of an enquiry would look like a fault. Returns
     an empty string when there is nothing to say, so callers can just filter
     it out of their line list. */
  window.EV.campaignLine = function () {
    const c = window.EV.campaign();
    if (!c) return '';
    const parts = CAMPAIGN_FIELDS.filter((f) => c[f]).map((f) => f.replace('utm_', '') + ': ' + c[f]);
    return parts.length ? 'Came from — ' + parts.join(', ') : '';
  };

  /* ------------------------------------------------------------------
     Reading progress
     Only on the two legal documents, which run to 11,000 and 13,000
     pixels. The homepage already has the hero's chapter rail doing this
     job, and two progress indicators on one page compete rather than
     help. Opt in with <body class="has-progress">.
     ------------------------------------------------------------------ */
  function initReadingProgress() {
    if (!document.body.classList.contains('has-progress')) return;

    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    const fill = bar.firstElementChild;

    let ticking = false, last = -1;
    const update = () => {
      ticking = false;
      const travel = document.documentElement.scrollHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
      const rounded = Math.round(p * 500) / 500;   // avoid pointless style writes
      if (rounded === last) return;
      last = rounded;
      fill.style.transform = 'scaleX(' + rounded + ')';
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     Back to top
     Enabled only where the page is genuinely long enough to need it —
     three viewports — so it never appears on the booking form or the
     404. Hidden until two viewports down, so it is not competing with
     anything above the fold.
     ------------------------------------------------------------------ */
  function initBackToTop() {
    if (document.documentElement.scrollHeight < window.innerHeight * 3) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Back to the top of the page');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.4" aria-hidden="true"><path d="M12 19V6m0 0-5.5 5.5M12 6l5.5 5.5"/></svg>' +
      '<span>Top</span>';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      // Send focus back to the top of the document, or a keyboard user is
      // left stranded at the bottom of the tab order.
      const main = document.getElementById('main');
      if (main) main.focus({ preventScroll: true });
    });

    // The homepage hero is over five viewports tall on its own, so "two
    // viewports down" lands squarely in the middle of it. A back-to-top
    // button parked over a full-screen photograph is the one place it has no
    // business being.
    const stage = document.getElementById('heroStage');

    let shown = false, ticking = false, atFoot = false;
    const update = () => {
      ticking = false;
      const inHero = stage && window.scrollY < stage.offsetTop + stage.offsetHeight - window.innerHeight * 0.5;
      const should = window.scrollY > window.innerHeight * 2 && !atFoot && !inHero;
      if (should === shown) return;
      shown = should;
      btn.classList.toggle('is-shown', should);
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    // Watch the legal strip specifically rather than the whole footer: it is
    // the short line of company details the button would otherwise sit on top
    // of, and it sits at the same place in both the full and the slim footer.
    // Once it is on screen the button has nothing left to offer anyway.
    const foot = document.querySelector('.footer__bottom');
    if (foot && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        atFoot = entries[0].isIntersecting;
        update();
      }).observe(foot);
    }

    update();
  }

  /* ------------------------------------------------------------------
     Form error messages
     The markup pairs each message with its field via data-error-for, but
     that is only a styling hook — nothing tied the two together for a
     screen reader, so aria-invalid announced "invalid" and never said
     why. This wires up aria-describedby (hint first, then error) and
     gives the message role="alert" so it is read the moment it appears.
     ------------------------------------------------------------------ */
  function initFieldErrors() {
    document.querySelectorAll('[data-error-for]').forEach((err) => {
      const input = document.getElementById(err.dataset.errorFor);
      if (!input) return;

      if (!err.id) err.id = 'err-' + err.dataset.errorFor;
      err.setAttribute('role', 'alert');

      const ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      const field = input.closest('.field');
      const hint = field && field.querySelector('.field-hint');
      if (hint) {
        if (!hint.id) hint.id = 'hint-' + input.id;
        if (ids.indexOf(hint.id) === -1) ids.push(hint.id);
      }
      if (ids.indexOf(err.id) === -1) ids.push(err.id);
      input.setAttribute('aria-describedby', ids.join(' '));
    });
  }

  /* ------------------------------------------------------------------
     Business details
     Any element with data-ev="key" gets filled from EV.BUSINESS. Links
     get the right href too, so a changed phone number in data.js changes
     the tel: link on five pages at once.
     ------------------------------------------------------------------ */
  function hydrate() {
    const B = (window.EV && window.EV.BUSINESS) || null;
    if (!B) return;

    const addressLine = [B.address.line1, B.address.postcode + ' ' + B.address.city,
                         B.address.country].join(', ');

    const text = {
      legalName: B.legalName,
      legalForm: B.legalForm,
      vatNumber: B.vatNumber,
      gemiNumber: B.gemiNumber,
      taxOffice: B.taxOffice,
      tradingName: B.tradingName,
      email: B.email,
      privacyEmail: B.privacyEmail,
      phone: B.phone,
      whatsapp: B.whatsapp,
      addressLine: addressLine,
      addressLine1: B.address.line1,
      addressCity: B.address.postcode + ' ' + B.address.city,
      addressCountry: B.address.country
    };

    const href = {
      phoneLink: 'tel:' + B.phoneHref,
      emailLink: 'mailto:' + B.email,
      privacyEmailLink: 'mailto:' + B.privacyEmail,
      whatsappLink: B.whatsappHref
    };

    document.querySelectorAll('[data-ev]').forEach((el) => {
      const key = el.dataset.ev;
      if (key in text) el.textContent = text[key];
      if (key in href) el.setAttribute('href', href[key]);
    });
  }

  /* ------------------------------------------------------------------
     Header
     Goes solid once the dark block at the top of the page is behind us.
     An observer on that block rather than a scroll listener, so there is
     no per-frame work and no threshold to keep in sync with the CSS.
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const watch = document.querySelector('[data-header-watch]');
    if (!watch || !('IntersectionObserver' in window)) {
      header.classList.add('is-solid');
      return;
    }

    const h = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h'), 10) || 76;

    new IntersectionObserver((entries) => {
      header.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: `-${h}px 0px 0px 0px`, threshold: 0 }).observe(watch);
  }

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  function initMenu() {
    const btn = document.getElementById('menuBtn');
    const menu = document.getElementById('menu');
    if (!btn || !menu) return;

    // The menu covers the page, so while it is open the rest of the document
    // must be out of reach — otherwise Tab walks straight off the menu and into
    // links nobody can see, which is disorienting for a keyboard user and
    // completely opaque for a screen reader.
    const behind = Array.from(document.body.children)
      .filter((el) => el !== menu && el.id !== 'header');

    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
                      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const setOpen = (open) => {
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('is-locked', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      behind.forEach((el) => {
        if (open) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
      if (open) {
        const first = menu.querySelector(FOCUSABLE);
        if (first) first.focus();
      }
    };

    // inert covers everything outside the menu; this keeps Tab cycling within
    // it rather than escaping to the browser chrome and back.
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(menu.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); btn.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); btn.focus(); }
    });

    menu.setAttribute('aria-hidden', 'true');

    btn.addEventListener('click', () => {
      setOpen(!document.body.classList.contains('menu-open'));
    });

    // Any navigation closes it, including same-page anchors.
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Disclosures (services, FAQ)
     One handler for both. The panels animate on grid-template-rows, so
     they open to their real height without anybody measuring anything.
     ------------------------------------------------------------------ */
  function initDisclosures() {
    document.querySelectorAll('[aria-expanded][aria-controls]').forEach((btn) => {
      if (btn.id === 'menuBtn') return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));

        // Within one accordion, opening a panel closes its siblings.
        const group = btn.closest('.service-list, .faq-list');
        if (group && !open) {
          group.querySelectorAll('[aria-expanded="true"]').forEach((other) => {
            if (other !== btn) other.setAttribute('aria-expanded', 'false');
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);      // one-shot: never fades back out
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

    items.forEach((el) => io.observe(el));
  }

  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
