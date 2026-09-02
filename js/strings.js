/* ==========================================================================
   Strings that JavaScript has to produce itself — ARIA labels, validation
   messages, status text. Static page copy is NOT here: it lives directly in
   the HTML as [data-lang-el] / [data-lang-en] pairs, so the page reads
   correctly with JavaScript disabled and both languages are in the markup
   for search engines. See css/style.css → "Language pairs".
   ========================================================================== */
window.XP_STRINGS = {
  el: {
    menuOpen: "Άνοιγμα μενού",
    menuClose: "Κλείσιμο μενού",
    langSwitched: "Η γλώσσα άλλαξε στα Ελληνικά",

    lightboxOpen: "Προβολή φωτογραφίας σε πλήρες μέγεθος",
    lightboxClose: "Κλείσιμο προβολής",
    lightboxPrev: "Προηγούμενη φωτογραφία",
    lightboxNext: "Επόμενη φωτογραφία",
    lightboxOf: "{n} από {total}",

    toTop: "Επιστροφή στην κορυφή",

    consentSaved: "Οι προτιμήσεις σας αποθηκεύτηκαν.",
    consentAccepted: "Αποδεχτήκατε όλα τα cookies.",
    consentDeclined: "Απορρίφθηκαν όλα τα μη απαραίτητα cookies.",

    fieldRequired: "Το πεδίο είναι υποχρεωτικό.",
    fieldEmail: "Δώστε μια έγκυρη διεύθυνση email.",
    fieldPhone: "Δώστε ένα έγκυρο τηλέφωνο (π.χ. 6941234567).",
    fieldDate: "Επιλέξτε μια ημερομηνία από σήμερα και μετά.",
    fieldConsent: "Πρέπει να συμφωνήσετε με την Πολιτική Απορρήτου για να στείλετε το μήνυμα.",

    formSending: "Αποστολή…",
    formSend: "Αποστολή μηνύματος",
    formOkTitle: "Το μήνυμά σας στάλθηκε.",
    formOkBody: "Ευχαριστούμε. Ο Χρόνης θα σας απαντήσει συνήθως εντός 48 ωρών.",
    formErrTitle: "Το μήνυμα δεν στάλθηκε.",
    formErrBody: "Κάτι πήγε στραβά με την αποστολή. Στείλτε μας απευθείας email στο {email} και θα απαντήσουμε το συντομότερο.",
    formMailtoBody: "Ανοίγουμε το πρόγραμμα email σας με τα στοιχεία συμπληρωμένα. Αν δεν άνοιξε, στείλτε μας email στο {email}."
  },

  en: {
    menuOpen: "Open menu",
    menuClose: "Close menu",
    langSwitched: "Language switched to English",

    lightboxOpen: "View photograph full size",
    lightboxClose: "Close viewer",
    lightboxPrev: "Previous photograph",
    lightboxNext: "Next photograph",
    lightboxOf: "{n} of {total}",

    toTop: "Back to top",

    consentSaved: "Your preferences have been saved.",
    consentAccepted: "You accepted all cookies.",
    consentDeclined: "All non-essential cookies were declined.",

    fieldRequired: "This field is required.",
    fieldEmail: "Enter a valid email address.",
    fieldPhone: "Enter a valid phone number (e.g. +30 694 123 4567).",
    fieldDate: "Choose a date from today onward.",
    fieldConsent: "You must agree to the Privacy Policy before sending.",

    formSending: "Sending…",
    formSend: "Send message",
    formOkTitle: "Your message has been sent.",
    formOkBody: "Thank you. Chronis usually replies within 48 hours.",
    formErrTitle: "The message could not be sent.",
    formErrBody: "Something went wrong sending the form. Please email us directly at {email} and we'll reply as soon as we can.",
    formMailtoBody: "We've opened your email app with the details filled in. If nothing opened, please email us at {email}."
  }
};
