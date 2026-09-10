// Speech to text via Groq's hosted Whisper. Free tier, no credit card,
// and Whisper large-v3 is the strongest Greek transcription available anywhere.

import { config } from '../config.js';

const ENDPOINT = 'https://api.groq.com/openai/v1/audio/transcriptions';

export async function transcribe(audio, mimeType = 'audio/webm') {
  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType }), 'turn.webm');
  form.append('model', config.stt.groqModel);
  form.append('language', 'el');
  form.append('response_format', 'json');
  // Nudges Whisper towards the vocabulary of this specific call.
  form.append('prompt', 'Τηλεφωνική συνομιλία στα ελληνικά για κατασκευή ιστοσελίδων, συντήρηση site, SEO, Google, πελάτες, τιμή, συνδρομή.');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.stt.groqKey}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Groq STT ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.text ?? '').trim();
}
