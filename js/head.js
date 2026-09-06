/* Runs synchronously in <head>, before first paint: marks the document as
   script-capable so css/style.css can safely hide the scroll-reveal elements.
   Without JS the class never changes and everything stays visible.
   It lives in its own file rather than inline so the Content-Security-Policy
   can keep script-src at 'self' with no 'unsafe-inline'. */
document.documentElement.className =
  document.documentElement.className.replace("no-js", "js");

/* ---------------------------------------------------------------------------
   Keep previews out of search results, without a launch-day trap.

   The site is shared as a preview on hosts that are not the clinic's own
   domain — GitHub Pages, a staging URL, a laptop. Those copies should never be
   indexed: a preview competing with the real site in search results, or simply
   being findable while it is unfinished, helps nobody.

   Rather than writing a noindex tag into the pages — which would then have to
   be remembered and removed on launch day, and would silently delist the real
   site if it were not — the tag is added here only when the page is NOT being
   served from vet-care.gr. On the real domain nothing is added and nothing has
   to be undone. The canonical link in every page already points at
   vet-care.gr, so a crawler that ignores this still knows which copy is the
   original.
   --------------------------------------------------------------------------- */
(function () {
  var host = location.hostname;
  if (/(^|\.)vet-care\.gr$/i.test(host)) return;   /* the live site: leave alone */

  var meta = document.createElement("meta");
  meta.setAttribute("name", "robots");
  meta.setAttribute("content", "noindex, nofollow, noarchive");
  document.head.appendChild(meta);
})();
