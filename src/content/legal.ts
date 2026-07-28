import type { AppLocale } from "@/i18n/routing";
import { PHONE_DISPLAY, EMAIL, VAT_NUMBER, BUSINESS_ADDRESS_DISPLAY_EL, BUSINESS_ADDRESS_DISPLAY_EN } from "@/content/business";

interface Meta {
  title: string;
  description: string;
}

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalPageContent {
  meta: Meta;
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export interface CookieRow {
  name: string;
  purpose: string;
  category: string;
  duration: string;
}

export interface CookiesPageContent extends LegalPageContent {
  tableTitle: string;
  tableHeadings: { name: string; purpose: string; category: string; duration: string };
  cookies: CookieRow[];
  thirdPartyNote: string;
}

const LAST_UPDATED_EL = "27 Ιουλίου 2026";
const LAST_UPDATED_EN = "27 July 2026";

const privacyPage: Record<AppLocale, LegalPageContent> = {
  el: {
    meta: {
      title: "Πολιτική Απορρήτου",
      description: "Πώς η HydroCore (mak theplumber) συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα.",
    },
    eyebrow: "ΝΟΜΙΚΑ",
    title: "Πολιτική Απορρήτου",
    intro:
      "Η παρούσα πολιτική εξηγεί ποια προσωπικά δεδομένα συλλέγουμε όταν επισκέπτεστε τον ιστότοπο ή ζητάτε ραντεβού, γιατί τα επεξεργαζόμαστε και ποια δικαιώματα έχετε βάσει του Γενικού Κανονισμού Προστασίας Δεδομένων (ΓΚΠΔ / GDPR).",
    lastUpdated: `Τελευταία ενημέρωση: ${LAST_UPDATED_EL}`,
    sections: [
      {
        heading: "1. Υπεύθυνος Επεξεργασίας",
        paragraphs: [
          `Υπεύθυνος επεξεργασίας των δεδομένων σας είναι ο mak theplumber (εμπορικό σήμα «HydroCore»), ατομική επιχείρηση με ΑΦΜ ${VAT_NUMBER}, με έδρα ${BUSINESS_ADDRESS_DISPLAY_EL}, Ελλάδα.`,
          `Για οποιοδήποτε ερώτημα σχετικά με την επεξεργασία των δεδομένων σας, επικοινωνήστε στο ${EMAIL} ή τηλεφωνικά στο ${PHONE_DISPLAY}.`,
          "Λόγω του μεγέθους της επιχείρησης δεν απαιτείται ο ορισμός Υπεύθυνου Προστασίας Δεδομένων (ΥΠΔ) βάσει του άρθρου 37 ΓΚΠΔ. Τα ερωτήματα προστασίας δεδομένων εξετάζονται απευθείας από τον υπεύθυνο επεξεργασίας.",
        ],
      },
      {
        heading: "2. Ποια δεδομένα συλλέγουμε",
        paragraphs: ["Συλλέγουμε δεδομένα μόνο όταν τα παρέχετε εσείς οι ίδιοι, μέσω της φόρμας κράτησης ή απευθείας επικοινωνίας:"],
        list: [
          "Στοιχεία επικοινωνίας: ονοματεπώνυμο, τηλέφωνο, email.",
          "Στοιχεία τοποθεσίας: διεύθυνση και ταχυδρομικός κώδικας του ακινήτου όπου ζητείται η εργασία.",
          "Στοιχεία ραντεβού: τύπος υπηρεσίας, βαθμός επείγοντος, προτιμώμενη ημερομηνία/ώρα, σχόλια που καταχωρείτε.",
          "Προαιρετικές φωτογραφίες: εικόνες της βλάβης ή του χώρου που επιλέγετε να ανεβάσετε για να μας βοηθήσετε να προετοιμαστούμε.",
          "Τεχνικά δεδομένα cookies: δείτε την Πολιτική Cookies για πλήρη λίστα.",
        ],
      },
      {
        heading: "3. Γιατί επεξεργαζόμαστε τα δεδομένα σας (νομική βάση)",
        paragraphs: [],
        list: [
          "Για την οργάνωση και εκτέλεση του ραντεβού που ζητήσατε — άρθρο 6 παρ. 1(β) ΓΚΠΔ, εκτέλεση σύμβασης/προσυμβατικά μέτρα κατόπιν αιτήματός σας.",
          "Για την τήρηση φορολογικών παραστατικών όπου απαιτείται από τον νόμο — άρθρο 6 παρ. 1(γ) ΓΚΠΔ, νομική υποχρέωση.",
          "Για λειτουργικά cookies (π.χ. ενσωματωμένος χάρτης) — άρθρο 6 παρ. 1(α) ΓΚΠΔ, με βάση τη συγκατάθεσή σας, ανακλητή ανά πάσα στιγμή.",
          "Δεν χρησιμοποιούμε αυτή τη στιγμή τα δεδομένα σας για μάρκετινγκ ή αναλυτικά εργαλεία. Αν αυτό αλλάξει στο μέλλον, θα ζητηθεί ξεχωριστά η συγκατάθεσή σας πριν από οποιαδήποτε τέτοια χρήση.",
        ],
      },
      {
        heading: "4. Πόσο καιρό διατηρούμε τα δεδομένα σας",
        paragraphs: [
          "Τηρούμε την αρχή του ελάχιστου δυνατού χρόνου διατήρησης: τα στοιχεία κράτησης (συμπεριλαμβανομένων τυχόν φωτογραφιών) διαγράφονται το συντομότερο δυνατό μετά την ολοκλήρωση ή ακύρωση του ραντεβού, μόλις παύσουν να είναι απαραίτητα — συνήθως εντός σύντομου χρονικού διαστήματος, εκτός αν χρειαστεί να τα κρατήσουμε λίγο περισσότερο για την εξυπηρέτηση ενεργού παραπόνου ή εγγύησης εργασίας.",
          "Εξαίρεση αποτελούν τα παραστατικά που σχετίζονται με τιμολόγηση, τα οποία διατηρούνται για πέντε (5) έτη, όπως επιβάλλει η ελληνική φορολογική νομοθεσία — αυτή είναι η μόνη υποχρεωτική ελάχιστη περίοδος διατήρησης που ισχύει.",
          "Μετά το πέρας των παραπάνω περιόδων, τα δεδομένα διαγράφονται ή ανωνυμοποιούνται με ασφαλή τρόπο.",
        ],
      },
      {
        heading: "5. Με ποιους μοιραζόμαστε τα δεδομένα σας",
        paragraphs: [
          "Δεν πουλάμε και δεν ενοικιάζουμε τα δεδομένα σας. Τα μοιραζόμαστε μόνο με τρίτους που μας βοηθούν να λειτουργήσουμε τον ιστότοπο και την επιχείρηση, στο βαθμό που απαιτείται:",
        ],
        list: [
          "Vercel — φιλοξενία του ιστότοπου.",
          "Supabase (βάση δεδομένων σε περιοχή ΕΕ) — αποθήκευση στοιχείων κράτησης και φωτογραφιών.",
          "Google (Gmail) — για την παραλαβή ειδοποιήσεων νέων κρατήσεων στο προσωπικό email της επιχείρησης.",
          "Google Maps (μόνο εφόσον έχετε δώσει «Λειτουργική» συγκατάθεση cookies) — δείτε την Πολιτική Cookies.",
        ],
      },
      {
        heading: "6. Διεθνείς διαβιβάσεις δεδομένων",
        paragraphs: [
          "Η βάση δεδομένων μας (Supabase) βρίσκεται σε περιοχή εντός της Ευρωπαϊκής Ένωσης. Ο πάροχος φιλοξενίας του ιστότοπου (Vercel Inc.) είναι εταιρεία με έδρα τις ΗΠΑ· στον βαθμό που η υποδομή της επεξεργάζεται δεδομένα εκτός Ευρωπαϊκού Οικονομικού Χώρου, η διαβίβαση πραγματοποιείται βάσει κατάλληλων εγγυήσεων, όπως οι Τυποποιημένες Συμβατικές Ρήτρες της Ευρωπαϊκής Επιτροπής.",
        ],
      },
      {
        heading: "7. Τα δικαιώματά σας",
        paragraphs: ["Ως υποκείμενο δεδομένων έχετε τα εξής δικαιώματα βάσει του ΓΚΠΔ:"],
        list: [
          "Πρόσβαση στα δεδομένα σας.",
          "Διόρθωση ανακριβών δεδομένων.",
          "Διαγραφή («δικαίωμα στη λήθη»), όπου δεν υπάρχει νόμιμος λόγος διατήρησης.",
          "Περιορισμός της επεξεργασίας.",
          "Φορητότητα των δεδομένων σας σε δομημένη, κοινώς χρησιμοποιούμενη μορφή.",
          "Εναντίωση στην επεξεργασία.",
          "Ανάκληση της συγκατάθεσής σας ανά πάσα στιγμή, χωρίς να θίγεται η νομιμότητα της επεξεργασίας που έγινε πριν την ανάκληση.",
        ],
      },
      {
        heading: "8. Πώς να ασκήσετε τα δικαιώματά σας",
        paragraphs: [
          `Στείλτε email στο ${EMAIL} ή καλέστε στο ${PHONE_DISPLAY}. Θα απαντήσουμε εντός ενός (1) μηνός από τη λήψη του αιτήματος, όπως προβλέπει ο ΓΚΠΔ.`,
          "Αν θεωρείτε ότι η επεξεργασία των δεδομένων σας παραβιάζει τον ΓΚΠΔ, έχετε δικαίωμα καταγγελίας στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ), www.dpa.gr, Κηφισίας 1-3, 115 23 Αθήνα.",
        ],
      },
      {
        heading: "9. Ασφάλεια δεδομένων",
        paragraphs: [
          "Η μεταφορά δεδομένων μεταξύ του προγράμματος περιήγησής σας και του ιστότοπου κρυπτογραφείται (HTTPS). Η πρόσβαση στον πίνακα διαχείρισης κρατήσεων προστατεύεται με κωδικό πρόσβασης και περιορίζεται στο προσωπικό της επιχείρησης. Εφαρμόζουμε επίσης μηχανισμούς προστασίας από αυτοματοποιημένη κατάχρηση της φόρμας κράτησης (rate limiting).",
        ],
      },
      {
        heading: "10. Ανήλικοι",
        paragraphs: ["Ο ιστότοπος δεν απευθύνεται σε ανήλικους κάτω των 16 ετών και δεν συλλέγουμε εν γνώσει μας δεδομένα ανηλίκων."],
      },
      {
        heading: "11. Αλλαγές στην παρούσα πολιτική",
        paragraphs: [
          "Ενδέχεται να ενημερώνουμε την παρούσα πολιτική κατά καιρούς. Η ημερομηνία τελευταίας ενημέρωσης αναγράφεται στην αρχή της σελίδας. Ουσιώδεις αλλαγές θα συνοδεύονται από ανανέωση του αιτήματος συγκατάθεσης cookies, όπου απαιτείται.",
        ],
      },
    ],
  },
  en: {
    meta: {
      title: "Privacy Policy",
      description: "How HydroCore (mak theplumber) collects, uses and protects your personal data.",
    },
    eyebrow: "LEGAL",
    title: "Privacy Policy",
    intro:
      "This policy explains what personal data we collect when you visit the site or request a booking, why we process it, and what rights you have under the General Data Protection Regulation (GDPR).",
    lastUpdated: `Last updated: ${LAST_UPDATED_EN}`,
    sections: [
      {
        heading: "1. Data controller",
        paragraphs: [
          `The data controller is mak theplumber (trading as "HydroCore"), a sole proprietorship with VAT number ${VAT_NUMBER}, registered at ${BUSINESS_ADDRESS_DISPLAY_EN}, Greece.`,
          `For any question about how we process your data, contact us at ${EMAIL} or by phone at ${PHONE_DISPLAY}.`,
          "Given the size of the business, we are not required to appoint a Data Protection Officer (DPO) under Article 37 GDPR. Data protection queries are handled directly by the controller.",
        ],
      },
      {
        heading: "2. What data we collect",
        paragraphs: ["We only collect data you provide yourself, through the booking form or direct contact:"],
        list: [
          "Contact details: full name, phone number, email.",
          "Location details: the address and postcode of the property where work is requested.",
          "Booking details: service type, urgency level, preferred date/time, any notes you enter.",
          "Optional photos: images of the issue or space you choose to upload to help us prepare.",
          "Technical cookie data: see our Cookie Policy for the full list.",
        ],
      },
      {
        heading: "3. Why we process your data (legal basis)",
        paragraphs: [],
        list: [
          "To organise and carry out the appointment you requested — Article 6(1)(b) GDPR, performance of a contract / pre-contractual steps taken at your request.",
          "To keep tax records where required by law — Article 6(1)(c) GDPR, legal obligation.",
          "For functional cookies (e.g. the embedded map) — Article 6(1)(a) GDPR, based on your consent, which you can withdraw at any time.",
          "We do not currently use your data for marketing or analytics. If that changes in future, we will ask for your separate consent before any such use.",
        ],
      },
      {
        heading: "4. How long we keep your data",
        paragraphs: [
          "We follow a minimum-necessary retention approach: booking details (including any photos) are deleted as soon as possible after the appointment is completed or cancelled, once they're no longer needed — normally within a short period — unless we need to keep them a little longer to support an active complaint or workmanship guarantee.",
          "The one exception is invoicing records, which are kept for five (5) years as required under Greek tax law — this is the only mandatory minimum retention period that applies.",
          "After these periods, data is securely deleted or anonymised.",
        ],
      },
      {
        heading: "5. Who we share your data with",
        paragraphs: [
          "We don't sell or rent your data. We only share it with third parties that help us run the site and business, to the extent required:",
        ],
        list: [
          "Vercel — website hosting.",
          "Supabase (database hosted in an EU region) — stores booking details and photos.",
          "Google (Gmail) — to receive new-booking notifications at the business's email address.",
          "Google Maps (only once you've given \"Functional\" cookie consent) — see our Cookie Policy.",
        ],
      },
      {
        heading: "6. International data transfers",
        paragraphs: [
          "Our database (Supabase) is hosted in a region within the European Union. Our website hosting provider (Vercel Inc.) is a US-headquartered company; to the extent its infrastructure processes data outside the European Economic Area, the transfer relies on appropriate safeguards, such as the European Commission's Standard Contractual Clauses.",
        ],
      },
      {
        heading: "7. Your rights",
        paragraphs: ["As a data subject you have the following rights under GDPR:"],
        list: [
          "Access to your data.",
          "Rectification of inaccurate data.",
          "Erasure (\"right to be forgotten\"), where there is no lawful reason to keep it.",
          "Restriction of processing.",
          "Portability of your data in a structured, commonly used format.",
          "Objection to processing.",
          "Withdrawal of consent at any time, without affecting the lawfulness of processing before the withdrawal.",
        ],
      },
      {
        heading: "8. How to exercise your rights",
        paragraphs: [
          `Email ${EMAIL} or call ${PHONE_DISPLAY}. We will respond within one (1) month of receiving your request, as required by GDPR.`,
          "If you believe our processing of your data breaches GDPR, you have the right to lodge a complaint with the Hellenic Data Protection Authority (HDPA), www.dpa.gr, Kifisias 1-3, 115 23 Athens.",
        ],
      },
      {
        heading: "9. Data security",
        paragraphs: [
          "Data transferred between your browser and the site is encrypted (HTTPS). Access to the booking admin panel is password-protected and limited to business staff. We also apply protections against automated abuse of the booking form (rate limiting).",
        ],
      },
      {
        heading: "10. Children",
        paragraphs: ["The site is not directed at children under 16 and we do not knowingly collect data from minors."],
      },
      {
        heading: "11. Changes to this policy",
        paragraphs: [
          "We may update this policy from time to time. The last-updated date is shown at the top of the page. Material changes will be accompanied by a renewed cookie consent prompt where required.",
        ],
      },
    ],
  },
};

const cookiesPage: Record<AppLocale, CookiesPageContent> = {
  el: {
    meta: {
      title: "Πολιτική Cookies",
      description: "Ποια cookies χρησιμοποιεί ο ιστότοπος της HydroCore, γιατί, και πώς να διαχειριστείτε τις προτιμήσεις σας.",
    },
    eyebrow: "ΝΟΜΙΚΑ",
    title: "Πολιτική Cookies",
    intro:
      "Ο ιστότοπος χρησιμοποιεί ελάχιστα cookies. Παρακάτω θα βρείτε ακριβώς ποια, γιατί τα χρησιμοποιούμε, και πώς μπορείτε να αλλάξετε τις προτιμήσεις σας ανά πάσα στιγμή.",
    lastUpdated: `Τελευταία ενημέρωση: ${LAST_UPDATED_EL}`,
    sections: [
      {
        heading: "Τι είναι τα cookies",
        paragraphs: [
          "Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν επισκέπτεστε έναν ιστότοπο. Χρησιμοποιούνται για να θυμάται ο ιστότοπος πληροφορίες σχετικά με την επίσκεψή σας, όπως τη γλώσσα που επιλέξατε ή τις προτιμήσεις συγκατάθεσής σας.",
        ],
      },
      {
        heading: "Κατηγορίες που χρησιμοποιούμε",
        paragraphs: [
          "Απολύτως απαραίτητα: επιτρέπουν βασικές λειτουργίες (γλώσσα, ασφάλεια, απομνημόνευση των προτιμήσεών σας για cookies) και εξαιρούνται από την υποχρέωση συγκατάθεσης βάσει του άρθρου 5 παρ. 3 της Οδηγίας ePrivacy, όπως έχει ενσωματωθεί στο ελληνικό δίκαιο.",
          "Λειτουργικά: ενεργοποιούν πρόσθετες λειτουργίες, όπως ο διαδραστικός χάρτης Google Maps, μόνο εφόσον δώσετε τη συγκατάθεσή σας.",
          "Στατιστικά και Μάρκετινγκ: δεν χρησιμοποιούμε αυτή τη στιγμή κανένα εργαλείο αναλυτικών στοιχείων ή μάρκετινγκ. Αν αυτό αλλάξει, η παρούσα σελίδα και το παράθυρο προτιμήσεων θα ενημερωθούν πριν από οποιαδήποτε τέτοια χρήση, και θα ζητηθεί η ρητή συγκατάθεσή σας.",
        ],
      },
      {
        heading: "Πώς να αλλάξετε τις προτιμήσεις σας",
        paragraphs: [
          "Μπορείτε να ανοίξετε ξανά το παράθυρο προτιμήσεων cookies ανά πάσα στιγμή από τον σύνδεσμο «Προτιμήσεις Cookies» στο υποσέλιδο κάθε σελίδας, ή διαγράφοντας τα cookies από τις ρυθμίσεις του browser σας.",
        ],
      },
      {
        heading: "Cookies τρίτων",
        paragraphs: [
          "Όταν επιλέξετε να ενεργοποιήσετε τον διαδραστικό χάρτη (κατηγορία «Λειτουργικά»), φορτώνεται μια ενσωμάτωση (iframe) από τη Google, η οποία ενδέχεται να ορίσει δικά της cookies. Δεν ελέγχουμε αυτά τα cookies — διέπονται από την πολιτική απορρήτου της Google.",
        ],
      },
    ],
    tableTitle: "Τα cookies που χρησιμοποιούμε",
    tableHeadings: { name: "Όνομα", purpose: "Σκοπός", category: "Κατηγορία", duration: "Διάρκεια" },
    cookies: [
      {
        name: "hydrocore_consent",
        purpose: "Αποθηκεύει τις προτιμήσεις σας για τα cookies, ώστε να μην σας ρωτάμε ξανά σε κάθε επίσκεψη.",
        category: "Απολύτως απαραίτητο",
        duration: "180 ημέρες",
      },
      {
        name: "NEXT_LOCALE",
        purpose: "Θυμάται την επιλογή γλώσσας (Ελληνικά/English).",
        category: "Απολύτως απαραίτητο",
        duration: "Cookie συνεδρίας (διαγράφεται με το κλείσιμο του browser)",
      },
      {
        name: "hydrocore_admin_session",
        purpose: "Πιστοποιεί τη σύνδεση προσωπικού στον πίνακα διαχείρισης κρατήσεων. Ορίζεται μόνο για μέλη της ομάδας που συνδέονται στο /admin, ποτέ για επισκέπτες.",
        category: "Απολύτως απαραίτητο",
        duration: "8 ώρες",
      },
    ],
    thirdPartyNote:
      "Επιπλέον cookies της Google ενδέχεται να οριστούν μόνο αφού ενεργοποιήσετε τον χάρτη μέσω της κατηγορίας «Λειτουργικά» — δείτε παραπάνω.",
  },
  en: {
    meta: {
      title: "Cookie Policy",
      description: "Which cookies the HydroCore site uses, why, and how to manage your preferences.",
    },
    eyebrow: "LEGAL",
    title: "Cookie Policy",
    intro:
      "The site uses very few cookies. Below is exactly which ones, why we use them, and how you can change your preferences at any time.",
    lastUpdated: `Last updated: ${LAST_UPDATED_EN}`,
    sections: [
      {
        heading: "What cookies are",
        paragraphs: [
          "Cookies are small text files stored on your device when you visit a website. They're used to help a site remember information about your visit, such as your chosen language or your cookie consent preferences.",
        ],
      },
      {
        heading: "Categories we use",
        paragraphs: [
          "Strictly necessary: enable core functionality (language, security, remembering your cookie choices) and are exempt from the consent requirement under Article 5(3) of the ePrivacy Directive, as implemented in Greek law.",
          "Functional: enable extra features, such as the interactive Google Maps embed, only once you give consent.",
          "Analytics and Marketing: we don't currently use any analytics or marketing tools. If that changes, this page and the preferences panel will be updated before any such use begins, and we'll ask for your explicit consent.",
        ],
      },
      {
        heading: "How to change your preferences",
        paragraphs: [
          "You can reopen the cookie preferences panel at any time via the \"Cookie Preferences\" link in the footer of every page, or by clearing cookies in your browser settings.",
        ],
      },
      {
        heading: "Third-party cookies",
        paragraphs: [
          "When you choose to enable the interactive map (\"Functional\" category), an embed (iframe) from Google loads, which may set its own cookies. We don't control these cookies — they're governed by Google's own privacy policy.",
        ],
      },
    ],
    tableTitle: "Cookies we use",
    tableHeadings: { name: "Name", purpose: "Purpose", category: "Category", duration: "Duration" },
    cookies: [
      {
        name: "hydrocore_consent",
        purpose: "Stores your cookie preferences so we don't ask again on every visit.",
        category: "Strictly necessary",
        duration: "180 days",
      },
      {
        name: "NEXT_LOCALE",
        purpose: "Remembers your language choice (Greek/English).",
        category: "Strictly necessary",
        duration: "Session cookie (deleted when the browser closes)",
      },
      {
        name: "hydrocore_admin_session",
        purpose: "Authenticates staff logged into the booking admin panel. Only set for team members signing into /admin, never for visitors.",
        category: "Strictly necessary",
        duration: "8 hours",
      },
    ],
    thirdPartyNote: "Additional Google cookies may only be set after you enable the map via the \"Functional\" category — see above.",
  },
};

const termsPage: Record<AppLocale, LegalPageContent> = {
  el: {
    meta: {
      title: "Όροι Χρήσης",
      description: "Οι όροι χρήσης του ιστότοπου και των υπηρεσιών κράτησης της HydroCore.",
    },
    eyebrow: "ΝΟΜΙΚΑ",
    title: "Όροι Χρήσης",
    intro: "Χρησιμοποιώντας τον παρόντα ιστότοπο ή τη φόρμα κράτησης, αποδέχεστε τους παρακάτω όρους.",
    lastUpdated: `Τελευταία ενημέρωση: ${LAST_UPDATED_EL}`,
    sections: [
      {
        heading: "1. Στοιχεία επιχείρησης",
        paragraphs: [
          `Ο ιστότοπος ανήκει και λειτουργεί από τον mak theplumber (εμπορικό σήμα «HydroCore»), ΑΦΜ ${VAT_NUMBER}, ${BUSINESS_ADDRESS_DISPLAY_EL}.`,
        ],
      },
      {
        heading: "2. Αιτήματα κράτησης",
        paragraphs: [
          "Η υποβολή φόρμας κράτησης αποτελεί αίτημα ραντεβού, όχι δεσμευτική κράτηση. Κάθε αίτημα επιβεβαιώνεται τηλεφωνικά ή μέσω email από την ομάδα μας πριν οριστικοποιηθεί το ραντεβού.",
          "Οι ενδεικτικές τιμές που τυχόν αναφέρονται στον ιστότοπο είναι κατά προσέγγιση. Η τελική χρέωση καθορίζεται μετά από αυτοψία ή κατά τη συνεννόηση, πριν την έναρξη της εργασίας.",
          "Διατηρούμε το δικαίωμα να απορρίψουμε ή να επαναπρογραμματίσουμε ένα αίτημα, ιδίως σε περιπτώσεις έλλειψης διαθεσιμότητας ή ελλιπών στοιχείων επικοινωνίας.",
        ],
      },
      {
        heading: "3. Ακυρώσεις",
        paragraphs: [
          "Μπορείτε να ακυρώσετε ή να αλλάξετε το ραντεβού σας χωρίς χρέωση έως 24 ώρες πριν την προγραμματισμένη ώρα. Για ακυρώσεις με μικρότερη προειδοποίηση ή μη εμφάνιση στο ραντεβού, ενδέχεται να ισχύσει χρέωση επίσκεψης.",
        ],
      },
      {
        heading: "4. Χρήση του ιστότοπου",
        paragraphs: [
          "Συμφωνείτε να μη χρησιμοποιείτε τον ιστότοπο για παράνομους σκοπούς, να μην επιχειρείτε μη εξουσιοδοτημένη πρόσβαση σε τμήματα του συστήματος (π.χ. τον πίνακα διαχείρισης) και να μην υποβάλλετε ψευδή ή παραπλανητικά στοιχεία μέσω της φόρμας κράτησης.",
        ],
      },
      {
        heading: "5. Πνευματική ιδιοκτησία",
        paragraphs: [
          "Το περιεχόμενο του ιστότοπου (κείμενα, σχεδιασμός, φωτογραφίες, λογότυπο) ανήκει στην HydroCore, εκτός αν αναφέρεται διαφορετικά, και δεν επιτρέπεται η αναπαραγωγή του χωρίς άδεια.",
        ],
      },
      {
        heading: "6. Περιορισμός ευθύνης",
        paragraphs: [
          "Καταβάλλουμε εύλογη προσπάθεια ώστε οι πληροφορίες του ιστότοπου να είναι ακριβείς, αλλά δεν παρέχουμε καμία εγγύηση ως προς την πληρότητα ή την αδιάλειπτη διαθεσιμότητα του ιστότοπου. Η ευθύνη μας για τις υπηρεσίες υδραυλικού που εκτελούμε διέπεται από τη χωριστή συμφωνία/παραστατικό που εκδίδεται για κάθε εργασία, όχι από τους παρόντες όρους.",
        ],
      },
      {
        heading: "7. Σύνδεσμοι τρίτων",
        paragraphs: ["Ο ιστότοπος ενδέχεται να περιέχει ενσωματώσεις τρίτων (π.χ. Google Maps). Δεν ευθυνόμαστε για το περιεχόμενο ή τις πρακτικές απορρήτου τρίτων ιστότοπων ή υπηρεσιών."],
      },
      {
        heading: "8. Εφαρμοστέο δίκαιο",
        paragraphs: ["Οι παρόντες όροι διέπονται από το ελληνικό δίκαιο. Αρμόδια είναι τα δικαστήρια της Αθήνας."],
      },
      {
        heading: "9. Τροποποιήσεις",
        paragraphs: ["Ενδέχεται να τροποποιούμε τους παρόντες όρους κατά καιρούς. Η ισχύουσα έκδοση είναι πάντα αυτή που εμφανίζεται στην παρούσα σελίδα."],
      },
      {
        heading: "10. Επικοινωνία",
        paragraphs: [`Για ερωτήσεις σχετικά με τους παρόντες όρους: ${EMAIL} / ${PHONE_DISPLAY}.`],
      },
    ],
  },
  en: {
    meta: {
      title: "Terms of Use",
      description: "Terms of use for the HydroCore website and booking service.",
    },
    eyebrow: "LEGAL",
    title: "Terms of Use",
    intro: "By using this site or the booking form, you agree to the terms below.",
    lastUpdated: `Last updated: ${LAST_UPDATED_EN}`,
    sections: [
      {
        heading: "1. Business details",
        paragraphs: [`This site is owned and operated by mak theplumber (trading as "HydroCore"), VAT number ${VAT_NUMBER}, ${BUSINESS_ADDRESS_DISPLAY_EN}.`],
      },
      {
        heading: "2. Booking requests",
        paragraphs: [
          "Submitting the booking form is a request for an appointment, not a binding booking. Every request is confirmed by phone or email by our team before the appointment is finalised.",
          "Any indicative pricing shown on the site is approximate. Final pricing is agreed after an on-site assessment or during the confirmation call, before work begins.",
          "We reserve the right to decline or reschedule a request, particularly where availability is limited or contact details are incomplete.",
        ],
      },
      {
        heading: "3. Cancellations",
        paragraphs: [
          "You can cancel or reschedule your appointment free of charge up to 24 hours before the scheduled time. Cancellations with less notice, or a missed appointment, may be subject to a call-out fee.",
        ],
      },
      {
        heading: "4. Use of the site",
        paragraphs: [
          "You agree not to use the site for unlawful purposes, not to attempt unauthorised access to any part of the system (such as the admin panel), and not to submit false or misleading information through the booking form.",
        ],
      },
      {
        heading: "5. Intellectual property",
        paragraphs: [
          "The site's content (text, design, photography, logo) belongs to HydroCore unless stated otherwise, and may not be reproduced without permission.",
        ],
      },
      {
        heading: "6. Limitation of liability",
        paragraphs: [
          "We make reasonable efforts to keep the site's information accurate, but we give no warranty as to completeness or uninterrupted availability of the site. Our liability for the plumbing work we carry out is governed by the separate agreement/invoice issued for each job, not by these terms.",
        ],
      },
      {
        heading: "7. Third-party links",
        paragraphs: ["The site may include third-party embeds (such as Google Maps). We're not responsible for the content or privacy practices of third-party sites or services."],
      },
      {
        heading: "8. Governing law",
        paragraphs: ["These terms are governed by Greek law. The courts of Athens have jurisdiction."],
      },
      {
        heading: "9. Changes",
        paragraphs: ["We may amend these terms from time to time. The version shown on this page is always the current one."],
      },
      {
        heading: "10. Contact",
        paragraphs: [`For questions about these terms: ${EMAIL} / ${PHONE_DISPLAY}.`],
      },
    ],
  },
};

export function getPrivacyPageContent(locale: AppLocale): LegalPageContent {
  return privacyPage[locale];
}

export function getCookiesPageContent(locale: AppLocale): CookiesPageContent {
  return cookiesPage[locale];
}

export function getTermsPageContent(locale: AppLocale): LegalPageContent {
  return termsPage[locale];
}
