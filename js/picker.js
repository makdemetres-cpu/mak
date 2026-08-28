/* ==========================================================================
   Ermis' Villas — searchable picker
   --------------------------------------------------------------------------
   One control, for the one list on this site too long to lay out as chips:
   the airlines. Everything else a guest chooses from — the house, the
   arrival point, the ferry line — is short enough to show all at once, and
   showing all at once is always better.

   Why not <select>: the list a native select drops down is drawn by the
   operating system and takes no styling at all. On a page where the calendar
   and the estate cards were built by hand, it is the one control that looks
   borrowed. Same reasoning as js/calendar.js, and the same sheet is reused
   here so the two feel like one family.

   Accessibility
   -------------
   The trigger is a button that opens a dialog. Inside, a text input filters
   the list; the input carries role="combobox" and aria-activedescendant so a
   screen reader hears the highlighted option change as the arrow keys move,
   without focus ever leaving the box being typed into. Enter takes the
   highlight, Escape closes, and the rest of the page is inert while it is
   open, so Tab cannot walk out behind it.

   Usage:
     const p = EV.createPicker({
       trigger,                       // the button that opens it
       title: 'Which airline?',
       hint: 'Type a name or a code',
       empty: 'No airline matches that.',
       items: [{ id: 'A3', label: 'Aegean Airlines', badge: 'A3', group: 'Greece' }],
       value: 'A3',
       onChange(id, item) { ... }     // id is '' when cleared
     });
   ========================================================================== */
(() => {
  "use strict";
  window.EV = window.EV || {};

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let seq = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /* Fold accents so "Türkish" and "Turkish" both find Turkish Airlines, and
     lower-case once rather than on every comparison. */
  function fold(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  window.EV.createPicker = function (opts) {
    const trigger = opts.trigger;
    if (!trigger) return null;

    const items = opts.items || [];
    const onChange = opts.onChange || function () {};
    const uid = 'pk' + (++seq);

    let value = opts.value || '';
    let open = false;
    let active = -1;          // index into `shown`
    let shown = items.slice();

    /* ------------------------------------------------------------------
       DOM
       ------------------------------------------------------------------ */
    const root = document.createElement('div');
    root.className = 'picker';
    root.hidden = true;
    root.innerHTML =
      '<div class="picker__scrim" data-pk-close></div>' +
      '<div class="picker__panel" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Choose') + '">' +
        '<div class="picker__head">' +
          '<div>' +
            '<p class="picker__eyebrow">' + esc(opts.eyebrow || 'Choose') + '</p>' +
            '<p class="picker__title">' + esc(opts.title || '') + '</p>' +
          '</div>' +
          '<button class="picker__close" type="button" data-pk-close aria-label="Close">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
                 'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="picker__search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
               'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>' +
          /* aria-label, not just a placeholder: a placeholder is not an
             accessible name, and a combobox announced as "edit, blank" tells
             a screen-reader user nothing about what it filters. */
          '<input class="picker__input" type="text" role="combobox" autocomplete="off" ' +
                 'aria-expanded="true" aria-autocomplete="list" spellcheck="false" ' +
                 'aria-label="' + esc(opts.title || 'Search the list') + '" ' +
                 'aria-controls="' + uid + '-list" id="' + uid + '-input" ' +
                 'placeholder="' + esc(opts.hint || 'Type to search') + '">' +
        '</div>' +
        '<ul class="picker__list" role="listbox" id="' + uid + '-list" ' +
            'aria-labelledby="' + uid + '-input" tabindex="-1"></ul>' +
        '<p class="picker__empty" hidden>' + esc(opts.empty || 'Nothing matches that.') + '</p>' +
      '</div>';

    // Appended to <body>, never left inside the form: opening this makes every
    // other child of <body> inert, and a panel nested inside one of them would
    // inert itself. That exact bug once made the review dialog deaf to clicks.
    document.body.appendChild(root);

    const panel  = root.querySelector('.picker__panel');
    const input  = root.querySelector('.picker__input');
    const list   = root.querySelector('.picker__list');
    const emptyEl = root.querySelector('.picker__empty');
    const behind = Array.from(document.body.children).filter((el) => el !== root);

    /* ------------------------------------------------------------------
       Painting
       ------------------------------------------------------------------ */
    function paint() {
      let html = '';
      let group = null;
      shown.forEach((it, i) => {
        if (it.group && it.group !== group) {
          group = it.group;
          html += '<li class="picker__group" role="presentation">' + esc(group) + '</li>';
        }
        html +=
          '<li class="picker__opt" role="option" id="' + uid + '-o' + i + '" ' +
              'data-i="' + i + '" aria-selected="' + (it.id === value) + '">' +
            (it.badge ? '<span class="picker__badge">' + esc(it.badge) + '</span>' : '') +
            '<span class="picker__label">' + esc(it.label) + '</span>' +
            (it.sub ? '<span class="picker__sub">' + esc(it.sub) + '</span>' : '') +
          '</li>';
      });
      list.innerHTML = html;
      emptyEl.hidden = shown.length > 0;
      highlight(shown.length ? 0 : -1, false);
    }

    function optEl(i) { return list.querySelector('[data-i="' + i + '"]'); }

    function highlight(i, scroll) {
      const prev = optEl(active);
      if (prev) prev.classList.remove('is-active');
      active = i;
      const el = optEl(i);
      if (!el) { input.removeAttribute('aria-activedescendant'); return; }
      el.classList.add('is-active');
      input.setAttribute('aria-activedescendant', el.id);
      if (scroll !== false) el.scrollIntoView({ block: 'nearest' });
    }

    function filter(q) {
      const f = fold(q).trim();
      shown = !f ? items.slice() : items.filter((it) =>
        fold(it.label).indexOf(f) !== -1 ||
        fold(it.badge || '').indexOf(f) === 0 ||
        fold(it.sub || '').indexOf(f) !== -1);
      paint();
    }

    function choose(i) {
      const it = shown[i];
      if (!it) return;
      value = it.id;
      onChange(value, it);
      close();
    }

    /* ------------------------------------------------------------------
       Wiring
       ------------------------------------------------------------------ */
    input.addEventListener('input', () => filter(input.value));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown')      { e.preventDefault(); highlight(Math.min(shown.length - 1, active + 1)); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); highlight(Math.max(0, active - 1)); }
      else if (e.key === 'Home')      { e.preventDefault(); highlight(0); }
      else if (e.key === 'End')       { e.preventDefault(); highlight(shown.length - 1); }
      else if (e.key === 'Enter')     { e.preventDefault(); choose(active); }
    });

    // Pointer: highlight follows the cursor so the keyboard and the mouse
    // never disagree about which row is about to be taken.
    list.addEventListener('mousemove', (e) => {
      const li = e.target.closest('.picker__opt');
      if (li) highlight(Number(li.dataset.i), false);
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.picker__opt');
      if (li) choose(Number(li.dataset.i));
    });

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-pk-close]')) close();
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = Array.from(panel.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null && el.tabIndex !== -1);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* ------------------------------------------------------------------
       Open / close
       ------------------------------------------------------------------ */
    function openPicker() {
      if (open) return;
      open = true;
      root.hidden = false;
      document.body.classList.add('is-locked');
      behind.forEach((el) => el.setAttribute('inert', ''));
      trigger.setAttribute('aria-expanded', 'true');
      input.value = '';
      filter('');
      // Start on whatever is already chosen, so re-opening does not lose your place.
      const at = shown.map((it) => it.id).indexOf(value);
      if (at !== -1) highlight(at);
      requestAnimationFrame(() => input.focus());
    }

    function close() {
      if (!open) return;
      open = false;
      root.hidden = true;
      document.body.classList.remove('is-locked');
      behind.forEach((el) => el.removeAttribute('inert'));
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }

    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', openPicker);

    paint();

    return {
      open: openPicker,
      close: close,
      get value() { return value; },
      get item() { return items.filter((it) => it.id === value)[0] || null; },
      set(id) {
        value = items.some((it) => it.id === id) ? id : '';
        paint();
        return value;
      }
    };
  };
})();
