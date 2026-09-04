/* Runs synchronously in <head>, before first paint: marks the document as
   script-capable so css/style.css can safely hide the scroll-reveal elements.
   Without JS the class never changes and everything stays visible.
   It lives in its own file rather than inline so the Content-Security-Policy
   can keep script-src at 'self' with no 'unsafe-inline'. */
document.documentElement.className =
  document.documentElement.className.replace("no-js", "js");
