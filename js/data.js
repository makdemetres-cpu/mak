/* Shared content data — locations & services — used by the homepage,
   the booking form, and the footer. Single source of truth so the
   branch list and service list never drift between pages. */
window.HC_DATA = {
  locations: [
    {
      id: "thess-center", region: "thessaloniki",
      name: { el: "Θεσσαλονίκη — Κέντρο (Έδρα)", en: "Thessaloniki — City Centre (HQ)" },
      address: { el: "Τσιμισκή 45, 546 23 Θεσσαλονίκη", en: "45 Tsimiski St, 546 23 Thessaloniki" },
      phone: "+30 2310 555 100",
      hours: { el: "Δευ–Παρ 08:00–20:00, Σάβ 09:00–15:00", en: "Mon–Fri 08:00–20:00, Sat 09:00–15:00" },
      mapsQuery: "Tsimiski 45, Thessaloniki, Greece"
    },
    {
      id: "thess-kalamaria", region: "thessaloniki",
      name: { el: "Θεσσαλονίκη — Καλαμαριά", en: "Thessaloniki — Kalamaria" },
      address: { el: "Μεταμορφώσεως 12, 551 33 Καλαμαριά", en: "12 Metamorfoseos St, 551 33 Kalamaria" },
      phone: "+30 2310 555 120",
      hours: { el: "Δευ–Παρ 08:00–20:00, Σάβ 09:00–15:00", en: "Mon–Fri 08:00–20:00, Sat 09:00–15:00" },
      mapsQuery: "Metamorfoseos 12, Kalamaria, Thessaloniki, Greece"
    },
    {
      id: "thess-evosmos", region: "thessaloniki",
      name: { el: "Θεσσαλονίκη — Εύοσμος", en: "Thessaloniki — Evosmos" },
      address: { el: "Λαγκαδά 88, 562 24 Εύοσμος", en: "88 Lagkada St, 562 24 Evosmos" },
      phone: "+30 2310 555 140",
      hours: { el: "Δευ–Παρ 08:00–20:00, Σάβ 09:00–15:00", en: "Mon–Fri 08:00–20:00, Sat 09:00–15:00" },
      mapsQuery: "Lagkada 88, Evosmos, Thessaloniki, Greece"
    },
    {
      id: "athens-kifisia", region: "athens",
      name: { el: "Αθήνα — Κηφισιά", en: "Athens — Kifisia" },
      address: { el: "Λεωφ. Κηφισίας 210, 145 62 Κηφισιά", en: "210 Kifisias Ave, 145 62 Kifisia" },
      phone: "+30 210 555 100",
      hours: { el: "Δευ–Παρ 08:00–20:00, Σάβ 09:00–15:00", en: "Mon–Fri 08:00–20:00, Sat 09:00–15:00" },
      mapsQuery: "Kifisias Avenue 210, Kifisia, Athens, Greece"
    },
    {
      id: "athens-piraeus", region: "athens",
      name: { el: "Αθήνα — Πειραιάς", en: "Athens — Piraeus" },
      address: { el: "Ακτή Μιαούλη 55, 185 35 Πειραιάς", en: "55 Akti Miaouli, 185 35 Piraeus" },
      phone: "+30 210 555 180",
      hours: { el: "Δευ–Παρ 08:00–20:00, Σάβ 09:00–15:00", en: "Mon–Fri 08:00–20:00, Sat 09:00–15:00" },
      mapsQuery: "Akti Miaouli 55, Piraeus, Greece"
    },
    {
      id: "patra", region: "patra",
      name: { el: "Πάτρα", en: "Patra" },
      address: { el: "Αγίου Ανδρέου 30, 262 21 Πάτρα", en: "30 Agiou Andreou St, 262 21 Patra" },
      phone: "+30 2610 555 100",
      hours: { el: "Δευ–Παρ 08:00–19:00, Σάβ 09:00–14:00", en: "Mon–Fri 08:00–19:00, Sat 09:00–14:00" },
      mapsQuery: "Agiou Andreou 30, Patra, Greece"
    },
    {
      id: "crete", region: "crete",
      name: { el: "Ηράκλειο, Κρήτη", en: "Heraklion, Crete" },
      address: { el: "25ης Αυγούστου 14, 712 02 Ηράκλειο", en: "14, 25th August St, 712 02 Heraklion" },
      phone: "+30 2810 555 100",
      hours: { el: "Δευ–Παρ 08:00–19:00, Σάβ 09:00–14:00", en: "Mon–Fri 08:00–19:00, Sat 09:00–14:00" },
      mapsQuery: "25is Avgoustou 14, Heraklion, Crete, Greece"
    }
  ],

  regions: [
    { id: "thessaloniki", label: { el: "Θεσσαλονίκη", en: "Thessaloniki" } },
    { id: "athens",       label: { el: "Αθήνα", en: "Athens" } },
    { id: "patra",        label: { el: "Πάτρα", en: "Patra" } },
    { id: "crete",        label: { el: "Κρήτη", en: "Crete" } }
  ],

  services: [
    {
      id: "emergency",
      icon: "bolt",
      name: { el: "Επείγουσα Επέμβαση 24/7", en: "24/7 Emergency Response" },
      desc: { el: "Σπασμένος σωλήνας, πλημμύρα ή διαρροή αερίου — φτάνουμε άμεσα, κάθε ώρα, κάθε μέρα.", en: "Burst pipe, flooding or a gas leak — we're on site fast, any hour, every day." }
    },
    {
      id: "leak-detection",
      icon: "search",
      name: { el: "Εντοπισμός Διαρροών", en: "Leak Detection" },
      desc: { el: "Ακουστικός & θερμικός εντοπισμός κρυφών διαρροών χωρίς να ανοίξουμε τοίχους ή πλακάκια.", en: "Acoustic & thermal leak tracing that finds hidden leaks without tearing up walls or tiles." }
    },
    {
      id: "pipe-repair",
      icon: "pipe",
      name: { el: "Εγκατάσταση & Επισκευή Σωληνώσεων", en: "Pipe Installation & Repair" },
      desc: { el: "Πλήρης αντικατάσταση ή τοπική επισκευή δικτύου ύδρευσης σε κατοικίες και επιχειρήσεις.", en: "Full re-piping or targeted repairs for residential and commercial water networks." }
    },
    {
      id: "drainage",
      icon: "drain",
      name: { el: "Αποφράξεις & Αποχέτευση", en: "Drain & Sewage Unblocking" },
      desc: { el: "Μηχανική αποφρακτική & υδροβολή υψηλής πίεσης για μόνιμη λύση, όχι πρόχειρη μπάλωση.", en: "Mechanical rodding & high-pressure jetting for a lasting fix, not a temporary patch." }
    },
    {
      id: "boilers",
      icon: "flame",
      name: { el: "Θερμοσίφωνες & Λέβητες", en: "Boilers & Water Heaters" },
      desc: { el: "Προμήθεια, εγκατάσταση, συντήρηση — ηλεκτρικοί, αερίου και ηλιακά συστήματα.", en: "Supply, installation and maintenance — electric, gas and solar-assisted systems." }
    },
    {
      id: "renovation",
      icon: "bath",
      name: { el: "Ανακαίνιση Μπάνιου & Κουζίνας", en: "Bathroom & Kitchen Renovation" },
      desc: { el: "Πλήρης υδραυλική μελέτη & υλοποίηση για ανακαινίσεις, σε συνεργασία με τον εργολάβο σας.", en: "Complete plumbing design & execution for renovations, coordinated with your contractor." }
    },
    {
      id: "commercial",
      icon: "building",
      name: { el: "Εμπορικές & Βιομηχανικές Εγκαταστάσεις", en: "Commercial & Industrial" },
      desc: { el: "Συμβόλαια συντήρησης για ξενοδοχεία, εστιατόρια, βιομηχανικές μονάδες και πολυκατοικίες.", en: "Maintenance contracts for hotels, restaurants, industrial sites and apartment blocks." }
    },
    {
      id: "smart",
      icon: "shield",
      name: { el: "Έξυπνοι Αισθητήρες Διαρροής", en: "Smart Leak Sensors" },
      desc: { el: "Ασύρματοι αισθητήρες που κλείνουν αυτόματα την κεντρική παροχή πριν γίνει ζημιά.", en: "Wireless sensors that shut off your main supply automatically before damage spreads." }
    }
  ]
};
