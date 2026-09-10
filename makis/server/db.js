// SQLite persistence. node:sqlite is built into Node 22.5+, so no native build.

import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    started_at  INTEGER NOT NULL,
    ended_at    INTEGER,
    difficulty  TEXT NOT NULL,
    scenario    TEXT NOT NULL,
    outcome     TEXT,
    score       REAL,
    report_json TEXT,
    metrics_json TEXT
  );

  CREATE TABLE IF NOT EXISTS turns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL REFERENCES sessions(id),
    idx         INTEGER NOT NULL,
    speaker     TEXT NOT NULL,
    text        TEXT NOT NULL,
    at          INTEGER NOT NULL,
    duration_ms INTEGER DEFAULT 0,
    audio_file  TEXT,
    objection   TEXT
  );

  CREATE INDEX IF NOT EXISTS turns_session ON turns(session_id, idx);
`);

export function createSession({ id, difficulty, scenario }) {
  db.prepare(
    `INSERT INTO sessions (id, started_at, difficulty, scenario) VALUES (?, ?, ?, ?)`
  ).run(id, Date.now(), difficulty, scenario);
}

export function addTurn({ sessionId, idx, speaker, text, durationMs = 0, audioFile = null, objection = null }) {
  db.prepare(
    `INSERT INTO turns (session_id, idx, speaker, text, at, duration_ms, audio_file, objection)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sessionId, idx, speaker, text, Date.now(), Math.round(durationMs), audioFile, objection);
}

export function getTurns(sessionId) {
  return db.prepare(
    `SELECT idx, speaker, text, at, duration_ms AS durationMs, audio_file AS audioFile, objection
       FROM turns WHERE session_id = ? ORDER BY idx ASC`
  ).all(sessionId);
}

export function finishSession({ id, outcome, score, report, metrics }) {
  db.prepare(
    `UPDATE sessions
        SET ended_at = ?, outcome = ?, score = ?, report_json = ?, metrics_json = ?
      WHERE id = ?`
  ).run(Date.now(), outcome, score, JSON.stringify(report), JSON.stringify(metrics), id);
}

export function listSessions(limit = 50) {
  const rows = db.prepare(
    `SELECT id, started_at AS startedAt, ended_at AS endedAt, difficulty, scenario,
            outcome, score, report_json AS reportJson
       FROM sessions
      WHERE ended_at IS NOT NULL
      ORDER BY started_at DESC
      LIMIT ?`
  ).all(limit);
  return rows.map((row) => ({
    ...row,
    report: row.reportJson ? JSON.parse(row.reportJson) : null,
    reportJson: undefined,
  }));
}

export function getSession(id) {
  const row = db.prepare(
    `SELECT id, started_at AS startedAt, ended_at AS endedAt, difficulty, scenario,
            outcome, score, report_json AS reportJson, metrics_json AS metricsJson
       FROM sessions WHERE id = ?`
  ).get(id);
  if (!row) return null;
  return {
    ...row,
    report: row.reportJson ? JSON.parse(row.reportJson) : null,
    metrics: row.metricsJson ? JSON.parse(row.metricsJson) : null,
    reportJson: undefined,
    metricsJson: undefined,
    turns: getTurns(id),
  };
}

export function deleteSession(id) {
  db.prepare(`DELETE FROM turns WHERE session_id = ?`).run(id);
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}

/** Score over time, oldest first — drives the progress chart. */
export function scoreHistory(limit = 60) {
  return db.prepare(
    `SELECT id, started_at AS startedAt, score, difficulty
       FROM sessions
      WHERE score IS NOT NULL
      ORDER BY started_at ASC
      LIMIT ?`
  ).all(limit);
}
