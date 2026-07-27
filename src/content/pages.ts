import type { AppLocale } from "@/i18n/routing";

interface Meta {
  title: string;
  description: string;
}

export interface ServicesPageContent {
  meta: Meta;
  eyebrow: string;
  title: string;
  intro: string;
  listHeading: string;
}

export interface AboutPageContent {
  meta: Meta;
  eyebrow: string;
  title: string;
  intro: string;
  story: string[];
  valuesHeading: string;
  values: Array<{ title: string; body: string }>;
}

export interface WorkPageContent {
  meta: Meta;
  eyebrow: string;
  title: string;
  intro: string;
}

export interface ContactPageContent {
  meta: Meta;
  eyebrow: string;
  title: string;
  intro: string;
  hoursHeading: string;
  hours: string;
  addressHeading: string;
}

const servicesPage: Record<AppLocale, ServicesPageContent> = {
  el: {
    meta: {
      title: "Υπηρεσίες",
      description:
        "Επείγουσες διαρροές, λέβητες, ανακαινίσεις μπάνιου, ενδοδαπέδια θέρμανση, αποχετεύσεις και θερμοσίφωνες — υπηρεσίες υδραυλικού στην Αθήνα από την HydroCore.",
    },
    eyebrow: "ΥΠΗΡΕΣΙΕΣ",
    title: "Υπηρεσίες υδραυλικού, χωρίς εκπλήξεις στην τιμή",
    intro:
      "Έξι βασικές υπηρεσίες, ένα συνεργείο. Επιλέξτε παρακάτω για να δείτε τι περιλαμβάνει η κάθε μία και πότε αξίζει να μας καλέσετε.",
    listHeading: "Λίστα υπηρεσιών",
  },
  en: {
    meta: {
      title: "Services",
      description:
        "Emergency leaks, boilers, bathroom renovations, underfloor heating, drain clearing and water heaters — plumbing services across Athens from HydroCore.",
    },
    eyebrow: "SERVICES",
    title: "Plumbing services, no surprises on price",
    intro: "Six core services, one crew. Pick one below to see what's included and when it's worth calling us.",
    listHeading: "List of services",
  },
};

const aboutPage: Record<AppLocale, AboutPageContent> = {
  el: {
    meta: {
      title: "Σχετικά",
      description:
        "Η HydroCore είναι μια υδραυλική πρακτική δώδεκα ατόμων που δραστηριοποιείται στην Αθήνα από το 2003.",
    },
    eyebrow: "ΣΧΕΤΙΚΑ",
    title: "Είκοσι τρία χρόνια στην Αθήνα",
    intro:
      "Η HydroCore ξεκίνησε ως ατομική επιχείρηση το 2003 και σήμερα είναι μια ομάδα δώδεκα τεχνικών που καλύπτει ολόκληρη την ευρύτερη Αθήνα.",
    story: [
      "Το όνομα πίσω από την επιχείρηση παραμένει το ίδιο από την πρώτη μέρα: mak theplumber. Η ομάδα μεγάλωσε, η προσέγγιση όχι — ένας τεχνικός αναλαμβάνει κάθε δουλειά από την αρχή έως το τέλος, χωρίς ενδιάμεσους υπεργολάβους.",
      "Δουλεύουμε σε όλη την ευρύτερη Αθήνα, σε ελληνικά και αγγλικά, σε ό,τι έχει να κάνει με νερό: από μια βρύση που δεν σταματάει έως μια πλήρη ανακαίνιση μπάνιου.",
      "Είμαστε αδειοδοτημένοι και ασφαλισμένοι.",
    ],
    valuesHeading: "Τι μας ξεχωρίζει",
    values: [
      {
        title: "Ένας τεχνικός, καμία υπεργολαβία",
        body: "Το άτομο που κάνει την προσφορά είναι αυτό που κάνει και τη δουλειά.",
      },
      {
        title: "Σαφής τιμολόγηση",
        body: "Τιμή πριν ξεκινήσουμε, όχι εκπλήξεις στο τέλος.",
      },
      {
        title: "Καθαρό αποτέλεσμα",
        body: "Ολοκληρωμένη δουλειά, σημείωμα παράδοσης, και εγγύηση όπου ισχύει.",
      },
    ],
  },
  en: {
    meta: {
      title: "About",
      description: "HydroCore is a twelve-person plumbing practice that's worked across Athens since 2003.",
    },
    eyebrow: "ABOUT",
    title: "Twenty-three years in Athens",
    intro:
      "HydroCore started as a one-person operation in 2003 and is today a twelve-engineer team covering greater Athens.",
    story: [
      "The name behind the business hasn't changed since day one: mak theplumber. The team has grown; the approach hasn't — one engineer sees a job through from start to finish, with no subcontracted middle step.",
      "We work across greater Athens, in Greek and English, on anything to do with water — from a tap that won't stop dripping to a full bathroom renovation.",
      "We're licensed and insured.",
    ],
    valuesHeading: "What sets us apart",
    values: [
      {
        title: "One engineer, no subcontracting",
        body: "The person who quotes the job is the one who does it.",
      },
      {
        title: "Clear pricing",
        body: "A price before we start, not a surprise at the end.",
      },
      {
        title: "A clean finish",
        body: "Completed work, a handover note, and warranty terms where they apply.",
      },
    ],
  },
};

const workPage: Record<AppLocale, WorkPageContent> = {
  el: {
    meta: {
      title: "Έργα",
      description: "Πρόσφατα έργα της HydroCore σε ολόκληρη την Αθήνα.",
    },
    eyebrow: "ΕΡΓΑ",
    title: "Πρόσφατη δουλειά",
    intro: "Μια μικρή επιλογή πρόσφατων έργων. Οι πραγματικές φωτογραφίες προστίθενται σταδιακά.",
  },
  en: {
    meta: {
      title: "Work",
      description: "Recent HydroCore projects from across Athens.",
    },
    eyebrow: "WORK",
    title: "Recent projects",
    intro: "A small selection of recent work. Real photography is being added over time.",
  },
};

const contactPage: Record<AppLocale, ContactPageContent> = {
  el: {
    meta: {
      title: "Επικοινωνία",
      description: "Στοιχεία επικοινωνίας, ωράριο και έδρα της HydroCore στην Αθήνα.",
    },
    eyebrow: "ΕΠΙΚΟΙΝΩΝΙΑ",
    title: "Μιλήστε μαζί μας",
    intro:
      "Για ραντεβού χρησιμοποιήστε την online κράτηση — είναι πιο γρήγορο. Για οτιδήποτε άλλο, επικοινωνήστε απευθείας.",
    hoursHeading: "Ώρες λειτουργίας",
    hours: "Δευτέρα–Σάββατο, 08:00–20:00. Κυριακή κλειστά (τα επείγοντα εξυπηρετούνται τηλεφωνικά).",
    addressHeading: "Έδρα",
  },
  en: {
    meta: {
      title: "Contact",
      description: "Contact details, working hours and registered address for HydroCore in Athens.",
    },
    eyebrow: "CONTACT",
    title: "Get in touch",
    intro: "For a booking, use the online form — it's faster. For anything else, reach us directly.",
    hoursHeading: "Working hours",
    hours: "Monday–Saturday, 08:00–20:00. Closed Sunday (emergencies handled by phone).",
    addressHeading: "Registered address",
  },
};

export function getServicesPageContent(locale: AppLocale): ServicesPageContent {
  return servicesPage[locale];
}

export function getAboutPageContent(locale: AppLocale): AboutPageContent {
  return aboutPage[locale];
}

export function getWorkPageContent(locale: AppLocale): WorkPageContent {
  return workPage[locale];
}

export function getContactPageContent(locale: AppLocale): ContactPageContent {
  return contactPage[locale];
}
