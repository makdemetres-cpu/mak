import type { AppLocale } from "@/i18n/routing";
import type { PropertyTypeValue, UrgencyValue } from "@/lib/validation/booking";

export interface BookingContent {
  meta: { title: string; description: string };
  /** Contains literal "{current}" and "{total}" placeholders — this is
   * plain data (not a function) because it's passed from a Server
   * Component into the client-side wizard, and functions can't cross
   * that boundary as props. See formatStepLabel. */
  stepLabelTemplate: string;
  nav: { back: string; next: string; submit: string; submitting: string };
  steps: {
    service: { kicker: string; heading: string; intro: string };
    urgency: {
      kicker: string;
      heading: string;
      options: Record<UrgencyValue, { title: string; body: string }>;
    };
    location: {
      kicker: string;
      heading: string;
      address: string;
      addressPlaceholder: string;
      postcode: string;
      postcodePlaceholder: string;
      propertyType: string;
      propertyTypeOptions: Record<PropertyTypeValue, string>;
      floor: string;
      floorPlaceholder: string;
      parkingNotes: string;
      parkingNotesPlaceholder: string;
    };
    schedule: {
      kicker: string;
      heading: string;
      dateLabel: string;
      slotLabel: string;
      noSlots: string;
      loadingSlots: string;
    };
    contact: {
      kicker: string;
      heading: string;
      name: string;
      namePlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      notes: string;
      notesPlaceholder: string;
      photo: string;
      photoHint: string;
      photoRemove: string;
    };
    review: {
      kicker: string;
      heading: string;
      serviceLabel: string;
      urgencyLabel: string;
      whenLabel: string;
      whereLabel: string;
      contactLabel: string;
      notesLabel: string;
      editLabel: string;
      privacyPrefix: string;
      privacyLinkText: string;
      privacySuffix: string;
    };
  };
  emergency: { heading: string; body: string; callCta: string; continueCta: string };
  validation: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    invalidPostcode: string;
    photoTooLarge: string;
    photoWrongType: string;
    mustAcceptPrivacy: string;
    selectOption: string;
    selectDate: string;
    selectSlot: string;
  };
  success: { heading: string; body: string; referenceLabel: string; ctaHome: string };
  errors: { generic: string; slotTaken: string; rateLimited: string };
  urgencyLabels: Record<UrgencyValue, string>;
  propertyTypeLabels: Record<PropertyTypeValue, string>;
}

const el: BookingContent = {
  meta: {
    title: "Κλείστε ραντεβού",
    description: "Κλείστε online ραντεβού για υδραυλικές εργασίες στην Αθήνα σε λίγα βήματα.",
  },
  stepLabelTemplate: "Βήμα {current} από {total}",
  nav: { back: "Πίσω", next: "Επόμενο", submit: "Επιβεβαίωση κράτησης", submitting: "Αποστολή…" },
  steps: {
    service: {
      kicker: "ΤΙ ΧΡΕΙΑΖΕΣΤΕ",
      heading: "Τι χρειάζεστε;",
      intro: "Επιλέξτε την υπηρεσία που ταιριάζει καλύτερα.",
    },
    urgency: {
      kicker: "ΠΟΣΟ ΕΠΕΙΓΟΝ",
      heading: "Πόσο επείγον είναι;",
      options: {
        EMERGENCY_TODAY: { title: "Επείγον, σήμερα", body: "Ενεργή διαρροή ή βλάβη που δεν μπορεί να περιμένει." },
        WITHIN_48H: { title: "Εντός 48 ωρών", body: "Χρειάζεται σύντομα, αλλά όχι σήμερα." },
        FLEXIBLE: { title: "Ευέλικτο", body: "Διαλέξτε μια ημερομηνία που σας βολεύει." },
      },
    },
    location: {
      kicker: "ΠΟΥ",
      heading: "Πού;",
      address: "Διεύθυνση",
      addressPlaceholder: "Οδός και αριθμός",
      postcode: "Ταχυδρομικός κώδικας",
      postcodePlaceholder: "Τ.Κ.",
      propertyType: "Τύπος ακινήτου",
      propertyTypeOptions: { APARTMENT: "Διαμέρισμα", HOUSE: "Μονοκατοικία", OTHER: "Άλλο" },
      floor: "Όροφος",
      floorPlaceholder: "π.χ. 2ος",
      parkingNotes: "Σημειώσεις πάρκινγκ (προαιρετικό)",
      parkingNotesPlaceholder: "π.χ. δύσκολη στάθμευση, υπάρχει χώρος στην αυλή",
    },
    schedule: {
      kicker: "ΠΟΤΕ",
      heading: "Πότε σας βολεύει;",
      dateLabel: "Ημερομηνία",
      slotLabel: "Ώρα",
      noSlots: "Δεν υπάρχουν διαθέσιμες ώρες αυτή την ημέρα. Δοκιμάστε άλλη ημερομηνία.",
      loadingSlots: "Έλεγχος διαθεσιμότητας…",
    },
    contact: {
      kicker: "ΣΤΟΙΧΕΙΑ ΕΠΙΚΟΙΝΩΝΙΑΣ",
      heading: "Πώς να επικοινωνήσουμε μαζί σας;",
      name: "Ονοματεπώνυμο",
      namePlaceholder: "Το ονοματεπώνυμό σας",
      phone: "Τηλέφωνο",
      phonePlaceholder: "69XXXXXXXX",
      email: "Email",
      emailPlaceholder: "you@example.com",
      notes: "Σημειώσεις (προαιρετικό)",
      notesPlaceholder: "Οτιδήποτε άλλο θα ήταν χρήσιμο να ξέρουμε",
      photo: "Φωτογραφία του προβλήματος (προαιρετικό)",
      photoHint: "JPG, PNG ή HEIC, έως 5MB",
      photoRemove: "Αφαίρεση",
    },
    review: {
      kicker: "ΕΛΕΓΧΟΣ",
      heading: "Ελέγξτε τα στοιχεία σας",
      serviceLabel: "Υπηρεσία",
      urgencyLabel: "Επείγον",
      whenLabel: "Πότε",
      whereLabel: "Διεύθυνση",
      contactLabel: "Επικοινωνία",
      notesLabel: "Σημειώσεις",
      editLabel: "Επεξεργασία",
      privacyPrefix: "Έχω διαβάσει και αποδέχομαι την ",
      privacyLinkText: "Πολιτική Απορρήτου",
      privacySuffix: ".",
    },
  },
  emergency: {
    heading: "Μη χάνετε χρόνο — καλέστε μας τώρα",
    body: "Για ενεργή διαρροή ή επείγουσα βλάβη, το τηλέφωνο είναι πιο γρήγορο από τη φόρμα.",
    callCta: "Καλέστε τώρα",
    continueCta: "Προτιμώ να συνεχίσω online",
  },
  validation: {
    required: "Υποχρεωτικό πεδίο",
    invalidEmail: "Μη έγκυρο email",
    invalidPhone: "Μη έγκυρος αριθμός τηλεφώνου (ελληνική μορφή)",
    invalidPostcode: "Μη έγκυρος ταχυδρομικός κώδικας (5 ψηφία)",
    photoTooLarge: "Το αρχείο υπερβαίνει τα 5MB",
    photoWrongType: "Επιτρέπονται μόνο εικόνες (JPG, PNG, HEIC)",
    mustAcceptPrivacy: "Πρέπει να αποδεχτείτε την Πολιτική Απορρήτου για να συνεχίσετε",
    selectOption: "Επιλέξτε μία επιλογή",
    selectDate: "Επιλέξτε ημερομηνία",
    selectSlot: "Επιλέξτε ώρα",
  },
  success: {
    heading: "Η κράτησή σας καταχωρήθηκε",
    body: "Θα επικοινωνήσουμε σύντομα για επιβεβαίωση. Σας στείλαμε και email με τα στοιχεία.",
    referenceLabel: "Αριθμός αναφοράς",
    ctaHome: "Αρχική σελίδα",
  },
  errors: {
    generic: "Κάτι πήγε στραβά. Δοκιμάστε ξανά ή καλέστε μας.",
    slotTaken: "Αυτή η ώρα μόλις κλείστηκε από κάποιον άλλον. Διαλέξτε άλλη.",
    rateLimited: "Πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο ή καλέστε μας.",
  },
  urgencyLabels: { EMERGENCY_TODAY: "Επείγον, σήμερα", WITHIN_48H: "Εντός 48 ωρών", FLEXIBLE: "Ευέλικτο" },
  propertyTypeLabels: { APARTMENT: "Διαμέρισμα", HOUSE: "Μονοκατοικία", OTHER: "Άλλο" },
};

const en: BookingContent = {
  meta: {
    title: "Book a visit",
    description: "Book a plumbing visit online across Athens in a few quick steps.",
  },
  stepLabelTemplate: "Step {current} of {total}",
  nav: { back: "Back", next: "Next", submit: "Confirm booking", submitting: "Submitting…" },
  steps: {
    service: {
      kicker: "WHAT YOU NEED",
      heading: "What do you need?",
      intro: "Choose the service that fits best.",
    },
    urgency: {
      kicker: "HOW URGENT",
      heading: "How urgent is it?",
      options: {
        EMERGENCY_TODAY: { title: "Emergency, today", body: "An active leak or fault that can't wait." },
        WITHIN_48H: { title: "Within 48 hours", body: "Needs doing soon, but not today." },
        FLEXIBLE: { title: "Flexible", body: "Pick a date that works for you." },
      },
    },
    location: {
      kicker: "WHERE",
      heading: "Where?",
      address: "Address",
      addressPlaceholder: "Street and number",
      postcode: "Postcode",
      postcodePlaceholder: "Postcode",
      propertyType: "Property type",
      propertyTypeOptions: { APARTMENT: "Apartment", HOUSE: "House", OTHER: "Other" },
      floor: "Floor",
      floorPlaceholder: "e.g. 2nd",
      parkingNotes: "Parking notes (optional)",
      parkingNotesPlaceholder: "e.g. tight parking, yard space available",
    },
    schedule: {
      kicker: "WHEN",
      heading: "When works for you?",
      dateLabel: "Date",
      slotLabel: "Time",
      noSlots: "No slots available that day. Try another date.",
      loadingSlots: "Checking availability…",
    },
    contact: {
      kicker: "CONTACT DETAILS",
      heading: "How should we reach you?",
      name: "Full name",
      namePlaceholder: "Your full name",
      phone: "Phone",
      phonePlaceholder: "69XXXXXXXX",
      email: "Email",
      emailPlaceholder: "you@example.com",
      notes: "Notes (optional)",
      notesPlaceholder: "Anything else that would help us",
      photo: "Photo of the problem (optional)",
      photoHint: "JPG, PNG or HEIC, up to 5MB",
      photoRemove: "Remove",
    },
    review: {
      kicker: "REVIEW",
      heading: "Check your details",
      serviceLabel: "Service",
      urgencyLabel: "Urgency",
      whenLabel: "When",
      whereLabel: "Address",
      contactLabel: "Contact",
      notesLabel: "Notes",
      editLabel: "Edit",
      privacyPrefix: "I have read and accept the ",
      privacyLinkText: "Privacy Policy",
      privacySuffix: ".",
    },
  },
  emergency: {
    heading: "Don't wait — call us now",
    body: "For an active leak or urgent fault, the phone is faster than the form.",
    callCta: "Call now",
    continueCta: "I'd rather continue online",
  },
  validation: {
    required: "This field is required",
    invalidEmail: "Enter a valid email",
    invalidPhone: "Enter a valid Greek phone number",
    invalidPostcode: "Enter a valid postcode (5 digits)",
    photoTooLarge: "File is larger than 5MB",
    photoWrongType: "Images only (JPG, PNG, HEIC)",
    mustAcceptPrivacy: "You need to accept the Privacy Policy to continue",
    selectOption: "Choose an option",
    selectDate: "Choose a date",
    selectSlot: "Choose a time",
  },
  success: {
    heading: "Your booking is in",
    body: "We'll be in touch shortly to confirm. We've also sent you an email with the details.",
    referenceLabel: "Reference number",
    ctaHome: "Homepage",
  },
  errors: {
    generic: "Something went wrong. Try again or call us.",
    slotTaken: "That slot was just booked by someone else. Please choose another.",
    rateLimited: "Too many attempts. Try again shortly, or call us.",
  },
  urgencyLabels: { EMERGENCY_TODAY: "Emergency, today", WITHIN_48H: "Within 48 hours", FLEXIBLE: "Flexible" },
  propertyTypeLabels: { APARTMENT: "Apartment", HOUSE: "House", OTHER: "Other" },
};

const content: Record<AppLocale, BookingContent> = { el, en };

export function getBookingContent(locale: AppLocale): BookingContent {
  return content[locale];
}

export function formatStepLabel(template: string, current: number, total: number): string {
  return template.replace("{current}", String(current)).replace("{total}", String(total));
}
