// Difficulty is enforced by the server, not by the model's goodwill.
// The model proposes deltas; these profiles clamp them and decide when he walks.

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'ΕΥΚΟΛΟ',
    patience: 10,
    trust: 2,
    maxTrustGain: 2,
    maxPatienceGain: 2,
    patienceFloorBeforeHangup: -4,   // effectively never hangs up first
    minTurnsBeforeHangup: 99,
    warmAt: 4,                        // trust needed before he engages properly
    dealAt: 7,                        // trust needed before a meeting is on the table
    tone: 'Είσαι επιφυλακτικός αλλά ευγενικός. Δίνεις χώρο στον πωλητή να μιλήσει.',
  },
  medium: {
    id: 'medium',
    label: 'ΜΕΤΡΙΟ',
    patience: 7,
    trust: 0,
    maxTrustGain: 1,
    maxPatienceGain: 1,
    patienceFloorBeforeHangup: -2,
    minTurnsBeforeHangup: 8,
    warmAt: 5,
    dealAt: 9,
    tone: 'Είσαι βιαστικός και καχύποπτος. Δεν χαρίζεσαι, αλλά ακούς αν σου δώσει λόγο.',
  },
  hard: {
    id: 'hard',
    label: 'ΔΥΣΚΟΛΟ',
    patience: 5,
    trust: -1,
    maxTrustGain: 1,
    maxPatienceGain: 0,               // patience never regenerates: time is one-way
    patienceFloorBeforeHangup: 0,
    minTurnsBeforeHangup: 4,
    warmAt: 6,
    dealAt: 10,
    tone: 'Είσαι εκνευρισμένος, βιαστικός και εχθρικός. Θεωρείς ότι σου χαραμίζουν τον χρόνο. Δεν δίνεις τίποτα δωρεάν.',
  },
};

export const DEFAULT_DIFFICULTY = 'hard';

export function getDifficulty(id) {
  return DIFFICULTIES[id] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
}

/**
 * Apply the model's proposed deltas under the profile's rules.
 * Gains are capped, losses are not — earning ground is hard, losing it is easy.
 */
export function applyDeltas(state, { patienceDelta = 0, trustDelta = 0 }, profile) {
  const patience = clampDelta(patienceDelta, profile.maxPatienceGain);
  const trust = clampDelta(trustDelta, profile.maxTrustGain);
  return {
    ...state,
    patience: round1(state.patience + patience),
    trust: round1(Math.max(-5, Math.min(12, state.trust + trust))),
  };
}

function clampDelta(value, maxGain) {
  const n = Number.isFinite(value) ? value : 0;
  if (n > 0) return Math.min(n, maxGain);
  return Math.max(n, -3);
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * The server decides whether the call is over — the model does not get to
 * hang up because it feels like it, nor to stay on the line out of politeness.
 */
export function shouldHangUp(state, profile, modelWantsHangup) {
  if (state.turnCount < profile.minTurnsBeforeHangup) return false;
  if (state.patience <= profile.patienceFloorBeforeHangup) return true;
  // A model-initiated hangup only lands if patience is already low.
  return Boolean(modelWantsHangup) && state.patience <= profile.patienceFloorBeforeHangup + 1;
}

/** Human-readable stance handed back to the model each turn, so he stays consistent. */
export function stanceFor(state, profile) {
  if (state.trust >= profile.dealAt) {
    return 'Έχει κερδίσει την εμπιστοσύνη σου. Μπορείς να δεχτείς ραντεβού ή να ζητήσεις συγκεκριμένη πρόταση, αλλά ρώτα ακόμα για τιμή και χρόνο.';
  }
  if (state.trust >= profile.warmAt) {
    return 'Άρχισε να σε ενδιαφέρει. Κάνεις πρακτικές ερωτήσεις (κόστος, χρόνος, τι ακριβώς περιλαμβάνει) αλλά ΔΕΝ δεσμεύεσαι.';
  }
  if (state.patience <= 1) {
    return 'Είσαι στα όριά σου. Απαντάς μονολεκτικά, λες ότι έχεις δουλειά και ετοιμάζεσαι να κλείσεις το τηλέφωνο.';
  }
  return 'Είσαι ακόμα κλειστός. Φέρνεις αντιρρήσεις, δεν δίνεις πληροφορίες για την επιχείρησή σου χωρίς λόγο, και θέλεις να τελειώνει η κλήση.';
}
