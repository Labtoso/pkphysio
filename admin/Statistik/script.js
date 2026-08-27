// ---------- Statistik-Dashboard (GoatCounter) ----------
// Liest die Zahlen über die GoatCounter-API. Schreibt nie etwas — reine
// Anzeige. Der API-Token wird nur im Browser-Tab gehalten (sessionStorage),
// nie in eine Datei geschrieben.
const GC_CODE_KEY = 'pk_gc_code';
const GC_TOKEN_KEY = 'pk_gc_token';

const CLICK_LABELS = {
  phone_header: 'Telefon (Kopfzeile)',
  phone_hero: 'Telefon (Startbereich)',
  phone_kontakt: 'Telefon (Kontakt)',
  instagram: 'Instagram'
};
// Alles, was mit "social_" oder "cta_block" beginnt, wird zusätzlich
// automatisch mit eingesammelt (siehe collectClicks unten) — deckt auch
// Social-Media-Icons pro Plattform und CTA-Bausteine ab, ohne dass hier
// jede einzelne Plattform gepflegt werden muss.

// ---------- DOM refs ----------
const connectScreen = document.getElementById('connectScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const gcCodeInput = document.getElementById('gcCodeInput');
const gcTokenInput = document.getElementById('gcTokenInput');
const gcConnectBtn = document.getElementById('gcConnectBtn');
const gcConnectError = document.getElementById('gcConnectError');

// ---------- Date helpers ----------
function isoHour(d) {
  const r = new Date(d);
  r.setMinutes(0, 0, 0);
  return r.toISOString();
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function startOfWeek(d) {
  const r = startOfDay(d);
  const day = (r.getDay() + 6) % 7; // Montag = 0
  r.setDate(r.getDate() - day);
  return r;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function dayLabel(d) {
  return String(d.getDate()) + '.';
}

// ---------- GoatCounter API ----------
function gcAuthHeader(token) {
  return 'Basic ' + btoa(token + ':');
}
async function gcFetch(code, token, path, params) {
  const url = new URL(`https://${code}.goatcounter.com/api/v0${path}`);
  Object.entries(params || {}).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, v); });
  const res = await fetch(url.toString(), { headers: { Authorization: gcAuthHeader(token) } });
  if (!res.ok) {
    const err = new Error(res.status === 401 || res.status === 403 ? 'API-Token ungültig oder ohne Leserechte.' : 'GoatCounter-Fehler (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return res.json();
}
async function gcTotal(code, token, start, end) {
  const data = await gcFetch(code, token, '/stats/total', { start: isoHour(start), end: isoHour(end) });
  return { pageviews: data.total || 0, events: data.total_events || 0 };
}
async function gcHits(code, token, start, end, limit) {
  const data = await gcFetch(code, token, '/stats/hits', { start: isoHour(start), end: isoHour(end), limit: limit || 200 });
  return data.hits || [];
}

// ---------- Rendering ----------
function deltaText(current, previous) {
  if (previous === 0) return current === 0 ? '±0 %' : '+∞ %';
  const pct = Math.round(((current - previous) / previous) * 100);
  return (pct > 0 ? '+' : pct < 0 ? '' : '±') + pct + ' %';
}
function renderStatTile(container, label, current, previous) {
  const tile = document.createElement('div');
  tile.className = 'stat-tile';
  tile.innerHTML = `
    <span class="stat-tile-label">${label}</span>
    <span class="stat-tile-value">${current}</span>
    <span class="stat-tile-delta">${deltaText(current, previous)} ggü. Vorperiode</span>
  `;
  container.appendChild(tile);
}
function renderTrendChart(container, hits, days, today) {
  // Summiere alle Nicht-Event-Pfade (also echte Seitenaufrufe) pro Tag.
  const byDay = {};
  for (let i = days - 1; i >= 0; i--) {
    byDay[addDays(startOfDay(today), -i).toISOString().slice(0, 10)] = 0;
  }
  hits.filter(h => !h.event).forEach(h => {
    (h.stats || []).forEach(s => {
      if (s.day in byDay) byDay[s.day] += s.daily || 0;
    });
  });
  const points = Object.entries(byDay).map(([day, value]) => ({ day: new Date(day + 'T00:00:00'), value }));
  const max = Math.max(1, ...points.map(p => p.value));

  container.innerHTML = `
    <div class="trend-chart" role="img" aria-label="Seitenaufrufe der letzten ${days} Tage">
      ${points.map(p => `
        <div class="trend-bar-col">
          <span class="trend-bar-value">${p.value || ''}</span>
          <div class="trend-bar" style="height:${Math.max(4, Math.round((p.value / max) * 100))}%"></div>
          <span class="trend-bar-day">${dayLabel(p.day)}</span>
        </div>
      `).join('')}
    </div>
  `;
}
function renderClickBreakdown(container, hits) {
  const events = hits.filter(h => h.event);
  if (!events.length) {
    container.innerHTML = '<p class="admin-hint">Noch keine Klicks in diesem Zeitraum erfasst.</p>';
    return;
  }
  const rows = events
    .map(h => ({ key: h.path, label: CLICK_LABELS[h.path] || h.path, value: h.count || 0 }))
    .sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map(r => r.value));

  container.innerHTML = rows.map(r => `
    <div class="click-row">
      <span class="click-row-label">${r.label}</span>
      <div class="click-row-bar-track"><div class="click-row-bar" style="width:${Math.round((r.value / max) * 100)}%"></div></div>
      <span class="click-row-value">${r.value}</span>
    </div>
  `).join('');
}

async function loadDashboard(code, token) {
  const statusEl = document.getElementById('statsStatus');
  const contentEl = document.getElementById('statsContent');
  statusEl.hidden = false;
  statusEl.textContent = 'Lade Statistiken …';
  contentEl.hidden = true;

  try {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = addDays(thisWeekStart, -7);
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [todayStat, yestStat, weekStat, lastWeekStat, monthStat, lastMonthStat] = await Promise.all([
      gcTotal(code, token, today, now),
      gcTotal(code, token, yesterday, today),
      gcTotal(code, token, thisWeekStart, now),
      gcTotal(code, token, lastWeekStart, thisWeekStart),
      gcTotal(code, token, thisMonthStart, now),
      gcTotal(code, token, lastMonthStart, thisMonthStart)
    ]);

    const tiles = document.getElementById('statTiles');
    tiles.innerHTML = '';
    renderStatTile(tiles, 'Heute', todayStat.pageviews, yestStat.pageviews);
    renderStatTile(tiles, 'Diese Woche', weekStat.pageviews, lastWeekStat.pageviews);
    renderStatTile(tiles, 'Dieser Monat', monthStat.pageviews, lastMonthStat.pageviews);

    const trendHits = await gcHits(code, token, addDays(today, -13), now, 200);
    renderTrendChart(document.getElementById('trendChartWrap'), trendHits, 14, now);

    const monthHits = await gcHits(code, token, thisMonthStart, now, 200);
    renderClickBreakdown(document.getElementById('clickBreakdown'), monthHits);

    statusEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    statusEl.textContent = 'Statistiken konnten nicht geladen werden: ' + (err.message || err);
  }
}

// ---------- Connect screen ----------
function showConnect() {
  connectScreen.style.display = 'flex';
  dashboardScreen.style.display = 'none';
}
function showDashboard() {
  connectScreen.style.display = 'none';
  dashboardScreen.style.display = 'block';
}

gcConnectBtn.addEventListener('click', async () => {
  gcConnectError.textContent = '';
  const code = gcCodeInput.value.trim().replace(/^https?:\/\//, '').replace(/\.goatcounter\.com.*$/, '');
  const token = gcTokenInput.value.trim();
  if (!code || !token) {
    gcConnectError.textContent = 'Bitte Site-Code und API-Token eingeben.';
    return;
  }
  gcConnectBtn.disabled = true;
  gcConnectBtn.textContent = 'Prüfe …';
  try {
    await gcTotal(code, token, addDays(new Date(), -1), new Date());
    try {
      sessionStorage.setItem(GC_CODE_KEY, code);
      sessionStorage.setItem(GC_TOKEN_KEY, token);
    } catch (e) {}
    showDashboard();
    loadDashboard(code, token);
  } catch (err) {
    gcConnectError.textContent = err.message || 'Verbindung fehlgeschlagen.';
  } finally {
    gcConnectBtn.disabled = false;
    gcConnectBtn.textContent = 'Verbinden';
  }
});
gcTokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') gcConnectBtn.click(); });

document.getElementById('gcDisconnectBtn').addEventListener('click', () => {
  try {
    sessionStorage.removeItem(GC_CODE_KEY);
    sessionStorage.removeItem(GC_TOKEN_KEY);
  } catch (e) {}
  gcCodeInput.value = '';
  gcTokenInput.value = '';
  showConnect();
});

// ---------- Initial screen ----------
(function () {
  let code = null, token = null;
  try {
    code = sessionStorage.getItem(GC_CODE_KEY);
    token = sessionStorage.getItem(GC_TOKEN_KEY);
  } catch (e) {}
  if (code && token) {
    showDashboard();
    loadDashboard(code, token);
  } else {
    showConnect();
  }
})();

// ---------- Theme toggle (same mechanism/key as the rest of the site) ----------
const themeToggle = document.getElementById('themeToggle');
themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});
