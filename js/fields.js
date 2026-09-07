/* ==========================================================================
   Χρόνης Πέγκας Photography — enquiry-form controls
   --------------------------------------------------------------------------
   Replaces two native widgets in the enquiry form with ones that match the
   rest of the site: the OS date picker and the OS dropdown. Both of those
   are drawn by the browser, not by this stylesheet, so they arrive in
   whatever grey-and-blue the operating system uses and are the only two
   things on the page that don't look like the page.

   The contract with everything else is deliberately narrow:

   - The native <input type="date"> and <select> STAY IN THE DOM and stay the
     only holders of their value. Nothing here introduces a second source of
     truth. With JavaScript off, or if this file throws, the form still has
     two working native controls and submits exactly the same data — the
     enhancement is opt-in per element, via data-xdate / data-xselect.
   - Every value change is written to the native element and then announced
     with a bubbling "input" and "change" event, so js/contact.js's existing
     validation and js/main.js's language handling keep working untouched.
     Neither file knows this one exists.
   - Labels are read back out of the native <option> elements, whose text
     js/main.js already swaps per language — so the dropdown re-labels itself
     for free. The calendar's own month and weekday names come from Intl in
     the page's current locale. Both re-render on the "xp:langchange" event
     main.js dispatches.

   No inline styles or handlers anywhere: the page ships a strict CSP
   (script-src 'self'; style-src 'self', neither with 'unsafe-inline'), so
   an inline onclick or a style="" attribute written into the markup would
   be refused. Everything visual lives in css/style.css under FORM CONTROLS.
   ========================================================================== */
(function () {
  "use strict";

  /* Intl is what makes the calendar bilingual without shipping two tables of
     month names. Without it (or without the DOM bits used below) the native
     controls are simply left alone — a plain, working date field beats a
     half-built custom one. */
  if (!window.Intl || !Intl.DateTimeFormat || !document.createElement("div").closest) return;

  var root = document.documentElement;
  var uid = 0;
  function nextId(prefix) { uid += 1; return prefix + "-" + uid; }

  function lang() { return root.getAttribute("lang") === "en" ? "en" : "el"; }
  function locale() { return lang() === "en" ? "en-GB" : "el-GR"; }
  function t(key) {
    var S = window.XP_STRINGS || {};
    var L = lang();
    return (S[L] && S[L][key]) || (S.el && S.el[key]) || "";
  }
  function fmt(str, vals) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vals, k) ? vals[k] : m;
    });
  }
  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  /* The two events js/contact.js listens for. "input" drives its
     re-validate-once-already-marked-bad behaviour; "change" is what its
     checkbox path and any future listener would expect. Both bubble, the
     way a real user edit does. */
  function announceChange(node) {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* Anything generated here re-labels itself when the language switches. */
  var relabellers = [];
  document.addEventListener("xp:langchange", function () {
    for (var i = 0; i < relabellers.length; i++) relabellers[i]();
  });

  /* Only one popup may be open at a time, and clicking anywhere else or
     pressing Escape closes it. Held centrally rather than per-control so two
     of these can never end up open on top of each other. */
  var openPopup = null;      // { close: fn, contains: fn }
  function setOpen(p) {
    if (openPopup && openPopup !== p) openPopup.close(false);
    openPopup = p;
  }
  document.addEventListener("mousedown", function (e) {
    if (openPopup && !openPopup.contains(e.target)) openPopup.close(false);
  }, true);
  document.addEventListener("focusin", function (e) {
    if (openPopup && !openPopup.contains(e.target)) openPopup.close(false);
  });
  document.addEventListener("keydown", function (e) {
    if (openPopup && e.key === "Escape") { e.stopPropagation(); openPopup.close(true); }
  });
  window.addEventListener("resize", function () { if (openPopup) openPopup.close(false); });

  /* The label's `for` still points at the native control, which is about to
     become invisible — repoint it at the visible trigger so clicking the
     label focuses something the visitor can see, and name the trigger from
     the label plus its own current value ("Type of occasion, Wedding"). */
  /* js/contact.js focuses the first invalid field on submit. The native
     control is a 1px transparent box by then, so focusing it would put the
     caret somewhere invisible — forward it to the trigger the visitor can
     actually see. Done here rather than in contact.js so that file needs no
     knowledge of this one. */
  function forwardFocus(native, trigger) {
    native.addEventListener("focus", function () { trigger.focus(); });
  }

  function wireLabel(field, native, trigger, valueEl) {
    var label = field.querySelector("label[for='" + native.id + "']");
    if (!label) return;
    if (!label.id) label.id = native.id + "-label";
    label.setAttribute("for", trigger.id);
    if (!valueEl.id) valueEl.id = trigger.id + "-value";
    trigger.setAttribute("aria-labelledby", label.id + " " + valueEl.id);
  }

  /* A popup opens below its trigger and left-aligned to it, unless that
     would push it off the bottom or the right of the viewport — in which
     case it flips above and/or aligns to the trigger's right edge instead.
     The calendar is a fixed 324px wide while the date field is only half a
     row on a 560px screen, so the right-edge case is the normal one there,
     not an edge case. Set as classes rather than inline styles because the
     page's CSP has no 'unsafe-inline' in style-src. */
  function placePopup(field, trigger, pop) {
    field.classList.remove("xfield--flip", "xfield--right");
    var box = trigger.getBoundingClientRect();
    var headerH = document.querySelector(".site-header");
    headerH = headerH ? headerH.getBoundingClientRect().height : 0;
    var below = window.innerHeight - box.bottom - 16;
    var above = box.top - headerH - 16;
    // Flip only when dropping down genuinely doesn't fit AND going up is
    // actually roomier — otherwise "doesn't fit below" would happily swap it
    // for an even tighter gap under the fixed header.
    if (pop.offsetHeight > below && above > below) field.classList.add("xfield--flip");
    if (box.left + pop.offsetWidth + 12 > window.innerWidth) field.classList.add("xfield--right");
  }

  /* ======================================================================
     DROPDOWN  —  data-xselect on a native <select>
     ====================================================================== */
  function enhanceSelect(native) {
    var field = native.closest(".field");
    if (!field) return;

    field.classList.add("xfield");
    native.classList.add("xfield__native");
    native.setAttribute("tabindex", "-1");
    native.setAttribute("aria-hidden", "true");

    var trigger = el("button", "xfield__trigger xsel__trigger");
    trigger.type = "button";
    trigger.id = nextId("xsel");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    var valueEl = el("span", "xfield__value");
    trigger.appendChild(valueEl);
    var caret = el("span", "xsel__caret");
    caret.setAttribute("aria-hidden", "true");
    trigger.appendChild(caret);

    var pop = el("div", "xfield__pop xsel__pop");
    var list = el("div", "xsel__list");
    list.id = trigger.id + "-list";
    list.setAttribute("role", "listbox");
    pop.appendChild(list);
    pop.hidden = true;
    trigger.setAttribute("aria-controls", list.id);

    var options = [];        // { node, value }
    for (var i = 0; i < native.options.length; i++) {
      var o = native.options[i];
      var node = el("div", "xsel__opt");
      node.id = trigger.id + "-o" + i;
      node.setAttribute("role", "option");
      node.setAttribute("data-value", o.value);
      list.appendChild(node);
      options.push({ node: node, value: o.value, native: o });
    }
    if (!options.length) return;

    native.parentNode.insertBefore(trigger, native.nextSibling);
    trigger.parentNode.insertBefore(pop, trigger.nextSibling);
    wireLabel(field, native, trigger, valueEl);
    forwardFocus(native, trigger);

    var active = 0;          // index the keyboard is currently on

    function paintLabels() {
      for (var i = 0; i < options.length; i++) {
        options[i].node.textContent = options[i].native.textContent;
      }
      var sel = native.selectedIndex;
      valueEl.textContent = sel >= 0 ? options[sel].native.textContent : t("selectPlaceholder");
      field.classList.toggle("xfield--empty", sel < 0);
    }
    function paintState() {
      for (var i = 0; i < options.length; i++) {
        var isSel = i === native.selectedIndex;
        options[i].node.setAttribute("aria-selected", String(isSel));
        options[i].node.classList.toggle("is-selected", isSel);
        options[i].node.classList.toggle("is-active", i === active);
      }
      if (options[active]) list.setAttribute("aria-activedescendant", options[active].node.id);
    }
    relabellers.push(function () { paintLabels(); paintState(); });

    var handle = {
      contains: function (n) { return trigger.contains(n) || pop.contains(n); },
      close: function (refocus) {
        if (pop.hidden) return;
        pop.hidden = true;
        field.classList.remove("xfield--open", "xfield--flip", "xfield--right");
        trigger.setAttribute("aria-expanded", "false");
        trigger.removeAttribute("aria-activedescendant");
        if (openPopup === handle) openPopup = null;
        if (refocus) trigger.focus();
      }
    };

    function open() {
      if (!pop.hidden) return;
      setOpen(handle);
      active = native.selectedIndex >= 0 ? native.selectedIndex : 0;
      paintState();
      pop.hidden = false;
      field.classList.add("xfield--open");
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("aria-activedescendant", options[active].node.id);
      placePopup(field, trigger, pop);
      if (options[active]) {
        options[active].node.scrollIntoView({ block: "nearest" });
      }
    }
    function commit(index) {
      if (index < 0 || index >= options.length) return;
      var changed = native.selectedIndex !== index;
      native.selectedIndex = index;
      active = index;
      paintLabels();
      paintState();
      if (changed) announceChange(native);
    }

    trigger.addEventListener("click", function () {
      if (pop.hidden) open(); else handle.close(true);
    });
    trigger.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " " || k === "Spacebar") {
        e.preventDefault();
        if (pop.hidden) { open(); return; }
      }
      if (pop.hidden) return;

      if (k === "ArrowDown")      { active = Math.min(options.length - 1, active + 1); }
      else if (k === "ArrowUp")   { active = Math.max(0, active - 1); }
      else if (k === "Home")      { e.preventDefault(); active = 0; }
      else if (k === "End")       { e.preventDefault(); active = options.length - 1; }
      else if (k === "Enter" || k === " " || k === "Spacebar") { commit(active); handle.close(true); return; }
      else if (k === "Tab")       { commit(active); handle.close(false); return; }
      else if (k.length === 1) {
        // Typeahead, on the labels actually on screen — so it matches what
        // the visitor is reading, in whichever language that is.
        var needle = k.toLowerCase();
        for (var i = 1; i <= options.length; i++) {
          var j = (active + i) % options.length;
          if (options[j].node.textContent.toLowerCase().indexOf(needle) === 0) { active = j; break; }
        }
      } else { return; }

      paintState();
      trigger.setAttribute("aria-activedescendant", options[active].node.id);
      if (options[active]) options[active].node.scrollIntoView({ block: "nearest" });
    });

    list.addEventListener("click", function (e) {
      var node = e.target.closest(".xsel__opt");
      if (!node) return;
      for (var i = 0; i < options.length; i++) {
        if (options[i].node === node) { commit(i); break; }
      }
      handle.close(true);
    });
    // Pointer hover moves the active row, matching a native dropdown.
    list.addEventListener("mousemove", function (e) {
      var node = e.target.closest(".xsel__opt");
      if (!node) return;
      for (var i = 0; i < options.length; i++) {
        if (options[i].node === node && active !== i) { active = i; paintState(); break; }
      }
    });

    // If anything else ever sets the select, the trigger has to follow it
    // rather than keep showing a stale label. form.reset() is the live case
    // (js/contact.js calls it after a successful send) and it fires "reset"
    // on the form WITHOUT firing "change" on the controls, and before their
    // values are actually restored — hence the deferred read.
    native.addEventListener("change", function () { paintLabels(); paintState(); });
    if (native.form) {
      native.form.addEventListener("reset", function () {
        window.setTimeout(function () { paintLabels(); paintState(); }, 0);
      });
    }

    paintLabels();
    paintState();
  }

  /* ======================================================================
     CALENDAR  —  data-xdate on a native <input type="date">
     ====================================================================== */
  var DAY = 86400000;
  function ymd(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  /* Parsed by hand rather than through new Date(string): the Date
     constructor reads a bare "2026-07-12" as UTC midnight, which lands on
     the 11th for anyone west of Greenwich. Everything here is local. */
  function parseYmd(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ""));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }
  function midnight(d) { var c = new Date(d.getTime()); c.setHours(0, 0, 0, 0); return c; }
  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function enhanceDate(native) {
    var field = native.closest(".field");
    if (!field) return;

    field.classList.add("xfield");
    native.classList.add("xfield__native");
    native.setAttribute("tabindex", "-1");
    native.setAttribute("aria-hidden", "true");

    var trigger = el("button", "xfield__trigger xdate__trigger");
    trigger.type = "button";
    trigger.id = nextId("xdate");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");

    var valueEl = el("span", "xfield__value");
    trigger.appendChild(valueEl);
    var icon = el("span", "xdate__icon");
    icon.setAttribute("aria-hidden", "true");
    trigger.appendChild(icon);

    var pop = el("div", "xfield__pop xdate__pop");
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-modal", "false");
    pop.hidden = true;

    /* The dimmed backdrop behind the narrow-screen sheet. Only ever in the
       document while the sheet is open, and never a child of the popup, so
       that a tap on it is seen as a tap OUTSIDE the popup by the shared
       close-on-outside-click handler above. */
    var scrim = el("div", "xdate__scrim");
    var sheetMQ = window.matchMedia("(max-width: 640px)");

    var head = el("div", "xdate__head");
    var prev = el("button", "xdate__nav"); prev.type = "button";
    var monthLabel = el("span", "xdate__month");
    monthLabel.id = trigger.id + "-month";
    monthLabel.setAttribute("aria-live", "polite");
    var next = el("button", "xdate__nav"); next.type = "button";
    head.appendChild(prev); head.appendChild(monthLabel); head.appendChild(next);
    pop.appendChild(head);
    pop.setAttribute("aria-labelledby", monthLabel.id);

    var weekRow = el("div", "xdate__week");
    weekRow.setAttribute("role", "row");
    pop.appendChild(weekRow);

    var grid = el("div", "xdate__grid");
    grid.setAttribute("role", "grid");
    grid.setAttribute("aria-labelledby", monthLabel.id);
    pop.appendChild(grid);

    var foot = el("div", "xdate__foot");
    var todayBtn = el("button", "xdate__act"); todayBtn.type = "button";
    var clearBtn = el("button", "xdate__act xdate__act--quiet"); clearBtn.type = "button";
    foot.appendChild(todayBtn); foot.appendChild(clearBtn);
    pop.appendChild(foot);

    native.parentNode.insertBefore(trigger, native.nextSibling);
    trigger.parentNode.insertBefore(pop, trigger.nextSibling);
    /* Where the popup lives when it is a dropdown. Sheet mode lifts it out
       to <body> (see the .is-sheet comment in style.css) and this marker is
       how it finds its way back. */
    var popHome = document.createComment("xdate");
    pop.parentNode.insertBefore(popHome, pop);
    wireLabel(field, native, trigger, valueEl);
    forwardFocus(native, trigger);

    /* A wedding that already happened is not an enquiry, and js/contact.js
       rejects a past date anyway (fieldDate) — so rather than let one be
       picked and then complain about it, everything before the floor is
       simply not selectable. Any min/max already on the element wins, so
       this stays configurable from the markup. */
    var floor = parseYmd(native.getAttribute("min")) || midnight(new Date());
    var ceiling = parseYmd(native.getAttribute("max"));

    var selected = parseYmd(native.value);
    var cursor = new Date((selected || floor).getTime());   // month on screen
    cursor.setDate(1);
    var focusDay = selected ? new Date(selected.getTime()) : new Date(floor.getTime());

    function outOfRange(d) {
      if (floor && d < floor) return true;
      if (ceiling && d > ceiling) return true;
      return false;
    }
    function monthFormatter() { return new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }); }
    function longFormatter()  { return new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }); }
    function fullFormatter()  { return new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

    function paintChrome() {
      trigger.setAttribute("title", t("dateOpen"));
      prev.setAttribute("aria-label", t("datePrev"));
      next.setAttribute("aria-label", t("dateNext"));
      todayBtn.textContent = t("dateToday");
      clearBtn.textContent = t("dateClear");

      // 2024-01-01 was a Monday, which is where both el-GR and en-GB start
      // their week — so seven consecutive days from it give the header in
      // the right order for either language.
      var wf = new Intl.DateTimeFormat(locale(), { weekday: "short" });
      var wl = new Intl.DateTimeFormat(locale(), { weekday: "long" });
      weekRow.textContent = "";
      for (var i = 0; i < 7; i++) {
        var d = new Date(2024, 0, 1 + i);
        var cell = el("span", "xdate__wd");
        cell.setAttribute("role", "columnheader");
        cell.setAttribute("aria-label", wl.format(d));
        cell.textContent = wf.format(d).replace(/\.$/, "");
        weekRow.appendChild(cell);
      }
    }

    function paintValue() {
      if (selected) {
        valueEl.textContent = longFormatter().format(selected);
        field.classList.remove("xfield--empty");
      } else {
        valueEl.textContent = t("datePlaceholder");
        field.classList.add("xfield--empty");
      }
    }

    function paintGrid() {
      monthLabel.textContent = monthFormatter().format(cursor);
      grid.textContent = "";

      var today = midnight(new Date());
      var first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      // getDay() is 0=Sunday; shift so Monday is column 0.
      var lead = (first.getDay() + 6) % 7;
      var start = new Date(first.getTime() - lead * DAY);
      // Six rows always, so the popup never changes height as months change
      // under the pointer — a grid that resizes mid-click moves the day the
      // visitor was aiming at.
      var full = fullFormatter();

      for (var r = 0; r < 6; r++) {
        var row = el("div", "xdate__row");
        row.setAttribute("role", "row");
        for (var c = 0; c < 7; c++) {
          var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + r * 7 + c);
          var cellWrap = el("span", "xdate__cellwrap");
          cellWrap.setAttribute("role", "gridcell");
          var b = el("button", "xdate__day");
          b.type = "button";
          b.textContent = String(d.getDate());
          b.setAttribute("data-ymd", ymd(d));
          b.setAttribute("aria-label", full.format(d));
          if (d.getMonth() !== cursor.getMonth()) b.classList.add("is-outside");
          if (sameDay(d, today)) b.classList.add("is-today");
          if (sameDay(d, selected)) { b.classList.add("is-selected"); b.setAttribute("aria-current", "date"); }
          b.setAttribute("aria-selected", String(sameDay(d, selected)));
          if (outOfRange(d)) { b.disabled = true; b.classList.add("is-disabled"); }
          // Roving tabindex: one stop for the whole grid, arrows do the rest.
          b.tabIndex = sameDay(d, focusDay) ? 0 : -1;
          cellWrap.appendChild(b);
          row.appendChild(cellWrap);
        }
        grid.appendChild(row);
      }

      prev.disabled = !!floor &&
        new Date(cursor.getFullYear(), cursor.getMonth(), 0) < floor;
      next.disabled = !!ceiling &&
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) > ceiling;
    }

    function focusGrid() {
      var b = grid.querySelector('.xdate__day[tabindex="0"]');
      if (b) b.focus();
    }
    function showMonthOf(d) {
      cursor = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    function moveFocus(days) {
      var d = new Date(focusDay.getFullYear(), focusDay.getMonth(), focusDay.getDate() + days);
      if (floor && d < floor) d = new Date(floor.getTime());
      if (ceiling && d > ceiling) d = new Date(ceiling.getTime());
      focusDay = d;
      showMonthOf(d);
      paintGrid();
      focusGrid();
    }
    function moveMonth(delta) {
      var d = new Date(focusDay.getFullYear(), focusDay.getMonth() + delta, focusDay.getDate());
      // Clamps 31 Mar - 1 month back to 28/29 Feb rather than overflowing
      // into March again, which is what a bare month add would do.
      if (d.getMonth() !== ((focusDay.getMonth() + delta) % 12 + 12) % 12) d.setDate(0);
      if (floor && d < floor) d = new Date(floor.getTime());
      if (ceiling && d > ceiling) d = new Date(ceiling.getTime());
      focusDay = d;
      showMonthOf(d);
      paintGrid();
      focusGrid();
    }

    var handle = {
      contains: function (n) { return trigger.contains(n) || pop.contains(n); },
      close: function (refocus) {
        if (pop.hidden) return;
        pop.hidden = true;
        unsheet();
        field.classList.remove("xfield--open", "xfield--flip", "xfield--right");
        trigger.setAttribute("aria-expanded", "false");
        if (openPopup === handle) openPopup = null;
        if (refocus) trigger.focus();
      }
    };
    function sheet() {
      pop.classList.add("is-sheet");
      document.body.appendChild(scrim);
      document.body.appendChild(pop);
    }
    function unsheet() {
      if (!pop.classList.contains("is-sheet")) return;
      pop.classList.remove("is-sheet");
      if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      popHome.parentNode.insertBefore(pop, popHome.nextSibling);
    }

    function open() {
      if (!pop.hidden) return;
      setOpen(handle);
      focusDay = selected ? new Date(selected.getTime()) : new Date(Math.max(floor.getTime(), midnight(new Date()).getTime()));
      showMonthOf(focusDay);
      paintChrome();
      paintGrid();
      pop.hidden = false;
      field.classList.add("xfield--open");
      trigger.setAttribute("aria-expanded", "true");
      if (sheetMQ.matches) sheet(); else placePopup(field, trigger, pop);
      focusGrid();
    }
    function commit(d) {
      selected = d ? new Date(d.getTime()) : null;
      native.value = d ? ymd(d) : "";
      paintValue();
      announceChange(native);
      if (d && window.XP_announce) {
        window.XP_announce(fmt(t("dateChosen"), { date: fullFormatter().format(d) }));
      }
    }

    trigger.addEventListener("click", function () {
      if (pop.hidden) open(); else handle.close(true);
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        open();
      }
    });

    prev.addEventListener("click", function () { moveMonth(-1); });
    next.addEventListener("click", function () { moveMonth(1); });
    todayBtn.addEventListener("click", function () {
      var d = midnight(new Date());
      if (outOfRange(d)) return;
      commit(d);
      handle.close(true);
    });
    clearBtn.addEventListener("click", function () {
      commit(null);
      handle.close(true);
    });

    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".xdate__day");
      if (!b || b.disabled) return;
      var d = parseYmd(b.getAttribute("data-ymd"));
      if (!d) return;
      commit(d);
      handle.close(true);
    });

    pop.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "Tab") {
        // The popup is a self-contained group: Tab leaves it and closes it,
        // landing on whatever follows the trigger in the form, which is
        // where someone tabbing through the form expects to go next.
        handle.close(false);
        return;
      }
      if (!grid.contains(e.target)) return;
      if (k === "ArrowLeft")       { e.preventDefault(); moveFocus(-1); }
      else if (k === "ArrowRight") { e.preventDefault(); moveFocus(1); }
      else if (k === "ArrowUp")    { e.preventDefault(); moveFocus(-7); }
      else if (k === "ArrowDown")  { e.preventDefault(); moveFocus(7); }
      else if (k === "PageUp")     { e.preventDefault(); moveMonth(-1); }
      else if (k === "PageDown")   { e.preventDefault(); moveMonth(1); }
      else if (k === "Home")       { e.preventDefault(); moveFocus(-((focusDay.getDay() + 6) % 7)); }
      else if (k === "End")        { e.preventDefault(); moveFocus(6 - ((focusDay.getDay() + 6) % 7)); }
    });

    // Mirror any change made from outside back onto the trigger. Same
    // reset() caveat as the dropdown above: the form fires "reset", the
    // input does not fire "change", and the value is only cleared after the
    // event has been dispatched.
    function syncFromNative() {
      var v = parseYmd(native.value);
      if (!!v === !!selected && (!v || sameDay(v, selected))) return;
      selected = v;
      paintValue();
    }
    native.addEventListener("change", syncFromNative);
    if (native.form) {
      native.form.addEventListener("reset", function () {
        window.setTimeout(syncFromNative, 0);
      });
    }

    relabellers.push(function () {
      paintChrome();
      paintValue();
      if (!pop.hidden) paintGrid();
    });

    paintChrome();
    paintValue();
  }

  /* ---------------------------------------------------------------- boot */
  var selects = document.querySelectorAll("select[data-xselect]");
  for (var i = 0; i < selects.length; i++) enhanceSelect(selects[i]);

  var dates = document.querySelectorAll("input[type='date'][data-xdate]");
  for (var j = 0; j < dates.length; j++) enhanceDate(dates[j]);
})();
