/* ===========================================================================
   i18n — Greek (default) / English
   ---------------------------------------------------------------------------
   Two complementary mechanisms, both driven from here:

   1. Key-based strings for the homepage and the shared chrome:
        <h2 data-i18n="services.title"></h2>
        <input data-i18n-attr="placeholder:booking.namePh">
        <p data-i18n-html="hero.lede"></p>   ← value may contain inline markup
      Only a small, hand-written allow-list of tags is ever injected this way
      (<em>, <strong>, <span>, <br>, <a>) and every value lives in this file,
      so no user-supplied content is ever written as HTML.

   2. Whole-block translation for the long legal prose, where key-splitting
      would be unreadable:
        <div data-lang="el">…</div>
        <div data-lang="en" hidden>…</div>

   The choice is stored in localStorage. That single entry is "strictly
   necessary" under art. 4(5) of Greek Law 3471/2006 / the ePrivacy Directive:
   it stores a preference the visitor actively expressed, is read only by this
   site, and is not used to profile anyone — so it needs no consent. It is
   still documented in the cookie policy for transparency.
   =========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "vetcare.lang";
  var DEFAULT_LANG = "el";
  var SUPPORTED = ["el", "en"];

  var STRINGS = {
    el: {
      /* --- meta / chrome --- */
      "meta.title": "Vet Care — Κτηνιατρικό Κέντρο στην Οβρυά Πατρών",
      "meta.description":
        "Κτηνιατρικό Κέντρο Vet Care στην Οβρυά Πατρών. Παθολογικό, ακτινολογικό, μικροβιολογικό, χειρουργικό και οδοντιατρικό τμήμα για ζώα συντροφιάς, καθώς και υπηρεσίες για παραγωγικά ζώα. Τηλ. 2616007142.",
      "brand.tagline": "Κτηνιατρικό Κέντρο",
      "nav.story": "Η ιστορία μας",
      "nav.services": "Υπηρεσίες",
      "nav.booking": "Ραντεβού",
      "nav.findus": "Πού είμαστε",
      "nav.contact": "Επικοινωνία",
      "nav.book": "Κλείστε ραντεβού",
      "nav.menu": "Μενού",
      "nav.openMenu": "Άνοιγμα μενού",
      "nav.closeMenu": "Κλείσιμο μενού",
      "nav.callAria": "Καλέστε το κτηνιατρείο στο 2616007142",
      "lang.aria": "Επιλογή γλώσσας",
      "lang.el": "Ελληνικά",
      "lang.other": "EN",
      "lang.otherAria": "Switch to English — αλλαγή γλώσσας στα αγγλικά",
      "lang.en": "Αγγλικά",
      "skip": "Μετάβαση στο περιεχόμενο",
      "action.call": "Κλήση",
      "action.book": "Ραντεβού",

      /* --- hero --- */
      "hero.title": "Φροντίδα για κάθε ζώο,<br><em class=\"accent-italic\">μικρό ή μεγάλο</em>",
      "hero.lede":
        "Το Κτηνιατρικό Κέντρο Vet Care στην Οβρυά προσφέρει ολοκληρωμένη φροντίδα για ζώα συντροφιάς και παραγωγικά ζώα — από την καθημερινή πρόληψη μέχρι τη διάγνωση και τη χειρουργική.",
      "hero.ctaBook": "Κλείστε ραντεβού",
      "hero.ctaCall": "Καλέστε 2616 007142",
      "hero.scroll": "Δείτε περισσότερα",
      "hero.ratingLabel": "κριτικές στο Google",
      "hero.ratingAria": "Βαθμολογία 4,7 στα 5 αστέρια από 46 κριτικές στο Google",
      "hero.hoursLabel": "Δευτέρα – Παρασκευή",
      "hero.hoursValue": "09:00–14:00 & 18:00–21:00",
      /* The hero status chip was removed; these remain for the hours table
         and for re-adding an open/closed indicator later. */
      "status.open": "Ανοιχτά τώρα",
      "status.closed": "Κλειστά τώρα",
      "status.opensAt": "Ανοίγει {time}",
      "status.opensMon": "Ανοίγει Δευτέρα 09:00",
      "status.opensTomorrow": "Ανοίγει αύριο 09:00",
      "status.checking": "Ωράριο λειτουργίας",

      "hero.artAlt": "Εικονογράφηση: σκύλος και γάτα σε λόφο της αχαϊκής υπαίθρου, με αγρόκτημα και πρόβατα στο βάθος",
      "story.artAlt": "Διακοσμητικό μοτίβο με πατημασιές, οπλές, κλαδιά ελιάς και στηθοσκόπιο",
      "map.street": "ΔΗΜΟΚΡΑΤΙΑΣ",
      "map.area": "ΟΒΡΥΑ",
      "map.north": "Β",
      /* --- story --- */
      "story.eyebrow": "Η ιστορία μας",
      "story.title": "Δύο κτηνίατροι, μία <em class=\"accent-italic\">κοινή φιλοσοφία</em>",
      "story.p1":
        "Το Vet Care δημιουργήθηκε από τους κτηνιάτρους <strong>Ελένη Φωτοπούλου</strong> και <strong>Γεώργιο Μαντζούνη</strong>, με μια απλή ιδέα: ότι ένα ζώο φροντίζεται καλύτερα όταν ο άνθρωπός του καταλαβαίνει ακριβώς τι συμβαίνει και γιατί.",
      "story.p2":
        "Στον χώρο μας στην Οβρυά εξετάζουμε σκύλους, γάτες και μικρά ζώα συντροφιάς, ενώ παράλληλα στηρίζουμε κτηνοτροφικές μονάδες της ευρύτερης Αχαΐας στη διαχείριση και την πρόληψη. Δύο πολύ διαφορετικοί κόσμοι, με την ίδια αρχή: σωστή διάγνωση, καθαρή εξήγηση, ρεαλιστικό πλάνο.",
      "story.pillar1.title": "Χρόνος για κάθε περιστατικό",
      "story.pillar1.text":
        "Εξετάζουμε χωρίς βιασύνη και εξηγούμε το εύρημα, τις επιλογές και το κόστος πριν προχωρήσουμε σε οτιδήποτε.",
      "story.pillar2.title": "Πρόληψη πριν από τη θεραπεία",
      "story.pillar2.text":
        "Εμβολιασμοί, αντιπαρασιτική προστασία και τακτικοί έλεγχοι, προσαρμοσμένοι στην ηλικία και στον τρόπο ζωής κάθε ζώου.",
      "story.pillar3.title": "Από το σπίτι ως τον στάβλο",
      "story.pillar3.text":
        "Η ίδια κλινική εξυπηρετεί το κατοικίδιο της οικογένειας και την εκτροφή του παραγωγού, με αντίστοιχη εξειδίκευση.",
      "story.signature.role": "Κτηνίατροι, Vet Care",
      "story.signature.text": "Ελένη Φωτοπούλου & Γεώργιος Μαντζούνης",

      /* --- services --- */
      "services.eyebrow": "Υπηρεσίες",
      "services.title": "Ό,τι χρειάζεται, <em class=\"accent-italic\">κάτω από μία στέγη</em>",
      "services.lede":
        "Τμήματα που καλύπτουν το μεγαλύτερο μέρος των καθημερινών αναγκών, ώστε να μη χρειάζεται να μετακινηθείτε αλλού για μια εξέταση ή μια επέμβαση ρουτίνας.",
      "services.small.title": "Ζώα συντροφιάς",
      "services.small.count": "5 τμήματα",
      "services.farm.title": "Παραγωγικά ζώα",
      "services.farm.count": "4 υπηρεσίες",

      "svc.internal.title": "Παθολογικό",
      "svc.internal.text":
        "Κλινική εξέταση, διερεύνηση συμπτωμάτων και παρακολούθηση χρόνιων παθήσεων σε σκύλους και γάτες.",
      "svc.radiology.title": "Ακτινολογικό",
      "svc.radiology.text":
        "Ακτινογραφικός και υπερηχογραφικός έλεγχος για γρήγορη εικόνα οστών, θώρακα και κοιλιάς.",
      "svc.lab.title": "Μικροβιολογικό",
      "svc.lab.text":
        "Αιματολογικές, βιοχημικές και μικροβιολογικές εξετάσεις για ασφαλή διάγνωση πριν από κάθε θεραπεία.",
      "svc.surgery.title": "Χειρουργικό",
      "svc.surgery.text":
        "Επεμβάσεις ρουτίνας και μαλακών μορίων, με προεγχειρητικό έλεγχο και παρακολούθηση της ανάνηψης.",
      "svc.dental.title": "Οδοντιατρικό",
      "svc.dental.text":
        "Έλεγχος στοματικής υγιεινής, καθαρισμός πέτρας και αντιμετώπιση οδοντικών προβλημάτων.",

      "svc.herd.title": "Διαχείριση εκτροφής",
      "svc.herd.text":
        "Παρακολούθηση υγείας κοπαδιού, πρωτόκολλα φροντίδας και οργάνωση της καθημερινής ρουτίνας της μονάδας.",
      "svc.repro.title": "Αναπαραγωγική διαχείριση",
      "svc.repro.text":
        "Έλεγχος γονιμότητας, προγραμματισμός αναπαραγωγής και υποστήριξη στις κρίσιμες περιόδους.",
      "svc.prevention.title": "Προληπτική κτηνιατρική",
      "svc.prevention.text":
        "Εμβολιακά προγράμματα και μέτρα βιοασφάλειας που περιορίζουν τα προβλήματα πριν εμφανιστούν.",
      "svc.advice.title": "Ζωοτεχνικές συμβουλές",
      "svc.advice.text":
        "Διατροφή και σταβλικές εγκαταστάσεις: πρακτικές προτάσεις για καλύτερη απόδοση και ευζωία.",

      "services.extra.title": "Κτηνιατρικά φάρμακα & καθημερινές υπηρεσίες",
      "services.extra.text":
        "Διαθέτουμε κτηνιατρικά φάρμακα και σκευάσματα, ώστε να ξεκινά η αγωγή αμέσως μετά την εξέταση. Στο ίδιο ραντεβού μπορούν να γίνουν και οι παρακάτω συνήθεις υπηρεσίες.",
      "services.extra.1": "Εμβολιασμοί και αντιπαρασιτική προστασία",
      "services.extra.2": "Τοποθέτηση και καταγραφή microchip",
      "services.extra.3": "Υγειονομικά πιστοποιητικά και διαβατήριο για ταξίδι",
      "services.extra.4": "Υπερηχογραφικός έλεγχος",
      "services.extra.5": "Καθαρισμός δοντιών",
      "services.extra.6": "Επείγοντα περιστατικά κατόπιν τηλεφωνικής επικοινωνίας",

      /* --- booking --- */
      "booking.eyebrow": "Ραντεβού",
      "booking.title": "Ζητήστε ραντεβού <em class=\"accent-italic\">online</em>",
      "booking.aside.title": "Πώς λειτουργεί",
      "booking.aside.text":
        "Η φόρμα στέλνει ένα <strong>αίτημα ραντεβού</strong> — δεν δεσμεύει ώρα από μόνη της. Επικοινωνούμε μαζί σας για να επιβεβαιώσουμε ή να προτείνουμε την πλησιέστερη διαθέσιμη ώρα.",
      "booking.step1.title": "Στέλνετε το αίτημα",
      "booking.step1.text": "Με λίγα στοιχεία: πώς θα σας βρούμε και τι χρειάζεται το ζώο σας.",
      "booking.step2.title": "Σας καλούμε για επιβεβαίωση",
      "booking.step2.text": "Εντός του ωραρίου λειτουργίας, τηλεφωνικά ή με email.",
      "booking.step3.title": "Σας περιμένουμε",
      "booking.step3.text": "Δημοκρατίας 149, Οβρυά — με την ώρα κλεισμένη και επιβεβαιωμένη.",
      "booking.urgent.title": "Είναι επείγον;",
      "booking.urgent.text": "Μη χρησιμοποιείτε τη φόρμα. Καλέστε μας απευθείας για να σας κατευθύνουμε αμέσως.",
      "booking.urgent.cta": "Κλήση 6972 701536",

      "booking.name": "Ονοματεπώνυμο",
      "booking.namePh": "π.χ. Μαρία Παπαδοπούλου",
      "booking.phone": "Τηλέφωνο",
      "booking.phonePh": "π.χ. 69XXXXXXXX",
      "booking.email": "Email",
      "booking.emailOpt": "(προαιρετικό)",
      "booking.emailPh": "για γραπτή επιβεβαίωση",
      "booking.animal": "Είδος ζώου",
      "booking.animal.choose": "Επιλέξτε…",
      "booking.animal.dog": "Σκύλος",
      "booking.animal.cat": "Γάτα",
      "booking.animal.smallPet": "Άλλο ζώο συντροφιάς",
      "booking.animal.farm": "Παραγωγικά ζώα / εκτροφή",
      "booking.animal.other": "Άλλο",
      "booking.date": "Προτιμώμενη ημερομηνία",
      "booking.slot": "Προτιμώμενη ώρα",
      "booking.slot.morning": "Πρωί (09:00–14:00)",
      "booking.slot.evening": "Απόγευμα (18:00–21:00)",
      "booking.slot.any": "Ό,τι είναι διαθέσιμο",
      "booking.message": "Λόγος επίσκεψης",
      "booking.messageOpt": "(προαιρετικό)",
      "booking.messagePh": "Σύντομη περιγραφή — π.χ. ετήσιος εμβολιασμός, χωλότητα, έλεγχος δοντιών.",
      "booking.consent":
        "Συναινώ στην επεξεργασία των στοιχείων μου από το Vet Care <strong>αποκλειστικά για τη διαχείριση αυτού του αιτήματος ραντεβού</strong>. Έχω διαβάσει την <a href=\"privacy.html\">Πολιτική Απορρήτου</a>.",
      "booking.submit": "Αποστολή αιτήματος",
      "booking.note":
        "Ζητάμε μόνο όσα χρειάζονται για να σας απαντήσουμε. Μην στέλνετε ιατρικά αρχεία ή στοιχεία πληρωμής μέσω της φόρμας.",
      "booking.mailNote": "Το αίτημα αποστέλλεται μέσω του δικού σας προγράμματος email — θα ανοίξει συμπληρωμένο και θα χρειαστεί να πατήσετε «Αποστολή» εκεί.",
      "booking.status.mailOpened": "Ανοίξαμε το πρόγραμμα email σας με το αίτημα συμπληρωμένο. Πατήστε «Αποστολή» εκεί για να ολοκληρωθεί — αλλιώς χρησιμοποιήστε τους παρακάτω τρόπους.",
      "booking.status.mailNone": "Δεν φαίνεται να άνοιξε πρόγραμμα email στη συσκευή σας. Αντιγράψτε το αίτημα ή καλέστε μας — τα στοιχεία σας δεν χάθηκαν.",
      "booking.fallback.title": "Στείλτε το με όποιον τρόπο σας βολεύει",
      "booking.fallback.copy": "Αντιγραφή αιτήματος",
      "booking.fallback.copied": "Αντιγράφηκε — επικολλήστε το σε email ή μήνυμα",
      "booking.fallback.mail": "Άνοιγμα email στο info@vet-care.gr",
      "booking.fallback.call": "Κλήση 2616 007142",
      "booking.err.required": "Συμπληρώστε αυτό το πεδίο.",
      "booking.err.phone": "Δώστε ένα έγκυρο τηλέφωνο επικοινωνίας.",
      "booking.err.email": "Ελέγξτε τη διεύθυνση email.",
      "booking.err.consent": "Χρειαζόμαστε τη συναίνεσή σας για να επεξεργαστούμε το αίτημα.",
      "booking.err.date": "Επιλέξτε μια ημερομηνία από σήμερα και μετά.",
      "booking.status.sending": "Γίνεται αποστολή…",
      "booking.status.ok":
        "Το αίτημά σας στάλθηκε. Θα επικοινωνήσουμε μαζί σας εντός του ωραρίου λειτουργίας για να επιβεβαιώσουμε την ώρα.",
      "booking.status.err":
        "Κάτι πήγε στραβά με την αποστολή. Δοκιμάστε ξανά ή καλέστε μας στο 2616 007142.",

      /* --- find us --- */
      "findus.eyebrow": "Πού είμαστε",
      "findus.title": "Στην Οβρυά, <em class=\"accent-italic\">λίγο έξω από την Πάτρα</em>",
      "findus.lede":
        "Βρισκόμαστε επί της οδού Δημοκρατίας. Πατήστε τον χάρτη για να ανοίξει η πλοήγηση από τη θέση σας.",
      "findus.mapAria": "Άνοιγμα οδηγιών πλοήγησης προς το Vet Care στους Χάρτες Google, σε νέα καρτέλα",
      "findus.mapLabel": "Vet Care",
      "findus.mapSub": "Δημοκρατίας 149, Οβρυά 263 34",
      "findus.mapGo": "Οδηγίες",
      "findus.address.title": "Διεύθυνση",
      "findus.address.text": "Δημοκρατίας 149, Οβρυά, Πάτρα, Τ.Κ. 263 34",
      "findus.nav.title": "Πλοήγηση",
      "findus.nav.text": "Ανοίγει στους Χάρτες Google με προορισμό το κτηνιατρείο.",
      "findus.hours.title": "Ώρες επίσκεψης",
      "findus.hours.text": "Δευτέρα έως Παρασκευή, 09:00–14:00 και 18:00–21:00.",
      "findus.cta": "Άνοιγμα στους Χάρτες Google",

      /* --- contact --- */
      "contact.eyebrow": "Επικοινωνία",
      "contact.title": "Μιλήστε <em class=\"accent-italic\">μαζί μας</em>",
      "contact.lede":
        "Για ραντεβού, ερωτήσεις ή κάτι επείγον, το τηλέφωνο είναι πάντα ο γρηγορότερος δρόμος.",
      "contact.landline": "Σταθερό",
      "contact.mobile": "Κινητό",
      "contact.email": "Email",
      "contact.address": "Διεύθυνση",
      "contact.addressHint": "Οβρυά, Πάτρα, Τ.Κ. 263 34",
      "contact.hours.title": "Ωράριο λειτουργίας",
      "contact.hours.caption": "Οι ώρες ισχύουν για επισκέψεις κατόπιν ραντεβού και για έκτακτα περιστατικά.",
      "contact.social.title": "Στα κοινωνικά δίκτυα",
      "contact.social.text": "Οι σύνδεσμοι θα ενεργοποιηθούν μόλις επιβεβαιωθούν οι επίσημες σελίδες.",
      "day.mon": "Δευτέρα",
      "day.tue": "Τρίτη",
      "day.wed": "Τετάρτη",
      "day.thu": "Πέμπτη",
      "day.fri": "Παρασκευή",
      "day.sat": "Σάββατο",
      "day.sun": "Κυριακή",
      "day.closed": "Κλειστά",
      "hours.weekday": "09:00–14:00 & 18:00–21:00",

      /* --- footer --- */
      "footer.about":
        "Κτηνιατρικό Κέντρο για ζώα συντροφιάς και παραγωγικά ζώα, στην Οβρυά Πατρών.",
      "footer.explore": "Πλοήγηση",
      "footer.hours": "Ωράριο",
      "footer.contact": "Επικοινωνία",
      "footer.weekdays": "Δευτ – Παρ",
      "footer.saturday": "Σάββατο",
      "footer.sunday": "Κυριακή",
      "footer.rights": "Με επιφύλαξη παντός δικαιώματος.",
      "footer.privacy": "Πολιτική Απορρήτου",
      "footer.cookies": "Πολιτική Cookies",
      "footer.cookieSettings": "Ρυθμίσεις cookies",
      "footer.controller": "Υπεύθυνος επεξεργασίας δεδομένων: Vet Care, Δημοκρατίας 149, Οβρυά 263 34.",

      /* --- cookie consent --- */
      "cookie.title": "Η ιδιωτικότητά σας, με τους δικούς σας όρους",
      "cookie.text":
        "Χρησιμοποιούμε μόνο την απολύτως απαραίτητη τοπική αποθήκευση για να λειτουργεί ο ιστότοπος (γλώσσα και η επιλογή σας εδώ). Θα θέλαμε επιπλέον τη συγκατάθεσή σας για ανώνυμα στατιστικά επισκεψιμότητας. <strong>Δεν ενεργοποιείται τίποτα μη απαραίτητο χωρίς την έγκρισή σας</strong> και μπορείτε να αλλάξετε γνώμη οποιαδήποτε στιγμή.",
      "cookie.accept": "Αποδοχή",
      "cookie.reject": "Απόρριψη",
      "cookie.settings": "Ρυθμίσεις",
      "cookie.policy": "Διαβάστε την Πολιτική Cookies",
      "cookie.aria": "Ενημέρωση για cookies και τοπική αποθήκευση",

      "prefs.title": "Ρυθμίσεις cookies",
      "prefs.intro":
        "Επιλέξτε τι επιτρέπετε. Η απόρριψη είναι εξίσου εύκολη με την αποδοχή και δεν περιορίζει καμία λειτουργία του ιστότοπου.",
      "prefs.necessary.title": "Απολύτως απαραίτητα",
      "prefs.necessary.text":
        "Αποθηκεύουν τη γλώσσα που επιλέξατε και την απόφασή σας για τα cookies. Χωρίς αυτά ο ιστότοπος δεν μπορεί να θυμηθεί τις επιλογές σας. Δεν απαιτούν συγκατάθεση.",
      "prefs.necessary.locked": "Πάντα ενεργά",
      "prefs.analytics.title": "Στατιστικά επισκεψιμότητας",
      "prefs.analytics.text":
        "Ανώνυμη μέτρηση επισκέψεων, ώστε να βλέπουμε ποιες σελίδες είναι χρήσιμες. Προς το παρόν δεν έχει εγκατασταθεί εργαλείο στατιστικών· η επιλογή σας θα τηρηθεί αν εγκατασταθεί στο μέλλον.",
      "prefs.save": "Αποθήκευση επιλογών",
      "prefs.acceptAll": "Αποδοχή όλων",
      "prefs.rejectAll": "Απόρριψη όλων",
      "prefs.close": "Κλείσιμο",
      "prefs.saved": "Οι επιλογές σας αποθηκεύτηκαν.",

      /* --- misc --- */
      "toTop": "Επιστροφή στην κορυφή",
      "privacy.metaTitle": "Πολιτική Απορρήτου — Vet Care",
      "privacy.metaDesc": "Πώς το Κτηνιατρικό Κέντρο Vet Care συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα, σύμφωνα με τον ΓΚΠΔ και τον ν. 4624/2019.",
      "cookies.metaTitle": "Πολιτική Cookies — Vet Care",
      "cookies.metaDesc": "Ποιους ιχνηλάτες χρησιμοποιεί ο ιστότοπος του Vet Care, γιατί δεν χρησιμοποιεί κανένα cookie, και πώς αλλάζετε ή ανακαλείτε τη συγκατάθεσή σας.",
      "404.metaTitle": "Η σελίδα δεν βρέθηκε — Vet Care",
      "404.metaDesc": "Η σελίδα που ζητήσατε δεν υπάρχει. Επιστρέψτε στην αρχική σελίδα του Κτηνιατρικού Κέντρου Vet Care.",
      "404.artAlt": "Εικονογράφηση: ένας σκύλος δίπλα σε πατημασιές που φεύγουν από τη σελίδα",
      "404.eyebrow": "Σελίδα 404",
      "404.title": "Αυτή η σελίδα το έσκασε",
      "404.text":
        "Η διεύθυνση που ζητήσατε δεν υπάρχει — ή άλλαξε. Ας σας γυρίσουμε κάπου γνώριμα.",
      "404.home": "Αρχική σελίδα",
      "404.call": "Καλέστε μας"
    },

    en: {
      /* --- meta / chrome --- */
      "meta.title": "Vet Care — Veterinary Centre in Ovria, Patras",
      "meta.description":
        "Vet Care veterinary centre in Ovria, Patras. Internal medicine, radiology, laboratory, surgery and dentistry for companion animals, plus herd health services for farm animals. Call +30 2616 007142.",
      "brand.tagline": "Veterinary Centre",
      "nav.story": "Our story",
      "nav.services": "Services",
      "nav.booking": "Appointments",
      "nav.findus": "Find us",
      "nav.contact": "Contact",
      "nav.book": "Book an appointment",
      "nav.menu": "Menu",
      "nav.openMenu": "Open menu",
      "nav.closeMenu": "Close menu",
      "nav.callAria": "Call the clinic on +30 2616 007142",
      "lang.aria": "Choose language",
      "lang.el": "Greek",
      "lang.other": "ΕΛ",
      "lang.otherAria": "Αλλαγή στα ελληνικά — switch to Greek",
      "lang.en": "English",
      "skip": "Skip to content",
      "action.call": "Call",
      "action.book": "Book",

      /* --- hero --- */
      "hero.title": "Care for every animal,<br><em class=\"accent-italic\">large or small</em>",
      "hero.lede":
        "Vet Care in Ovria offers complete veterinary care for companion animals and livestock alike — from everyday prevention through to diagnostics and surgery.",
      "hero.ctaBook": "Book an appointment",
      "hero.ctaCall": "Call 2616 007142",
      "hero.scroll": "See more",
      "hero.ratingLabel": "Google reviews",
      "hero.ratingAria": "Rated 4.7 out of 5 stars from 46 Google reviews",
      "hero.hoursLabel": "Monday – Friday",
      "hero.hoursValue": "09:00–14:00 & 18:00–21:00",
      /* The hero status chip was removed; these remain for the hours table
         and for re-adding an open/closed indicator later. */
      "status.open": "Open now",
      "status.closed": "Closed now",
      "status.opensAt": "Opens {time}",
      "status.opensMon": "Opens Monday 09:00",
      "status.opensTomorrow": "Opens tomorrow 09:00",
      "status.checking": "Opening hours",

      "hero.artAlt": "Illustration: a dog and a cat on an Achaian hillside, with a farmstead and sheep in the distance",
      "story.artAlt": "Decorative pattern of paw prints, hooves, olive sprigs and a stethoscope",
      "map.street": "DIMOKRATIAS",
      "map.area": "OVRIA",
      "map.north": "N",
      /* --- story --- */
      "story.eyebrow": "Our story",
      "story.title": "Two vets, one <em class=\"accent-italic\">shared philosophy</em>",
      "story.p1":
        "Vet Care was founded by veterinarians <strong>Eleni Fotopoulou</strong> and <strong>Georgios Mantzounis</strong> on a simple idea: an animal is cared for best when the person beside it understands exactly what is happening, and why.",
      "story.p2":
        "At our practice in Ovria we see dogs, cats and small companion animals, while also supporting livestock farms across Achaia with herd management and prevention. Two very different worlds, held to the same standard: an accurate diagnosis, a clear explanation, a realistic plan.",
      "story.pillar1.title": "Time for every case",
      "story.pillar1.text":
        "We examine without rushing, and explain the findings, the options and the cost before anything goes ahead.",
      "story.pillar2.title": "Prevention before treatment",
      "story.pillar2.text":
        "Vaccination, parasite protection and regular check-ups, matched to each animal's age and way of life.",
      "story.pillar3.title": "From the living room to the barn",
      "story.pillar3.text":
        "The same clinic looks after the family pet and the farmer's herd, with the expertise each one needs.",
      "story.signature.role": "Veterinarians, Vet Care",
      "story.signature.text": "Eleni Fotopoulou & Georgios Mantzounis",

      /* --- services --- */
      "services.eyebrow": "Services",
      "services.title": "Everything needed, <em class=\"accent-italic\">under one roof</em>",
      "services.lede":
        "Departments that cover most day-to-day needs, so you rarely have to travel elsewhere for a test or a routine procedure.",
      "services.small.title": "Companion animals",
      "services.small.count": "5 departments",
      "services.farm.title": "Farm animals",
      "services.farm.count": "4 services",

      "svc.internal.title": "Internal medicine",
      "svc.internal.text":
        "Clinical examination, investigation of symptoms and long-term monitoring of chronic conditions in dogs and cats.",
      "svc.radiology.title": "Radiology",
      "svc.radiology.text":
        "X-ray and ultrasound imaging for a fast, clear picture of bones, chest and abdomen.",
      "svc.lab.title": "Laboratory",
      "svc.lab.text":
        "Haematology, biochemistry and microbiology, so treatment starts from a confirmed diagnosis.",
      "svc.surgery.title": "Surgery",
      "svc.surgery.text":
        "Routine and soft-tissue procedures, with pre-operative checks and monitored recovery.",
      "svc.dental.title": "Dentistry",
      "svc.dental.text":
        "Oral health checks, scaling and treatment of dental problems that are easy to miss at home.",

      "svc.herd.title": "Herd management",
      "svc.herd.text":
        "Health monitoring across the herd, care protocols and structure for the unit's daily routine.",
      "svc.repro.title": "Reproductive management",
      "svc.repro.text":
        "Fertility assessment, breeding planning and support through the critical periods.",
      "svc.prevention.title": "Preventive veterinary care",
      "svc.prevention.text":
        "Vaccination programmes and biosecurity measures that head problems off before they spread.",
      "svc.advice.title": "Husbandry consulting",
      "svc.advice.text":
        "Nutrition and housing: practical recommendations for better performance and animal welfare.",

      "services.extra.title": "Veterinary pharmacy & everyday services",
      "services.extra.text":
        "We stock veterinary medicines and preparations so treatment can begin right after the examination. The following routine services can also be done during the same appointment.",
      "services.extra.1": "Vaccinations and parasite protection",
      "services.extra.2": "Microchipping and registration",
      "services.extra.3": "Health certificates and pet passports for travel",
      "services.extra.4": "Ultrasound examination",
      "services.extra.5": "Dental cleaning",
      "services.extra.6": "Urgent cases by prior phone call",

      /* --- booking --- */
      "booking.eyebrow": "Appointments",
      "booking.title": "Request an appointment <em class=\"accent-italic\">online</em>",
      "booking.aside.title": "How it works",
      "booking.aside.text":
        "This form sends an <strong>appointment request</strong> — it does not reserve a slot on its own. We will get in touch to confirm it, or to suggest the closest time available.",
      "booking.step1.title": "You send the request",
      "booking.step1.text": "Just a few details: how to reach you, and what your animal needs.",
      "booking.step2.title": "We call to confirm",
      "booking.step2.text": "Within opening hours, by phone or by email.",
      "booking.step3.title": "We see you at the clinic",
      "booking.step3.text": "Dimokratias 149, Ovria — with the time agreed and confirmed.",
      "booking.urgent.title": "Is it urgent?",
      "booking.urgent.text": "Please don't use the form. Call us directly so we can advise you straight away.",
      "booking.urgent.cta": "Call 6972 701536",

      "booking.name": "Full name",
      "booking.namePh": "e.g. Maria Papadopoulou",
      "booking.phone": "Phone",
      "booking.phonePh": "e.g. 69XXXXXXXX",
      "booking.email": "Email",
      "booking.emailOpt": "(optional)",
      "booking.emailPh": "for written confirmation",
      "booking.animal": "Type of animal",
      "booking.animal.choose": "Please choose…",
      "booking.animal.dog": "Dog",
      "booking.animal.cat": "Cat",
      "booking.animal.smallPet": "Other companion animal",
      "booking.animal.farm": "Farm animals / livestock",
      "booking.animal.other": "Other",
      "booking.date": "Preferred date",
      "booking.slot": "Preferred time",
      "booking.slot.morning": "Morning (09:00–14:00)",
      "booking.slot.evening": "Evening (18:00–21:00)",
      "booking.slot.any": "Whatever is available",
      "booking.message": "Reason for the visit",
      "booking.messageOpt": "(optional)",
      "booking.messagePh": "A short description — e.g. annual vaccination, limping, dental check.",
      "booking.consent":
        "I consent to Vet Care processing my details <strong>solely to handle this appointment request</strong>. I have read the <a href=\"privacy.html\">Privacy Policy</a>.",
      "booking.submit": "Send request",
      "booking.note":
        "We ask only for what we need to reply. Please don't send medical records or payment details through this form.",
      "booking.mailNote": "The request is sent through your own email app — it opens pre-filled, and you press Send there.",
      "booking.status.mailOpened": "We've opened your email app with the request filled in. Press Send there to finish — or use one of the options below.",
      "booking.status.mailNone": "No email app seems to have opened on your device. Copy the request or call us — nothing you typed has been lost.",
      "booking.fallback.title": "Send it whichever way suits you",
      "booking.fallback.copy": "Copy the request",
      "booking.fallback.copied": "Copied — paste it into an email or a message",
      "booking.fallback.mail": "Open an email to info@vet-care.gr",
      "booking.fallback.call": "Call +30 2616 007142",
      "booking.err.required": "Please fill in this field.",
      "booking.err.phone": "Please give a valid contact number.",
      "booking.err.email": "Please check the email address.",
      "booking.err.consent": "We need your consent before we can process the request.",
      "booking.err.date": "Please choose today's date or later.",
      "booking.status.sending": "Sending…",
      "booking.status.ok":
        "Your request has been sent. We'll contact you within opening hours to confirm the time.",
      "booking.status.err":
        "Something went wrong while sending. Please try again, or call us on +30 2616 007142.",

      /* --- find us --- */
      "findus.eyebrow": "Find us",
      "findus.title": "In Ovria, <em class=\"accent-italic\">just outside Patras</em>",
      "findus.lede":
        "We are on Dimokratias street. Tap the map to open turn-by-turn directions from wherever you are.",
      "findus.mapAria": "Open directions to Vet Care in Google Maps, in a new tab",
      "findus.mapLabel": "Vet Care",
      "findus.mapSub": "Dimokratias 149, Ovria 263 34",
      "findus.mapGo": "Directions",
      "findus.address.title": "Address",
      "findus.address.text": "Dimokratias 149, Ovria, Patras, 263 34, Greece",
      "findus.nav.title": "Navigation",
      "findus.nav.text": "Opens Google Maps with the clinic set as your destination.",
      "findus.hours.title": "Visiting hours",
      "findus.hours.text": "Monday to Friday, 09:00–14:00 and 18:00–21:00.",
      "findus.cta": "Open in Google Maps",

      /* --- contact --- */
      "contact.eyebrow": "Contact",
      "contact.title": "Talk <em class=\"accent-italic\">to us</em>",
      "contact.lede":
        "For appointments, questions or anything urgent, the phone is always the fastest route.",
      "contact.landline": "Landline",
      "contact.mobile": "Mobile",
      "contact.email": "Email",
      "contact.address": "Address",
      "contact.addressHint": "Ovria, Patras, 263 34, Greece",
      "contact.hours.title": "Opening hours",
      "contact.hours.caption": "These hours apply to booked appointments and to urgent cases alike.",
      "contact.social.title": "On social media",
      "contact.social.text": "Links will go live once the official pages are confirmed.",
      "day.mon": "Monday",
      "day.tue": "Tuesday",
      "day.wed": "Wednesday",
      "day.thu": "Thursday",
      "day.fri": "Friday",
      "day.sat": "Saturday",
      "day.sun": "Sunday",
      "day.closed": "Closed",
      "hours.weekday": "09:00–14:00 & 18:00–21:00",

      /* --- footer --- */
      "footer.about":
        "A veterinary centre for companion animals and livestock, in Ovria, Patras.",
      "footer.explore": "Explore",
      "footer.hours": "Hours",
      "footer.contact": "Contact",
      "footer.weekdays": "Mon – Fri",
      "footer.saturday": "Saturday",
      "footer.sunday": "Sunday",
      "footer.rights": "All rights reserved.",
      "footer.privacy": "Privacy Policy",
      "footer.cookies": "Cookie Policy",
      "footer.cookieSettings": "Cookie settings",
      "footer.controller": "Data controller: Vet Care, Dimokratias 149, Ovria 263 34, Greece.",

      /* --- cookie consent --- */
      "cookie.title": "Your privacy, on your terms",
      "cookie.text":
        "We use only the strictly necessary local storage that makes the site work (your language, and your choice here). We would additionally like your consent for anonymous visitor statistics. <strong>Nothing non-essential runs without your approval</strong>, and you can change your mind at any time.",
      "cookie.accept": "Accept",
      "cookie.reject": "Reject",
      "cookie.settings": "Settings",
      "cookie.policy": "Read the Cookie Policy",
      "cookie.aria": "Cookie and local storage notice",

      "prefs.title": "Cookie settings",
      "prefs.intro":
        "Choose what you allow. Rejecting is exactly as easy as accepting, and limits nothing on this site.",
      "prefs.necessary.title": "Strictly necessary",
      "prefs.necessary.text":
        "These remember the language you picked and the cookie decision you made. Without them the site cannot recall your choices. They require no consent.",
      "prefs.necessary.locked": "Always on",
      "prefs.analytics.title": "Visitor statistics",
      "prefs.analytics.text":
        "Anonymous measurement of visits, so we can see which pages are useful. No analytics tool is installed at the moment; your choice will be honoured if one ever is.",
      "prefs.save": "Save choices",
      "prefs.acceptAll": "Accept all",
      "prefs.rejectAll": "Reject all",
      "prefs.close": "Close",
      "prefs.saved": "Your choices have been saved.",

      /* --- misc --- */
      "toTop": "Back to top",
      "privacy.metaTitle": "Privacy Policy — Vet Care",
      "privacy.metaDesc": "How Vet Care veterinary centre collects, uses and protects your personal data, under the GDPR and Greek Law 4624/2019.",
      "cookies.metaTitle": "Cookie Policy — Vet Care",
      "cookies.metaDesc": "Which trackers the Vet Care website uses, why it uses no cookies at all, and how to change or withdraw your consent.",
      "404.metaTitle": "Page not found — Vet Care",
      "404.metaDesc": "The page you asked for does not exist. Head back to the Vet Care veterinary centre home page.",
      "404.artAlt": "Illustration: a dog beside a trail of paw prints leading off the page",
      "404.eyebrow": "Error 404",
      "404.title": "This page has run off",
      "404.text":
        "The address you asked for doesn't exist — or it has moved. Let's get you back somewhere familiar.",
      "404.home": "Back to home",
      "404.call": "Call us"
    }
  };

  /* ------------------------------------------------------------------ *
   * Public helper: window.VetCareI18n
   * ------------------------------------------------------------------ */
  function readStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.indexOf(v) > -1 ? v : null;
    } catch (e) {
      /* Safari private mode and friends — fall through to the default. */
      return null;
    }
  }

  function store(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* Preference simply won't persist; the site still works. */
    }
  }

  var current = readStored() || DEFAULT_LANG;

  function t(key, lang) {
    var dict = STRINGS[lang || current] || STRINGS[DEFAULT_LANG];
    var value = dict[key];
    if (value === undefined) {
      value = STRINGS[DEFAULT_LANG][key];
    }
    return value === undefined ? "" : value;
  }

  function apply(lang) {
    current = SUPPORTED.indexOf(lang) > -1 ? lang : DEFAULT_LANG;

    var root = document.documentElement;
    root.setAttribute("lang", current);

    /* 1. Key-based nodes */
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    }

    var htmlNodes = document.querySelectorAll("[data-i18n-html]");
    for (var j = 0; j < htmlNodes.length; j++) {
      htmlNodes[j].innerHTML = t(htmlNodes[j].getAttribute("data-i18n-html"));
    }

    /* 2. Attributes: data-i18n-attr="aria-label:key, placeholder:other.key" */
    var attrNodes = document.querySelectorAll("[data-i18n-attr]");
    for (var k = 0; k < attrNodes.length; k++) {
      var pairs = attrNodes[k].getAttribute("data-i18n-attr").split(",");
      for (var p = 0; p < pairs.length; p++) {
        var bits = pairs[p].split(":");
        if (bits.length === 2) {
          attrNodes[k].setAttribute(bits[0].trim(), t(bits[1].trim()));
        }
      }
    }

    /* 3. Whole-block prose (legal pages) */
    var blocks = document.querySelectorAll("[data-lang]");
    for (var b = 0; b < blocks.length; b++) {
      var match = blocks[b].getAttribute("data-lang") === current;
      blocks[b].hidden = !match;
    }

    /* 4. Language switch buttons reflect state */
    var switches = document.querySelectorAll("[data-lang-set]");
    for (var s = 0; s < switches.length; s++) {
      var isOn = switches[s].getAttribute("data-lang-set") === current;
      switches[s].setAttribute("aria-pressed", isOn ? "true" : "false");
    }

    /* 5. Page-level metadata that search engines and share cards read */
    var titleKey = root.getAttribute("data-title-key") || "meta.title";
    var descKey = root.getAttribute("data-desc-key") || "meta.description";
    if (STRINGS[current][titleKey]) document.title = t(titleKey);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && STRINGS[current][descKey]) desc.setAttribute("content", t(descKey));
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", current === "el" ? "el_GR" : "en_GB");

    document.dispatchEvent(
      new CustomEvent("vetcare:langchange", { detail: { lang: current } })
    );
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    store(lang);
    apply(lang);
  }

  window.VetCareI18n = {
    get lang() { return current; },
    t: t,
    set: set,
    apply: apply,
    SUPPORTED: SUPPORTED
  };

  /* Apply as early as possible so the first paint is already translated. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { apply(current); });
  } else {
    apply(current);
  }
})();
