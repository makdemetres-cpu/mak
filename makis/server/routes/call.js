// The call itself: pick up, take a turn, hang up, get graded.

import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '../config.js';
import { concatAudio } from '../audio.js';
import * as db from '../db.js';
import * as providers from '../providers/index.js';
import { getDifficulty, applyDeltas, shouldHangUp, DEFAULT_DIFFICULTY } from '../persona/difficulty.js';
import { pickScenario, pickupLine, systemPrompt, toModelHistory } from '../persona/makis.js';
import { computeMetrics } from '../coach/metrics.js';
import { COACH_SYSTEM, coachPrompt, fallbackReport } from '../coach/rubric.js';

/** Live calls. A call is in memory while it runs, in SQLite once it ends. */
const live = new Map();

export function getLive(id) {
  return live.get(id);
}

export async function startCall({ difficulty = DEFAULT_DIFFICULTY, scenario: wanted } = {}) {
  const profile = getDifficulty(difficulty);
  const scenario = pickScenario(wanted);
  const id = randomUUID();

  const session = {
    id,
    scenario,
    profile,
    startedAt: Date.now(),
    idx: 0,
    turns: [],
    state: {
      patience: profile.patience,
      trust: profile.trust,
      turnCount: 0,
      objectionsRaised: [],
      lastUserText: '',
    },
  };
  live.set(id, session);
  mkdirSync(join(config.recordingsDir, id), { recursive: true });
  db.createSession({ id, difficulty: profile.id, scenario: scenario.id });

  // He picks up the phone the way a busy person picks up the phone.
  const line = pickupLine(scenario);
  const audio = await providers.speak(line);
  const file = audio ? saveAudio(id, `m-${session.idx}`, audio) : null;
  recordTurn(session, { speaker: 'makis', text: line, durationMs: 0, audioFile: file });

  return {
    sessionId: id,
    difficulty: profile.id,
    difficultyLabel: profile.label,
    scenario: { id: scenario.id, label: scenario.label, business: scenario.business, city: scenario.city },
    pickup: {
      text: line,
      audio: audio ? audio.audio.toString('base64') : null,
      mime: audio?.mime ?? null,
    },
    state: publicState(session),
  };
}

/**
 * One exchange: your audio in, his answer out, streamed so the first sentence
 * starts playing while the rest is still being synthesised.
 */
export async function handleTurn(session, { audio, mimeType, text, durationMs = 0 }, stream) {
  // Once he has hung up, the line is dead — nothing more goes through it.
  if (session.hangup) {
    stream.send('hangup', { reason: 'already-ended' });
    return;
  }

  // 1. What did you actually say?
  let userText = (text ?? '').trim();
  if (!userText && audio?.length) {
    userText = await providers.transcribe(audio, mimeType);
  }
  if (!userText) {
    stream.send('empty', { message: 'Δεν ακούστηκε τίποτα.' });
    return;
  }

  const userFile = audio?.length ? saveAudio(session.id, `u-${session.idx}`, { audio, mime: mimeType }) : null;
  recordTurn(session, { speaker: 'user', text: userText, durationMs, audioFile: userFile });
  session.state.lastUserText = userText;
  session.state.turnCount += 1;
  stream.send('transcript', { speaker: 'user', text: userText });

  // 2. What does he make of it?
  const system = systemPrompt({ scenario: session.scenario, profile: session.profile, state: session.state });
  const reply = await providers.askMakis({
    system,
    messages: toModelHistory(session.turns).slice(-16),
    state: session.state,
    scenario: session.scenario,
  });

  // 3. The server, not the model, decides how much ground he gives.
  session.state = {
    ...applyDeltas(session.state, { patienceDelta: reply.patienceDelta, trustDelta: reply.trustDelta }, session.profile),
    turnCount: session.state.turnCount,
    objectionsRaised: reply.objection
      ? [...new Set([...session.state.objectionsRaised, reply.objection])]
      : session.state.objectionsRaised,
    lastUserText: userText,
  };

  const hangup = shouldHangUp(session.state, session.profile, reply.wantsHangup);
  const say = hangup ? withGoodbye(reply.say) : reply.say;

  stream.send('reply', { text: say, mood: reply.mood });
  stream.send('state', publicState(session));

  // 4. Speak it, sentence by sentence, so the wait is short.
  const chunks = chunkForSpeech(say);
  const parts = [];
  let spokenMime = 'audio/mpeg';
  for (let i = 0; i < chunks.length; i += 1) {
    const spoken = await providers.speak(chunks[i]);
    if (spoken) {
      parts.push(spoken.audio);
      spokenMime = spoken.mime;
      stream.send('audio', { index: i, mime: spoken.mime, data: spoken.audio.toString('base64') });
    } else {
      // No server voice available — the browser says this piece out loud.
      stream.send('speak', { index: i, text: chunks[i] });
    }
  }

  const file = parts.length ? saveAudio(session.id, `m-${session.idx}`, { audio: concatAudio(parts, spokenMime), mime: spokenMime }) : null;
  recordTurn(session, { speaker: 'makis', text: say, durationMs: 0, audioFile: file, objection: reply.objection });

  if (hangup) {
    session.hangup = true;
    stream.send('hangup', { reason: 'patience' });
  }
  if (reply.degraded) stream.send('degraded', { message: 'Πρόχειρη λειτουργία: δεν υπάρχει κλειδί LLM.' });
}

export async function endCall(session, reason = 'ended') {
  live.delete(session.id);
  const outcome = session.hangup ? 'hangup' : reason;
  const endedAt = Date.now();

  const metrics = computeMetrics(session.turns, {
    startedAt: session.startedAt,
    endedAt,
    objectionsRaised: session.state.objectionsRaised,
  });

  let report;
  try {
    if (config.llm.provider === 'offline') throw new Error('offline');
    report = await providers.askCoach({
      system: COACH_SYSTEM,
      prompt: coachPrompt({
        scenario: session.scenario,
        difficulty: session.profile.label,
        outcome,
        turns: session.turns,
        metrics,
      }),
    });
    report = normalizeReport(report, metrics, outcome);
  } catch (err) {
    if (err.message !== 'offline') console.warn(`[coach] falling back to local scoring: ${err.message}`);
    report = fallbackReport({ metrics, outcome });
  }

  db.finishSession({ id: session.id, outcome, score: report.score, report, metrics });

  return {
    sessionId: session.id,
    outcome,
    score: report.score,
    report,
    metrics,
    scenario: session.scenario,
    difficulty: session.profile.label,
  };
}

/** Keep the model honest about its own scoring caps. */
function normalizeReport(report, metrics, outcome) {
  let score = Number(report.score);
  if (!Number.isFinite(score)) score = 5;
  if (outcome === 'hangup') score = Math.min(score, 5);
  if (metrics.questionsAsked === 0) score = Math.min(score, 4);
  if (!metrics.closeAttempted) score = Math.min(score, 7);
  return {
    ...report,
    score: Math.max(0, Math.min(10, Math.round(score * 2) / 2)),
    weaknesses: Array.isArray(report.weaknesses) ? report.weaknesses.slice(0, 5) : [],
    strengths: Array.isArray(report.strengths) ? report.strengths.slice(0, 3) : [],
  };
}

function recordTurn(session, turn) {
  const idx = session.idx;
  session.turns.push({ ...turn, idx });
  db.addTurn({ sessionId: session.id, idx, ...turn });
  session.idx += 1;
}

const EXT_BY_MIME = { webm: 'webm', wav: 'wav', ogg: 'ogg', mp4: 'm4a' };

function saveAudio(sessionId, name, { audio, mime }) {
  const ext = Object.entries(EXT_BY_MIME).find(([key]) => mime?.includes(key))?.[1] ?? 'mp3';
  const file = `${name}.${ext}`;
  writeFileSync(join(config.recordingsDir, sessionId, file), audio);
  return file;
}

function publicState(session) {
  return {
    patience: session.state.patience,
    patienceMax: session.profile.patience,
    trust: session.state.trust,
    turnCount: session.state.turnCount,
  };
}

const GOODBYES = ['Γεια σας.', 'Καλή συνέχεια.', 'Ευχαριστώ, γεια σας.'];

function withGoodbye(say) {
  const text = (say ?? '').trim();
  if (/(γεια σας|καλή συνέχεια|γεια σου)\s*\.?$/i.test(text)) return text;
  return `${text} ${GOODBYES[Math.floor(Math.random() * GOODBYES.length)]}`.trim();
}

/**
 * Split a reply into speakable pieces. The first piece is deliberately short so
 * audio starts fast; the rest are merged to avoid choppy delivery.
 */
export function chunkForSpeech(text, { firstMax = 90, restMax = 220 } = {}) {
  const sentences = (text ?? '')
    .split(/(?<=[.!;…?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sentences.length) return [];

  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const limit = chunks.length === 0 ? firstMax : restMax;
    if (!current) {
      current = sentence;
    } else if ((current + ' ' + sentence).length <= limit) {
      current += ' ' + sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
