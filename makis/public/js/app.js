// Screen routing and wiring. Everything else lives in its own module.

import { Call } from './call.js';
import { Orb } from './visualizer.js';
import { renderReport, fmtDuration, esc } from './report.js';
import { loadHistory } from './history.js';

const $ = (id) => document.getElementById(id);
const screens = {
  console: $('screen-console'),
  call: $('screen-call'),
  report: $('screen-report'),
  history: $('screen-history'),
};

let cfg = null;
let call = null;
let orb = null;
let timer = null;
let choice = { difficulty: 'hard', scenario: '' };

function show(name) {
  Object.values(screens).forEach((s) => s.classList.remove('is-active'));
  screens[name].classList.add('is-active');
  window.scrollTo(0, 0);
}

function toast(message, isError = false) {
  const el = $('toast');
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 5200);
}

// ── Setup ──────────────────────────────────────────────────────────────
async function init() {
  cfg = await (await fetch('/api/config')).json();

  buildChips($('difficulty-picker'), cfg.difficulties, 'hard', (id) => { choice.difficulty = id; });
  buildChips(
    $('scenario-picker'),
    [{ id: '', label: 'Τυχαία' }, ...cfg.scenarios],
    '',
    (id) => { choice.scenario = id; }
  );

  $('stack-strip').innerHTML = stackPills(cfg);
  if (cfg.degraded) {
    toast('Πρόχειρη λειτουργία: δεν βρέθηκε κλειδί LLM, ο Μάκης απαντάει από σενάριο. Δες το README.');
  }
  if (cfg.browserSpeech && !(window.SpeechRecognition ?? window.webkitSpeechRecognition)) {
    $('mic-note').textContent = 'Χωρίς κλειδί Groq χρειάζεσαι Chrome ή Edge για αναγνώριση φωνής.';
  }

  orb = new Orb($('orb'));

  $('btn-start').addEventListener('click', startCall);
  $('btn-end').addEventListener('click', () => call?.end('ended'));
  $('btn-again').addEventListener('click', () => show('console'));
  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => goto(btn.dataset.goto));
  });
}

function buildChips(host, options, initial, onPick) {
  host.innerHTML = options.map((o) => `
    <button class="chip" type="button" role="radio" data-id="${o.id}"
            aria-checked="${o.id === initial}">${esc(o.label)}</button>`).join('');
  host.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    host.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-checked', String(c === chip)));
    onPick(chip.dataset.id);
  });
}

function stackPills(config) {
  const pills = [
    { label: `ΑΚΟΗ: ${config.stt === 'groq' ? 'WHISPER' : 'BROWSER'}`, live: config.stt === 'groq' },
    {
      label: `ΜΥΑΛΟ: ${config.llm === 'offline' ? 'ΣΕΝΑΡΙΟ' : config.llm.toUpperCase()}`,
      live: config.llm !== 'offline',
      degraded: config.llm === 'offline',
    },
    { label: `ΦΩΝΗ: ${config.tts === 'browser' ? 'BROWSER' : config.tts.toUpperCase()}`, live: config.tts !== 'browser' },
  ];
  return pills.map((p) => `<span class="stack-pill${p.live ? ' is-live' : ''}${p.degraded ? ' is-degraded' : ''}">${p.label}</span>`).join('');
}

async function goto(name) {
  if (name === 'history') {
    show('history');
    await loadHistory({ onOpen: openPastSession });
    return;
  }
  show(name);
}

async function openPastSession(id) {
  const detail = await (await fetch(`/api/sessions/${id}`)).json();
  renderReport({
    ...detail,
    sessionId: detail.id,
    difficulty: detail.difficulty?.toUpperCase(),
    scenario: { label: detail.scenarioLabel },
  });
  show('report');
}

// ── The call ───────────────────────────────────────────────────────────
async function startCall() {
  const button = $('btn-start');
  button.disabled = true;
  $('transcript-feed').innerHTML = '';
  setStatus('idle', 'Σύνδεση…');

  call = new Call({
    onCallStarted: (data) => {
      $('call-business').textContent = `${data.scenario.business} ${data.scenario.city}`;
      $('call-difficulty').textContent = data.difficultyLabel;
      setPatience(1);
      startTimer();
    },
    onStatus: setStatus,
    onLine: addLine,
    onInterim: (text) => { $('call-hint').textContent = `“${text}”`; },
    onState: (state) => setPatience(state.patience / (state.patienceMax || 1)),
    onDegraded: (message) => toast(message),
    onError: (message) => toast(message, true),
    onFinished: (result) => finishCall(result),
  });

  try {
    show('call');
    orb.start();
    tickOrb();
    await call.start({ ...choice, browserSpeech: cfg.browserSpeech });
  } catch (err) {
    show('console');
    toast(micError(err), true);
  } finally {
    button.disabled = false;
  }
}

function micError(err) {
  const name = err?.name ?? '';
  if (name === 'NotAllowedError') return 'Χρειάζεται πρόσβαση στο μικρόφωνο για να ξεκινήσει η κλήση.';
  if (name === 'NotFoundError') return 'Δεν βρέθηκε μικρόφωνο.';
  if (location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    return 'Το μικρόφωνο απαιτεί HTTPS ή localhost.';
  }
  return err?.message ?? 'Κάτι πήγε στραβά.';
}

function finishCall(result) {
  stopTimer();
  orb.stop();
  if (!result) {
    toast('Η κλήση τερματίστηκε αλλά δεν ήρθε αξιολόγηση.', true);
    show('console');
    return;
  }
  renderReport(result);
  show('report');
  loadHistory({ onOpen: openPastSession }).catch(() => {});
}

function tickOrb() {
  if (!call || call.over) {
    orb.set('idle', 0);
    return;
  }
  orb.set(orbState, call.level);
  requestAnimationFrame(tickOrb);
}

let orbState = 'idle';

function setStatus(state, hint = '') {
  orbState = state;
  const el = $('call-status');
  el.className = `status is-${state}`;
  el.textContent = {
    idle: 'ΑΝΑΜΟΝΗ',
    listening: 'ΣΑΣ ΑΚΟΥΕΙ',
    speaking: 'ΜΙΛΑΕΙ Ο ΜΑΚΗΣ',
    thinking: 'ΣΚΕΦΤΕΤΑΙ',
  }[state] ?? state.toUpperCase();
  $('call-hint').textContent = hint;
}

function addLine({ speaker, text }) {
  const feed = $('transcript-feed');
  const line = document.createElement('div');
  line.className = `line line-${speaker}`;
  line.innerHTML = `<b>${speaker === 'user' ? 'ΕΣΥ' : 'ΜΑΚΗΣ'}</b>${esc(text)}`;
  feed.appendChild(line);
  feed.scrollTop = feed.scrollHeight;
  $('call-hint').textContent = '';
}

function setPatience(ratio) {
  const fill = $('patience-fill');
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  fill.style.width = `${pct}%`;
  fill.className = pct <= 25 ? 'is-critical' : pct <= 55 ? 'is-low' : '';
}

function startTimer() {
  const startedAt = Date.now();
  stopTimer();
  timer = setInterval(() => {
    $('call-timer').textContent = fmtDuration(Date.now() - startedAt);
  }, 1000);
  $('call-timer').textContent = '00:00';
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

init().catch((err) => toast(`Αποτυχία εκκίνησης: ${err.message}`, true));
