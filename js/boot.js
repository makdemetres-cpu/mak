/* ==========================================================================
   Runs synchronously in <head>, before first paint.
   Kept deliberately tiny — everything here blocks rendering by design.

   Two jobs:
   1. Mark the document as JS-capable. The scroll-reveal hidden states in
      style.css are all scoped to `.js`, so if this file never runs (JS off,
      blocked, or an error) every section is simply visible. The page is
      never left blank waiting on an observer.
   2. Restore the visitor's language before anything paints, so a Greek
      visitor who chose English never sees a flash of Greek first.

   Storing the language choice is exempt from the ePrivacy consent
   requirement: Art. 5(3) of Directive 2002/58/EC excludes storage that is
   strictly necessary to provide a service the user explicitly requested,
   and a language the user themselves selected is the textbook example.
   See cookies.html for the full table.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var lang = null;
  try {
    lang = localStorage.getItem("xp_lang");
  } catch (e) {
    /* Private mode, or storage disabled entirely. Fall through to default. */
  }

  if (lang !== "el" && lang !== "en") {
    // No stored choice — infer once from the browser, defaulting to Greek,
    // since the site's primary audience is local.
    var nav = (navigator.language || "el").toLowerCase();
    lang = nav.indexOf("el") === 0 ? "el" : (nav.indexOf("en") === 0 ? "en" : "el");
  }

  root.setAttribute("lang", lang);
})();
