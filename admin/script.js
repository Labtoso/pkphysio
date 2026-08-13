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

async function ghGetSha(token, path) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${REPO_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error('GitHub-Fehler (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json.sha;
}

async function ghPutBinaryFile(token, path, base64Content, message, sha) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const body = { message: message, content: base64Content, branch: REPO_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = new Error('GitHub-Fehler beim Bild-Upload (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
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
const draggableSections = document.getElementById('draggableSections');

// ---------- Custom sections (page builder) ----------
function createCustomSectionCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Textblock</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field">
      <span>Text</span>
      <div class="admin-richtext-toolbar">
        <button type="button" class="rt-btn" data-cmd="bold"><b>B</b></button>
        <button type="button" class="rt-btn" data-cmd="italic"><i>I</i></button>
      </div>
      <div class="admin-richtext cs-text" contenteditable="true"></div>
    </label>
  `;
  section.querySelector('.cs-text').innerHTML = cs.text || '';
  const removeBtn = makeRemoveBtn(() => section.remove());
  removeBtn.textContent = 'Sektion entfernen';
  section.appendChild(removeBtn);
  initRichTextToolbar(section);
  makeSectionDraggable(section);
  return section;
}

function renderCustomSectionCards(customSections) {
  draggableSections.querySelectorAll('[data-custom="1"]').forEach(el => el.remove());
  customSections.forEach(cs => {
    draggableSections.appendChild(createCustomSectionCard(cs));
  });
}

function collectCustomSections() {
  return [...draggableSections.querySelectorAll('[data-custom="1"]')].map(section => ({
    id: section.dataset.sectionKey,
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    text: section.querySelector('.cs-text').innerHTML
  }));
}

document.getElementById('addSectionBtn').addEventListener('click', () => {
  const type = document.getElementById('newSectionType').value;
  if (type === 'textblock') {
    const cs = { id: 'custom-' + Date.now(), eyebrow: '', title: 'Neue Überschrift', text: '' };
    draggableSections.appendChild(createCustomSectionCard(cs));
  }
});

// ---------- Drag & drop reordering ----------
let dragEl = null;

function makeSectionDraggable(section) {
  section.setAttribute('draggable', 'true');
  section.addEventListener('dragstart', () => {
    dragEl = section;
    section.classList.add('dragging');
  });
  section.addEventListener('dragend', () => {
    section.classList.remove('dragging');
    dragEl = null;
  });
}

draggableSections.querySelectorAll('.draggable').forEach(makeSectionDraggable);

draggableSections.addEventListener('dragover', e => {
  e.preventDefault();
  if (!dragEl) return;
  const after = getDragAfterElement(draggableSections, e.clientY);
  if (after == null) draggableSections.appendChild(dragEl);
  else draggableSections.insertBefore(dragEl, after);
});

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.draggable:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: -Infinity }).element;
}

function applySectionOrder(order) {
  order.forEach(key => {
    const el = draggableSections.querySelector(`[data-section-key="${key}"]`);
    if (el) draggableSections.appendChild(el);
  });
}

function collectSectionOrder() {
  return [...draggableSections.querySelectorAll('.draggable')].map(el => el.dataset.sectionKey);
}

function fillFixedFields(data) {
  document.getElementById('meta_title').value = data.meta.title;
  document.getElementById('meta_description').value = data.meta.description;

  document.getElementById('design_primaryColor').value = data.design.primaryColor;
  document.getElementById('design_accentColor').value = data.design.accentColor;
  document.getElementById('design_fontFamily').value = data.design.fontFamily;
  document.getElementById('design_borderRadius').value = data.design.borderRadius;
  document.getElementById('design_borderRadius_val').textContent = data.design.borderRadius;
  document.getElementById('design_textScale').value = data.design.textScale;
  document.getElementById('design_textScale_val').textContent = data.design.textScale;
  document.getElementById('design_portraitWidth').value = data.design.portraitWidth;
  document.getElementById('design_logoHeight').value = data.design.logoHeight;

  document.getElementById('nav_ueberMich').value = data.nav.ueberMich;
  document.getElementById('nav_leistungen').value = data.nav.leistungen;
  document.getElementById('nav_faq').value = data.nav.faq;
  document.getElementById('nav_kontakt').value = data.nav.kontakt;
  document.getElementById('btn_headerCta').value = data.buttons.headerCta;
  document.getElementById('btn_kontaktCta').value = data.buttons.kontaktCta;
  document.getElementById('btn_mobileCta').value = data.buttons.mobileCta;

  document.getElementById('site_phone').value = data.site.phone;
  document.getElementById('site_phoneHref').value = data.site.phoneHref;
  document.getElementById('site_address').value = data.site.address;
  document.getElementById('site_email').value = data.site.email;
  document.getElementById('site_instagramHandle').value = data.site.instagramHandle;
  document.getElementById('site_instagramUrl').value = data.site.instagramUrl;

  document.getElementById('hero_eyebrow').value = data.hero.eyebrow;
  document.getElementById('hero_title').value = data.hero.title;
  document.getElementById('hero_subtitle').value = data.hero.subtitle;
  document.getElementById('hero_text').innerHTML = data.hero.text;
  document.getElementById('hero_ctaPrimary').value = data.hero.ctaPrimary;
  document.getElementById('hero_ctaSecondary').value = data.hero.ctaSecondary;

  document.getElementById('about_eyebrow').value = data.about.eyebrow;
  document.getElementById('about_title').value = data.about.title;
  document.getElementById('about_text').innerHTML = data.about.text;

  document.getElementById('leistungen_eyebrow').value = data.leistungen.eyebrow;
  document.getElementById('leistungen_title').value = data.leistungen.title;
  document.getElementById('service0_title').value = data.leistungen.services[0].title;
  document.getElementById('service0_text').innerHTML = data.leistungen.services[0].text;
  document.getElementById('service1_title').value = data.leistungen.services[1].title;
  document.getElementById('service1_text').innerHTML = data.leistungen.services[1].text;
  document.getElementById('angeboteEyebrow').value = data.leistungen.angeboteEyebrow;
  document.getElementById('angeboteTitle').value = data.leistungen.angeboteTitle;

  document.getElementById('faq_eyebrow').value = data.faq.eyebrow;
  document.getElementById('faq_title').value = data.faq.title;
  document.getElementById('faq_text').value = data.faq.text;

  document.getElementById('kontakt_eyebrow').value = data.kontakt.eyebrow;
  document.getElementById('kontakt_title').value = data.kontakt.title;
  document.getElementById('kontakt_text').innerHTML = data.kontakt.text;
}

function readFixedFields(data) {
  data.meta.title = document.getElementById('meta_title').value.trim();
  data.meta.description = document.getElementById('meta_description').value.trim();

  data.design.primaryColor = document.getElementById('design_primaryColor').value;
  data.design.accentColor = document.getElementById('design_accentColor').value;
  data.design.fontFamily = document.getElementById('design_fontFamily').value;
  data.design.borderRadius = Number(document.getElementById('design_borderRadius').value);
  data.design.textScale = Number(document.getElementById('design_textScale').value);
  data.design.portraitWidth = Number(document.getElementById('design_portraitWidth').value);
  data.design.logoHeight = Number(document.getElementById('design_logoHeight').value);

  data.nav.ueberMich = document.getElementById('nav_ueberMich').value;
  data.nav.leistungen = document.getElementById('nav_leistungen').value;
  data.nav.faq = document.getElementById('nav_faq').value;
  data.nav.kontakt = document.getElementById('nav_kontakt').value;
  data.buttons.headerCta = document.getElementById('btn_headerCta').value;
  data.buttons.kontaktCta = document.getElementById('btn_kontaktCta').value;
  data.buttons.mobileCta = document.getElementById('btn_mobileCta').value;

  data.site.phone = document.getElementById('site_phone').value.trim();
  data.site.phoneHref = document.getElementById('site_phoneHref').value.trim();
  data.site.address = document.getElementById('site_address').value.trim();
  data.site.email = document.getElementById('site_email').value.trim();
  data.site.instagramHandle = document.getElementById('site_instagramHandle').value.trim();
  data.site.instagramUrl = document.getElementById('site_instagramUrl').value.trim();

  data.hero.eyebrow = document.getElementById('hero_eyebrow').value;
  data.hero.title = document.getElementById('hero_title').value;
  data.hero.subtitle = document.getElementById('hero_subtitle').value;
  data.hero.text = document.getElementById('hero_text').innerHTML;
  data.hero.ctaPrimary = document.getElementById('hero_ctaPrimary').value;
  data.hero.ctaSecondary = document.getElementById('hero_ctaSecondary').value;

  data.about.eyebrow = document.getElementById('about_eyebrow').value;
  data.about.title = document.getElementById('about_title').value;
  data.about.text = document.getElementById('about_text').innerHTML;

  data.leistungen.eyebrow = document.getElementById('leistungen_eyebrow').value;
  data.leistungen.title = document.getElementById('leistungen_title').value;
  data.leistungen.services[0].title = document.getElementById('service0_title').value;
  data.leistungen.services[0].text = document.getElementById('service0_text').innerHTML;
  data.leistungen.services[1].title = document.getElementById('service1_title').value;
  data.leistungen.services[1].text = document.getElementById('service1_text').innerHTML;
  data.leistungen.angeboteEyebrow = document.getElementById('angeboteEyebrow').value;
  data.leistungen.angeboteTitle = document.getElementById('angeboteTitle').value;

  data.faq.eyebrow = document.getElementById('faq_eyebrow').value;
  data.faq.title = document.getElementById('faq_title').value;
  data.faq.text = document.getElementById('faq_text').value;

  data.kontakt.eyebrow = document.getElementById('kontakt_eyebrow').value;
  data.kontakt.title = document.getElementById('kontakt_title').value;
  data.kontakt.text = document.getElementById('kontakt_text').innerHTML;
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
      <label class="admin-field">
        <span>Antwort</span>
        <div class="admin-richtext-toolbar">
          <button type="button" class="rt-btn" data-cmd="bold"><b>B</b></button>
          <button type="button" class="rt-btn" data-cmd="italic"><i>I</i></button>
        </div>
        <div class="admin-richtext faq-a" contenteditable="true"></div>
      </label>
    `;
    row.querySelector('.faq-a').innerHTML = item.a;
    initRichTextToolbar(row);
    row.appendChild(makeRemoveBtn(() => { row.remove(); }));
    list.appendChild(row);
  });
}
function collectFaq() {
  return [...document.querySelectorAll('#faqList .admin-repeater-item')].map(row => ({
    q: row.querySelector('.faq-q').value,
    a: row.querySelector('.faq-a').innerHTML
  }));
}

function initRichTextToolbar(container) {
  container.querySelectorAll('.rt-btn').forEach(btn => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = '1';
    const editable = btn.closest('.admin-field').querySelector('[contenteditable]');
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      editable.focus();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });
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

// ---------- Images ----------
const IMAGE_KEYS = ['portrait', 'logoDark', 'logoLight', 'favicon'];
const pendingImages = {};

IMAGE_KEYS.forEach(key => {
  document.getElementById('file_' + key).addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    pendingImages[key] = file;
    document.getElementById('preview_' + key).src = URL.createObjectURL(file);
  });
});

function fillImagePreviews(images) {
  IMAGE_KEYS.forEach(key => {
    document.getElementById('preview_' + key).src = '../' + images[key];
  });
}

async function uploadPendingImages(token, data) {
  for (const key of IMAGE_KEYS) {
    const file = pendingImages[key];
    if (!file) continue;
    const path = 'Assets/' + sanitizeFilename(file.name);
    const base64 = await fileToBase64(file);
    const existingSha = await ghGetSha(token, path);
    await ghPutBinaryFile(token, path, base64, 'Bild aktualisiert über Admin-Panel (' + key + ')', existingSha);
    data.images[key] = path;
    delete pendingImages[key];
  }
}

// ---------- Login ----------
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Keine Antwort von GitHub nach ' + (ms / 1000) + ' Sekunden. Evtl. blockiert eine Firewall/Antivirus/VPN die Verbindung zu api.github.com.')), ms))
  ]);
}

function showEditor() {
  loginScreen.style.display = 'none';
  editorScreen.style.display = 'block';
}
function showLogin() {
  editorScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
}
showLogin();

async function login(token) {
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Prüfe Zugang …';
  try {
    const { sha, text } = await withTimeout(ghGetFile(token), 10000);
    const data = parseContentJs(text);

    state.token = token;
    state.sha = sha;
    state.data = data;

    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}

    fillFixedFields(data);
    fillImagePreviews(data.images);
    renderTimeline(data.about.timeline);
    renderAngebote(data.leistungen.angebote);
    renderFaq(data.faq.items);
    renderCustomSectionCards(data.customSections || []);
    applySectionOrder(data.order || ['hero', 'about', 'leistungen', 'faq', 'kontakt']);

    showEditor();
  } catch (err) {
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
  loginError.textContent = '';
  const token = tokenInput.value.trim();
  if (!token) {
    loginError.textContent = 'Bitte ein Token eingeben.';
    return;
  }
  login(token);
});
tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

document.getElementById('logoutBtn').addEventListener('click', () => {
  state = { token: null, sha: null, data: null };
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  tokenInput.value = '';
  showLogin();
});

// ---------- Save ----------
async function save() {
  if (!state.data) return;
  readFixedFields(state.data);
  state.data.about.timeline = collectTimeline();
  state.data.leistungen.angebote = collectAngebote();
  state.data.faq.items = collectFaq();
  state.data.customSections = collectCustomSections();
  state.data.order = collectSectionOrder();

  const hasImageUploads = IMAGE_KEYS.some(key => pendingImages[key]);

  [saveStatus].forEach(el => { el.className = 'admin-status'; el.textContent = hasImageUploads ? 'Lade Bilder hoch …' : 'Speichere …'; });

  try {
    if (hasImageUploads) {
      await uploadPendingImages(state.token, state.data);
      saveStatus.textContent = 'Speichere Texte …';
    }

    const newText = serializeContentJs(state.data);
    const newSha = await ghPutFile(state.token, state.sha, newText, 'Inhalte über Admin-Panel aktualisiert');
    state.sha = newSha;
    const actionsUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`;
    saveStatus.className = 'admin-status success';
    saveStatus.innerHTML = 'Gespeichert. Die Website aktualisiert sich in der Regel innerhalb von ein bis zwei Minuten. ' +
      '<a href="' + actionsUrl + '" target="_blank" rel="noopener">Fortschritt auf GitHub Actions ansehen →</a>';
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

// ---------- Static rich-text toolbars & design sliders ----------
initRichTextToolbar(document);

document.getElementById('design_borderRadius').addEventListener('input', e => {
  document.getElementById('design_borderRadius_val').textContent = e.target.value;
});
document.getElementById('design_textScale').addEventListener('input', e => {
  document.getElementById('design_textScale_val').textContent = e.target.value;
});

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
