/* ===========================================================================
   Branded form controls: dropdown + date picker
   ---------------------------------------------------------------------------
   A browser draws <select> popups and the native date calendar itself, using
   the operating system's widgets — CSS cannot reach inside them. So to make
   them match the rest of the site they have to be rebuilt in the page.

   This is progressive enhancement, not replacement: the real <select> and
   <input type="date"> stay in the form and remain the source of truth. The
   custom UI writes back into them and fires the same `input`/`change` events,
   so validation, the honeypot, translation and submission all carry on working
   untouched. If this file fails to load, the native controls come back and the
   form still works.

   Accessibility follows the WAI-ARIA select-only combobox pattern: full
   keyboard control (arrows, Home/End, Enter, Escape, type-ahead), managed
   focus, and aria-activedescendant so a screen reader tracks the highlight.
   =========================================================================== */

(function () {
  "use strict";

  var active = null;          /* the one open popup, if any */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function t(key, fallback) {
    var s = window.VetCareI18n ? window.VetCareI18n.t(key) : "";
    return s || fallback;
  }
  function lang() {
    return window.VetCareI18n ? window.VetCareI18n.lang : "el";
  }

  function closeActive() {
    if (active) active.close();
  }

  document.addEventListener("mousedown", function (event) {
    if (active && !active.root.contains(event.target)) closeActive();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && active) {
      var button = active.button;
      active.close();
      button.focus();
    }
  });
  window.addEventListener("resize", closeActive);

  /* Small screens get a bottom sheet instead of an anchored popup — an
     anchored menu near the bottom of a phone is unreachable with a thumb. */
  function isSheet() {
    return window.matchMedia("(max-width: 620px)").matches;
  }

  function makeBackdrop() {
    var el = document.createElement("div");
    el.className = "cpop-backdrop";
    document.body.appendChild(el);
    return el;
  }

  /* ---------------------------------------------------------------- select */
  function enhanceSelect(select) {
    if (select.dataset.enhanced) return;
    select.dataset.enhanced = "1";

    var root = document.createElement("div");
    root.className = "cselect";
    select.parentNode.insertBefore(root, select);
    root.appendChild(select);

    select.classList.add("cselect__native");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "cselect__btn";
    button.id = select.id + "-btn";
    button.setAttribute("role", "combobox");
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");

    var valueEl = document.createElement("span");
    valueEl.className = "cselect__value";
    button.appendChild(valueEl);

    var chev = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chev.setAttribute("class", "cselect__chev");
    chev.setAttribute("viewBox", "0 0 24 24");
    chev.setAttribute("aria-hidden", "true");
    var chevPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    chevPath.setAttribute("d", "m6 9.5 6 6 6-6");
    chevPath.setAttribute("fill", "none");
    chevPath.setAttribute("stroke", "currentColor");
    chevPath.setAttribute("stroke-width", "1.9");
    chevPath.setAttribute("stroke-linecap", "round");
    chevPath.setAttribute("stroke-linejoin", "round");
    chev.appendChild(chevPath);
    button.appendChild(chev);
    root.appendChild(button);

    var pop = document.createElement("div");
    pop.className = "cpop cselect__pop";
    pop.hidden = true;
    var list = document.createElement("ul");
    list.className = "cselect__list";
    list.id = select.id + "-list";
    list.setAttribute("role", "listbox");
    list.tabIndex = -1;
    pop.appendChild(list);
    root.appendChild(pop);

    button.setAttribute("aria-controls", list.id);

    /* A <label for="…"> pointing at the now-hidden select is re-pointed at the
       button, which is a labelable element, so clicking the label still works. */
    var label = select.id ? document.querySelector('label[for="' + select.id + '"]') : null;
    if (label) label.htmlFor = button.id;

    /* booking.js focuses the first invalid field; send it here, not to the
       hidden native element. */
    select.customFocusTarget = button;

    var options = [];
    var index = -1;          /* highlighted option while open */
    var backdrop = null;
    var typed = "";
    var typedAt = 0;

    function render() {
      list.textContent = "";
      options = [];
      for (var i = 0; i < select.options.length; i++) {
        var native = select.options[i];
        var li = document.createElement("li");
        li.className = "cselect__opt";
        li.id = select.id + "-opt-" + i;
        li.setAttribute("role", "option");
        li.textContent = native.text;
        li.dataset.index = String(i);
        if (native.value === "") li.classList.add("is-placeholder");
        li.setAttribute("aria-selected", i === select.selectedIndex ? "true" : "false");
        /* The "please choose…" row is not a real answer, so it never gets the
           selected treatment even while it is technically the current value. */
        if (i === select.selectedIndex && native.value !== "") li.classList.add("is-selected");
        list.appendChild(li);
        options.push(li);
      }
      syncValue();
    }

    function syncValue() {
      var chosen = select.options[select.selectedIndex];
      var empty = !chosen || chosen.value === "";
      valueEl.textContent = chosen ? chosen.text : "";
      button.classList.toggle("is-empty", empty);
    }

    function highlight(next) {
      if (index > -1 && options[index]) options[index].classList.remove("is-active");
      index = Math.max(0, Math.min(next, options.length - 1));
      var el = options[index];
      if (!el) return;
      el.classList.add("is-active");
      button.setAttribute("aria-activedescendant", el.id);
      el.scrollIntoView({ block: "nearest" });
    }

    function open() {
      if (!pop.hidden) return;
      closeActive();
      pop.hidden = false;
      root.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      if (isSheet()) {
        root.classList.add("is-sheet");
        backdrop = makeBackdrop();
        backdrop.addEventListener("click", function () { close(); button.focus(); });
        document.body.style.overflow = "hidden";
      } else {
        /* Flip upwards when there is not enough room below. */
        var space = window.innerHeight - button.getBoundingClientRect().bottom;
        pop.classList.toggle("is-up", space < Math.min(280, options.length * 46 + 20));
      }
      active = controller;
      highlight(select.selectedIndex > -1 ? select.selectedIndex : 0);
      list.focus();
    }

    function close() {
      if (pop.hidden) return;
      pop.hidden = true;
      pop.classList.remove("is-up");
      root.classList.remove("is-open", "is-sheet");
      button.setAttribute("aria-expanded", "false");
      button.removeAttribute("aria-activedescendant");
      if (backdrop) { backdrop.remove(); backdrop = null; }
      document.body.style.overflow = "";
      if (active === controller) active = null;
    }

    function choose(i) {
      if (i < 0 || i >= select.options.length) return;
      select.selectedIndex = i;
      /* Both events, so anything listening for either keeps working. */
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      render();
      close();
      button.focus();
    }

    var controller = { root: root, button: button, close: close };

    button.addEventListener("click", function () {
      pop.hidden ? open() : (close(), button.focus());
    });

    list.addEventListener("click", function (event) {
      var li = event.target.closest(".cselect__opt");
      if (li) choose(parseInt(li.dataset.index, 10));
    });

    list.addEventListener("mousemove", function (event) {
      var li = event.target.closest(".cselect__opt");
      if (li) highlight(parseInt(li.dataset.index, 10));
    });

    function onKey(event) {
      var key = event.key;
      if (pop.hidden) {
        if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
          event.preventDefault();
          open();
        }
        return;
      }
      if (key === "ArrowDown") { event.preventDefault(); highlight(index + 1); }
      else if (key === "ArrowUp") { event.preventDefault(); highlight(index - 1); }
      else if (key === "Home") { event.preventDefault(); highlight(0); }
      else if (key === "End") { event.preventDefault(); highlight(options.length - 1); }
      else if (key === "Enter" || key === " ") { event.preventDefault(); choose(index); }
      else if (key === "Tab") { close(); }
      else if (key.length === 1) {
        /* Type-ahead, the way a native select behaves. */
        var now = Date.now();
        typed = now - typedAt > 900 ? key : typed + key;
        typedAt = now;
        var needle = typed.toLowerCase();
        for (var i = 0; i < options.length; i++) {
          if (options[i].textContent.toLowerCase().indexOf(needle) === 0) { highlight(i); break; }
        }
      }
    }
    button.addEventListener("keydown", onKey);
    list.addEventListener("keydown", onKey);

    document.addEventListener("vetcare:langchange", render);
    render();
  }

  /* ------------------------------------------------------------------ date */
  var MS_DAY = 86400000;

  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }
  function fromIso(s) {
    if (!s) return null;
    var bits = s.split("-");
    if (bits.length !== 3) return null;
    var d = new Date(+bits[0], +bits[1] - 1, +bits[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function enhanceDate(input) {
    if (input.dataset.enhanced) return;
    input.dataset.enhanced = "1";

    var root = document.createElement("div");
    root.className = "cdate";
    input.parentNode.insertBefore(root, input);
    root.appendChild(input);

    input.classList.add("cdate__native");
    input.setAttribute("tabindex", "-1");
    input.setAttribute("aria-hidden", "true");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "cselect__btn cdate__btn";
    button.id = input.id + "-btn";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    var valueEl = document.createElement("span");
    valueEl.className = "cselect__value";
    button.appendChild(valueEl);

    var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "cselect__chev cdate__icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<rect x="3.2" y="5" width="17.6" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
      '<path d="M3.2 10h17.6M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>';
    button.appendChild(icon);
    root.appendChild(button);

    var pop = document.createElement("div");
    pop.className = "cpop cdate__pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-modal", "false");
    pop.hidden = true;
    root.appendChild(pop);

    var label = input.id ? document.querySelector('label[for="' + input.id + '"]') : null;
    if (label) label.htmlFor = button.id;
    input.customFocusTarget = button;

    var view = null;      /* first day of the month on screen */
    var cursor = null;    /* keyboard-focused day */
    var backdrop = null;

    function minDate() {
      return fromIso(input.min) || null;
    }
    function disabled(d) {
      var min = minDate();
      if (min && d < min) return true;
      var day = d.getDay();
      return day === 0 || day === 6;   /* clinic is closed at weekends */
    }

    function label_() {
      var chosen = fromIso(input.value);
      if (!chosen) {
        valueEl.textContent = t("booking.datePlaceholder", "Επιλέξτε ημερομηνία");
        button.classList.add("is-empty");
        return;
      }
      button.classList.remove("is-empty");
      try {
        valueEl.textContent = new Intl.DateTimeFormat(lang() === "el" ? "el-GR" : "en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        }).format(chosen);
      } catch (e) {
        valueEl.textContent = input.value;
      }
    }

    function build() {
      pop.textContent = "";

      var head = document.createElement("div");
      head.className = "cdate__head";

      var prev = document.createElement("button");
      prev.type = "button";
      prev.className = "cdate__nav";
      prev.setAttribute("aria-label", t("date.prevMonth", "Προηγούμενος μήνας"));
      prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      var title = document.createElement("div");
      title.className = "cdate__title";
      title.setAttribute("aria-live", "polite");
      try {
        title.textContent = new Intl.DateTimeFormat(lang() === "el" ? "el-GR" : "en-GB",
          { month: "long", year: "numeric" }).format(view);
      } catch (e) {
        title.textContent = view.getMonth() + 1 + "/" + view.getFullYear();
      }

      var next = document.createElement("button");
      next.type = "button";
      next.className = "cdate__nav";
      next.setAttribute("aria-label", t("date.nextMonth", "Επόμενος μήνας"));
      next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      prev.addEventListener("click", function () { shiftMonth(-1); });
      next.addEventListener("click", function () { shiftMonth(1); });

      head.appendChild(prev);
      head.appendChild(title);
      head.appendChild(next);
      pop.appendChild(head);

      /* Weekday initials, Monday first (both Greek and UK convention). */
      var names = document.createElement("div");
      names.className = "cdate__weekdays";
      var fmt;
      try {
        fmt = new Intl.DateTimeFormat(lang() === "el" ? "el-GR" : "en-GB", { weekday: "short" });
      } catch (e) { fmt = null; }
      var monday = new Date(2024, 0, 1);  /* a known Monday */
      for (var w = 0; w < 7; w++) {
        var cell = document.createElement("span");
        var day = new Date(monday.getTime() + w * MS_DAY);
        cell.textContent = fmt ? fmt.format(day).replace(".", "").slice(0, 2) : "";
        if (w >= 5) cell.className = "is-weekend";
        names.appendChild(cell);
      }
      pop.appendChild(names);

      var grid = document.createElement("div");
      grid.className = "cdate__grid";
      grid.setAttribute("role", "grid");

      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var lead = (first.getDay() + 6) % 7;              /* Monday = 0 */
      var start = new Date(first.getTime() - lead * MS_DAY);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var chosen = fromIso(input.value);

      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var cellBtn = document.createElement("button");
        cellBtn.type = "button";
        cellBtn.className = "cdate__day";
        cellBtn.textContent = String(d.getDate());
        cellBtn.dataset.iso = iso(d);
        if (d.getMonth() !== view.getMonth()) cellBtn.classList.add("is-outside");
        if (d.getTime() === today.getTime()) cellBtn.classList.add("is-today");
        if (chosen && d.getTime() === chosen.getTime()) {
          cellBtn.classList.add("is-chosen");
          cellBtn.setAttribute("aria-current", "date");
        }
        if (disabled(d)) { cellBtn.disabled = true; cellBtn.classList.add("is-off"); }
        cellBtn.tabIndex = cursor && d.getTime() === cursor.getTime() ? 0 : -1;
        grid.appendChild(cellBtn);
      }
      pop.appendChild(grid);

      var foot = document.createElement("div");
      foot.className = "cdate__foot";
      var note = document.createElement("span");
      note.textContent = t("date.closedNote", "Σάββατο και Κυριακή κλειστά");
      var clear = document.createElement("button");
      clear.type = "button";
      clear.className = "cdate__clear";
      clear.textContent = t("date.clear", "Καθαρισμός");
      clear.addEventListener("click", function () {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        label_();
        close();
        button.focus();
      });
      foot.appendChild(note);
      foot.appendChild(clear);
      pop.appendChild(foot);
    }

    function shiftMonth(delta) {
      view = new Date(view.getFullYear(), view.getMonth() + delta, 1);
      build();
      var focusable = pop.querySelector(".cdate__day:not(.is-outside):not(:disabled)");
      if (focusable) { focusable.tabIndex = 0; focusable.focus(); cursor = fromIso(focusable.dataset.iso); }
    }

    function pick(isoStr) {
      input.value = isoStr;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      label_();
      close();
      button.focus();
    }

    pop.addEventListener("click", function (event) {
      var day = event.target.closest(".cdate__day");
      if (day && !day.disabled) pick(day.dataset.iso);
    });

    pop.addEventListener("keydown", function (event) {
      var moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      if (moves[event.key] !== undefined) {
        event.preventDefault();
        cursor = new Date((cursor || new Date()).getTime() + moves[event.key] * MS_DAY);
        if (cursor.getMonth() !== view.getMonth() || cursor.getFullYear() !== view.getFullYear()) {
          view = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        }
        build();
        var target = pop.querySelector('.cdate__day[data-iso="' + iso(cursor) + '"]');
        if (target) { target.tabIndex = 0; target.focus(); }
      } else if (event.key === "PageUp") { event.preventDefault(); shiftMonth(-1); }
      else if (event.key === "PageDown") { event.preventDefault(); shiftMonth(1); }
    });

    function open() {
      if (!pop.hidden) return;
      closeActive();
      var chosen = fromIso(input.value);
      var min = minDate() || new Date();
      cursor = chosen || min;
      view = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      build();
      pop.hidden = false;
      root.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      if (isSheet()) {
        root.classList.add("is-sheet");
        backdrop = makeBackdrop();
        backdrop.addEventListener("click", function () { close(); button.focus(); });
        document.body.style.overflow = "hidden";
      } else {
        var space = window.innerHeight - button.getBoundingClientRect().bottom;
        pop.classList.toggle("is-up", space < 380);
      }
      active = controller;
      var focusable = pop.querySelector('.cdate__day[data-iso="' + iso(cursor) + '"]') ||
        pop.querySelector(".cdate__day:not(:disabled)");
      if (focusable) { focusable.tabIndex = 0; focusable.focus(); }
    }

    function close() {
      if (pop.hidden) return;
      pop.hidden = true;
      pop.classList.remove("is-up");
      root.classList.remove("is-open", "is-sheet");
      button.setAttribute("aria-expanded", "false");
      if (backdrop) { backdrop.remove(); backdrop = null; }
      document.body.style.overflow = "";
      if (active === controller) active = null;
    }

    var controller = { root: root, button: button, close: close };

    button.addEventListener("click", function () {
      pop.hidden ? open() : (close(), button.focus());
    });
    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    document.addEventListener("vetcare:langchange", function () {
      label_();
      if (!pop.hidden) build();
    });
    label_();
  }

  /* ------------------------------------------------------------------ boot */
  function init() {
    var form = document.getElementById("booking-form");
    if (!form) return;
    form.querySelectorAll("select").forEach(enhanceSelect);
    form.querySelectorAll('input[type="date"]').forEach(enhanceDate);
    document.documentElement.classList.add("has-custom-controls");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
