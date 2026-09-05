/* ===========================================================================
   Confirmation for the destructive buttons on review-admin.php.

   This lives in its own file rather than an onsubmit="" attribute because the
   site's Content-Security-Policy is script-src 'self' — inline handlers are
   refused, silently, so the attribute version never ran and Delete removed a
   review on a single click with no warning at all.
   =========================================================================== */
(function () {
  "use strict";
  var forms = document.querySelectorAll("form[data-confirm]");
  for (var i = 0; i < forms.length; i++) {
    forms[i].addEventListener("submit", function (event) {
      if (!window.confirm(this.getAttribute("data-confirm"))) {
        event.preventDefault();
      }
    });
  }
})();
