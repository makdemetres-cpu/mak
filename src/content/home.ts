import type { AppLocale } from "@/i18n/routing";

export interface HomeContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    kicker: string;
    headline: string;
    sub: string;
    ctaPrimary: string;
    ctaEmergency: string;
  };
  trust: Array<{ value: string; label: string }>;
  // Service list items live in content/services.ts (shared with the
  // /services detail pages) — this is just the section wrapper copy.
  services: {
    kicker: string;
    heading: string;
  };
  howItWorks: {
    kicker: string;
    heading: string;
    steps: Array<{ number: string; title: string; description: string }>;
  };
  work: {
    kicker: string;
    heading: string;
    projects: Array<{ title: string; caption: string; imageLabel: string }>;
  };
  testimonials: {
    kicker: string;
    heading: string;
    placeholderQuote: string;
    placeholderAttribution: string;
  };
  serviceArea: {
    kicker: string;
    heading: string;
    intro: string;
    areas: string[];
    mapTitle: string;
    mapBody: string;
    mapCta: string;
  };
  bookingCta: {
    heading: string;
    sub: string;
    ctaPrimary: string;
  };
}

const el: HomeContent = {
  meta: {
    title: "HydroCore — Υδραυλικοί Μηχανικοί, Αθήνα | 23 Χρόνια, Γρήγορη Απόκριση",
    description:
      "Η HydroCore εξυπηρετεί σπίτια στην Αθήνα εδώ και 23 χρόνια — επείγουσες διαρροές, εγκαταστάσεις λεβήτων, ανακαινίσεις μπάνιου, ενδοδαπέδια θέρμανση. Ομάδα 12 αδειοδοτημένων τεχνικών.",
  },
  hero: {
    kicker: "ΑΘΗΝΑ — ΑΠΟ ΤΟ 2003",
    headline: "Είκοσι τρία χρόνια κάτω από τα πατώματα της Αθήνας. Επιτόπου εντός 60 λεπτών όταν είναι επείγον.",
    sub: "Η HydroCore είναι μια υδραυλική πρακτική δώδεκα ατόμων που δραστηριοποιείται σε όλη την ευρύτερη Αθήνα — εγκαταστάσεις λεβήτων, ανακαινίσεις μπάνιου, ενδοδαπέδια θέρμανση και διαρροές που δεν περιμένουν. Ο άνθρωπος που κάνει την προσφορά είναι ο ίδιος που κάνει τη δουλειά.",
    ctaPrimary: "Κλείστε ραντεβού",
    ctaEmergency: "Επείγον — καλέστε τώρα",
  },
  trust: [
    { value: "23", label: "χρόνια εμπειρίας" },
    { value: "12", label: "τεχνικοί" },
    { value: "EL835105724", label: "ΑΦΜ — αδειοδοτημένοι & ασφαλισμένοι" },
    { value: "60′", label: "μέσος χρόνος απόκρισης, κέντρο Αθήνας" },
  ],
  services: {
    kicker: "ΥΠΗΡΕΣΙΕΣ",
    heading: "Ό,τι χρειάζεται ένα σπίτι, από έναν μηχανικό",
  },
  howItWorks: {
    kicker: "ΠΩΣ ΔΟΥΛΕΥΟΥΜΕ",
    heading: "Τέσσερα βήματα, καμία έκπληξη",
    steps: [
      {
        number: "01",
        title: "Πείτε μας τι συμβαίνει",
        description: "Τύπος εργασίας, πόσο επείγον είναι, φωτογραφίες αν έχετε.",
      },
      {
        number: "02",
        title: "Επιβεβαιώνουμε ραντεβού",
        description: "Ένα πραγματικό χρονικό παράθυρο, όχι αναμονή όλης της ημέρας.",
      },
      {
        number: "03",
        title: "Ένας τεχνικός, από την αρχή ως το τέλος",
        description: "Όποιος αναλαμβάνει τη δουλειά είναι αυτός που την ολοκληρώνει.",
      },
      {
        number: "04",
        title: "Παράδοση εγγράφως",
        description: "Σημείωμα ολοκλήρωσης και τυχόν όροι εγγύησης, μέσω email.",
      },
    ],
  },
  work: {
    kicker: "ΕΡΓΑ",
    heading: "Πρόσφατη δουλειά",
    projects: [
      {
        title: "Κολωνάκι — Πλήρης ανακαίνιση μπάνιου",
        caption: "Απογύμνωση έως τελική πλακόστρωση σε διαμέρισμα δεκαετίας 1930.",
        imageLabel:
          "Φωτογραφία: ολοκληρωμένο μπάνιο στο Κολωνάκι — γωνιακή λήψη ντουζιέρας και πλακιδίων, φυσικός φωτισμός",
      },
      {
        title: "Γλυφάδα — Ενδοδαπέδια θέρμανση",
        caption: "Πλήρες retrofit υδραυλικού συστήματος σε μονοκατοικία.",
        imageLabel:
          "Φωτογραφία: σωληνώσεις ενδοδαπέδιας θέρμανσης πριν τη σκυροδέτηση, τακτοποιημένο flat-lay πλάνο",
      },
      {
        title: "Παγκράτι — Αντικατάσταση λέβητα",
        caption: "Αναβάθμιση σε συμπυκνωτικό λέβητα, ολοκληρωμένη εντός μίας ημέρας.",
        imageLabel: "Φωτογραφία: νέος λέβητας εγκατεστημένος, καθαρή σύνδεση χάλκινων σωληνώσεων σε close-up",
      },
    ],
  },
  testimonials: {
    kicker: "ΜΑΡΤΥΡΙΕΣ",
    heading: "Τι λένε οι πελάτες μας",
    placeholderQuote: "[Εδώ θα προστεθεί πραγματική μαρτυρία πελάτη πριν τη δημοσίευση του ιστότοπου.]",
    placeholderAttribution: "— Όνομα πελάτη, περιοχή",
  },
  serviceArea: {
    kicker: "ΠΕΡΙΟΧΗ ΕΞΥΠΗΡΕΤΗΣΗΣ",
    heading: "Καλύπτουμε όλη την ευρύτερη Αθήνα",
    intro: "Αν είστε εντός Αττικής, πιθανότατα σας καλύπτουμε. Ενδεικτικά:",
    areas: [
      "Κολωνάκι",
      "Παγκράτι",
      "Νέα Σμύρνη",
      "Γλυφάδα",
      "Βούλα",
      "Χαλάνδρι",
      "Μαρούσι",
      "Κηφισιά",
      "Περιστέρι",
      "Νέα Ιωνία",
      "Πειραιάς",
      "Βριλήσσια",
    ],
    mapTitle: "Διαδραστικός χάρτης",
    mapBody:
      "Ο χάρτης φορτώνει δεδομένα από τη Google μόνο αφού αποδεχτείτε τα cookies χαρτών. Δείτε την Πολιτική Cookies για λεπτομέρειες.",
    mapCta: "Ενεργοποίηση χάρτη",
  },
  bookingCta: {
    heading: "Κάτι χρειάζεται επισκευή;",
    sub: "Πείτε μας μία φορά — αναλαμβάνουμε εμείς από εκεί.",
    ctaPrimary: "Κλείστε ραντεβού",
  },
};

const en: HomeContent = {
  meta: {
    title: "HydroCore — Plumbing Engineers, Athens | 23 Years, Fast Response",
    description:
      "HydroCore has serviced Athens homes for 23 years — emergency leaks, boiler installs, bathroom renovations, underfloor heating. Licensed team of 12. Book online or call now.",
  },
  hero: {
    kicker: "ATHENS — SINCE 2003",
    headline: "Twenty-three years under Athens' floors. On site within 60 minutes when it's urgent.",
    sub: "HydroCore is a twelve-person plumbing practice working across greater Athens — boiler installs, bathroom renovations, underfloor heating, and the leaks that can't wait. The person who quotes the job is the person who does it.",
    ctaPrimary: "Book a visit",
    ctaEmergency: "Emergency — call now",
  },
  trust: [
    { value: "23", label: "years trading" },
    { value: "12", label: "engineers" },
    { value: "EL835105724", label: "VAT — licensed & insured" },
    { value: "60′", label: "average response, central Athens" },
  ],
  services: {
    kicker: "SERVICES",
    heading: "Everything a home needs, from one engineer",
  },
  howItWorks: {
    kicker: "HOW IT WORKS",
    heading: "Four steps, no surprises",
    steps: [
      {
        number: "01",
        title: "Tell us what's wrong",
        description: "Service type, how urgent it is, photos if you have them.",
      },
      {
        number: "02",
        title: "We confirm a slot",
        description: "A real time window, not a day-long wait.",
      },
      {
        number: "03",
        title: "One engineer, start to finish",
        description: "The person who scoped it does the work.",
      },
      {
        number: "04",
        title: "Signed off, in writing",
        description: "Completion note and any warranty terms by email.",
      },
    ],
  },
  work: {
    kicker: "WORK",
    heading: "Recent projects",
    projects: [
      {
        title: "Kolonaki — Full bathroom renovation",
        caption: "Strip-out to finished tiling in a 1930s apartment.",
        imageLabel: "Photo: finished bathroom in Kolonaki — angled shot of shower and tiling, natural light",
      },
      {
        title: "Glyfada — Underfloor heating retrofit",
        caption: "Full wet-system retrofit in a detached house.",
        imageLabel: "Photo: underfloor heating pipework before the pour, tidy flat-lay shot",
      },
      {
        title: "Pagkrati — Boiler replacement",
        caption: "Upgrade to a condensing boiler, completed in one day.",
        imageLabel: "Photo: newly installed boiler, clean copper pipework connections, close-up",
      },
    ],
  },
  testimonials: {
    kicker: "TESTIMONIALS",
    heading: "What clients say",
    placeholderQuote: "[A real customer quote will be added here before the site goes live.]",
    placeholderAttribution: "— Client name, area",
  },
  serviceArea: {
    kicker: "SERVICE AREA",
    heading: "We cover greater Athens",
    intro: "If you're within Attica, we most likely cover you. A sample:",
    areas: [
      "Kolonaki",
      "Pagkrati",
      "Nea Smyrni",
      "Glyfada",
      "Voula",
      "Chalandri",
      "Marousi",
      "Kifisia",
      "Peristeri",
      "Nea Ionia",
      "Piraeus",
      "Vrilissia",
    ],
    mapTitle: "Interactive map",
    mapBody: "The map loads data from Google only once you accept map cookies. See the Cookie Policy for details.",
    mapCta: "Enable map",
  },
  bookingCta: {
    heading: "Something needs fixing?",
    sub: "Tell us once — we'll take it from there.",
    ctaPrimary: "Book a visit",
  },
};

const content: Record<AppLocale, HomeContent> = { el, en };

export function getHomeContent(locale: AppLocale): HomeContent {
  return content[locale];
}
