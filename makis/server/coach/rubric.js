// Coach mode: MAKIS drops character and grades the call against real
// cold-call fundamentals — discovery, objection handling, tonality,
// control of the call, and whether you ever actually asked for something.

import { formatMetrics } from './metrics.js';

export const COACH_SYSTEM = `Είσαι έμπειρος προπονητής τηλεφωνικών πωλήσεων με 20 χρόνια στις B2B πωλήσεις στην Ελλάδα.
Μόλις άκουσες μια κλήση όπου ένας πωλητής προσπάθησε να πουλήσει κατασκευή ιστοσελίδας και μηνιαίο πακέτο συντήρησης σε ιδιοκτήτη μικρής ελληνικής επιχείρησης.

Ο ρόλος σου: ΑΥΣΤΗΡΗ, ΕΙΛΙΚΡΙΝΗΣ, ΧΡΗΣΙΜΗ αξιολόγηση. Όχι ενθάρρυνση, όχι γενικότητες.
Γράφεις ΜΟΝΟ στα ελληνικά, σε δεύτερο πρόσωπο ("μίλησες", "δεν ρώτησες").

ΚΑΝΟΝΕΣ ΒΑΘΜΟΛΟΓΗΣΗΣ (0-10):
- 0-3: Δεν έγινε ουσιαστική πώληση. Μονόλογος, καμία ερώτηση, καμία διαχείριση αντίρρησης.
- 4-5: Βασικά λάθη. Κάποια προσπάθεια, αλλά χωρίς ανακάλυψη αναγκών ή χωρίς απάντηση στις αντιρρήσεις.
- 6-7: Σωστά θεμέλια. Ερωτήσεις, κάποια διαχείριση αντιρρήσεων, αλλά χαμένες ευκαιρίες.
- 8-9: Δυνατή κλήση. Ανακάλυψη, συγκεκριμένες απαντήσεις, έλεγχος, καθαρή προσπάθεια κλεισίματος.
- 10: Σπάνιο. Άψογη κλήση.
Αν ο υποψήφιος πελάτης έκλεισε το τηλέφωνο, ο βαθμός ΔΕΝ μπορεί να ξεπερνάει το 5.
Αν ο πωλητής δεν έκανε ΚΑΜΙΑ ερώτηση, ο βαθμός ΔΕΝ μπορεί να ξεπερνάει το 4.
Αν δεν υπήρξε καμία προσπάθεια κλεισίματος, ο βαθμός ΔΕΝ μπορεί να ξεπερνάει το 7.

Οι αδυναμίες είναι το κύριο μέρος. Κάθε αδυναμία πρέπει να είναι ΣΥΓΚΕΚΡΙΜΕΝΗ και να παραπέμπει σε κάτι που όντως ειπώθηκε, με σύντομο παράδειγμα από τη συνομιλία και το τι έπρεπε να πει αντ' αυτού.

Απαντάς ΜΟΝΟ με JSON:
{
  "score": αριθμός 0-10 με μισό βαθμό ακρίβεια,
  "headline": "μία πρόταση που περιγράφει την κλήση χωρίς περιστροφές",
  "subscores": {
    "discovery": 0-10, "objections": 0-10, "tonality": 0-10, "control": 0-10, "closing": 0-10
  },
  "weaknesses": [
    { "title": "σύντομος τίτλος", "detail": "τι έκανες λάθος, με παράδειγμα από την κλήση", "fix": "τι έπρεπε να πεις" }
  ],
  "strengths": ["σύντομα, το πολύ 3"],
  "drill": "μία συγκεκριμένη άσκηση για την επόμενη κλήση",
  "verdict": "θα έκλεινε ραντεβού" | "οριακό" | "χαμένη κλήση"
}
Δώσε 3 έως 5 αδυναμίες.`;

export function coachPrompt({ scenario, difficulty, outcome, turns, metrics }) {
  const transcript = turns
    .map((t) => `${t.speaker === 'user' ? 'ΠΩΛΗΤΗΣ' : 'ΜΑΚΗΣ'}: ${t.text}`)
    .join('\n');

  const outcomeLine = {
    hangup: 'Ο Μάκης ΕΚΛΕΙΣΕ ΤΟ ΤΗΛΕΦΩΝΟ από εκνευρισμό.',
    ended: 'Ο πωλητής τερμάτισε την κλήση.',
    abandoned: 'Η κλήση διακόπηκε.',
  }[outcome] ?? 'Η κλήση τελείωσε.';

  return `ΕΠΙΧΕΙΡΗΣΗ ΠΟΥ ΔΕΧΤΗΚΕ ΤΗΝ ΚΛΗΣΗ: ${scenario.business} ${scenario.city}
${scenario.detail}
ΕΠΙΠΕΔΟ ΔΥΣΚΟΛΙΑΣ ΤΟΥ ΥΠΟΨΗΦΙΟΥ ΠΕΛΑΤΗ: ${difficulty}
ΕΚΒΑΣΗ: ${outcomeLine}

ΜΕΤΡΗΣΕΙΣ (πραγματικά δεδομένα, μετρημένα — χρησιμοποίησέ τα, μην τα επινοήσεις):
${formatMetrics(metrics)}

ΑΠΟΜΑΓΝΗΤΟΦΩΝΗΣΗ:
${transcript}

Αξιολόγησε την κλήση.`;
}

/**
 * Scoring without a model: used in rehearsal mode and whenever the LLM is
 * unreachable, so ending a call always produces a report instead of an error.
 */
export function fallbackReport({ metrics, outcome }) {
  // A call where you never spoke is not a 5 with good tonality — it is a zero.
  if (!metrics.userTurns) {
    return {
      score: 0,
      headline: 'Δεν μίλησες καθόλου. Ο Μάκης σήκωσε το τηλέφωνο και βρήκε σιωπή.',
      subscores: { discovery: 0, objections: 0, tonality: 0, control: 0, closing: 0 },
      weaknesses: [{
        title: 'Καμία ομιλία',
        detail: 'Η κλήση τερματίστηκε χωρίς να πεις τίποτα.',
        fix: 'Ξεκίνα με όνομα, εταιρεία και λόγο κλήσης μέσα σε 8 δευτερόλεπτα.',
      }],
      strengths: [],
      drill: 'Γράψε ένα άνοιγμα 15 λέξεων και πες το δυνατά πέντε φορές πριν την επόμενη κλήση.',
      verdict: 'χαμένη κλήση',
      offline: true,
    };
  }

  let score = 5;
  const weaknesses = [];

  if (metrics.questionsAsked === 0) {
    score -= 2;
    weaknesses.push({
      title: 'Καμία ερώτηση ανακάλυψης',
      detail: 'Σε όλη την κλήση δεν έκανες ούτε μία ερώτηση για την επιχείρησή του.',
      fix: 'Ρώτα νωρίς: «Πώς σας βρίσκουν σήμερα οι καινούργιοι πελάτες;»',
    });
  } else if (metrics.questionsAsked < 3) {
    score -= 0.5;
    weaknesses.push({
      title: 'Λίγες ερωτήσεις',
      detail: `Έκανες μόνο ${metrics.questionsAsked} ερώτηση/ερωτήσεις.`,
      fix: 'Στόχευσε σε τουλάχιστον 4-5 ερωτήσεις πριν προτείνεις οτιδήποτε.',
    });
  }

  if (metrics.talkRatio > 0.65) {
    score -= 1.5;
    weaknesses.push({
      title: 'Μίλησες πολύ',
      detail: `Κράτησες το ${(metrics.talkRatio * 100).toFixed(0)}% του λόγου.`,
      fix: 'Σε ψυχρή κλήση στόχευσε κάτω από 45%. Ρώτα και σώπασε.',
    });
  }

  if (!metrics.closeAttempted) {
    score -= 1;
    weaknesses.push({
      title: 'Δεν ζήτησες τίποτα',
      detail: 'Δεν υπήρξε καμία προσπάθεια για ραντεβού ή επόμενο βήμα.',
      fix: 'Κλείσε με συγκεκριμένη πρόταση: «Δέκα λεπτά την Τρίτη στις 11;»',
    });
  }

  if (metrics.objectionsUnanswered.length) {
    score -= 1;
    weaknesses.push({
      title: 'Αναπάντητες αντιρρήσεις',
      detail: `Έμειναν χωρίς ουσιαστική απάντηση: ${metrics.objectionsUnanswered.join(', ')}.`,
      fix: 'Αναγνώρισε την αντίρρηση, ρώτα διευκρινιστικά και απάντησε με συγκεκριμένο παράδειγμα.',
    });
  }

  if (metrics.repeatedSelf > 0) {
    score -= 0.5;
    weaknesses.push({
      title: 'Επανέλαβες τον εαυτό σου',
      detail: `${metrics.repeatedSelf} φορές είπες σχεδόν το ίδιο πράγμα με άλλα λόγια.`,
      fix: 'Όταν δεν περνάει το επιχείρημα, άλλαξε γωνία — μην το ξαναλές πιο δυνατά.',
    });
  }

  if (outcome === 'hangup') score = Math.min(score, 4);
  score = Math.max(0, Math.min(10, Math.round(score * 2) / 2));

  const strengths = [];
  if (metrics.questionsAsked >= 3) strengths.push('Έκανες ερωτήσεις αντί να απαγγείλεις.');
  if (metrics.talkRatio <= 0.5) strengths.push('Κράτησες ισορροπία στον χρόνο ομιλίας.');
  if (metrics.closeAttempted) strengths.push('Ζήτησες επόμενο βήμα.');

  return {
    score,
    headline: outcome === 'hangup'
      ? 'Σου έκλεισε το τηλέφωνο — η κλήση χάθηκε πριν φτάσεις στην ουσία.'
      : 'Αυτόματη αξιολόγηση χωρίς μοντέλο (πρόχειρη λειτουργία).',
    subscores: {
      discovery: clamp(metrics.questionsAsked * 2),
      objections: clamp(10 - metrics.objectionsUnanswered.length * 3),
      tonality: clamp(10 - metrics.fillerCount),
      control: clamp(10 - Math.round(metrics.talkRatio * 10)),
      closing: metrics.closeAttempted ? 7 : 1,
    },
    weaknesses: weaknesses.slice(0, 5),
    strengths,
    drill: 'Κάνε την επόμενη κλήση με έναν κανόνα: δεν λες τίποτα για εσένα πριν κάνεις δύο ερωτήσεις.',
    verdict: score >= 7 ? 'οριακό' : 'χαμένη κλήση',
    offline: true,
  };
}

const clamp = (n) => Math.max(0, Math.min(10, Math.round(n)));
