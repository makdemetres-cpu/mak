// Rehearsal mode: no API keys, no reasoning — but still stateful, still Greek,
// still hostile. Exists so the whole app (call loop, HUD, coach, history) can be
// driven end to end before you sign up for a single account.

const LINES = [
  { say: 'Ναι, κοιτάξτε, δεν με ενδιαφέρει, ευχαριστώ.', objection: 'μη ενδιαφέρον', mood: 'hostile' },
  { say: 'Ένας ανιψιός μου ξέρει από αυτά, μου το φτιάχνει τζάμπα. Γιατί να δώσω λεφτά;', objection: 'ο ανιψιός μου', mood: 'annoyed' },
  { say: 'Άσε, εγώ δουλεύω με πελατεία χρόνια. Από στόμα σε στόμα έρχονται όλοι.', objection: 'από στόμα σε στόμα', mood: 'annoyed' },
  { say: 'Και γιατί να πληρώνω κάθε μήνα; Μια φορά δεν το φτιάχνεις και τελείωσε;', objection: 'μηνιαία συνδρομή', mood: 'annoyed' },
  { say: 'Πόσο κάνει; Πες μου νούμερο, μη μου τα λες αυτά.', objection: 'τιμή', mood: 'neutral' },
  { say: 'Κοίτα, στείλε μου ένα email να το δω και σε παίρνω εγώ.', objection: 'στείλε email', mood: 'annoyed' },
  { say: 'Έχω δουλειά τώρα, δεν μπορώ να μιλάω. Τι ακριβώς θέλεις;', objection: 'δεν έχω χρόνο', mood: 'hostile' },
  { say: 'Εντάξει... και τι θα μου φέρει αυτό; Πελάτες θα μου φέρει;', objection: 'τι θα μου αποφέρει', mood: 'curious' },
];

export function offlineReply({ state }) {
  const line = LINES[Math.min(state.turnCount, LINES.length - 1)];
  const short = (state.lastUserText ?? '').trim().length < 25;
  return {
    say: line.say,
    mood: line.mood,
    objection: line.objection,
    // Even without a brain the pressure is real: waffle costs him patience.
    patienceDelta: short ? -1.5 : -1,
    trustDelta: (state.lastUserText ?? '').includes(';') ? 1 : 0,
    wantsHangup: state.turnCount >= LINES.length - 1,
  };
}
