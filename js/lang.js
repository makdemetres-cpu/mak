/* ==========================================================================
   SITRIXWEB — Greek / English

   How it works: both languages are in the HTML, marked with data-l="en" or
   data-l="el", and the stylesheet shows one and hides the other based on
   data-lang on <html>. That means no flash of the wrong language, no waiting
   on a fetch, and — because the attribute is stamped in the markup itself —
   the page still reads correctly with JavaScript switched off.

   Attributes that cannot hold two values at once (placeholders, aria-labels,
   the page title and meta description) are swapped here instead, from
   data-*-en / data-*-el pairs.

   The chosen language is remembered in localStorage. That storage is exempt
   from the consent requirement: Art. 5(3) of Directive 2002/58/EC (Greek Law
   3471/2006 Art. 4(5)) excludes storage strictly necessary for a service the
   user explicitly requested, and a language the user picked themselves is
   the textbook example. It is listed in cookies.html all the same.
   ========================================================================== */
(() => {
  "use strict";

  const KEY = "sitrix_lang";
  const LANGS = ["en", "el"];
  const root = document.documentElement;

  function stored() {
    try {
      const v = localStorage.getItem(KEY);
      return LANGS.indexOf(v) !== -1 ? v : null;
    } catch (e) { return null; }
  }

  /* Applies everything that is not plain text: the document language (which
     screen readers and hyphenation depend on), the title, the description,
     and any attribute given as a data-*-en / data-*-el pair. */
  function apply(lang) {
    // These two are set synchronously, before the first paint, so the page
    // never renders in one language and then swaps to the other.
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "el" ? "el" : "en");

    // The rest needs a document to walk, so it waits if the parser is still
    // working. This file is deliberately loaded in <head> without `defer`.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => paint(lang), { once: true });
      return;
    }
    paint(lang);
  }

  function paint(lang) {
    const title = root.getAttribute("data-title-" + lang);
    if (title) document.title = title;

    const desc = root.getAttribute("data-desc-" + lang);
    const meta = document.querySelector('meta[name="description"]');
    if (desc && meta) meta.setAttribute("content", desc);

    document.querySelectorAll("[data-ph-en]").forEach((el) => {
      const v = el.getAttribute("data-ph-" + lang);
      if (v !== null) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-aria-en]").forEach((el) => {
      const v = el.getAttribute("data-aria-" + lang);
      if (v !== null) el.setAttribute("aria-label", v);
    });

    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      const on = b.getAttribute("data-lang-btn") === lang;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    document.dispatchEvent(new CustomEvent("sitrix:lang", { detail: lang }));
  }

  function set(lang) {
    if (LANGS.indexOf(lang) === -1) return;
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply(lang);
  }

  /* First visit: follow the browser, defaulting to English for everyone whose
     browser is not asking for Greek. */
  function detect() {
    const list = navigator.languages || [navigator.language || "en"];
    for (let i = 0; i < list.length; i++) {
      const l = String(list[i]).toLowerCase();
      if (l.indexOf("el") === 0) return "el";
      if (l.indexOf("en") === 0) return "en";
    }
    return "en";
  }

  const current = stored() || detect();
  apply(current);

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-btn]");
    if (!btn) return;
    e.preventDefault();
    set(btn.getAttribute("data-lang-btn"));
  });

  window.SitrixLang = {
    get: () => root.getAttribute("data-lang") || "en",
    set,
    /* Used by booking.js, reviews.js and consent.js for the strings they
       generate at runtime rather than ship in the markup. */
    t(dict) {
      const l = root.getAttribute("data-lang") || "en";
      return (dict && (dict[l] !== undefined ? dict[l] : dict.en)) || "";
    },
  };
})();
