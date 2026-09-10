/* ==========================================================================
   SITRIXWEB — runtime strings, Greek and English

   Anything the page writes at runtime rather than shipping in the markup:
   month and day names, validation messages, the consent banner, success
   copy. Text that lives in the HTML is translated there instead, inside
   data-l="en" / data-l="el" blocks.

   Read through window.SitrixLang.t(), which falls back to English if a key
   is missing a Greek string.
   ========================================================================== */
window.SITRIX_STRINGS = {

  /* ---------------------------------------------------------- calendar */
  months: {
    en: ["January", "February", "March", "April", "May", "June",
         "July", "August", "September", "October", "November", "December"],
    el: ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου",
         "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"],
  },
  monthsStandalone: {
    en: ["January", "February", "March", "April", "May", "June",
         "July", "August", "September", "October", "November", "December"],
    el: ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
         "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"],
  },
  days: {
    en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    el: ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"],
  },
  dayInitials: {
    en: ["M", "T", "W", "T", "F", "S", "S"],
    el: ["Δ", "Τ", "Τ", "Π", "Π", "Σ", "Κ"],
  },
  prevMonth: { en: "Previous month", el: "Προηγούμενος μήνας" },
  nextMonth: { en: "Next month", el: "Επόμενος μήνας" },
  unavailable: { en: " — unavailable", el: " — μη διαθέσιμη" },
  slotGone: { en: " — no longer available", el: " — δεν είναι πλέον διαθέσιμη" },
  pickDayFirst: {
    en: "Pick a day first and the open times will appear here.",
    el: "Διαλέξτε πρώτα ημέρα και θα εμφανιστούν εδώ οι διαθέσιμες ώρες.",
  },
  dayFull: {
    en: "Nothing left on this day — try the next one.",
    el: "Δεν έμεινε τίποτα για αυτή την ημέρα — δοκιμάστε την επόμενη.",
  },
  summaryEmpty: {
    en: "Choose a day and a time and your slot will be summarised here.",
    el: "Επιλέξτε ημέρα και ώρα και το ραντεβού σας θα συνοψιστεί εδώ.",
  },

  /* ---------------------------------------------------------- booking */
  bkNoSlot: {
    en: "Pick a day and a time above first.",
    el: "Επιλέξτε πρώτα ημέρα και ώρα παραπάνω.",
  },
  bkName: {
    en: "Please tell me what to call you.",
    el: "Πείτε μου πώς να σας αποκαλώ.",
  },
  bkEmail: {
    en: "That email address doesn't look right.",
    el: "Αυτή η διεύθυνση email δεν φαίνεται σωστή.",
  },
  bkConsent: {
    en: "I need your consent to store these details and contact you about the call.",
    el: "Χρειάζομαι τη συγκατάθεσή σας για να αποθηκεύσω τα στοιχεία και να επικοινωνήσω μαζί σας για την κλήση.",
  },
  bkSending: { en: "Booking…", el: "Γίνεται κράτηση…" },
  bkFailed: {
    en: "Something went wrong sending that. Please email me directly instead.",
    el: "Κάτι πήγε στραβά κατά την αποστολή. Στείλτε μου απευθείας email.",
  },

  /* ---------------------------------------------------------- reviews */
  rvPending: { en: "Awaiting publication", el: "Σε αναμονή δημοσίευσης" },
  rvRating: {
    en: "Pick a rating from one to five stars.",
    el: "Επιλέξτε βαθμολογία από ένα έως πέντε αστέρια.",
  },
  rvName: {
    en: "A name (or first name) please.",
    el: "Ένα όνομα (ή μικρό όνομα) παρακαλώ.",
  },
  rvText: {
    en: "A sentence or two would help — 15 characters minimum.",
    el: "Μία-δύο προτάσεις θα βοηθούσαν — τουλάχιστον 15 χαρακτήρες.",
  },
  rvConsent: {
    en: "I need your permission before publishing this.",
    el: "Χρειάζομαι την άδειά σας πριν το δημοσιεύσω.",
  },
  rvSending: { en: "Sending…", el: "Αποστολή…" },
  rvFailed: {
    en: "That didn't send. Please email it to me instead and I'll add it.",
    el: "Δεν στάλθηκε. Στείλτε μου το με email και θα το προσθέσω.",
  },
  outOfFive: { en: " out of 5", el: " στα 5" },

  /* ---------------------------------------------------------- consent */
  ccTitle: { en: "Cookies, honestly", el: "Cookies, με ειλικρίνεια" },
  ccBody: {
    en: "This site uses one strictly necessary cookie-equivalent to remember this choice. " +
        "Anything else — preferences and anonymous analytics — only runs if you say yes. " +
        "You can change your mind at any time from the footer.",
    el: "Αυτός ο ιστότοπος χρησιμοποιεί ένα απολύτως απαραίτητο στοιχείο αποθήκευσης για να θυμάται αυτή την επιλογή. " +
        "Οτιδήποτε άλλο — προτιμήσεις και ανώνυμα στατιστικά — εκτελείται μόνο αν συμφωνήσετε. " +
        "Μπορείτε να αλλάξετε γνώμη οποιαδήποτε στιγμή από το υποσέλιδο.",
  },
  ccAccept: { en: "Accept all", el: "Αποδοχή όλων" },
  ccReject: { en: "Reject non-essential", el: "Απόρριψη μη απαραίτητων" },
  ccCustomise: { en: "Customise", el: "Προσαρμογή" },
  ccPrefsTitle: { en: "Cookie settings", el: "Ρυθμίσεις cookies" },
  ccPrefsIntro: {
    en: "Switch on only what you are comfortable with. Full detail in the ",
    el: "Ενεργοποιήστε μόνο όσα σας βολεύουν. Πλήρεις λεπτομέρειες στην ",
  },
  ccPolicyLink: { en: "Cookie Policy", el: "Πολιτική Cookies" },
  ccPrivacyLink: { en: "Privacy Policy", el: "Πολιτική Απορρήτου" },
  ccSave: { en: "Save my choices", el: "Αποθήκευση επιλογών" },
  ccCancel: { en: "Cancel", el: "Ακύρωση" },
  ccAlwaysOn: { en: "Always on", el: "Πάντα ενεργό" },
  ccAllow: { en: "Allow", el: "Να επιτρέπεται" },
  ccDialogLabel: { en: "Cookie choices", el: "Επιλογές cookies" },

  catNecessary: { en: "Strictly necessary", el: "Απολύτως απαραίτητα" },
  catNecessaryD: {
    en: "Keeps your cookie choice and your language, and lets forms work. These cannot be switched off and never identify you.",
    el: "Διατηρεί την επιλογή σας για τα cookies και τη γλώσσα, και επιτρέπει στις φόρμες να λειτουργούν. Δεν απενεργοποιούνται και δεν σας ταυτοποιούν ποτέ.",
  },
  catPreferences: { en: "Preferences", el: "Προτιμήσεις" },
  catPreferencesD: {
    en: "Remembers small choices you make on the site — such as a review you submitted — on this device only.",
    el: "Θυμάται μικρές επιλογές σας στον ιστότοπο — όπως μια κριτική που υποβάλατε — μόνο σε αυτή τη συσκευή.",
  },
  catAnalytics: { en: "Analytics", el: "Στατιστικά" },
  catAnalyticsD: {
    en: "Anonymous, aggregated statistics about which pages get read, so I can improve them. Nothing is loaded unless you allow it.",
    el: "Ανώνυμα, συγκεντρωτικά στατιστικά για το ποιες σελίδες διαβάζονται, ώστε να τις βελτιώνω. Δεν φορτώνεται τίποτα χωρίς την άδειά σας.",
  },
  catMarketing: { en: "Marketing", el: "Μάρκετινγκ" },
  catMarketingD: {
    en: "Would allow advertising or remarketing tags. None are used on this site today; the switch is here so the choice stays yours if that ever changes.",
    el: "Θα επέτρεπε ετικέτες διαφήμισης ή remarketing. Δεν χρησιμοποιείται καμία σήμερα· ο διακόπτης υπάρχει ώστε η επιλογή να παραμένει δική σας αν αυτό αλλάξει.",
  },
};
