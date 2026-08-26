/* ==========================================================================
   Ermis' Villas — date range calendar
   --------------------------------------------------------------------------
   One calendar, both dates. Arrival on the first tap, departure on the second,
   the nights counted as you go.

   Why this exists at all: `<input type="date">` is a perfectly good control,
   but the calendar it drops down is drawn by Chrome or Safari and takes no
   styling whatsoever. On a page where everything else has been drawn by hand,
   it is the one thing that looks borrowed.

   The booking window
   ------------------
   Nothing before today and nothing more than 90 days out, applied to every
   date in the range rather than only the arrival — so a stay that starts near
   the end of the window is necessarily a short one. Out-of-range days are
   rendered, greyed and announced as disabled rather than hidden: a visitor who
   tries to book five months out should be able to see that the far edge exists
   and that they have reached it, not wonder whether the calendar is broken.

   Dates are handled as local calendar days throughout, never as timestamps.
   `new Date().toISOString()` is UTC, so in Greece it names the wrong day for
   the first two or three hours of every morning — the sort of bug that is
   invisible in testing and then quietly hands somebody yesterday.

   Accessibility
   -------------
   A modal dialog with a roving-tabindex grid inside it. Arrow keys move a day
   at a time, up and down move a week, PageUp and PageDown move a month, Home
   and End go to the ends of the week. The month scrolls itself into view when
   focus moves past its edge. The selection is announced through a live region
   as a sentence — "3 nights, Fri 12 September to Mon 15 September" — because
   "12" on its own tells a screen-reader user nothing about what just happened.

   Usage:
     const cal = EV.createRangeCalendar({
       trigger, minDays: 0, maxDays: 90,
       from: '2026-09-12', to: '2026-09-15',
       onChange(from, to) { ... }        // ISO strings, or '' for cleared
     });
   ========================================================================== */
(() => {
  "use strict";
  window.EV = window.EV || {};

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];
  const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DOW_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]),' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* ---- Local calendar days. No timestamps, no UTC, no time-of-day. ---- */
  function today() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
  function iso(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }
  function fromISO(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const p = s.split('-').map(Number);
    const d = new Date(p[0], p[1] - 1, p[2]);
    return isNaN(d) ? null : d;
  }
  const key = (d) => d.getTime();
  const nightsBetween = (a, b) => (a && b) ? Math.round((b - a) / 86400000) : 0;

  /* Monday-first, which is what Greece and the rest of Europe read. */
  const mondayIndex = (d) => (d.getDay() + 6) % 7;

  function longDate(d) {
    return DOW_LONG[mondayIndex(d)] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function shortDate(d) {
    return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3);
  }

  window.EV.createRangeCalendar = function (opts) {
    const trigger = opts.trigger;
    if (!trigger) return null;

    const min = addDays(today(), opts.minDays || 0);
    const max = addDays(today(), opts.maxDays == null ? 90 : opts.maxDays);
    const onChange = opts.onChange || function () {};

    let from = clampOrNull(fromISO(opts.from));
    let to = clampOrNull(fromISO(opts.to));
    if (from && to && to <= from) to = null;

    let hover = null;          // the day under the pointer, for the range preview
    let cursor = from || min;  // the day that currently owns the tab stop
    let page = 0;              // which pair of months is shown on a wide screen
    let open = false;
    let wide = false;

    function clampOrNull(d) {
      if (!d) return null;
      return (d < min || d > max) ? null : d;
    }

    /* ---- The months the window actually spans ---- */
    const months = [];
    for (let m = new Date(min.getFullYear(), min.getMonth(), 1);
         m <= max; m = addMonths(m, 1)) {
      months.push(m);
    }

    /* ------------------------------------------------------------------
       DOM
       ------------------------------------------------------------------ */
    const root = document.createElement('div');
    root.className = 'cal';
    root.hidden = true;
    root.innerHTML =
      '<div class="cal__scrim" data-cal-close></div>' +
      '<div class="cal__panel" role="dialog" aria-modal="true" aria-label="Choose your dates">' +
        '<div class="cal__head">' +
          '<div>' +
            '<p class="cal__eyebrow">Your dates</p>' +
            '<p class="cal__read" data-cal-read>Choose your arrival</p>' +
          '</div>' +
          '<button class="cal__close" type="button" data-cal-close aria-label="Close the calendar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
                 'stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cal__body">' +
          '<button class="cal__step cal__step--prev" type="button" data-cal-prev aria-label="Earlier months">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' +
          '</button>' +
          '<div class="cal__months" data-cal-months></div>' +
          '<button class="cal__step cal__step--next" type="button" data-cal-next aria-label="Later months">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" ' +
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cal__foot">' +
          '<button class="cal__clear" type="button" data-cal-clear>Clear</button>' +
          '<p class="cal__note">Bookings open up to ' + (opts.maxDays == null ? 90 : opts.maxDays) + ' days ahead</p>' +
          '<button class="btn cal__done" type="button" data-cal-done>Done</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);

    const panel = root.querySelector('.cal__panel');
    const monthsEl = root.querySelector('[data-cal-months]');
    const readEl = root.querySelector('[data-cal-read]');
    const prevBtn = root.querySelector('[data-cal-prev]');
    const nextBtn = root.querySelector('[data-cal-next]');

    // Everything that is not the calendar, so it can be made unreachable while
    // the calendar is up — same approach as the mobile menu in main.js.
    const behind = Array.from(document.body.children).filter((el) => el !== root);

    /* Build every month once. There are at most four of them in a 90-day
       window, so there is nothing to gain by building them on demand and a
       re-render on every keystroke to lose. */
    const dayButtons = new Map();     // time -> button

    months.forEach((m, i) => {
      const sec = document.createElement('section');
      sec.className = 'cal__month';
      sec.dataset.month = String(i);

      const h = document.createElement('h3');
      h.className = 'cal__mname';
      h.id = 'calm' + i + '-' + Math.random().toString(36).slice(2, 7);
      h.textContent = MONTHS[m.getMonth()] + ' ' + m.getFullYear();
      sec.appendChild(h);

      const grid = document.createElement('div');
      grid.className = 'cal__grid';
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-labelledby', h.id);

      const head = document.createElement('div');
      head.className = 'cal__dow';
      head.setAttribute('role', 'row');
      DOW_SHORT.forEach((s, di) => {
        const c = document.createElement('span');
        c.setAttribute('role', 'columnheader');
        c.setAttribute('aria-label', DOW_LONG[di]);
        c.textContent = s;
        head.appendChild(c);
      });
      grid.appendChild(head);

      const first = new Date(m.getFullYear(), m.getMonth(), 1);
      const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const lead = mondayIndex(first);
      let row = null;

      for (let cell = 0; cell < lead + daysInMonth; cell++) {
        if (cell % 7 === 0) {
          row = document.createElement('div');
          row.setAttribute('role', 'row');
          grid.appendChild(row);
        }
        if (cell < lead) {
          const blank = document.createElement('span');
          blank.className = 'cal__blank';
          blank.setAttribute('role', 'gridcell');
          row.appendChild(blank);
          continue;
        }
        const d = new Date(m.getFullYear(), m.getMonth(), cell - lead + 1);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cal__day';
        b.setAttribute('role', 'gridcell');
        b.dataset.iso = iso(d);
        b.tabIndex = -1;
        b.innerHTML = '<span>' + d.getDate() + '</span>';
        row.appendChild(b);
        dayButtons.set(key(d), b);
      }

      sec.appendChild(grid);
      monthsEl.appendChild(sec);
    });

    /* ------------------------------------------------------------------
       Painting
       ------------------------------------------------------------------ */
    function paint() {
      const t = today();
      // While only the arrival is set, the hovered (or focused) day previews
      // what the range would be. It is the single thing that makes a range
      // calendar feel like one control instead of two.
      const previewEnd = (from && !to && hover && hover > from) ? hover : null;

      dayButtons.forEach((b, timeKey) => {
        const d = new Date(timeKey);
        const out = d < min || d > max;
        // Once an arrival is chosen, days before it are not a valid departure.
        // They stay clickable, and clicking one restarts the range there.
        const isFrom = !!(from && key(from) === timeKey);
        const isTo = !!(to && key(to) === timeKey);
        const inRange = !!(from && to && d > from && d < to);
        const inPreview = !!(previewEnd && d > from && d < previewEnd);

        b.disabled = out;
        b.setAttribute('aria-disabled', out ? 'true' : 'false');
        b.classList.toggle('is-out', out);
        b.classList.toggle('is-today', key(d) === key(t));
        b.classList.toggle('is-from', isFrom);
        b.classList.toggle('is-to', isTo);
        b.classList.toggle('is-in', inRange);
        b.classList.toggle('is-preview', inPreview);
        b.classList.toggle('is-edge', isFrom || isTo);
        b.setAttribute('aria-selected', (isFrom || isTo || inRange) ? 'true' : 'false');
        b.tabIndex = (!out && key(d) === key(cursor)) ? 0 : -1;

        let label = longDate(d);
        if (out) label += ', unavailable';
        else if (isFrom) label += ', arrival';
        else if (isTo) label += ', departure';
        b.setAttribute('aria-label', label);
      });

      // If the cursor landed on a disabled day it must not be the only tab
      // stop in the grid, or Tab walks into a dead end.
      if (!dayButtons.has(key(cursor)) || dayButtons.get(key(cursor)).disabled) {
        const firstOpen = dayButtons.get(key(min));
        if (firstOpen) firstOpen.tabIndex = 0;
      }

      readEl.textContent = readOut();
      applyLayout();
    }

    function readOut() {
      if (from && to) {
        const n = nightsBetween(from, to);
        return n + (n === 1 ? ' night, ' : ' nights, ') + longDate(from) + ' to ' + longDate(to);
      }
      if (from) return 'Arriving ' + longDate(from) + '. Now choose when you leave.';
      return 'Choose your arrival';
    }

    /* On a wide screen two months sit side by side and the arrows move
       through them. On a phone the whole window is a single scroll, which is
       fewer controls and one less thing to explain. */
    function applyLayout() {
      wide = window.matchMedia('(min-width: 760px)').matches;
      root.classList.toggle('cal--wide', wide);
      const last = Math.max(0, months.length - 2);
      if (page > last) page = last;
      Array.from(monthsEl.children).forEach((sec, i) => {
        sec.hidden = wide ? !(i === page || i === page + 1) : false;
      });
      prevBtn.disabled = !wide || page <= 0;
      nextBtn.disabled = !wide || page >= last;
    }

    /* Make sure the day the cursor is on is actually on screen. */
    function revealCursor() {
      const idx = months.findIndex((m) =>
        m.getFullYear() === cursor.getFullYear() && m.getMonth() === cursor.getMonth());
      if (idx < 0) return;
      if (wide) {
        if (idx < page) page = idx;
        else if (idx > page + 1) page = idx - 1;
        applyLayout();
      } else {
        const sec = monthsEl.children[idx];
        if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: 'nearest' });
      }
    }

    /* ------------------------------------------------------------------
       Selecting
       ------------------------------------------------------------------ */
    function pick(d) {
      if (d < min || d > max) return;
      if (!from || (from && to)) {          // start a fresh range
        from = d; to = null;
      } else if (d > from) {                 // close it
        to = d;
      } else {                               // clicked on or before the arrival
        from = d; to = null;
      }
      cursor = d;
      hover = null;
      paint();
      emit();
    }

    function clear() {
      from = null; to = null; hover = null;
      cursor = min;
      paint();
      emit();
    }

    function emit() { onChange(from ? iso(from) : '', to ? iso(to) : ''); }

    /* ------------------------------------------------------------------
       Events
       ------------------------------------------------------------------ */
    monthsEl.addEventListener('click', (e) => {
      const b = e.target.closest('.cal__day');
      if (!b || b.disabled) return;
      pick(fromISO(b.dataset.iso));
    });

    monthsEl.addEventListener('pointerover', (e) => {
      const b = e.target.closest('.cal__day');
      if (!b || b.disabled || !from || to) return;
      const d = fromISO(b.dataset.iso);
      if (hover && key(hover) === key(d)) return;
      hover = d;
      paint();
    });
    monthsEl.addEventListener('pointerleave', () => {
      if (hover) { hover = null; paint(); }
    });

    monthsEl.addEventListener('keydown', (e) => {
      const b = e.target.closest('.cal__day');
      if (!b) return;
      let next = null;
      switch (e.key) {
        case 'ArrowLeft':  next = addDays(cursor, -1); break;
        case 'ArrowRight': next = addDays(cursor, 1); break;
        case 'ArrowUp':    next = addDays(cursor, -7); break;
        case 'ArrowDown':  next = addDays(cursor, 7); break;
        case 'Home':       next = addDays(cursor, -mondayIndex(cursor)); break;
        case 'End':        next = addDays(cursor, 6 - mondayIndex(cursor)); break;
        case 'PageUp':     next = new Date(cursor.getFullYear(), cursor.getMonth() - 1, cursor.getDate()); break;
        case 'PageDown':   next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()); break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          pick(cursor);
          focusCursor();
          return;
        default: return;
      }
      e.preventDefault();
      if (next < min) next = min;
      if (next > max) next = max;
      cursor = next;
      // Keyboard users get the same range preview the pointer gets.
      if (from && !to) hover = next > from ? next : null;
      paint();
      revealCursor();
      focusCursor();
    });

    function focusCursor() {
      const b = dayButtons.get(key(cursor));
      if (b && !b.disabled) b.focus();
    }

    prevBtn.addEventListener('click', () => { page = Math.max(0, page - 1); applyLayout(); });
    nextBtn.addEventListener('click', () => { page = page + 1; applyLayout(); });

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-cal-close]') || e.target.closest('[data-cal-done]')) close();
      else if (e.target.closest('[data-cal-clear]')) clear();
    });

    // Tab must not walk out of the dialog. inert covers the rest of the page;
    // this wraps the two ends back onto each other.
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null && el.tabIndex !== -1);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener('resize', () => { if (open) applyLayout(); }, { passive: true });

    /* ------------------------------------------------------------------
       Open / close
       ------------------------------------------------------------------ */
    function openCal() {
      if (open) return;
      open = true;
      root.hidden = false;
      document.body.classList.add('is-locked');
      behind.forEach((el) => el.setAttribute('inert', ''));
      trigger.setAttribute('aria-expanded', 'true');
      cursor = from || min;
      paint();
      revealCursor();
      // A frame's grace so the panel is laid out before focus lands, which
      // stops phones scrolling the sheet to a half-drawn position.
      requestAnimationFrame(focusCursor);
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
    trigger.addEventListener('click', openCal);

    paint();

    return {
      open: openCal,
      close: close,
      clear: clear,
      get from() { return from ? iso(from) : ''; },
      get to() { return to ? iso(to) : ''; },
      nights: () => nightsBetween(from, to),
      minISO: iso(min),
      maxISO: iso(max),
      /* Set the range from outside — used when a saved draft is restored.
         Anything outside the window is dropped rather than clamped: silently
         moving somebody's dates is worse than asking them again. */
      setRange(a, b) {
        from = clampOrNull(fromISO(a));
        to = clampOrNull(fromISO(b));
        if (from && to && to <= from) to = null;
        cursor = from || min;
        paint();
        return { from: from ? iso(from) : '', to: to ? iso(to) : '' };
      }
    };
  };

  /* Shared with booking.js so both format dates the same way. */
  window.EV.dateHelpers = { today, addDays, iso, fromISO, shortDate, longDate, nightsBetween };
})();
