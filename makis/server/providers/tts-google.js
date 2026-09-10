// Google Cloud Text-to-Speech, Chirp 3: HD Greek voices.
// 1M characters/month free — roughly 300 ten-minute calls.

import { config } from '../config.js';

const SYNTH = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const VOICES = 'https://texttospeech.googleapis.com/v1/voices';

export async function synthesize(text) {
  const res = await fetch(`${SYNTH}?key=${config.tts.googleKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'el-GR', name: config.tts.googleVoice },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: config.tts.googleRate,
        // A touch of extra presence, closer to a phone earpiece than a studio.
        effectsProfileId: ['telephony-class-application'],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Google TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  if (!data.audioContent) throw new Error('Google TTS returned no audio');
  return { audio: Buffer.from(data.audioContent, 'base64'), mime: 'audio/mpeg' };
}

export async function listGreekVoices() {
  const res = await fetch(`${VOICES}?languageCode=el-GR&key=${config.tts.googleKey}`);
  if (!res.ok) throw new Error(`Google voices ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.voices ?? []).map((v) => ({
    name: v.name,
    gender: v.ssmlGender,
    tier: v.name.includes('Chirp3-HD') ? 'Chirp 3 HD'
      : v.name.includes('Neural2') ? 'Neural2'
      : v.name.includes('Wavenet') ? 'WaveNet' : 'Standard',
  }));
}
