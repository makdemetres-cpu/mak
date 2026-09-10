// Facts about the call, computed in code. The coach model gets these as given
// truth so "μίλησες το 78% της κλήσης" is measured, not guessed.

const QUESTION_MARKS = /[;?]/g;

const VALUE_WORDS = [
  'πελάτ', 'τζίρο', 'κρατήσ', 'παραγγελ', 'ραντεβού', 'google', 'κινητό',
  'ανταγωνισ', 'χάνετε', 'κερδίσ', 'αυξήσ', 'έσοδα', 'προμήθει',
];

const CLOSE_WORDS = [
  'ραντεβού', 'να τα πούμε', 'να περάσω', 'να συναντηθ', 'δευτέρα', 'τρίτη',
  'τετάρτη', 'πέμπτη', 'παρασκευή', 'να κλείσουμε', 'να ξεκινήσουμε',
  'σας στείλω πρόταση', 'προσφορά', 'να κανονίσουμε',
];

const FILLERS = ['εεε', 'εε ', 'ααα', 'βασικά', 'λοιπόν', 'κάπως', 'ας πούμε', 'ουσιαστικά'];

const norm = (s) => (s ?? '').toLowerCase();

export function computeMetrics(turns, { startedAt, endedAt, objectionsRaised = [] }) {
  const user = turns.filter((t) => t.speaker === 'user');
  const makis = turns.filter((t) => t.speaker === 'makis');

  const userMs = sum(user.map((t) => t.durationMs || estimateMs(t.text)));
  const makisMs = sum(makis.map((t) => t.durationMs || estimateMs(t.text)));
  const speakingMs = userMs + makisMs;
  const callMs = Math.max(0, (endedAt ?? Date.now()) - startedAt);

  const userWords = sum(user.map((t) => words(t.text)));
  const questions = sum(user.map((t) => (t.text.match(QUESTION_MARKS) ?? []).length));
  const longestMonologueMs = Math.max(0, ...user.map((t) => t.durationMs || estimateMs(t.text)));

  const firstValueTurn = user.findIndex((t) => VALUE_WORDS.some((w) => norm(t.text).includes(w)));
  const closeAttempted = user.some((t) => CLOSE_WORDS.some((w) => norm(t.text).includes(w)));
  const fillers = sum(user.map((t) => FILLERS.filter((f) => norm(t.text).includes(f)).length));

  return {
    callMs,
    userMs,
    makisMs,
    // Share of actual speech that was yours. Above ~0.65 on a cold call is a problem.
    talkRatio: speakingMs ? round2(userMs / speakingMs) : 0,
    turns: turns.length,
    userTurns: user.length,
    userWords,
    avgWordsPerTurn: user.length ? Math.round(userWords / user.length) : 0,
    questionsAsked: questions,
    longestMonologueMs,
    firstValueTurn: firstValueTurn === -1 ? null : firstValueTurn + 1,
    closeAttempted,
    fillerCount: fillers,
    objectionsRaised,
    objectionsUnanswered: unansweredObjections(turns, objectionsRaised),
    repeatedSelf: repeatedSelf(user),
  };
}

/** An objection counts as handled only if the very next thing you said was substantive. */
function unansweredObjections(turns, objectionsRaised) {
  const unanswered = [];
  for (let i = 0; i < turns.length; i += 1) {
    const t = turns[i];
    if (t.speaker !== 'makis' || !t.objection) continue;
    const next = turns[i + 1];
    const substantive = next && next.speaker === 'user' && words(next.text) >= 12;
    if (!substantive) unanswered.push(t.objection);
  }
  // Objections tracked on the session but never followed by a user turn at all.
  return unanswered.length ? unanswered : objectionsRaised.filter((o) => !o.answered).map((o) => o.label ?? o);
}

/** Near-identical consecutive pitches — the classic sign of pushing instead of selling. */
function repeatedSelf(user) {
  let repeats = 0;
  for (let i = 1; i < user.length; i += 1) {
    const a = new Set(tokens(user[i - 1].text));
    const b = tokens(user[i].text);
    if (b.length < 6) continue;
    const overlap = b.filter((w) => a.has(w)).length / b.length;
    if (overlap > 0.6) repeats += 1;
  }
  return repeats;
}

const tokens = (s) => norm(s).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3);
const words = (s) => (s ?? '').trim().split(/\s+/).filter(Boolean).length;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const round2 = (n) => Math.round(n * 100) / 100;
// ~150 words per minute when a turn has no recorded audio duration.
const estimateMs = (text) => Math.round((words(text) / 150) * 60_000);

export function formatMetrics(m) {
  return [
    `Διάρκεια κλήσης: ${(m.callMs / 1000).toFixed(0)} δευτερόλεπτα`,
    `Πόσο μίλησε ο πωλητής σε σχέση με τον Μάκη: ${(m.talkRatio * 100).toFixed(0)}%`,
    `Γύροι πωλητή: ${m.userTurns}, μέσος όρος λέξεων ανά γύρο: ${m.avgWordsPerTurn}`,
    `Ερωτήσεις που έκανε ο πωλητής: ${m.questionsAsked}`,
    `Μεγαλύτερος αδιάκοπος μονόλογος: ${(m.longestMonologueMs / 1000).toFixed(0)} δευτ.`,
    `Γύρος στον οποίο πρωτοανέφερε όφελος για την επιχείρηση: ${m.firstValueTurn ?? 'ΠΟΤΕ'}`,
    `Προσπάθησε κλείσιμο/ραντεβού: ${m.closeAttempted ? 'ΝΑΙ' : 'ΟΧΙ'}`,
    `Επαναλήψεις του ίδιου επιχειρήματος: ${m.repeatedSelf}`,
    `Κομπιάσματα/παρεμβλήματα: ${m.fillerCount}`,
    `Αντιρρήσεις που έμειναν αναπάντητες: ${m.objectionsUnanswered.length ? m.objectionsUnanswered.join(', ') : 'καμία'}`,
  ].join('\n');
}
