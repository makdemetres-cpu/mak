// Environment loading and provider selection.
// No dotenv dependency — .env is a trivial format and this app ships zero deps.

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const path = resolve(ROOT, '.env');
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const env = (key, fallback = '') => (process.env[key] ?? fallback).trim();

// A provider is only "configured" if the key it needs is actually present.
// Anything missing degrades to browser mode instead of throwing at call time.
const groqKey = env('GROQ_API_KEY');
const geminiKey = env('GEMINI_API_KEY');
const googleTtsKey = env('GOOGLE_TTS_API_KEY');
const elevenKey = env('ELEVENLABS_API_KEY');

function pick(requested, available, fallback) {
  return available.includes(requested) ? requested : fallback;
}

const sttAvailable = ['browser', ...(groqKey ? ['groq'] : [])];
const llmAvailable = [
  ...(geminiKey ? ['gemini'] : []),
  ...(groqKey ? ['groq'] : []),
];
const ttsAvailable = [
  'browser',
  ...(googleTtsKey ? ['google'] : []),
  ...(geminiKey ? ['gemini'] : []),
  ...(elevenKey ? ['elevenlabs'] : []),
];

export const config = {
  port: Number(env('PORT', '3000')),
  dataDir: resolve(ROOT, 'data'),
  recordingsDir: resolve(ROOT, 'data', 'recordings'),
  dbPath: resolve(ROOT, 'data', 'makis.db'),

  stt: {
    provider: pick(env('STT_PROVIDER', 'groq'), sttAvailable, 'browser'),
    groqKey,
    groqModel: env('GROQ_STT_MODEL', 'whisper-large-v3-turbo'),
  },
  llm: {
    // No LLM key at all means no reasoning: the app runs in rehearsal mode
    // with a scripted-but-stateful MAKIS so the UI is still explorable.
    provider: pick(env('LLM_PROVIDER', 'gemini'), llmAvailable, llmAvailable[0] ?? 'offline'),
    geminiKey,
    geminiModel: env('GEMINI_MODEL', 'gemini-flash-latest'),
    groqKey,
    groqModel: env('GROQ_LLM_MODEL', 'llama-3.3-70b-versatile'),
  },
  tts: {
    // No Google Cloud key but a Gemini key present? Speak with Gemini rather
    // than dropping to the browser voice.
    provider: pick(
      env('TTS_PROVIDER', 'google'),
      ttsAvailable,
      geminiKey ? 'gemini' : 'browser'
    ),
    googleKey: googleTtsKey,
    googleVoice: env('GOOGLE_TTS_VOICE', 'el-GR-Chirp3-HD-Charon'),
    googleRate: Number(env('GOOGLE_TTS_SPEAKING_RATE', '1.0')),
    geminiKey,
    geminiModel: env('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts'),
    geminiVoice: env('GEMINI_TTS_VOICE', 'Charon'),
    geminiStyle: env('GEMINI_TTS_STYLE', 'Πες το με βαριεστημένη, βιαστική φωνή ενός μεσήλικα Έλληνα καταστηματάρχη στο τηλέφωνο'),
    elevenKey,
    elevenVoice: env('ELEVENLABS_VOICE_ID', ''),
    elevenModel: env('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
  },
};

mkdirSync(config.dataDir, { recursive: true });
mkdirSync(config.recordingsDir, { recursive: true });

/** What the browser needs to know about how this server is wired. */
export function clientConfig() {
  return {
    stt: config.stt.provider,
    llm: config.llm.provider,
    tts: config.tts.provider,
    // Browser STT means the mic never leaves the machine and we need
    // the Web Speech API instead of uploading audio.
    browserSpeech: config.stt.provider === 'browser',
    browserVoice: config.tts.provider === 'browser',
    degraded: config.llm.provider === 'offline',
  };
}
