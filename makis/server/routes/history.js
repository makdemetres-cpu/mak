// Past calls: the list, one call in full, the score curve, and deleting a run.

import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';

import { config } from '../config.js';
import * as db from '../db.js';
import { SCENARIOS } from '../persona/makis.js';

export function list() {
  const sessions = db.listSessions(100).map(decorate);
  const scored = sessions.filter((s) => typeof s.score === 'number');
  const recent = scored.slice(0, 5);
  return {
    sessions,
    stats: {
      total: sessions.length,
      best: scored.length ? Math.max(...scored.map((s) => s.score)) : null,
      average: scored.length ? round1(avg(scored.map((s) => s.score))) : null,
      recentAverage: recent.length ? round1(avg(recent.map((s) => s.score))) : null,
      trend: trendOf(scored),
    },
    progress: db.scoreHistory(60),
  };
}

export function detail(id) {
  const session = db.getSession(id);
  return session ? decorate(session) : null;
}

export function remove(id) {
  db.deleteSession(id);
}

export function recording(res, sessionId, file) {
  if (!/^[a-z]-\d+\.(mp3|webm)$/.test(file)) return false;
  const path = join(config.recordingsDir, sessionId, file);
  if (!existsSync(path)) return false;
  res.writeHead(200, {
    'Content-Type': file.endsWith('.mp3') ? 'audio/mpeg' : 'audio/webm',
    'Cache-Control': 'private, max-age=3600',
  });
  createReadStream(path).pipe(res);
  return true;
}

function decorate(session) {
  const scenario = SCENARIOS[session.scenario];
  return {
    ...session,
    scenarioLabel: scenario?.label ?? session.scenario,
    business: scenario?.business ?? '',
    durationMs: session.endedAt && session.startedAt ? session.endedAt - session.startedAt : 0,
  };
}

/** Are the last three calls better than the three before them? */
function trendOf(scored) {
  if (scored.length < 4) return null;
  const recent = scored.slice(0, 3).map((s) => s.score);
  const older = scored.slice(3, 6).map((s) => s.score);
  if (!older.length) return null;
  return round1(avg(recent) - avg(older));
}

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const round1 = (n) => Math.round(n * 10) / 10;
