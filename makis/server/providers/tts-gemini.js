// Gemini's own speech generation, using the same free AI Studio key as the brain.
// This is the cardless path: no billing account, no Google Cloud project, no card.
// The trade-off is a tight daily quota on the preview TTS models — when it runs
// out the call falls back to the browser voice and carries on.

import { config } from '../config.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function synthesize(text) {
  const model = config.tts.geminiModel;
  const url = `${BASE}/models/${model}:generateContent?key=${config.tts.geminiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Gemini TTS takes direction in plain language, so the persona's tone
      // travels with the words instead of being flattened into neutral read.
      contents: [{ parts: [{ text: `${config.tts.geminiStyle}: ${text}` }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: config.tts.geminiVoice } },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error('Gemini TTS returned no audio');

  // It answers with raw 16-bit PCM, which no browser will play on its own.
  const pcm = Buffer.from(part.inlineData.data, 'base64');
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType ?? '')?.[1]) || 24000;
  return { audio: toWav(pcm, rate), mime: 'audio/wav' };
}

/** Wrap raw mono 16-bit PCM in a WAV header. */
function toWav(pcm, sampleRate, channels = 1, bitsPerSample = 16) {
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);          // PCM chunk size
  header.writeUInt16LE(1, 20);           // format: PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Which TTS-capable models this key can actually reach. */
export async function listTtsModels() {
  const res = await fetch(`${BASE}/models?key=${config.tts.geminiKey}`);
  if (!res.ok) throw new Error(`Gemini models ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.models ?? [])
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((name) => name.includes('tts'));
}
