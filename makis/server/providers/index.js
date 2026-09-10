// One facade over every provider, so routes never care who is answering.
// Every path degrades instead of dying: a dead TTS key means the browser
// speaks the same Greek text, a missing LLM key means rehearsal mode.

import { config } from '../config.js';
import * as sttGroq from './stt-groq.js';
import * as llmGemini from './llm-gemini.js';
import * as llmGroq from './llm-groq.js';
import * as ttsGoogle from './tts-google.js';
import * as ttsGemini from './tts-gemini.js';
import * as ttsEleven from './tts-elevenlabs.js';
import { offlineReply } from './offline-brain.js';

export async function transcribe(audio, mimeType) {
  if (config.stt.provider !== 'groq') {
    throw new Error('Server-side STT is disabled (STT_PROVIDER=browser)');
  }
  return sttGroq.transcribe(audio, mimeType);
}

async function rawChat(opts) {
  if (config.llm.provider === 'gemini') return llmGemini.chat(opts);
  if (config.llm.provider === 'groq') return llmGroq.chat(opts);
  throw new Error('offline');
}

/** Pull a JSON object out of a model response that may be fenced or chatty. */
export function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    throw new Error(`Model did not return JSON: ${cleaned.slice(0, 200)}`);
  }
}

const GREEK = /[Ͱ-Ͽἀ-῿]/;

/** Ask MAKIS for his next line. Falls back to rehearsal mode if there is no brain. */
export async function askMakis({ system, messages, state, scenario }) {
  if (config.llm.provider === 'offline') {
    return { ...offlineReply({ state, scenario }), degraded: true };
  }

  let text = await rawChat({ system, messages, json: true, temperature: 0.95 });
  let reply = parseJson(text);

  // He is never allowed to answer in English, whatever the salesperson does.
  if (reply.say && !GREEK.test(reply.say)) {
    text = await rawChat({
      system,
      messages: [
        ...messages,
        { role: 'assistant', content: JSON.stringify(reply) },
        { role: 'user', content: 'ΛΑΘΟΣ: απάντησες εκτός ελληνικών. Ξαναγράψε το ίδιο JSON με το "say" ΜΟΝΟ στα ελληνικά.' },
      ],
      json: true,
      temperature: 0.7,
    });
    reply = parseJson(text);
  }

  return {
    say: String(reply.say ?? '').trim(),
    mood: reply.mood ?? 'neutral',
    objection: reply.objection ?? null,
    patienceDelta: Number(reply.patience_delta ?? 0),
    trustDelta: Number(reply.trust_delta ?? 0),
    wantsHangup: Boolean(reply.wants_to_hang_up),
  };
}

/** Coach mode uses the same brain, cooler and longer. */
export async function askCoach({ system, prompt }) {
  const text = await rawChat({
    system,
    messages: [{ role: 'user', content: prompt }],
    json: true,
    temperature: 0.3,
    maxTokens: 1600,
  });
  return parseJson(text);
}

/**
 * Speak one line. Returns null when the browser should do the talking —
 * either because that is the configured provider or because the real one failed.
 */
export async function speak(text) {
  if (!text?.trim()) return null;
  if (config.tts.provider === 'browser') return null;
  try {
    if (config.tts.provider === 'google') return await ttsGoogle.synthesize(text);
    if (config.tts.provider === 'gemini') return await ttsGemini.synthesize(text);
    if (config.tts.provider === 'elevenlabs') return await ttsEleven.synthesize(text);
  } catch (err) {
    // Quota exhausted, bad key, network — the call carries on with a lesser voice.
    console.warn(`[tts] ${config.tts.provider} failed, falling back to browser voice: ${err.message}`);
    return null;
  }
  return null;
}

export const health = {
  stt: config.stt.provider,
  llm: config.llm.provider,
  tts: config.tts.provider,
};
