// `npm run doctor` — checks every key you have configured and says, in plain
// Greek and English, what works and what does not. Run this before your first call.

import { config } from '../server/config.js';
import * as gemini from '../server/providers/llm-gemini.js';
import * as ttsGoogle from '../server/providers/tts-google.js';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[90m·\x1b[0m ${m}`);

console.log('\nMAKIS — έλεγχος ρυθμίσεων\n');

// ── STT ──────────────────────────────────────────────────────────────
console.log('ΑΚΟΗ (speech-to-text)');
if (config.stt.provider === 'groq') {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${config.stt.groqKey}` },
    });
    if (res.ok) ok(`Groq συνδέθηκε · μοντέλο ${config.stt.groqModel}`);
    else bad(`Groq απάντησε ${res.status}. Έλεγξε το GROQ_API_KEY.`);
  } catch (err) {
    bad(`Δεν έγινε σύνδεση στο Groq: ${err.message}`);
  }
} else {
  info('Χωρίς κλειδί Groq — θα χρησιμοποιηθεί η αναγνώριση φωνής του browser (μόνο Chrome/Edge).');
}

// ── LLM ──────────────────────────────────────────────────────────────
console.log('\nΜΥΑΛΟ (LLM)');
if (config.llm.provider === 'gemini') {
  try {
    const models = await gemini.listModels();
    const wanted = config.llm.geminiModel;
    if (models.some((m) => m === wanted || m.startsWith(wanted))) {
      ok(`Gemini συνδέθηκε · μοντέλο ${wanted}`);
    } else {
      bad(`Το μοντέλο "${wanted}" δεν είναι διαθέσιμο με αυτό το κλειδί.`);
      info(`Διαθέσιμα: ${models.slice(0, 6).join(', ')}${models.length > 6 ? '…' : ''}`);
      info('Άλλαξε το GEMINI_MODEL στο .env σε ένα από τα παραπάνω.');
    }
  } catch (err) {
    bad(`Gemini: ${err.message}`);
  }
} else if (config.llm.provider === 'groq') {
  ok(`Groq LLM · μοντέλο ${config.llm.groqModel}`);
} else {
  bad('Κανένα κλειδί LLM — ο Μάκης θα απαντάει από σενάριο (πρόχειρη λειτουργία).');
  info('Πάρε δωρεάν κλειδί: https://aistudio.google.com/apikey → GEMINI_API_KEY στο .env');
}

// ── TTS ──────────────────────────────────────────────────────────────
console.log('\nΦΩΝΗ (text-to-speech)');
if (config.tts.provider === 'google') {
  try {
    const voices = await ttsGoogle.listGreekVoices();
    const chosen = voices.find((v) => v.name === config.tts.googleVoice);
    if (chosen) ok(`Google TTS συνδέθηκε · φωνή ${chosen.name} (${chosen.tier})`);
    else {
      bad(`Η φωνή "${config.tts.googleVoice}" δεν υπάρχει για el-GR.`);
      info(`Δοκίμασε: ${voices.filter((v) => v.tier === 'Chirp 3 HD').slice(0, 4).map((v) => v.name).join(', ') || voices.slice(0, 4).map((v) => v.name).join(', ')}`);
      info('Τρέξε `npm run voices` για να τις ακούσεις.');
    }
  } catch (err) {
    bad(`Google TTS: ${err.message}`);
    info('Βεβαιώσου ότι ενεργοποίησες το "Cloud Text-to-Speech API" στο project σου.');
  }
} else if (config.tts.provider === 'elevenlabs') {
  ok(`ElevenLabs · φωνή ${config.tts.elevenVoice || '(δεν έχει οριστεί ELEVENLABS_VOICE_ID)'}`);
} else {
  info('Χωρίς κλειδί TTS — θα μιλάει η φωνή του browser (ρομποτική αλλά λειτουργική).');
}

console.log('\nΈτοιμο. Ξεκίνα με: npm start\n');
