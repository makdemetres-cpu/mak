import type { AppLocale } from "@/i18n/routing";

interface CategoryCopy {
  name: string;
  description: string;
}

export interface ConsentContent {
  banner: {
    title: string;
    body: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
  };
  modal: {
    title: string;
    intro: string;
    save: string;
    acceptAll: string;
    rejectAll: string;
    close: string;
    alwaysOn: string;
  };
  categories: {
    necessary: CategoryCopy;
    functional: CategoryCopy;
    analytics: CategoryCopy;
    marketing: CategoryCopy;
  };
}

const el: ConsentContent = {
  banner: {
    title: "Χρησιμοποιούμε cookies",
    body: "Χρησιμοποιούμε μόνο τα απολύτως απαραίτητα cookies από προεπιλογή. Με τη συγκατάθεσή σας, μπορούμε επίσης να ενεργοποιήσουμε λειτουργίες όπως ο διαδραστικός χάρτης. Δείτε την Πολιτική Cookies για λεπτομέρειες.",
    acceptAll: "Αποδοχή όλων",
    rejectAll: "Απόρριψη όλων",
    customize: "Προσαρμογή",
  },
  modal: {
    title: "Προτιμήσεις Cookies",
    intro:
      "Επιλέξτε ποιες κατηγορίες cookies επιτρέπετε. Τα απολύτως απαραίτητα δεν μπορούν να απενεργοποιηθούν, καθώς χρειάζονται για να λειτουργήσει ο ιστότοπος.",
    save: "Αποθήκευση προτιμήσεων",
    acceptAll: "Αποδοχή όλων",
    rejectAll: "Απόρριψη όλων",
    close: "Κλείσιμο",
    alwaysOn: "Πάντα ενεργά",
  },
  categories: {
    necessary: {
      name: "Απολύτως απαραίτητα",
      description:
        "Επιτρέπουν βασικές λειτουργίες όπως πλοήγηση, γλώσσα και ασφάλεια. Ο ιστότοπος δεν λειτουργεί χωρίς αυτά.",
    },
    functional: {
      name: "Λειτουργικά",
      description: "Ενεργοποιούν πρόσθετες λειτουργίες, όπως ο διαδραστικός χάρτης Google Maps.",
    },
    analytics: {
      name: "Στατιστικά",
      description:
        "Θα μας βοηθούσαν να καταλάβουμε πώς χρησιμοποιείται ο ιστότοπος. Δεν χρησιμοποιούμε αναλυτικά εργαλεία αυτή τη στιγμή.",
    },
    marketing: {
      name: "Μάρκετινγκ",
      description: "Θα χρησιμοποιούνταν για διαφημιστικούς σκοπούς. Δεν χρησιμοποιούμε cookies μάρκετινγκ αυτή τη στιγμή.",
    },
  },
};

const en: ConsentContent = {
  banner: {
    title: "We use cookies",
    body: "We use only strictly necessary cookies by default. With your consent, we can also enable features like the interactive map. See our Cookie Policy for details.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    customize: "Customize",
  },
  modal: {
    title: "Cookie Preferences",
    intro: "Choose which categories of cookies you allow. Strictly necessary cookies can't be turned off — the site needs them to work.",
    save: "Save preferences",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    close: "Close",
    alwaysOn: "Always on",
  },
  categories: {
    necessary: {
      name: "Strictly necessary",
      description: "Enable core functionality like navigation, language and security. The site doesn't work without these.",
    },
    functional: {
      name: "Functional",
      description: "Enable extra features, such as the interactive Google Maps embed.",
    },
    analytics: {
      name: "Analytics",
      description: "Would help us understand how the site is used. We don't currently use any analytics tools.",
    },
    marketing: {
      name: "Marketing",
      description: "Would be used for advertising purposes. We don't currently use any marketing cookies.",
    },
  },
};

const content: Record<AppLocale, ConsentContent> = { el, en };

export function getConsentContent(locale: AppLocale): ConsentContent {
  return content[locale];
}
