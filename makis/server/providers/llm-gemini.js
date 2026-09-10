// Gemini via Google AI Studio. Free tier, no credit card, best Greek of the
// free models — which matters both for staying in character and for coaching.

import { config } from '../config.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * @param {{system: string, messages: {role: 'user'|'assistant', content: string}[],
 *          json?: boolean, temperature?: number, maxTokens?: number}} opts
 */
export async function chat({ system, messages, json = true, temperature = 0.9, maxTokens = 700 }) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const url = `${BASE}/models/${config.llm.geminiModel}:generateContent?key=${config.llm.geminiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text) throw new Error('Gemini returned no text (blocked or empty candidate)');
  return text;
}

export async function listModels() {
  const res = await fetch(`${BASE}/models?key=${config.llm.geminiKey}`);
  if (!res.ok) throw new Error(`Gemini models ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''));
}
