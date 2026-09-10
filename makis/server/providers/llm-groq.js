// Groq's OpenAI-compatible chat endpoint — the backup brain, and the reason
// a single Groq key can run this app on its own if Gemini quota runs out.

import { config } from '../config.js';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export async function chat({ system, messages, json = true, temperature = 0.9, maxTokens = 700 }) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.llm.groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.llm.groqModel,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq LLM ${res.status}: ${(await res.text()).slice(0, 400)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq LLM returned no content');
  return text;
}
