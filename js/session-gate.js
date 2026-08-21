/* ==========================================================================
   HydroCore — fresh-visit detector
   Runs synchronously, first, before the page body parses.
   - Marks whether this load is a genuinely new browser session (tab/browser
     just opened) vs. a refresh or in-site navigation, via sessionStorage —
     other scripts read window.__hcFreshVisit instead of deciding this
     themselves, so every script on the page agrees.
   - On a fresh visit landing on the homepage, strips any #section hash and
     disables native scroll restoration so the page always opens at the top,
     instead of jumping back to wherever the visitor scrolled to last time.
   ========================================================================== */
(function () {
  "use strict";

  var FLAG = "hc_visit_active_v1";
  var isFresh = true;
  try {
    isFresh = !sessionStorage.getItem(FLAG);
    if (isFresh) sessionStorage.setItem(FLAG, "1");
  } catch (e) {
    isFresh = true; // storage unavailable — fail open, same as a fresh visit
  }
  window.__hcFreshVisit = isFresh;

  var path = location.pathname.replace(/^.*\//, "");
  var isHome = path === "" || path === "index.html";

  if (isFresh && isHome) {
    if ("scrollRestoration" in history) {
      try { history.scrollRestoration = "manual"; } catch (e) {}
    }
    if (location.hash) {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    }
  }
})();
