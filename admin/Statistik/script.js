// ---------- Statistik-Dashboard ----------
// Reads the daily counters written by /analytics-track.js on the public
// site (Firestore collection "dailyStats", one document per day, IDs
// "YYYY-MM-DD"). Read-only here — this page never writes anything.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, query, where, orderBy, getDocs, documentId } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const CLICK_LABELS = {
  phone_header: 'Telefon (Kopfzeile)',
  phone_hero: 'Telefon (Startbereich)',
  phone_kontakt: 'Telefon (Kontakt)',
  instagram: 'Instagram',
  social_block: 'Social-Media-Icons',
  cta_block: 'Call-to-Action-Bausteine'
};

// ---------- Date helpers ----------
function fmtId(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function startOfWeek(d) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // Monday = 0
  r.setDate(r.getDate() - day);
  return r;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function getField(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : 0), obj) || 0;
}
function sumRange(dataMap, startId, endId, field) {
  let total = 0;
  for (const [id, data] of Object.entries(dataMap)) {
    if (id < startId || id > endId) continue;
    total += getField(data, field);
  }
  return total;
}
function deltaText(current, previous) {
  if (previous === 0) return current === 0 ? '±0 %' : '+∞ %';
  const pct = Math.round(((current - previous) / previous) * 100);
  return (pct > 0 ? '+' : pct < 0 ? '' : '±') + pct + ' %';
}

// ---------- Firestore ----------
let db = null;
try {
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.apiKey !== 'REPLACE_ME') {
    db = getFirestore(initializeApp(window.FIREBASE_CONFIG));
  }
} catch (e) {}

async function fetchRange(startId, endId) {
  const q = query(
    collection(db, 'dailyStats'),
    where(documentId(), '>=', startId),
    where(documentId(), '<=', endId),
    orderBy(documentId())
  );
  const snap = await getDocs(q);
  const map = {};
  snap.forEach(d => { map[d.id] = d.data(); });
  return map;
}

// ---------- Rendering ----------
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

function renderTrendChart(container, dataMap, days) {
  const today = new Date();
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const id = fmtId(d);
    points.push({ id, day: d.getDate(), value: getField(dataMap[id], 'pageviews') });
  }
  const max = Math.max(1, ...points.map(p => p.value));

  container.innerHTML = `
    <div class="trend-chart" role="img" aria-label="Seitenaufrufe der letzten ${days} Tage">
      ${points.map(p => `
        <div class="trend-bar-col">
          <span class="trend-bar-value">${p.value || ''}</span>
          <div class="trend-bar" style="height:${Math.max(4, Math.round((p.value / max) * 100))}%"></div>
          <span class="trend-bar-day">${p.day}.</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderClickBreakdown(container, dataMap, startId, endId) {
  const rows = Object.keys(CLICK_LABELS).map(key => ({
    key,
    label: CLICK_LABELS[key],
    value: sumRange(dataMap, startId, endId, 'clicks.' + key)
  }));
  const max = Math.max(1, ...rows.map(r => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (total === 0) {
    container.innerHTML = '<p class="admin-hint">Noch keine Klicks in diesem Zeitraum erfasst.</p>';
    return;
  }

  container.innerHTML = rows.map(r => `
    <div class="click-row">
      <span class="click-row-label">${r.label}</span>
      <div class="click-row-bar-track"><div class="click-row-bar" style="width:${Math.round((r.value / max) * 100)}%"></div></div>
      <span class="click-row-value">${r.value}</span>
    </div>
  `).join('');
}

async function loadDashboard() {
  const statusEl = document.getElementById('statsStatus');
  const contentEl = document.getElementById('statsContent');

  if (!db) {
    statusEl.textContent = 'Firebase ist noch nicht eingerichtet (firebase-config.js). Siehe FIRESTORE_SETUP.md im Statistik-Ordner.';
    return;
  }

  try {
    const today = new Date();
    const todayId = fmtId(today);
    const yestId = fmtId(addDays(today, -1));
    const thisWeekStartId = fmtId(startOfWeek(today));
    const lastWeekStartId = fmtId(addDays(startOfWeek(today), -7));
    const lastWeekEndId = fmtId(addDays(startOfWeek(today), -1));
    const thisMonthStartId = fmtId(startOfMonth(today));
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthStartId = fmtId(lastMonthDate);
    const lastMonthEndId = fmtId(addDays(startOfMonth(today), -1));

    const dataMap = await fetchRange(lastMonthStartId, todayId);

    const tiles = document.getElementById('statTiles');
    tiles.innerHTML = '';
    renderStatTile(tiles, 'Heute', sumRange(dataMap, todayId, todayId, 'pageviews'), sumRange(dataMap, yestId, yestId, 'pageviews'));
    renderStatTile(tiles, 'Diese Woche', sumRange(dataMap, thisWeekStartId, todayId, 'pageviews'), sumRange(dataMap, lastWeekStartId, lastWeekEndId, 'pageviews'));
    renderStatTile(tiles, 'Dieser Monat', sumRange(dataMap, thisMonthStartId, todayId, 'pageviews'), sumRange(dataMap, lastMonthStartId, lastMonthEndId, 'pageviews'));

    renderTrendChart(document.getElementById('trendChartWrap'), dataMap, 14);
    renderClickBreakdown(document.getElementById('clickBreakdown'), dataMap, thisMonthStartId, todayId);

    statusEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    statusEl.textContent = 'Statistiken konnten nicht geladen werden: ' + (err.message || err);
  }
}

loadDashboard();

// ---------- Theme toggle (same mechanism/key as the rest of the site) ----------
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    const isLight = document.documentElement.classList.contains('light');
    themeToggle.setAttribute('aria-pressed', String(isLight));
    try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
  });
}
