// The post-call verdict. Weaknesses lead — that is the point of the exercise.

const SUB_LABELS = {
  discovery: 'ΑΝΑΚΑΛΥΨΗ',
  objections: 'ΑΝΤΙΡΡΗΣΕΙΣ',
  tonality: 'ΤΟΝΟΣ',
  control: 'ΕΛΕΓΧΟΣ',
  closing: 'ΚΛΕΙΣΙΜΟ',
};

const $ = (id) => document.getElementById(id);

export function renderReport(result) {
  const report = result.report ?? {};
  const metrics = result.metrics ?? {};
  const score = Number(report.score ?? 0);

  $('report-meta').textContent = [
    result.difficulty ?? '',
    result.scenario?.label ?? result.scenarioLabel ?? '',
    result.outcome === 'hangup' ? 'ΕΚΛΕΙΣΕ ΤΟ ΤΗΛΕΦΩΝΟ' : '',
  ].filter(Boolean).join(' · ');

  $('report-score').textContent = score.toFixed(1).replace('.0', '');
  $('report-verdict').textContent = report.verdict ?? '';
  $('report-headline').textContent = report.headline ?? '';

  // Dial: 327 is the circumference of r=52.
  const dial = $('dial-value');
  dial.style.strokeDashoffset = String(327 - (Math.max(0, Math.min(10, score)) / 10) * 327);
  dial.style.stroke = score >= 7 ? 'var(--accent)' : score >= 5 ? 'var(--gold)' : 'var(--warn)';

  $('subscores').innerHTML = Object.entries(report.subscores ?? {})
    .map(([key, value]) => {
      const n = Math.max(0, Math.min(10, Number(value) || 0));
      return `<div class="sub">
        <span class="sub-label">${SUB_LABELS[key] ?? key.toUpperCase()}</span>
        <span class="sub-bar"><i style="width:${n * 10}%"></i></span>
        <span class="sub-num">${n}</span>
      </div>`;
    }).join('') || '<p class="empty">—</p>';

  $('weaknesses').innerHTML = (report.weaknesses ?? []).map((w) => `
    <div class="weakness">
      <h3>${esc(w.title ?? '')}</h3>
      <p>${esc(w.detail ?? '')}</p>
      ${w.fix ? `<p class="fix">${esc(w.fix)}</p>` : ''}
    </div>`).join('') || '<p class="empty">Καμία αδυναμία δεν καταγράφηκε.</p>';

  $('strengths').innerHTML = (report.strengths ?? []).map((s) => `<li>${esc(s)}</li>`).join('')
    || '<li>—</li>';
  $('drill').textContent = report.drill ?? '';

  $('metrics').innerHTML = metricCards(metrics).map((m) => `
    <div class="metric">
      <div class="metric-value${m.bad ? ' is-bad' : ''}">${m.value}</div>
      <div class="metric-label">${m.label}</div>
    </div>`).join('');

  renderPlayback(result);
}

function metricCards(m) {
  const talk = Math.round((m.talkRatio ?? 0) * 100);
  return [
    { value: fmtDuration(m.callMs ?? 0), label: 'Διάρκεια κλήσης' },
    { value: `${talk}%`, label: 'Μίλησες εσύ', bad: talk > 65 },
    { value: m.questionsAsked ?? 0, label: 'Ερωτήσεις που έκανες', bad: (m.questionsAsked ?? 0) < 3 },
    { value: `${Math.round((m.longestMonologueMs ?? 0) / 1000)}s`, label: 'Μεγαλύτερος μονόλογος', bad: (m.longestMonologueMs ?? 0) > 30000 },
    { value: m.closeAttempted ? 'ΝΑΙ' : 'ΟΧΙ', label: 'Ζήτησες επόμενο βήμα', bad: !m.closeAttempted },
    { value: (m.objectionsUnanswered ?? []).length, label: 'Αναπάντητες αντιρρήσεις', bad: (m.objectionsUnanswered ?? []).length > 0 },
  ];
}

/** Recordings only exist when audio actually went through the server. */
function renderPlayback(result) {
  const panel = document.getElementById('playback-panel');
  const host = document.getElementById('playback');
  const turns = (result.turns ?? []).filter((t) => t.audioFile);
  if (!turns.length) {
    panel.hidden = true;
    host.innerHTML = '';
    return;
  }
  panel.hidden = false;
  host.innerHTML = turns.map((t) => `
    <div>
      <div class="pb-label">${t.speaker === 'user' ? 'ΕΣΥ' : 'ΜΑΚΗΣ'} · ${esc(clip(t.text))}</div>
      <audio controls preload="none" src="/api/sessions/${result.sessionId ?? result.id}/audio/${t.audioFile}"></audio>
    </div>`).join('');
}

export const fmtDuration = (ms) => {
  const total = Math.round(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const clip = (text, max = 46) => (text.length > max ? `${text.slice(0, max)}…` : text);

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));
