// FlipDesk dashboard — vanilla JS, no build step, no CDN. Talks to the local API only.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = (v, d = 0) => v == null ? '—' : '€' + Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (v) => v == null ? '—' : (v >= 0 ? '+' : '−') + eur(Math.abs(v));
const pct = (v) => v == null ? '—' : `${v.toFixed(1)}%`;
const ago = (iso) => {
  if (!iso) return '';
  const m = Math.max(0, (Date.now() - new Date(iso + 'Z').getTime()) / 60000);
  if (m < 60) return `${Math.round(m)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};
const human = (s) => (s || '').replace(/_/g, ' ');

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  flame: '<path d="M12 3s5 4.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
  box: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  plug: '<path d="M9 2v6M15 2v6"/><path d="M6 8h12v4a6 6 0 0 1-12 0V8z"/><path d="M12 18v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  arrow: '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  truck: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const paintIcons = (root = document) => $$('[data-icon]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon); });

const MK = { vendora: 'V', facebook: 'f', vinted: 'Vi', skoop: 'S', manual: '✎' };
const MK_NAME = { vendora: 'Vendora', facebook: 'Facebook', vinted: 'Vinted', skoop: 'Skoop', manual: 'Shared' };
const TIER_CLASS = { HOT: 'b-hot', GOOD: 'b-good', NEGOTIATE: 'b-neg', WATCH: 'b-watch', REJECTED: 'b-rej' };
const TIER_ICON = { HOT: '🔥', GOOD: '✅', NEGOTIATE: '💬', WATCH: '👀', REJECTED: '⛔' };
const tierBadge = (t) => t ? `<span class="badge ${TIER_CLASS[t]}">${TIER_ICON[t]} ${t}</span>` : '';
const riskBadge = (r) => r ? `<span class="badge r-${r}">Risk ${r}</span>` : '';

async function api(path, opts = {}) {
  const res = await fetch(path, { headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText);
  return data;
}
const post = (path, body) => api(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body || {}) });

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('on'), 3200);
}

function bindSeg(el, onChange) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', el).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    onChange(b.dataset);
  });
}

const state = { delivery: '', tiers: 'HOT,GOOD,NEGOTIATE', days: 365, period: 'all', overview: null, dealsScope: 'open', invScope: 'open', sort: { key: 'deal_score', dir: -1 } };

/* ------------------------------------------------------------- routing */
const VIEWS = ['dashboard', 'deals', 'inventory', 'analytics', 'connectors', 'settings', 'activity'];
function go(view) {
  if (!VIEWS.includes(view)) view = 'dashboard';
  $$('.view').forEach((v) => v.classList.toggle('on', v.id === `view-${view}`));
  $$('.nav-btn').forEach((b) => b.dataset.view === view ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('.controls').style.display = view === 'dashboard' || view === 'deals' ? '' : 'none';
  ({ dashboard: renderDashboard, deals: renderDeals, inventory: renderInventory, analytics: renderAnalytics, connectors: renderConnectors, settings: renderSettings, activity: renderActivity })[view]();
}
window.addEventListener('hashchange', () => go(location.hash.slice(1)));
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-view], [data-view-link]');
  if (nav && !nav.closest('.drawer')) location.hash = nav.dataset.view || nav.dataset.viewLink;
});

/* ------------------------------------------------------------ overview */
async function loadOverview() {
  const o = await api('/api/overview');
  state.overview = o;
  const first = (o.owner || 'Owner').split(' ')[0];
  $('#owner').textContent = first;
  $('#who-name').textContent = o.owner;
  $('#avatar').textContent = (o.owner || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  $('#who-status').textContent = o.paused ? 'scanning paused' : `bot online · up ${fmtUptime(o.uptime_seconds)}`;
  $('#live-dot').classList.toggle('off', o.paused);
  $('#subtitle').textContent = `${o.candidates_today} candidates today · ${o.hot_deals} hot · base ${o.base_location.split(',')[0]}`;
  $('#nav-deals').textContent = o.hot_deals || '';
  $('#bell-dot').hidden = !o.hot_deals;
  $('#mode-card').innerHTML = o.mode === 'PAPER'
    ? `<b>PAPER MODE</b>Simulated listings &amp; inventory. Nothing is published or bought.${o.sample_price_rules ? '<br><span class="muted">Using SAMPLE price rules.</span>' : ''}`
    : `<b>LIVE</b>Real listings. You make every purchase decision.`;
  return o;
}
const fmtUptime = (s) => s < 3600 ? `${Math.max(1, Math.round(s / 60))} min` : s < 172800 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} d`;

/* ----------------------------------------------------------- dashboard */
async function renderDashboard() {
  const [o, deals, inv] = await Promise.all([
    loadOverview(),
    api(`/api/deals?tier=${state.tiers}${state.delivery ? `&delivery=${state.delivery}` : ''}`),
    api('/api/inventory'),
  ]);
  renderProfitCard(o);
  renderTopDeal(deals);
  renderFeed(deals);
  renderTiles(inv.items);
  renderChart();
}

function renderProfitCard(o) {
  const v = state.period === 'month' ? o.realized_profit_month : o.realized_profit;
  $('#profit-num').textContent = eur(v, 2);
  $('#profit-sub').innerHTML = `
    <span>Pending <b class="num">${eur(o.pending_profit)}</b></span>
    <span>In stock <b class="num">${eur(o.inventory_value)}</b></span>
    <span>${o.flips_completed} flips</span>`;
}

function renderTopDeal(deals) {
  const el = $('#top-deal');
  const top = deals.find((d) => d.tier === 'HOT') || deals[0];
  if (!top) {
    el.innerHTML = `<h3>No open deals</h3><p>Share any listing from Vendora, Facebook, Vinted or Skoop and get a scored verdict in seconds.</p>
      <button class="glow-btn" onclick="document.querySelector('#ask-input').focus()">Analyze a listing</button>`;
    return;
  }
  el.innerHTML = `
    <h3>Best opportunity right now</h3>
    <div class="model">${esc(top.model)} ${top.storage_gb ? top.storage_gb + 'GB' : ''}</div>
    <p>${eur(top.price)} asking · ${signed(top.net_profit)} expected · score ${Math.round(top.deal_score || 0)}/100 · ${top.delivery === 'shipped' ? 'shipped' : top.travel_minutes != null ? `~${Math.round(top.travel_minutes)} min away` : 'distance unknown'}</p>
    <button class="glow-btn" data-open="${top.id}">Open deal card</button>`;
}

function feedRow(d) {
  const where = d.delivery === 'shipped' ? 'shipped' : d.location ? `${esc(d.location)}${d.travel_minutes != null ? ` · ${Math.round(d.travel_minutes)}m` : ''}` : 'location ?';
  return `<button class="feed-row" data-open="${d.id}">
    <span class="mk" title="${MK_NAME[d.marketplace] || d.marketplace}">${MK[d.marketplace] || '?'}</span>
    <span style="min-width:0"><div class="t">${esc(d.model || d.title)} ${d.storage_gb ? d.storage_gb + 'GB' : ''}</div>
      <div class="s">${TIER_ICON[d.tier]} ${Math.round(d.deal_score || 0)}/100 · ${MK_NAME[d.marketplace] || d.marketplace} · ${where}</div></span>
    <span class="r"><div class="p num">${eur(d.price)}</div>
      <div class="small num ${d.net_profit >= 0 ? 'pos' : 'neg'}">${signed(d.net_profit)}</div></span>
  </button>`;
}

function renderFeed(deals) {
  const list = deals.slice(0, 6);
  $('#feed').innerHTML = list.length ? list.map(feedRow).join('') : '<div class="empty">Nothing matches this filter.</div>';
}

const STATUS_SHORT = { READY_TO_LIST: 'Ready', RETURN_WINDOW: 'Return window', IN_TRANSIT: 'In transit' };
function renderTiles(items) {
  const open = items.filter((i) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'RETURNED'].includes(i.status)).slice(0, 4);
  $('#tiles').innerHTML = open.length ? open.map((i) => {
    const value = i.listing_price ?? i.predicted_sale;
    const margin = value != null && i.purchase_cost != null ? value - i.purchase_cost - (i.repair_cost || 0) : i.predicted_profit;
    return `<button class="tile" data-item="${i.id}">
      <span class="v num">${eur(value)}</span>
      <span class="small num ${margin >= 0 ? 'pos' : 'neg'}">${signed(margin)} ${i.purchase_cost ? `on ${eur(i.purchase_cost)}` : 'est.'}</span>
      <span class="glyph">${icon('phone')}</span>
      <span class="foot"><b>${esc(i.model)}</b></span>
      <span class="foot"><span class="muted">${i.storage_gb}GB</span><span class="muted">${esc(STATUS_SHORT[i.status] || human(i.status).toLowerCase())}</span></span>
    </button>`;
  }).join('') : '<div class="empty" style="grid-column:1/-1">No open inventory.</div>';
}

/* --------------------------------------------------------------- chart */
async function renderChart() {
  const pts = await api(`/api/profit?days=${state.days}`);
  const wrap = $('#chart');
  const now = Date.now();
  const start = now - state.days * 86400000;
  renderChartTable(pts);
  if (!pts.length) { wrap.innerHTML = '<div class="empty">No completed flips in this range yet.</div>'; return; }
  const series = [{ t: start, v: pts[0].cumulative - (pts[0].profit || 0), base: true },
    ...pts.map((p) => ({ t: new Date(p.at + 'Z').getTime(), v: p.cumulative, p })),
    { t: now, v: pts[pts.length - 1].cumulative, base: true }];
  const W = wrap.clientWidth || 800, H = wrap.clientHeight || 260;
  const m = { l: 46, r: 12, t: 16, b: 26 };
  const vmin = Math.min(...series.map((s) => s.v)), vmax = Math.max(...series.map((s) => s.v));
  const ticks = niceTicks(Math.min(0, vmin), vmax, 5);
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = (t) => m.l + (t - start) / (now - start) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);
  const line = series.map((s, i) => `${i ? 'L' : 'M'}${x(s.t).toFixed(1)},${y(s.v).toFixed(1)}`).join('');
  const area = `${line}L${x(now).toFixed(1)},${y(y0)}L${x(start).toFixed(1)},${y(y0)}Z`;
  const xt = xTicks(start, now, state.days).filter((_, i, all) => all.length * 46 < W - m.l || i % 2 === 0);
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative profit chart">
    <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c98bb6" stop-opacity=".55"/><stop offset="1" stop-color="#c98bb6" stop-opacity="0"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="4"/></filter></defs>
    ${ticks.map((v) => `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${m.l - 10}" y="${y(v) + 4}" text-anchor="end">${shortEur(v)}</text>`).join('')}
    ${xt.map((t) => `<text class="axis" x="${x(t.t)}" y="${H - 6}" text-anchor="middle">${t.label}</text>`).join('')}
    <path d="${area}" fill="url(#fill)"/>
    <path class="line" d="${line}"/>
    <line class="guide" id="guide" y1="${m.t}" y2="${H - m.b}" x1="-10" x2="-10"/>
    <circle id="dot-glow" r="9" fill="#f3a6d6" opacity="0" filter="url(#glow)"/>
    <circle id="dot" r="5" fill="#fbe3f1" stroke="#0e0b0f" stroke-width="2" opacity="0"/>
    <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" id="hit"/>
  </svg><div class="chart-tip" id="tip"></div>`;
  const real = series.filter((s) => !s.base);
  const tip = $('#tip'), guide = $('#guide'), dot = $('#dot'), dg = $('#dot-glow');
  const show = (s) => {
    const px = x(s.t), py = y(s.v);
    guide.setAttribute('x1', px); guide.setAttribute('x2', px);
    for (const c of [dot, dg]) { c.setAttribute('cx', px); c.setAttribute('cy', py); c.setAttribute('opacity', c === dg ? '.8' : '1'); }
    tip.style.left = `${Math.min(Math.max(px, 90), W - 90)}px`;
    tip.style.top = `${py}px`;
    tip.classList.toggle('below', py < 90);
    tip.innerHTML = `<div class="d"><span>${new Date(s.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span>${esc(s.p.model)}</span></div>
      <div class="v num">${eur(s.v)} <span class="badge b-good">${signed(s.p.profit)}</span></div>`;
    tip.classList.add('on');
  };
  const hit = $('#hit');
  const move = (clientX) => {
    const r = wrap.getBoundingClientRect();
    const px = (clientX - r.left) * (W / r.width);
    let best = real[0];
    for (const s of real) if (Math.abs(x(s.t) - px) < Math.abs(x(best.t) - px)) best = s;
    show(best);
  };
  hit.addEventListener('mousemove', (e) => move(e.clientX));
  hit.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  const mid = start + (now - start) * 0.55;
  show(real.reduce((a, b) => (Math.abs(b.t - mid) < Math.abs(a.t - mid) ? b : a)));
}

function renderChartTable(pts) {
  $('#chart-table').innerHTML = `<table><thead><tr><th>Sold</th><th>Device</th><th class="r">Profit</th><th class="r">Cumulative</th></tr></thead><tbody>
    ${pts.map((p) => `<tr><td>${new Date(p.at + 'Z').toLocaleDateString('en-GB')}</td><td>${esc(p.model)}</td><td class="r num">${signed(p.profit)}</td><td class="r num">${eur(p.cumulative)}</td></tr>`).join('')}</tbody></table>`;
}

function niceTicks(lo, hi, n) {
  if (hi === lo) hi = lo + 100;
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw);
  const out = [];
  for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < hi) out.push(out[out.length - 1] + step);
  return out;
}
const shortEur = (v) => Math.abs(v) >= 1000 ? `€${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : `€${v}`;
function xTicks(start, end, days) {
  const out = [];
  if (days > 60) {
    const d = new Date(start); d.setDate(1); d.setMonth(d.getMonth() + 1);
    const every = days > 200 ? 1 : 1;
    for (; d.getTime() < end; d.setMonth(d.getMonth() + every)) out.push({ t: d.getTime(), label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  } else {
    const step = days <= 7 ? 1 : days <= 30 ? 5 : 14;
    for (let t = start; t < end; t += step * 86400000) out.push({ t, label: new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
  }
  return out;
}

/* --------------------------------------------------------- deal drawer */
const drawer = $('#drawer'), scrim = $('#scrim');
function openDrawer(html) {
  drawer.innerHTML = `<button class="round-btn close" aria-label="Close" data-close>${icon('x')}</button>${html}`;
  drawer.classList.add('on'); scrim.classList.add('on');
  drawer.scrollTop = 0;
}
function closeDrawer() { drawer.classList.remove('on'); scrim.classList.remove('on'); }
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDrawer());
drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) { openDeal(+o.dataset.open); return; }
  const it = e.target.closest('[data-item]');
  if (it) openItem(+it.dataset.item);
});

const CERT = (c) => `<i class="c-${(c || 'UNKNOWN').split(' ')[0]}">${c || 'UNKNOWN'}</i>`;

async function openDeal(id) {
  const d = await api(`/api/listings/${id}`);
  const ev = d.evaluation || {}, f = ev.facts || {}, val = ev.valuation, pr = ev.profit, neg = d.negotiation;
  const fact = (label, pair, fmt = (v) => v) => {
    const [v, c] = pair || [null, 'UNKNOWN'];
    const shown = v == null ? (d.delivery === 'shipped' ? 'inspect on arrival' : 'inspect in person') : Array.isArray(v) ? (v.length ? v.join(', ') : 'none') : fmt(v);
    return `<span class="fact">${label}: ${esc(shown)} ${CERT(v == null ? 'UNKNOWN' : c)}</span>`;
  };
  const where = d.delivery === 'shipped' ? `${icon('truck')} Delivery: shipped — inspect on arrival` :
    `${icon('pin')} ${esc(d.location || 'Unknown')} · ${d.travel_minutes != null ? `~${Math.round(d.travel_minutes)} min` : 'travel UNKNOWN'} · ${esc(ev.location?.tier || '')} · confidence ${d.location_confidence}`;
  openDrawer(`
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${tierBadge(d.tier)} ${riskBadge(d.risk_level)} ${d.is_paper ? '<span class="badge b-paper">PAPER</span>' : ''} ${d.decision ? `<span class="badge b-state">${d.decision}</span>` : ''}</div>
    <h2>${esc(d.model || d.title)} ${d.storage_gb ? d.storage_gb + 'GB' : ''}</h2>
    <div class="muted small" style="margin-top:4px">${esc(d.title)} · ${MK_NAME[d.marketplace] || d.marketplace}${d.mirrors.length ? ` (+ seen on ${d.mirrors.map((m) => MK_NAME[m.marketplace]).join(', ')})` : ''} · listed ${ago(d.listed_at || d.first_seen_at)}</div>
    <div class="scores">
      <div class="ring" style="--p:${d.deal_score || 0}" title="Deal score">${d.deal_score != null ? Math.round(d.deal_score) : '–'}</div>
      <div><div class="small muted">DEAL SCORE</div><div style="font-weight:700">${d.deal_score != null ? Math.round(d.deal_score) + '/100' : 'not scored'}</div>
      <div class="small ink2">Risk ${d.risk_level} — scored separately</div></div>
    </div>
    <section><div class="money">
      <div><small>Price</small><b class="num">${eur(d.price)}</b></div>
      <div><small>My max buy</small><b class="num">${eur(d.my_max_buy)}</b></div>
      <div><small>Expected sale</small><b class="num">${eur(d.expected_sale)}</b></div>
      <div><small>Net profit</small><b class="num ${d.net_profit >= 0 ? 'pos' : 'neg'}">${signed(d.net_profit)}</b></div>
      <div><small>ROI</small><b class="num">${pct(d.roi_percent)}</b></div>
      <div><small>Comps</small><b class="num">${val ? `${val.n} · ${val.confidence}` : '—'}</b></div>
    </div>
    ${val ? `<p class="small ink2" style="margin:10px 0 0">Market: Low ${eur(val.low)} · Typical ${eur(val.typical)} · High ${eur(val.high)} · Recommended listing ${eur(val.recommended_listing)}</p>` : ''}
    </section>
    <section><h3>Device</h3><div class="facts">
      ${fact('Battery', f.battery_health, (v) => v + '%')}${fact('Condition', f.condition, human)}${fact('Face ID', f.face_id)}
      ${fact('Repairs', f.repairs)}${fact('SIM', f.sim_type, human)}
      ${f.battery_cycles ? `<span class="fact">Cycles: ${f.battery_cycles}</span>` : ''}
      <span class="fact">Box: ${f.box ? 'yes' : 'no / unknown'}</span>
    </div><p class="small ink2" style="margin:10px 0 0;display:flex;gap:6px;align-items:center">${where}</p></section>
    ${(ev.components || []).length ? `<section><h3>Why it scored ${Math.round(d.deal_score)}</h3>
      ${ev.components.map((c) => `<div class="comp"><span>${esc(c.label)}</span><span class="bar"><i style="width:${c.points / c.weight * 100}%"></i></span><span class="num r" style="text-align:right">${c.points}/${c.weight}</span><span class="why">${esc(c.reason)}</span></div>`).join('')}
    </section>` : ''}
    ${(ev.positives || []).length ? `<section><h3>Strengths</h3><ul class="list">${ev.positives.map((p) => `<li><span class="pos">+</span>${esc(p)}</li>`).join('')}</ul></section>` : ''}
    ${(ev.warnings || []).length ? `<section><h3>Warnings</h3><ul class="list">${ev.warnings.map((w) => `<li>⚠️ ${esc(w)}</li>`).join('')}</ul></section>` : ''}
    ${(ev.rejects || []).length ? `<section><h3>Rejected because</h3><ul class="list">${ev.rejects.map((w) => `<li>⛔ ${esc(w)}</li>`).join('')}</ul></section>` : ''}
    ${(ev.risk?.reasons || []).length ? `<section><h3>Risk signals</h3><ul class="list">${ev.risk.reasons.map((w) => `<li class="neg">● <span class="ink2">${esc(w)}</span></li>`).join('')}</ul></section>` : ''}
    ${pr ? `<section><h3>Profit breakdown</h3><dl class="kv num">
      <dt>Expected sale</dt><dd>${eur(pr.expected_sale, 2)}</dd><dt>− Purchase</dt><dd>${eur(pr.purchase_price, 2)}</dd>
      <dt>− Repair reserve</dt><dd>${eur(pr.repair_reserve, 2)}</dd><dt>− Platform fee</dt><dd>${eur(pr.platform_fee, 2)}</dd>
      <dt>− Withdrawal + shipping</dt><dd>${eur(pr.withdrawal_fee + pr.shipping, 2)}</dd><dt>− Travel (round trip)</dt><dd>${eur(pr.travel_cost + pr.time_cost, 2)}</dd>
      <dt><b>= Net profit</b></dt><dd><b>${eur(pr.net_profit, 2)}</b> · ROI ${pct(pr.roi_percent)}</dd></dl></section>` : ''}
    ${d.tier !== 'REJECTED' && neg ? `<section><h3>Negotiation</h3>
      <div class="money"><div><small>Opening</small><b class="num">${eur(neg.opening)}</b></div><div><small>Target</small><b class="num">${eur(neg.target)}</b></div><div><small>Absolute max</small><b class="num">${eur(neg.absolute_max)}</b></div></div>
      <div style="margin-top:10px">${Object.entries(d.drafts).map(([k, t]) => `<div class="draft"><button class="chip-btn" data-copy="${esc(t)}">Copy</button><span class="muted small">${k}</span><br>${esc(t)}</div>`).join('')}</div>
      <p class="small muted">Copy and send these yourself. FlipDesk never messages sellers.</p></section>` : ''}
    ${d.description ? `<section><h3>Listing text</h3><p class="small ink2" style="white-space:pre-wrap;margin:0">${esc(d.description)}</p></section>` : ''}
    <div class="actions">
      ${d.url && !d.url.includes('example.invalid') ? `<a class="btn ghost" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Open listing</a>` : ''}
      ${d.decision ? '' : `<button class="btn primary" data-decide="APPROVED" data-id="${d.id}" ${d.tier === 'REJECTED' ? 'disabled title="Rejected by your rules"' : ''}>Approve</button>
      <button class="btn danger" data-decide="REJECTED" data-id="${d.id}">Reject</button>`}
    </div>`);
}

drawer.addEventListener('click', async (e) => {
  const c = e.target.closest('[data-copy]');
  if (c) { await navigator.clipboard?.writeText(c.dataset.copy).catch(() => {}); toast('Copied — paste it to the seller yourself'); return; }
  const dec = e.target.closest('[data-decide]');
  if (dec) {
    try {
      const r = await post(`/api/listings/${dec.dataset.id}/decision`, { decision: dec.dataset.decide });
      closeDrawer();
      toast(r.inventory ? `Approved → ${r.inventory.code}. Contact the seller yourself.` : 'Rejected');
      refresh();
    } catch (err) { toast(err.message); }
  }
});

/* ------------------------------------------------------- inventory item */
const NEEDS = { PURCHASED: ['purchase_cost'], LISTED: ['listing_price'], SOLD: ['sale_price', 'sale_platform'], COMPLETED: ['fees_paid'], REPAIR: ['repair_cost'] };
async function openItem(id) {
  const inv = await api('/api/inventory');
  const i = inv.items.find((x) => x.id === id);
  if (!i) return;
  const plat = Object.entries(i.platforms || {});
  openDrawer(`
    <div style="display:flex;gap:8px;margin-bottom:10px"><span class="badge b-state">${human(i.status)}</span>${i.is_paper ? '<span class="badge b-paper">PAPER</span>' : ''}<span class="badge b-state">${i.purchase_path === 'shipped' ? 'Shipped path' : 'In-person path'}</span></div>
    <h2>${esc(i.code)} · ${esc(i.model)} ${i.storage_gb}GB</h2>
    <section><div class="money">
      <div><small>Cost</small><b class="num">${eur(i.purchase_cost)}</b></div><div><small>Repair</small><b class="num">${eur(i.repair_cost)}</b></div>
      <div><small>Predicted sale</small><b class="num">${eur(i.predicted_sale)}</b></div><div><small>Listing price</small><b class="num">${eur(i.listing_price)}</b></div>
      <div><small>Sale price</small><b class="num">${eur(i.sale_price)}</b></div><div><small>Net profit</small><b class="num">${i.net_profit != null ? signed(i.net_profit) : `${signed(i.predicted_profit)} est.`}</b></div>
    </div></section>
    ${i.return_window_ends_at ? `<div class="notice warn" style="margin-top:14px">Return window closes ${new Date(i.return_window_ends_at + 'Z').toLocaleString('en-GB')} — finish inspect-on-arrival before then.</div>` : ''}
    ${plat.length ? `<section><h3>Marketplace listings</h3><ul class="list">${plat.map(([k, v]) => `<li><span class="mk" style="width:22px;height:22px;font-size:9px">${MK[k] || '?'}</span>${MK_NAME[k] || k} → ${esc(v)}</li>`).join('')}</ul></section>` : ''}
    ${['INSPECTION', 'RETURN_WINDOW'].includes(i.status) ? `<section><h3>Inspection</h3><button class="btn primary" data-inspect="${i.id}">${i.status === 'INSPECTION' ? 'Start inspection checklist' : 'Start inspect-on-arrival'}</button><div id="insp"></div></section>` : ''}
    ${i.allowed.length ? `<section><h3>Move to</h3><form id="trans" class="toolbar" data-id="${i.id}">
      <select class="input" name="status" style="flex:1 1 180px">${i.allowed.map((s) => `<option value="${s}">${human(s)}</option>`).join('')}</select>
      <div id="trans-fields" style="display:contents"></div>
      <button class="btn primary" type="submit">Update</button></form></section>` : ''}`);
  const form = $('#trans');
  if (form) {
    const paint = () => {
      const need = NEEDS[form.status.value] || [];
      $('#trans-fields').innerHTML = need.map((n) => n === 'sale_platform'
        ? `<select class="input" name="sale_platform" style="flex:1 1 140px">${['vendora', 'facebook', 'skoop', 'vinted'].map((p) => `<option>${p}</option>`).join('')}</select>`
        : `<input class="input" name="${n}" type="number" step="0.01" min="0" placeholder="${human(n)} €" style="flex:1 1 140px" ${n === 'fees_paid' || n === 'repair_cost' ? '' : 'required'}>`).join('');
    };
    form.status.addEventListener('change', paint); paint();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = { status: form.status.value };
      for (const el of $$('#trans-fields [name]', form)) if (el.value !== '') body[el.name] = el.type === 'number' ? +el.value : el.value;
      try {
        const r = await post(`/api/inventory/${form.dataset.id}/transition`, body);
        toast(r.takedown?.length ? r.takedown.join(' · ') : `${r.code} → ${human(r.status)}`);
        closeDrawer(); refresh();
      } catch (err) { toast(err.message); }
    });
  }
}

drawer.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-inspect]');
  if (!b) return;
  const insp = await post(`/api/inventory/${b.dataset.inspect}/inspection`);
  b.remove();
  renderInspection(insp);
});

function renderInspection(insp) {
  const sections = [...new Set(insp.items.map((i) => i.section))];
  const go = insp.path === 'in_person' ? ['BUY', 'WALK_AWAY'] : ['KEEP', 'RETURN'];
  $('#insp').innerHTML = sections.map((s) => `<div style="margin-top:14px"><div class="small muted" style="font-weight:700;margin-bottom:4px">${esc(s)}</div>
    ${insp.items.filter((i) => i.section === s).map((i) => `<div class="insp-item"><span>${esc(i.label)}</span>
      <span class="tri" data-insp-item="${i.id}">${['PASS', 'FAIL', 'UNKNOWN'].map((v) => `<button type="button" data-v="${v}" aria-pressed="${i.result === v}">${v}</button>`).join('')}</span></div>`).join('')}</div>`).join('')
    + `<div class="actions">${go.map((g, k) => `<button class="btn ${k ? 'danger' : 'primary'}" data-insp-decide="${g}" data-insp="${insp.id}">${human(g)}</button>`).join('')}</div><div id="ret"></div>`;
}
drawer.addEventListener('click', async (e) => {
  const v = e.target.closest('.tri button');
  if (v) {
    const tri = v.parentElement;
    await post(`/api/inspection-items/${tri.dataset.inspItem}`, { result: v.dataset.v });
    $$('button', tri).forEach((x) => x.setAttribute('aria-pressed', String(x === v)));
    return;
  }
  const d = e.target.closest('[data-insp-decide]');
  if (d) {
    try {
      const r = await post(`/api/inspections/${d.dataset.insp}/decision`, { decision: d.dataset.inspDecide });
      if (r.return_text) $('#ret').innerHTML = `<div class="draft" style="margin-top:12px"><button class="chip-btn" data-copy="${esc(r.return_text)}">Copy</button><span class="muted small">return request — submit it on the platform yourself</span><br>${esc(r.return_text).replace(/\n/g, '<br>')}</div>`;
      else toast(`Inspection: ${human(r.decision)}. You can now move the item on.`);
    } catch (err) { toast(err.message); }
  }
});

/* ---------------------------------------------------------------- deals */
async function renderDeals() {
  await loadOverview();
  const rows = state.dealsScope === 'open'
    ? await api(`/api/deals${state.delivery ? `?delivery=${state.delivery}` : ''}`)
    : (await api('/api/listings')).filter((r) => !state.delivery || r.delivery === state.delivery);
  const k = state.sort.key, dir = state.sort.dir;
  rows.sort((a, b) => ((a[k] ?? -1e9) > (b[k] ?? -1e9) ? 1 : -1) * dir);
  const cols = [['tier', 'Tier'], ['model', 'Device'], ['price', 'Price', 'r'], ['my_max_buy', 'My max', 'r'], ['expected_sale', 'Exp. sale', 'r'], ['net_profit', 'Profit', 'r'], ['roi_percent', 'ROI', 'r'], ['deal_score', 'Score', 'r'], ['risk_level', 'Risk'], ['travel_minutes', 'Travel', 'r'], ['marketplace', 'Source'], ['first_seen_at', 'Seen']];
  $('#deals-table').innerHTML = rows.length ? `<table><thead><tr>${cols.map(([key, l, c]) => `<th class="${c || ''}"><button data-sort="${key}">${l}${k === key ? (dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}</tr></thead><tbody>
    ${rows.map((d) => `<tr data-open="${d.id}" style="${d.evaluation?.rejects?.length || d.decision ? 'opacity:.6' : ''}">
      <td>${tierBadge(d.tier)}</td><td><b>${esc(d.model || '?')}</b> ${d.storage_gb ? d.storage_gb + 'GB' : ''}<div class="small muted">${esc(d.title).slice(0, 48)}</div></td>
      <td class="r num">${eur(d.price)}</td><td class="r num">${eur(d.my_max_buy)}</td><td class="r num">${eur(d.expected_sale)}</td>
      <td class="r num ${d.net_profit >= 0 ? 'pos' : 'neg'}">${signed(d.net_profit)}</td><td class="r num">${pct(d.roi_percent)}</td>
      <td class="r num"><b>${d.deal_score != null ? Math.round(d.deal_score) : '—'}</b></td><td>${riskBadge(d.risk_level)}</td>
      <td class="r num">${d.delivery === 'shipped' ? '📦' : d.travel_minutes != null ? Math.round(d.travel_minutes) + 'm' : '?'}</td>
      <td>${MK_NAME[d.marketplace] || d.marketplace}${d.evaluation?.rejects?.length ? '' : ''}</td><td class="small muted">${ago(d.first_seen_at)}</td></tr>`).join('')}
    </tbody></table>` : '<div class="empty">No deals.</div>';
}
$('#deals-table').addEventListener('click', (e) => {
  const s = e.target.closest('[data-sort]');
  if (!s) return;
  e.stopPropagation();
  state.sort = { key: s.dataset.sort, dir: state.sort.key === s.dataset.sort ? -state.sort.dir : -1 };
  renderDeals();
});
bindSeg($('#deals-scope'), (d) => { state.dealsScope = d.scope; renderDeals(); });

/* ------------------------------------------------------------ inventory */
const DONE = ['COMPLETED', 'CANCELLED', 'REJECTED', 'RETURNED'];
async function renderInventory() {
  const inv = await api('/api/inventory');
  const items = inv.items.filter((i) => state.invScope === 'all' || (state.invScope === 'done' ? DONE.includes(i.status) : !DONE.includes(i.status)));
  const counts = {};
  inv.items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });
  $('#inv-pipeline').innerHTML = inv.statuses.filter((s) => counts[s]).map((s) => `<span class="badge b-state">${human(s)} · ${counts[s]}</span>`).join('');
  $('#inv-table').innerHTML = items.length ? `<table><thead><tr><th>Code</th><th>Device</th><th>Status</th><th class="r">Cost</th><th class="r">Predicted</th><th class="r">Sold</th><th class="r">Net</th><th class="hide-sm">Platform</th></tr></thead><tbody>
    ${items.map((i) => `<tr data-item="${i.id}"><td class="mono small">${esc(i.code)}</td><td><b>${esc(i.model)}</b> ${i.storage_gb}GB${i.battery_health ? ` <span class="small muted">· ${i.battery_health}%</span>` : ''}</td>
      <td><span class="badge b-state">${human(i.status)}</span></td><td class="r num">${eur(i.purchase_cost)}</td><td class="r num">${eur(i.predicted_sale)}</td>
      <td class="r num">${eur(i.sale_price)}</td><td class="r num ${(i.net_profit ?? i.predicted_profit) >= 0 ? 'pos' : 'neg'}">${i.net_profit != null ? signed(i.net_profit) : `<span class="muted">${signed(i.predicted_profit)}</span>`}</td>
      <td class="hide-sm">${MK_NAME[i.sale_platform] || ''}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Nothing here.</div>';
}
bindSeg($('#inv-scope'), (d) => { state.invScope = d.scope; renderInventory(); });

/* ------------------------------------------------------------ analytics */
async function renderAnalytics() {
  const a = await api('/api/analytics');
  const maxAbs = Math.max(1, ...a.score_buckets.flatMap((b) => [b.actual || 0, b.predicted || 0]));
  $('#an-buckets').innerHTML = a.score_buckets.length ? a.score_buckets.map((b) => `
    <div class="comp" style="grid-template-columns:70px 1fr 120px"><span><b>${b.bucket}</b> <span class="muted small">n=${b.n}</span></span>
      <span style="display:grid;gap:4px"><span class="bar"><i style="width:${(b.actual || 0) / maxAbs * 100}%"></i></span><span class="bar"><i style="width:${(b.predicted || 0) / maxAbs * 100}%;background:rgba(255,255,255,.28)"></i></span></span>
      <span class="num small" style="text-align:right">${eur(b.actual)} actual<br><span class="muted">${eur(b.predicted)} predicted</span></span></div>`).join('')
    + '<p class="small muted">Pink = actual average profit · grey = predicted. Suggestions to change weights are shown here once there is enough history — never applied without you.</p>'
    : '<div class="empty">No completed flips yet.</div>';
  const pmax = Math.max(1, ...a.platforms.map((p) => p.profit));
  $('#an-platforms').innerHTML = a.platforms.map((p) => `<div class="comp" style="grid-template-columns:90px 1fr 90px"><span>${MK_NAME[p.platform] || p.platform}</span><span class="bar"><i style="width:${p.profit / pmax * 100}%"></i></span><span class="num small" style="text-align:right">${eur(p.profit)} · ${p.n}</span></div>`).join('') || '<div class="empty">No sales yet.</div>';
  $('#an-models').innerHTML = `<table><thead><tr><th>Model</th><th class="r">Flips</th><th class="r">Profit</th><th class="r">Avg ROI</th><th class="r">Avg days to sell</th></tr></thead><tbody>
    ${a.models.map((m) => `<tr><td><b>${esc(m.model)}</b></td><td class="r num">${m.n}</td><td class="r num pos">${eur(m.profit)}</td><td class="r num">${pct(m.avg_roi)}</td><td class="r num">${m.avg_days ?? '—'}</td></tr>`).join('')}</tbody></table>`;
}

/* ------------------------------------------------------------ connectors */
async function renderConnectors() {
  const rows = await api('/api/connectors');
  $('#conn-grid').innerHTML = rows.map((c) => `<article class="card">
    <div class="card-h"><div style="display:flex;gap:10px;align-items:center"><span class="mk">${MK[c.name] || '?'}</span><h2>${esc(c.display_name)}</h2></div><span class="badge st-${c.state}">${c.state}</span></div>
    <dl class="kv"><dt>Discovery</dt><dd>${esc(c.discovery)}</dd><dt>Publishing</dt><dd>${esc(c.publishing)}</dd>
    ${Object.entries(c.operations).map(([k, v]) => `<dt>${human(k)}</dt><dd class="small ink2">${esc(v)}</dd>`).join('')}</dl>
    <p class="small muted" style="margin:12px 0 0">${esc(c.reason)}</p>
    <p class="small ink2" style="margin:6px 0 0">${esc(c.detail)}</p></article>`).join('');
}

/* -------------------------------------------------------------- settings */
async function renderSettings() {
  const s = await api('/api/settings');
  $('#set-blockers').innerHTML = s.blockers.length
    ? `<div class="notice warn"><b>LIVE mode is blocked</b> until you set these (PAPER mode uses labelled placeholders):<ul>${s.blockers.map((b) => `<li class="mono small">${esc(b)}</li>`).join('')}</ul></div>`
    : '<div class="notice info">Everything required for LIVE mode is set.</div>';
  const v = s.price_rule_version;
  $('#rules-src').textContent = v ? `${v.source}${v.is_sample ? ' · SAMPLE' : ''}` : 'none imported';
  $('#rules-table').innerHTML = `<table><thead><tr><th>Model</th><th class="r">Storage</th><th class="r">My max buy</th><th class="r">Min battery</th></tr></thead><tbody>
    ${s.price_rules.map((r) => `<tr><td>${esc(r.model)}</td><td class="r num">${r.storage_gb}GB</td><td class="r num"><b>${eur(r.max_buy_price)}</b></td><td class="r num">${r.min_battery_health ?? '—'}</td></tr>`).join('')}</tbody></table>`;
  const c = s.config;
  const row = (k, val) => `<dt class="mono small">${k}</dt><dd>${val == null ? '<span class="badge b-rej">not set</span>' : esc(typeof val === 'object' ? JSON.stringify(val) : val)}</dd>`;
  $('#set-config').innerHTML = `<dl class="kv">
    ${row('mode', c.mode)}${row('base_location', c.location.base_location)}
    ${row('location tiers (min)', `${c.location.excellent_minutes} / ${c.location.very_good_minutes} / ${c.location.preferred_max_minutes} / hard ${c.location.hard_max_minutes}`)}
    ${Object.entries(c.deal_rules).map(([k, val]) => row(k, val)).join('')}
    ${Object.entries(c.profit_rules).map(([k, val]) => row(k, val)).join('')}
    ${Object.entries(c.risk).map(([k, val]) => row(k, val)).join('')}
    ${row('weights', Object.values(c.deal_score_weights).join(' / '))}
    ${row('quiet_hours', c.notifications.quiet_hours)}
    ${row('telegram', s.telegram_enabled ? 'connected' : 'not configured (.env)')}
    ${row('claude api', s.claude_enabled ? 'configured' : 'not configured (.env)')}
    ${row('ai budget / month', c.ai.monthly_budget_usd)}</dl>
    <p class="small muted">Edit <span class="mono">config.yaml</span> and restart to change these. It is validated on load.</p>`;
}
$('#rules-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await post('/api/price-rules', new FormData(e.target));
    const rep = r.report;
    $('#rules-report').innerHTML = `<div class="notice info" style="margin-top:12px">Imported <b>${rep.imported}</b> rules.
      ${['unmatched_models', 'duplicates', 'missing_storage', 'bad_prices'].filter((k) => rep[k].length).map((k) => `<br>${human(k)}: ${rep[k].map(esc).join(', ')}`).join('')}</div>`;
    renderSettings();
  } catch (err) { toast(err.message); }
});

/* -------------------------------------------------------------- activity */
async function renderActivity() {
  const ev = await api('/api/events');
  $('#events').innerHTML = ev.length ? `<table><tbody>${ev.map((e) => `<tr><td class="small muted" style="white-space:nowrap">${ago(e.at)}</td><td><span class="badge b-state">${esc(e.kind)}</span></td><td>${esc(e.message)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">No events yet.</div>';
}

/* ---------------------------------------------------------------- intake */
$('#ask').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#ask-input');
  const text = input.value.trim();
  if (!text) return;
  try {
    const r = await post('/api/intake', { text });
    input.value = '';
    if (r.duplicate_of) toast(`Same item as #${r.duplicate_of} — linked, no new alert`);
    await openDeal(r.duplicate_of || r.id);
    refresh();
  } catch (err) { toast(err.message); }
});

/* ----------------------------------------------------------------- wire */
bindSeg($('#delivery-seg'), (d) => { state.delivery = d.delivery; refresh(); });
bindSeg($('#tier-seg'), (d) => { state.tiers = d.tier; renderDashboard(); });
bindSeg($('#range-seg'), (d) => { state.days = +d.days; renderChart(); });
bindSeg($('#profit-period'), (d) => { state.period = d.period; renderProfitCard(state.overview); });
$('#chart-table-btn').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  $('#chart').hidden = on; $('#chart-table').hidden = !on;
});
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => $('#view-dashboard').classList.contains('on') && renderChart(), 150); });

function refresh() { go(location.hash.slice(1) || 'dashboard'); }
paintIcons();
refresh();
setInterval(() => { if (!drawer.classList.contains('on') && document.visibilityState === 'visible') refresh(); }, 60000);
