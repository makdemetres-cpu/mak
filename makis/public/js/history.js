// Past calls and whether you are actually getting better.

import { esc, fmtDuration } from './report.js';

export async function loadHistory({ onOpen }) {
  const res = await fetch('/api/sessions');
  const data = await res.json();

  renderStats(data.stats);
  drawChart(document.getElementById('progress-chart'), data.progress ?? []);
  renderList(data.sessions ?? [], onOpen);
  return data;
}

function renderStats(stats = {}) {
  const trend = stats.trend;
  const cards = [
    { value: stats.total ?? 0, label: 'ΚΛΗΣΕΙΣ' },
    { value: fmtScore(stats.average), label: 'ΜΕΣΟΣ ΟΡΟΣ' },
    { value: fmtScore(stats.recentAverage), label: 'ΤΕΛΕΥΤΑΙΕΣ 5' },
    { value: fmtScore(stats.best), label: 'ΚΑΛΥΤΕΡΗ' },
    {
      value: trend === null || trend === undefined ? '—' : `${trend > 0 ? '+' : ''}${trend}`,
      label: 'ΤΑΣΗ',
      cls: trend > 0 ? ' is-up' : trend < 0 ? ' is-down' : '',
    },
  ];
  document.getElementById('history-stats').innerHTML = cards.map((c) => `
    <div class="stat">
      <div class="stat-value${c.cls ?? ''}">${c.value}</div>
      <div class="stat-label">${c.label}</div>
    </div>`).join('');
}

function renderList(sessions, onOpen) {
  const host = document.getElementById('history-list');
  if (!sessions.length) {
    host.innerHTML = '<p class="empty">Καμία ολοκληρωμένη κλήση ακόμα.</p>';
    return;
  }
  host.innerHTML = sessions.map((s) => `
    <button class="history-row" type="button" data-id="${s.id}">
      <span class="history-score${(s.score ?? 0) < 5 ? ' is-low' : ''}">${fmtScore(s.score)}</span>
      <span class="history-main">
        <span class="history-title">${esc(s.business || s.scenarioLabel || '')}</span>
        <span class="history-sub">${fmtDate(s.startedAt)} · ${fmtDuration(s.durationMs)} · ${s.outcome === 'hangup' ? 'ΕΚΛΕΙΣΕ ΤΟ ΤΗΛΕΦΩΝΟ' : 'ΟΛΟΚΛΗΡΩΘΗΚΕ'}</span>
      </span>
      <span class="history-del" data-del="${s.id}" role="button" aria-label="Διαγραφή">✕</span>
    </button>`).join('');

  host.onclick = async (event) => {
    const del = event.target.closest('[data-del]');
    if (del) {
      event.stopPropagation();
      await fetch(`/api/sessions/${del.dataset.del}`, { method: 'DELETE' });
      loadHistory({ onOpen });
      return;
    }
    const row = event.target.closest('[data-id]');
    if (row) onOpen(row.dataset.id);
  };
}

/** Score over time. Hand-drawn on canvas — no chart library for five points. */
function drawChart(canvas, points) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 720;
  const height = 220;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pad = { left: 26, right: 12, top: 14, bottom: 22 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  ctx.strokeStyle = 'rgba(120,210,255,0.10)';
  ctx.fillStyle = '#74889a';
  ctx.font = '10px ui-monospace, monospace';
  ctx.lineWidth = 1;
  for (let score = 0; score <= 10; score += 5) {
    const y = pad.top + plotH - (score / 10) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(String(score), 6, y + 3);
  }

  if (points.length < 1) {
    ctx.fillText('Καμία βαθμολογία ακόμα', pad.left + 8, pad.top + plotH / 2);
    return;
  }

  const xFor = (i) => pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yFor = (score) => pad.top + plotH - (Math.max(0, Math.min(10, score)) / 10) * plotH;

  // Area under the curve, so the trend reads at a glance.
  const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
  gradient.addColorStop(0, 'rgba(55,229,200,0.22)');
  gradient.addColorStop(1, 'rgba(55,229,200,0)');
  ctx.beginPath();
  ctx.moveTo(xFor(0), pad.top + plotH);
  points.forEach((p, i) => ctx.lineTo(xFor(i), yFor(p.score)));
  ctx.lineTo(xFor(points.length - 1), pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(xFor(i), yFor(p.score)) : ctx.moveTo(xFor(i), yFor(p.score))));
  ctx.strokeStyle = '#37e5c8';
  ctx.lineWidth = 2;
  ctx.stroke();

  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(xFor(i), yFor(p.score), 3, 0, Math.PI * 2);
    ctx.fillStyle = p.score < 5 ? '#ff5d6c' : '#37e5c8';
    ctx.fill();
  });
}

const fmtScore = (n) => (typeof n === 'number' ? String(Math.round(n * 10) / 10) : '—');

const fmtDate = (ts) => new Date(ts).toLocaleString('el-GR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
