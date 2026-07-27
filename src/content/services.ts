import type { AppLocale } from "@/i18n/routing";

export interface ServiceDetail {
  number: string;
  slug: string;
  title: string;
  summary: string;
  pricePrefix: string;
  priceValue: string;
  intro: string;
  included: string[];
  signs: string[];
}

const el: ServiceDetail[] = [
  {
    number: "01",
    slug: "emergency-leaks",
    title: "Επείγουσες διαρροές & σπασμένοι σωλήνες",
    summary:
      "Νερό εκεί που δεν θα έπρεπε, οποιαδήποτε ώρα. Εντοπισμός, απομόνωση και επισκευή — συχνά στην ίδια επίσκεψη.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro:
      "Όταν το νερό είναι εκεί που δεν θα έπρεπε, ο χρόνος μετράει. Απομονώνουμε την παροχή, εντοπίζουμε τη διαρροή και επισκευάζουμε — συχνά στην ίδια επίσκεψη.",
    included: [
      "Άμεση απομόνωση της παροχής νερού",
      "Εντοπισμός διαρροής (ορατής και κρυφής)",
      "Επισκευή ή προσωρινή αντιμετώπιση όταν χρειάζονται ανταλλακτικά",
      "Επιβεβαίωση επισκευής και σημείωμα ολοκλήρωσης",
    ],
    signs: [
      "Υγρασία που εξαπλώνεται σε οροφή ή τοίχο",
      "Ξαφνική πτώση της πίεσης νερού",
      "Ο μετρητής νερού κινείται ακόμη κι όταν όλα είναι κλειστά",
      "Μυρωδιά υγρασίας χωρίς προφανή αιτία",
    ],
  },
  {
    number: "02",
    slug: "boiler-installation-service",
    title: "Εγκατάσταση & συντήρηση λέβητα",
    summary:
      "Νέες εγκαταστάσεις, ετήσια συντήρηση και επισκευές αυθημερόν, για κάθε μεγάλη μάρκα που κυκλοφορεί στην Ελλάδα.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro:
      "Νέες εγκαταστάσεις, ετήσια συντήρηση και επισκευές αυθημερόν, για κάθε μεγάλη μάρκα που κυκλοφορεί στην Ελλάδα.",
    included: [
      "Εγκατάσταση και θέση σε λειτουργία νέου λέβητα",
      "Ετήσια συντήρηση και έλεγχοι ασφαλείας",
      "Διάγνωση και επισκευή αυθημερόν για τις περισσότερες βλάβες",
      "Συμβουλές για το σωστό μέγεθος και τύπο για το ακίνητό σας",
    ],
    signs: [
      "Δεν υπάρχει ζεστό νερό ή η θερμοκρασία είναι ασταθής",
      "Ασυνήθιστοι θόρυβοι από τον λέβητα",
      "Η φλόγα δεν παραμένει αναμμένη",
      "Ο λέβητας είναι πάνω από 10-15 ετών",
    ],
  },
  {
    number: "03",
    slug: "bathroom-renovation",
    title: "Ανακαίνιση μπάνιου",
    summary: "Από πλήρη απογύμνωση έως τελική πλακόστρωση, με ένα συνεργείο από την αρχή έως το τέλος.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro: "Από πλήρη απογύμνωση έως τελική πλακόστρωση, με ένα συνεργείο από την αρχή έως το τέλος.",
    included: [
      "Απογύμνωση και απομάκρυνση του υπάρχοντος μπάνιου",
      "Πρώτη φάση υδραυλικών και τυχόν επανασχεδιασμός δικτύου",
      "Στεγανοποίηση και συντονισμός πλακόστρωσης",
      "Τοποθέτηση ειδών υγιεινής, βρυσών και συστημάτων ντους",
    ],
    signs: [
      "Παλιά είδη που χρειάζονται αντικατάσταση",
      "Επίμονη υγρασία ή κακή αποστράγγιση",
      "Σχεδιάζετε πλήρη αλλαγή διάταξης",
      "Προετοιμάζετε το ακίνητο για πώληση ή ενοικίαση",
    ],
  },
  {
    number: "04",
    slug: "underfloor-heating",
    title: "Ενδοδαπέδια θέρμανση",
    summary: "Υδραυλικά και ηλεκτρικά συστήματα, σε υφιστάμενα δάπεδα ή σε νέες κατασκευές.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro: "Υδραυλικά και ηλεκτρικά συστήματα, σε υφιστάμενα δάπεδα ή σε νέες κατασκευές.",
    included: [
      "Σχεδιασμός συστήματος στο μέγεθος του χώρου και του ακινήτου",
      "Εγκατάσταση υδραυλικού ή ηλεκτρικού συστήματος",
      "Τοποθέτηση σε υφιστάμενο δάπεδο ή πρώτη φάση σε νέα κατασκευή",
      "Ρύθμιση και δοκιμή συλλέκτη και θερμοστάτη",
    ],
    signs: [
      "Αλλάζετε δάπεδο και θέλετε θέρμανση από κάτω",
      "Τα καλοριφέρ καταλαμβάνουν χώρο που θα θέλατε να κερδίσετε",
      "Κρύα σημεία με την τρέχουσα θέρμανση",
      "Επεκτείνετε ή ανακαινίζετε έναν χώρο",
    ],
  },
  {
    number: "05",
    slug: "drain-clearing",
    title: "Καθαρισμός αποχετεύσεων",
    summary: "Έλεγχος με κάμερα, όχι μαντεψιά. Απόφραξη και εντοπισμός της αιτίας πριν φύγουμε.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro: "Έλεγχος με κάμερα, όχι μαντεψιά. Απόφραξη και εντοπισμός της αιτίας πριν φύγουμε.",
    included: [
      "Επιθεώρηση με κάμερα για εντοπισμό της απόφραξης και της αιτίας",
      "Μηχανικός καθαρισμός της απόφραξης",
      "Συμβουλές για αποφυγή επανεμφάνισης",
      "Αναφορά ευρημάτων όταν η αιτία είναι δομική",
    ],
    signs: [
      "Αργή αποστράγγιση σε νεροχύτες, ντουζιέρες ή τουαλέτες",
      "Ήχοι γουργουρίσματος από τις αποχετεύσεις",
      "Επαναλαμβανόμενες αποφράξεις στο ίδιο σημείο",
      "Δυσοσμία από αποχέτευση",
    ],
  },
  {
    number: "06",
    slug: "water-heaters",
    title: "Θερμοσίφωνες & θερμαντήρες νερού",
    summary:
      "Με ή χωρίς δεξαμενή, στο σωστό μέγεθος για το ακίνητο και σύμφωνα με τους ισχύοντες κανονισμούς.",
    pricePrefix: "από",
    priceValue: "€ —",
    intro:
      "Με ή χωρίς δεξαμενή, στο σωστό μέγεθος για το ακίνητο και σύμφωνα με τους ισχύοντες κανονισμούς.",
    included: [
      "Συμβουλές μεγέθους για συστήματα με ή χωρίς δεξαμενή",
      "Εγκατάσταση και σύνδεση με το υπάρχον δίκτυο",
      "Αφαίρεση και απόσυρση της παλιάς μονάδας",
      "Δοκιμή ασφαλείας και πίεσης μετά την ολοκλήρωση",
    ],
    signs: [
      "Το νερό δεν ζεσταίνεται σταθερά",
      "Ορατή σκουριά ή διαρροή γύρω από τη δεξαμενή",
      "Η μονάδα έχει ξεπεράσει το αναμενόμενο όριο ζωής της",
      "Αλλαγή από δεξαμενή σε σύστημα χωρίς δεξαμενή για εξοικονόμηση χώρου",
    ],
  },
];

const en: ServiceDetail[] = [
  {
    number: "01",
    slug: "emergency-leaks",
    title: "Emergency leaks & burst pipes",
    summary: "Water where it shouldn't be, at any hour. Isolated, traced, and fixed — same visit wherever possible.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro:
      "When water's somewhere it shouldn't be, time matters. We isolate the supply, trace the leak, and fix it — often in the same visit.",
    included: [
      "Immediate isolation of the water supply",
      "Leak tracing, visible and hidden",
      "Repair, or safe temporary containment when parts need ordering",
      "Repair confirmation and a completion note",
    ],
    signs: [
      "Water staining spreading across a ceiling or wall",
      "A sudden drop in water pressure",
      "Your water meter still moving with everything switched off",
      "A damp smell with no obvious source",
    ],
  },
  {
    number: "02",
    slug: "boiler-installation-service",
    title: "Boiler installation & service",
    summary: "New installs, annual servicing, and same-day repairs across every major brand sold in Greece.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro: "New installs, annual servicing, and same-day repairs across every major brand sold in Greece.",
    included: [
      "New boiler installation and commissioning",
      "Annual servicing and safety checks",
      "Same-day diagnostics and repair for most faults",
      "Advice on the right size and type for your property",
    ],
    signs: [
      "No hot water, or an inconsistent temperature",
      "Unusual noises from the boiler",
      "The pilot light won't stay lit",
      "Your boiler is more than 10–15 years old",
    ],
  },
  {
    number: "03",
    slug: "bathroom-renovation",
    title: "Bathroom renovation",
    summary: "Full strip-outs to finished tiling, coordinated with one crew from first fix to last.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro: "Full strip-outs to finished tiling, coordinated with one crew from first fix to last.",
    included: [
      "Strip-out and disposal of the existing bathroom",
      "First-fix plumbing and any required re-routing",
      "Waterproofing and tiling coordination",
      "Fitting of sanitaryware, taps and shower systems",
    ],
    signs: [
      "Dated fittings that are overdue for replacement",
      "Persistent damp or poor drainage",
      "You're planning a full layout change",
      "Preparing a property for sale or letting",
    ],
  },
  {
    number: "04",
    slug: "underfloor-heating",
    title: "Underfloor heating",
    summary: "Wet and electric systems, retrofitted into existing floors or specified for new builds.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro: "Wet and electric systems, retrofitted into existing floors or specified for new builds.",
    included: [
      "System design sized to the room and property",
      "Wet (hydronic) and electric system installation",
      "Retrofit into existing floors, or first-fix for new builds",
      "Manifold and thermostat setup and testing",
    ],
    signs: [
      "You're replacing flooring and want heating built in underneath",
      "Radiators taking up wall space you'd rather reclaim",
      "Cold spots with your current heating layout",
      "Extending or renovating a room",
    ],
  },
  {
    number: "05",
    slug: "drain-clearing",
    title: "Drain clearing",
    summary: "Camera-inspected, not guessed. Blockages cleared and the cause identified before we leave.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro: "Camera-inspected, not guessed. Blockages cleared and the cause identified before we leave.",
    included: [
      "CCTV camera inspection to identify the blockage and its cause",
      "Mechanical clearing of the blockage",
      "Advice on preventing recurrence",
      "A findings report where the cause is structural",
    ],
    signs: [
      "Slow-draining sinks, showers or toilets",
      "Gurgling sounds from drains",
      "Recurring blockages in the same spot",
      "Bad odours from a drain",
    ],
  },
  {
    number: "06",
    slug: "water-heaters",
    title: "Water heaters",
    summary: "Tank and tankless, sized to the property and installed to current code.",
    pricePrefix: "from",
    priceValue: "€ —",
    intro: "Tank and tankless, sized to the property and installed to current code.",
    included: [
      "Sizing advice for tank and tankless systems",
      "Installation and connection to existing plumbing",
      "Removal and disposal of the old unit",
      "Safety and pressure testing on completion",
    ],
    signs: [
      "Water isn't heating consistently",
      "Visible rust or leaking around the tank",
      "The unit is past its expected lifespan",
      "Switching from tank to tankless to save space",
    ],
  },
];

const content: Record<AppLocale, ServiceDetail[]> = { el, en };

export function getServices(locale: AppLocale): ServiceDetail[] {
  return content[locale];
}

export function getService(locale: AppLocale, slug: string): ServiceDetail | undefined {
  return content[locale].find((service) => service.slug === slug);
}

export interface ServiceDetailLabels {
  breadcrumbHome: string;
  breadcrumbServices: string;
  includedHeading: string;
  signsHeading: string;
  otherServicesHeading: string;
  ctaLabel: string;
}

const labels: Record<AppLocale, ServiceDetailLabels> = {
  el: {
    breadcrumbHome: "Αρχική",
    breadcrumbServices: "Υπηρεσίες",
    includedHeading: "Τι περιλαμβάνει",
    signsHeading: "Πότε αξίζει να καλέσετε",
    otherServicesHeading: "Άλλες υπηρεσίες",
    ctaLabel: "Κλείστε ραντεβού για αυτή την υπηρεσία",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbServices: "Services",
    includedHeading: "What's included",
    signsHeading: "Signs it's time to call",
    otherServicesHeading: "Other services",
    ctaLabel: "Book a visit for this service",
  },
};

export function getServiceDetailLabels(locale: AppLocale): ServiceDetailLabels {
  return labels[locale];
}
