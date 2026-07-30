/* Small dictionary for strings JS has to generate itself (toasts, aria
   labels, dynamic booking confirmations). Static page copy lives directly
   in the HTML as [data-lang-el]/[data-lang-en] pairs — see style.css. */
window.HC_STRINGS = {
  el: {
    menuOpen: "Άνοιγμα μενού", menuClose: "Κλείσιμο μενού",
    langSwitchTo: "Switch to English",
    toastCopied: "Αντιγράφηκε στο πρόχειρο",
    testiPrev: "Προηγούμενη μαρτυρία", testiNext: "Επόμενη μαρτυρία",
    getDirections: "Οδηγίες", callNow: "Κλήση",
    consentSaved: "Οι προτιμήσεις cookies αποθηκεύτηκαν",
    consentAcceptedAll: "Αποδεχτήκατε όλα τα cookies",
    consentRejected: "Απορρίφθηκαν τα μη απαραίτητα cookies",
    bookingRef: "Κωδικός Αιτήματος",
    bookingSuccessMail: "Στάλθηκε στο appointments@hydrocore.gr — θα επικοινωνήσουμε εντός 2 ωρών εργάσιμου ωραρίου.",
    bookingFallbackMail: "Ανοίξαμε το πρόγραμμα email σας με τα στοιχεία συμπληρωμένα προς appointments@hydrocore.gr. Αν δεν ανοίξει αυτόματα, στείλτε μας email στο appointments@hydrocore.gr με τον κωδικό αιτήματός σας.",
    fieldRequired: "Το πεδίο είναι υποχρεωτικό",
    fieldInvalidPhone: "Δώστε έγκυρο τηλέφωνο (π.χ. 6912345678 ή 2310123456)",
    fieldInvalidEmail: "Δώστε έγκυρο email",
    fieldInvalidDate: "Επιλέξτε ημερομηνία από σήμερα και μετά",
    consentRequired: "Πρέπει να αποδεχτείτε την Πολιτική Απορρήτου για να συνεχίσετε",
    stepOf: "Βήμα {n} από {total}",
    copied: "Αντιγράφηκε"
  },
  en: {
    menuOpen: "Open menu", menuClose: "Close menu",
    langSwitchTo: "Αλλαγή σε Ελληνικά",
    toastCopied: "Copied to clipboard",
    testiPrev: "Previous testimonial", testiNext: "Next testimonial",
    getDirections: "Directions", callNow: "Call now",
    consentSaved: "Your cookie preferences were saved",
    consentAcceptedAll: "You accepted all cookies",
    consentRejected: "Non-essential cookies were rejected",
    bookingRef: "Request Reference",
    bookingSuccessMail: "Sent to appointments@hydrocore.gr — we'll be in touch within 2 business hours.",
    bookingFallbackMail: "We opened your email app with the details addressed to appointments@hydrocore.gr. If it didn't open automatically, please email us at appointments@hydrocore.gr with your request reference.",
    fieldRequired: "This field is required",
    fieldInvalidPhone: "Enter a valid phone number (e.g. 6912345678 or 2310123456)",
    fieldInvalidEmail: "Enter a valid email address",
    fieldInvalidDate: "Choose a date from today onward",
    consentRequired: "You must accept the Privacy Policy to continue",
    stepOf: "Step {n} of {total}",
    copied: "Copied"
  }
};

window.HC_LANG = {
  get: function () {
    return localStorage.getItem("hc_lang") || document.documentElement.getAttribute("data-lang") || "el";
  },
  t: function (key) {
    var lang = window.HC_LANG.get();
    var dict = window.HC_STRINGS[lang] || window.HC_STRINGS.el;
    return dict[key] || key;
  },
  set: function (lang) {
    if (lang !== "el" && lang !== "en") return;
    localStorage.setItem("hc_lang", lang);
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });
    var titleAttr = document.documentElement.getAttribute("data-title-" + lang);
    if (titleAttr) document.title = titleAttr;
    var descAttr = document.documentElement.getAttribute("data-desc-" + lang);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (descAttr && metaDesc) metaDesc.setAttribute("content", descAttr);
    document.dispatchEvent(new CustomEvent("hc:langchange", { detail: { lang: lang } }));
  },
  init: function () {
    var saved = localStorage.getItem("hc_lang");
    var lang = saved || "el";
    window.HC_LANG.set(lang);
    document.querySelectorAll(".lang-switch").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-lang]");
        if (!btn) return;
        window.HC_LANG.set(btn.dataset.lang);
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", window.HC_LANG.init);
