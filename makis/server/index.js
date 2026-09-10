// MAKIS — server entry point. Routes, static files, and the call lifecycle.

import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { config, clientConfig, ROOT } from './config.js';
import { sendJson, readBody, readJson, serveStatic, openStream } from './http.js';
import * as call from './routes/call.js';
import * as history from './routes/history.js';
import { DIFFICULTIES } from './persona/difficulty.js';
import { SCENARIOS } from './persona/makis.js';

const PUBLIC_DIR = resolve(ROOT, 'public');

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  try {
    // ── API ──────────────────────────────────────────────────────────────
    if (path === '/api/config' && req.method === 'GET') {
      return sendJson(res, 200, {
        ...clientConfig(),
        difficulties: Object.values(DIFFICULTIES).map((d) => ({ id: d.id, label: d.label })),
        scenarios: Object.values(SCENARIOS).map((s) => ({ id: s.id, label: s.label })),
      });
    }

    if (path === '/api/call' && req.method === 'POST') {
      const body = await readJson(req);
      return sendJson(res, 200, await call.startCall(body));
    }

    const turnMatch = path.match(/^\/api\/call\/([\w-]+)\/turn$/);
    if (turnMatch && req.method === 'POST') {
      const session = call.getLive(turnMatch[1]);
      if (!session) return sendJson(res, 404, { error: 'Η κλήση δεν βρέθηκε ή έχει τερματιστεί.' });

      const contentType = req.headers['content-type'] ?? '';
      const durationMs = Number(url.searchParams.get('duration') ?? 0);
      let payload;
      if (contentType.startsWith('application/json')) {
        const body = await readJson(req);
        payload = { text: body.text, durationMs: body.durationMs ?? durationMs };
      } else {
        payload = { audio: await readBody(req), mimeType: contentType || 'audio/webm', durationMs };
      }

      const stream = openStream(res);
      try {
        await call.handleTurn(session, payload, stream);
      } catch (err) {
        console.error('[turn]', err);
        stream.send('error', { message: friendly(err) });
      }
      return stream.close();
    }

    const endMatch = path.match(/^\/api\/call\/([\w-]+)\/end$/);
    if (endMatch && req.method === 'POST') {
      const session = call.getLive(endMatch[1]);
      if (!session) return sendJson(res, 404, { error: 'Η κλήση δεν βρέθηκε.' });
      const body = await readJson(req);
      return sendJson(res, 200, await call.endCall(session, body.reason ?? 'ended'));
    }

    if (path === '/api/sessions' && req.method === 'GET') {
      return sendJson(res, 200, history.list());
    }

    const sessionMatch = path.match(/^\/api\/sessions\/([\w-]+)$/);
    if (sessionMatch && req.method === 'GET') {
      const detail = history.detail(sessionMatch[1]);
      return detail
        ? sendJson(res, 200, detail)
        : sendJson(res, 404, { error: 'Δεν βρέθηκε.' });
    }
    if (sessionMatch && req.method === 'DELETE') {
      history.remove(sessionMatch[1]);
      return sendJson(res, 200, { ok: true });
    }

    const audioMatch = path.match(/^\/api\/sessions\/([\w-]+)\/audio\/([\w.-]+)$/);
    if (audioMatch && req.method === 'GET') {
      if (history.recording(res, audioMatch[1], audioMatch[2])) return undefined;
      return sendJson(res, 404, { error: 'Δεν βρέθηκε ηχογράφηση.' });
    }

    // ── Static ───────────────────────────────────────────────────────────
    if (req.method === 'GET' && serveStatic(res, PUBLIC_DIR, path)) return undefined;

    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[server]', err);
    if (!res.headersSent) return sendJson(res, 500, { error: friendly(err) });
    return res.end();
  }
});

/** Turn provider failures into something a Greek-speaking human can act on. */
function friendly(err) {
  const message = err?.message ?? String(err);
  if (message.includes('Groq STT 401') || message.includes('Groq LLM 401')) {
    return 'Το κλειδί του Groq δεν έγινε δεκτό. Έλεγξε το GROQ_API_KEY στο .env.';
  }
  if (message.includes('Gemini 400') && message.includes('API key')) {
    return 'Το κλειδί του Gemini δεν έγινε δεκτό. Έλεγξε το GEMINI_API_KEY στο .env.';
  }
  if (message.includes('429')) {
    return 'Ξεπεράστηκε το δωρεάν όριο του παρόχου. Δοκίμασε ξανά σε λίγο ή άλλαξε πάροχο στο .env.';
  }
  return message;
}

server.listen(config.port, () => {
  const line = (label, value) => `  ${label.padEnd(16)} ${value}`;
  console.log('\n  MAKIS — προπόνηση ψυχρής κλήσης');
  console.log(line('STT', config.stt.provider === 'groq' ? `Groq ${config.stt.groqModel}` : 'browser (Web Speech API)'));
  console.log(line('LLM', config.llm.provider === 'gemini' ? `Gemini ${config.llm.geminiModel}`
    : config.llm.provider === 'groq' ? `Groq ${config.llm.groqModel}`
    : 'ΚΑΝΕΝΑ — πρόχειρη λειτουργία (δες README)'));
  console.log(line('TTS', config.tts.provider === 'google' ? `Google ${config.tts.googleVoice}`
    : config.tts.provider === 'elevenlabs' ? 'ElevenLabs'
    : 'browser (speechSynthesis)'));
  console.log(`\n  → http://localhost:${config.port}\n`);
});
