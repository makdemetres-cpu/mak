// `npm run voices` — lists every Greek voice your key can use and records a
// sample of each, so MAKIS's voice is chosen by ear rather than by guesswork.
//
//   npm run voices           list the voices
//   npm run voices -- --demo record a sample of each Chirp 3 HD voice

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { config, ROOT } from '../server/config.js';
import { listGreekVoices } from '../server/providers/tts-google.js';

const SAMPLE = 'Ναι, λέγετε. Κοιτάξτε, έχω δουλειά τώρα, πείτε μου γρήγορα τι θέλετε.';
const OUT = join(ROOT, 'data', 'voice-samples');

if (!config.tts.googleKey) {
  console.error('\nΔεν υπάρχει GOOGLE_TTS_API_KEY στο .env — δες το README (βήμα 3).\n');
  process.exit(1);
}

const voices = await listGreekVoices();
const hd = voices.filter((v) => v.tier === 'Chirp 3 HD');

console.log(`\nΕλληνικές φωνές διαθέσιμες με αυτό το κλειδί: ${voices.length}\n`);
for (const v of voices) {
  const marker = v.name === config.tts.googleVoice ? ' \x1b[32m← τρέχουσα\x1b[0m' : '';
  console.log(`  ${v.name.padEnd(30)} ${v.tier.padEnd(11)} ${v.gender}${marker}`);
}

if (!process.argv.includes('--demo')) {
  console.log('\nΓια δείγματα ήχου:  npm run voices -- --demo\n');
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
const targets = (hd.length ? hd : voices).slice(0, 12);
console.log(`\nΗχογράφηση δείγματος για ${targets.length} φωνές…\n`);

for (const voice of targets) {
  try {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.tts.googleKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: SAMPLE },
        voice: { languageCode: 'el-GR', name: voice.name },
        audioConfig: { audioEncoding: 'MP3', effectsProfileId: ['telephony-class-application'] },
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
    const { audioContent } = await res.json();
    const file = join(OUT, `${voice.name}.mp3`);
    writeFileSync(file, Buffer.from(audioContent, 'base64'));
    console.log(`  ✓ ${voice.name}`);
  } catch (err) {
    console.log(`  ✗ ${voice.name} — ${err.message}`);
  }
}

console.log(`\nΤα δείγματα είναι στο: ${OUT}`);
console.log('Άκουσέ τα, διάλεξε μία και βάλ\' την στο .env:  GOOGLE_TTS_VOICE=el-GR-Chirp3-HD-…\n');
