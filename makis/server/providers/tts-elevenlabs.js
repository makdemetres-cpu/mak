// ElevenLabs — the most human Greek voice, but the free plan is ~10 minutes
// of speech per month. Here as a one-line upgrade path, not as the default.

import { config } from '../config.js';

export async function synthesize(text) {
  const voice = config.tts.elevenVoice;
  if (!voice) throw new Error('ELEVENLABS_VOICE_ID is not set');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.tts.elevenKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: config.tts.elevenModel,
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35 },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return { audio: Buffer.from(await res.arrayBuffer()), mime: 'audio/mpeg' };
}

export async function listVoices() {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': config.tts.elevenKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices ${res.status}`);
  const data = await res.json();
  return (data.voices ?? []).map((v) => ({ id: v.voice_id, name: v.name }));
}
