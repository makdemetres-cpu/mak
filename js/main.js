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
  });

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
