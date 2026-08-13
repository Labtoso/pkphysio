document.getElementById('bootStatus').textContent = 'admin.js gestartet …';

// ---------- Config ----------
const REPO_OWNER = 'Labtoso';
const REPO_NAME = 'pkphysio';
const REPO_BRANCH = 'main';
const CONTENT_PATH = 'content.js';
const TOKEN_KEY = 'pk_admin_token';

// ---------- Base64 helpers (UTF-8 safe) ----------
function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode('0x' + hex)));
}
function base64ToUtf8(b64) {
  return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// ---------- GitHub API ----------
function ghHeaders(token) {
  return {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json'
  };
}

async function ghGetFile(token) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}?ref=${REPO_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) {
    const err = new Error('GitHub-Fehler beim Laden (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return { sha: json.sha, text: base64ToUtf8(json.content.replace(/\n/g, '')) };
}

async function ghPutFile(token, sha, newText, message) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || 'Update content via admin panel',
      content: utf8ToBase64(newText),
      sha: sha,
      branch: REPO_BRANCH
    })
  });
  if (!res.ok) {
    const err = new Error('GitHub-Fehler beim Speichern (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json.content.sha;
}

function parseContentJs(text) {
  const match = text.match(/window\.SITE_CONTENT\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error('content.js konnte nicht gelesen werden (unerwartetes Format).');
  return JSON.parse(match[1]);
}

function serializeContentJs(data) {
  return 'window.SITE_CONTENT = ' + JSON.stringify(data, null, 2) + ';\n';
}

// ---------- State ----------
let state = { token: null, sha: null, data: null };

// ---------- DOM refs ----------
const loginScreen = document.getElementById('loginScreen');
const editorScreen = document.getElementById('editorScreen');
const tokenInput = document.getElementById('tokenInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const saveStatus = document.getElementById('saveStatus');

const FIELD_IDS = [
  'site_phone', 'site_phoneHref', 'site_address', 'site_email', 'site_instagramHandle', 'site_instagramUrl',
  'hero_eyebrow', 'hero_title', 'hero_subtitle', 'hero_text', 'hero_ctaPrimary', 'hero_ctaSecondary',
  'about_eyebrow', 'about_title', 'about_text',
  'leistungen_eyebrow', 'leistungen_title',
  'service0_title', 'service0_text', 'service1_title', 'service1_text',
  'angeboteEyebrow', 'angeboteTitle',
  'faq_eyebrow', 'faq_title', 'faq_text',
  'kontakt_eyebrow', 'kontakt_title', 'kontakt_text'
];

function fillFixedFields(data) {
  document.getElementById('site_phone').value = data.site.phone;
  document.getElementById('site_phoneHref').value = data.site.phoneHref;
  document.getElementById('site_address').value = data.site.address;
  document.getElementById('site_email').value = data.site.email;
  document.getElementById('site_instagramHandle').value = data.site.instagramHandle;
  document.getElementById('site_instagramUrl').value = data.site.instagramUrl;

  document.getElementById('hero_eyebrow').value = data.hero.eyebrow;
  document.getElementById('hero_title').value = data.hero.title;
  document.getElementById('hero_subtitle').value = data.hero.subtitle;
  document.getElementById('hero_text').value = data.hero.text;
  document.getElementById('hero_ctaPrimary').value = data.hero.ctaPrimary;
  document.getElementById('hero_ctaSecondary').value = data.hero.ctaSecondary;

  document.getElementById('about_eyebrow').value = data.about.eyebrow;
  document.getElementById('about_title').value = data.about.title;
  document.getElementById('about_text').value = data.about.text;

  document.getElementById('leistungen_eyebrow').value = data.leistungen.eyebrow;
  document.getElementById('leistungen_title').value = data.leistungen.title;
  document.getElementById('service0_title').value = data.leistungen.services[0].title;
  document.getElementById('service0_text').value = data.leistungen.services[0].text;
  document.getElementById('service1_title').value = data.leistungen.services[1].title;
  document.getElementById('service1_text').value = data.leistungen.services[1].text;
  document.getElementById('angeboteEyebrow').value = data.leistungen.angeboteEyebrow;
  document.getElementById('angeboteTitle').value = data.leistungen.angeboteTitle;

  document.getElementById('faq_eyebrow').value = data.faq.eyebrow;
  document.getElementById('faq_title').value = data.faq.title;
  document.getElementById('faq_text').value = data.faq.text;

  document.getElementById('kontakt_eyebrow').value = data.kontakt.eyebrow;
  document.getElementById('kontakt_title').value = data.kontakt.title;
  document.getElementById('kontakt_text').value = data.kontakt.text;
}

function readFixedFields(data) {
  data.site.phone = document.getElementById('site_phone').value.trim();
  data.site.phoneHref = document.getElementById('site_phoneHref').value.trim();
  data.site.address = document.getElementById('site_address').value.trim();
  data.site.email = document.getElementById('site_email').value.trim();
  data.site.instagramHandle = document.getElementById('site_instagramHandle').value.trim();
  data.site.instagramUrl = document.getElementById('site_instagramUrl').value.trim();

  data.hero.eyebrow = document.getElementById('hero_eyebrow').value;
  data.hero.title = document.getElementById('hero_title').value;
  data.hero.subtitle = document.getElementById('hero_subtitle').value;
  data.hero.text = document.getElementById('hero_text').value;
  data.hero.ctaPrimary = document.getElementById('hero_ctaPrimary').value;
  data.hero.ctaSecondary = document.getElementById('hero_ctaSecondary').value;

  data.about.eyebrow = document.getElementById('about_eyebrow').value;
  data.about.title = document.getElementById('about_title').value;
  data.about.text = document.getElementById('about_text').value;

  data.leistungen.eyebrow = document.getElementById('leistungen_eyebrow').value;
  data.leistungen.title = document.getElementById('leistungen_title').value;
  data.leistungen.services[0].title = document.getElementById('service0_title').value;
  data.leistungen.services[0].text = document.getElementById('service0_text').value;
  data.leistungen.services[1].title = document.getElementById('service1_title').value;
  data.leistungen.services[1].text = document.getElementById('service1_text').value;
  data.leistungen.angeboteEyebrow = document.getElementById('angeboteEyebrow').value;
  data.leistungen.angeboteTitle = document.getElementById('angeboteTitle').value;

  data.faq.eyebrow = document.getElementById('faq_eyebrow').value;
  data.faq.title = document.getElementById('faq_title').value;
  data.faq.text = document.getElementById('faq_text').value;

  data.kontakt.eyebrow = document.getElementById('kontakt_eyebrow').value;
  data.kontakt.title = document.getElementById('kontakt_title').value;
  data.kontakt.text = document.getElementById('kontakt_text').value;
}

// ---------- Repeaters ----------
function makeRemoveBtn(onRemove) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'admin-remove-btn';
  btn.textContent = 'Entfernen';
  btn.addEventListener('click', onRemove);
  return btn;
}

function renderTimeline(items) {
  const list = document.getElementById('timelineList');
  list.innerHTML = '';
  items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Zeitraum</span><input class="tl-date" type="text" value="${escapeAttr(item.date)}"></label>
      <label class="admin-field"><span>Beschreibung</span><input class="tl-text" type="text" value="${escapeAttr(item.text)}"></label>
    `;
    row.appendChild(makeRemoveBtn(() => { row.remove(); }));
    list.appendChild(row);
  });
}
function collectTimeline() {
  return [...document.querySelectorAll('#timelineList .admin-repeater-item')].map(row => ({
    date: row.querySelector('.tl-date').value,
    text: row.querySelector('.tl-text').value
  }));
}

function renderAngebote(items) {
  const list = document.getElementById('angeboteList');
  list.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Titel</span><input class="of-title" type="text" value="${escapeAttr(item.title)}"></label>
      <label class="admin-field"><span>Punkte (eine Zeile pro Punkt)</span><textarea class="of-items" rows="3">${escapeHtml((item.items || []).join('\n'))}</textarea></label>
      <label class="admin-field"><span>Überschrift Unterliste (optional, z.B. "bisherige Events:")</span><input class="of-sub-heading" type="text" value="${escapeAttr(item.subheading || '')}"></label>
      <label class="admin-field"><span>Unterliste (eine Zeile pro Punkt, optional)</span><textarea class="of-sub-items" rows="3">${escapeHtml((item.subitems || []).join('\n'))}</textarea></label>
    `;
    row.appendChild(makeRemoveBtn(() => { row.remove(); }));
    list.appendChild(row);
  });
}
function collectAngebote() {
  return [...document.querySelectorAll('#angeboteList .admin-repeater-item')].map(row => ({
    title: row.querySelector('.of-title').value,
    items: row.querySelector('.of-items').value.split('\n').map(s => s.trim()).filter(Boolean),
    subheading: row.querySelector('.of-sub-heading').value,
    subitems: row.querySelector('.of-sub-items').value.split('\n').map(s => s.trim()).filter(Boolean)
  }));
}

function renderFaq(items) {
  const list = document.getElementById('faqList');
  list.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Frage</span><input class="faq-q" type="text" value="${escapeAttr(item.q)}"></label>
      <label class="admin-field"><span>Antwort</span><textarea class="faq-a" rows="3">${escapeHtml(item.a)}</textarea></label>
    `;
    row.appendChild(makeRemoveBtn(() => { row.remove(); }));
    list.appendChild(row);
  });
}
function collectFaq() {
  return [...document.querySelectorAll('#faqList .admin-repeater-item')].map(row => ({
    q: row.querySelector('.faq-q').value,
    a: row.querySelector('.faq-a').value
  }));
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.querySelectorAll('[data-add]').forEach(btn => {
  btn.addEventListener('click', () => {
    const kind = btn.getAttribute('data-add');
    if (kind === 'timeline') renderTimeline([...collectTimeline(), { date: '', text: '' }]);
    if (kind === 'angebote') renderAngebote([...collectAngebote(), { title: '', items: [], subheading: '', subitems: [] }]);
    if (kind === 'faq') renderFaq([...collectFaq(), { q: '', a: '' }]);
  });
});

// ---------- Login ----------
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT: Keine Antwort von GitHub nach ' + (ms / 1000) + ' Sekunden. Evtl. blockiert eine Firewall/Antivirus/VPN die Verbindung zu api.github.com.')), ms))
  ]);
}

async function login(token) {
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Prüfe Zugang …';
  alert('Schritt 1: Sende jetzt Anfrage an api.github.com. Klicke OK und warte.');
  try {
    const { sha, text } = await withTimeout(ghGetFile(token), 10000);
    alert('Schritt 2: Antwort von GitHub erhalten! Verarbeite Inhalt …');
    const data = parseContentJs(text);

    state.token = token;
    state.sha = sha;
    state.data = data;

    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}

    fillFixedFields(data);
    renderTimeline(data.about.timeline);
    renderAngebote(data.leistungen.angebote);
    renderFaq(data.faq.items);

    loginScreen.hidden = true;
    editorScreen.hidden = false;
    alert('Schritt 3: Fertig, Editor sollte jetzt sichtbar sein.');
  } catch (err) {
    alert('FEHLER: ' + err.message + ' | status=' + err.status);
    if (err.status === 401) {
      loginError.textContent = 'Token ungültig oder abgelaufen.';
    } else if (err.status === 404) {
      loginError.textContent = 'Repository oder content.js nicht gefunden. Wurde der Code schon nach GitHub gepusht?';
    } else if (err.status === 403) {
      loginError.textContent = 'Kein Zugriff. Prüfe, ob das Token Zugriff auf "pkphysio" mit "Contents: Read and write" hat.';
    } else {
      loginError.textContent = err.message || 'Unbekannter Fehler.';
    }
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Anmelden';
  }
}

loginBtn.addEventListener('click', () => {
  alert('Button-Klick erkannt. Klicke OK, dann versuche ich mich anzumelden.');
  loginError.textContent = '';
  const token = tokenInput.value.trim();
  if (!token) {
    loginError.textContent = 'Bitte ein Token eingeben.';
    return;
  }
  login(token);
});

document.getElementById('bootStatus').textContent = 'Bereit. Token eingeben und auf Anmelden klicken.';
tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

document.getElementById('logoutBtn').addEventListener('click', () => {
  state = { token: null, sha: null, data: null };
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  tokenInput.value = '';
  editorScreen.hidden = true;
  loginScreen.hidden = false;
});

// ---------- Save ----------
async function save() {
  if (!state.data) return;
  readFixedFields(state.data);
  state.data.about.timeline = collectTimeline();
  state.data.leistungen.angebote = collectAngebote();
  state.data.faq.items = collectFaq();

  const newText = serializeContentJs(state.data);

  [saveStatus].forEach(el => { el.className = 'admin-status'; el.textContent = 'Speichere …'; });

  try {
    const newSha = await ghPutFile(state.token, state.sha, newText, 'Inhalte über Admin-Panel aktualisiert');
    state.sha = newSha;
    saveStatus.className = 'admin-status success';
    saveStatus.textContent = 'Gespeichert. Die Website aktualisiert sich in der Regel innerhalb von ein bis zwei Minuten.';
  } catch (err) {
    saveStatus.className = 'admin-status error';
    if (err.status === 409) {
      saveStatus.textContent = 'Konflikt: Die Datei wurde inzwischen anderswo geändert. Bitte Seite neu laden und erneut versuchen.';
    } else if (err.status === 403) {
      saveStatus.textContent = 'Kein Schreibzugriff mit diesem Token.';
    } else {
      saveStatus.textContent = err.message || 'Speichern fehlgeschlagen.';
    }
  }
}

document.getElementById('saveBtn').addEventListener('click', save);
document.getElementById('saveBtnBottom').addEventListener('click', save);

// ---------- Auto-login if a token is already in this tab's session ----------
(function () {
  try {
    const existing = sessionStorage.getItem(TOKEN_KEY);
    if (existing) {
      tokenInput.value = existing;
      login(existing);
    }
  } catch (e) {}
})();
