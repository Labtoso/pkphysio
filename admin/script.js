// ---------- Config ----------
const REPO_OWNER = 'Labtoso';
const REPO_NAME = 'pkphysio';
const REPO_BRANCH = 'main';
const CONTENT_PATH = 'content.js';
const TOKEN_KEY = 'pk_admin_token';

// SHA-256 hash of the access password (never the plaintext). Only gates the
// login form itself; it is not a substitute for the GitHub token check.
const PIN_HASH = 'eec9bb67f607e0a241a430dd814b9407ef7a46084ddbdd7f4fb2f8e44760ad45';
const PIN_SESSION_KEY = 'pk_admin_pin_ok';
const PIN_ATTEMPTS_KEY = 'pk_admin_pin_attempts';
const PIN_LOCK_KEY = 'pk_admin_pin_lock_until';

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
const pinScreen = document.getElementById('pinScreen');
const pinInput = document.getElementById('pinInput');
const pinBtn = document.getElementById('pinBtn');
const pinError = document.getElementById('pinError');
const loginScreen = document.getElementById('loginScreen');
const editorScreen = document.getElementById('editorScreen');
const tokenInput = document.getElementById('tokenInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const saveStatus = document.getElementById('saveStatus');
const draggableSections = document.getElementById('draggableSections');

// ---------- Custom blocks (page builder) ----------
const pendingBlockImages = {}; // imageKey -> File
const tableBlockData = new WeakMap(); // section -> { columns, rows }

function blockUid() {
  return 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}
function blockImagePreviewSrc(path) {
  return path ? '../' + path : '';
}
function finishBlockCard(section) {
  const removeBtn = makeRemoveBtn(() => section.remove());
  removeBtn.textContent = 'Baustein entfernen';
  section.appendChild(removeBtn);
  return section;
}

// -- Textblock mit Bild --
function createTextImageCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'textimage';
  section.dataset.imagePath = cs.image || '';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Textblock mit Bild</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field">
      <span>Text</span>
      <div class="admin-richtext cs-text"></div>
    </label>
    <div class="admin-image-field">
      <span>Bild</span>
      <div class="admin-image-row">
        <img class="admin-image-preview cs-image-preview" src="${escapeAttr(blockImagePreviewSrc(cs.image))}">
        <input type="file" accept="image/*" class="cs-image-file">
      </div>
    </div>
    <div class="admin-radio-row">
      <label><input type="radio" name="cs-pos-${cs.id}" class="cs-pos" value="left" ${cs.imagePosition !== 'right' ? 'checked' : ''}> Bild links</label>
      <label><input type="radio" name="cs-pos-${cs.id}" class="cs-pos" value="right" ${cs.imagePosition === 'right' ? 'checked' : ''}> Bild rechts</label>
    </div>
  `;
  section.querySelector('.cs-text').innerHTML = cs.text || '';
  const preview = section.querySelector('.cs-image-preview');
  section.querySelector('.cs-image-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    pendingBlockImages[cs.id] = file;
    preview.src = URL.createObjectURL(file);
  });
  initQuillEditors(section);
  return finishBlockCard(section);
}
function collectTextImageCard(section) {
  const posEl = section.querySelector('.cs-pos:checked');
  return {
    id: section.dataset.sectionKey,
    type: 'textimage',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    text: getQuillHtml(section.querySelector('.cs-text')),
    image: section.dataset.imagePath || '',
    imagePosition: posEl ? posEl.value : 'left'
  };
}

// -- FAQ-Liste --
function createFaqBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'faq';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> FAQ-Liste</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-faq-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-faq-add">+ Frage hinzufügen</button>
  `;
  const list = section.querySelector('.cs-faq-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Frage</span><input class="cs-faq-q" type="text" value="${escapeAttr(item.q || '')}"></label>
      <label class="admin-field">
        <span>Antwort</span>
        <div class="admin-richtext cs-faq-a"></div>
      </label>
    `;
    row.querySelector('.cs-faq-a').innerHTML = item.a || '';
    initQuillEditors(row);
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.items && cs.items.length ? cs.items : [{ q: '', a: '' }]).forEach(renderRow);
  section.querySelector('.cs-faq-add').addEventListener('click', () => renderRow({ q: '', a: '' }));
  return finishBlockCard(section);
}
function collectFaqBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'faq',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    items: [...section.querySelectorAll('.cs-faq-list .admin-repeater-item')].map(row => ({
      q: row.querySelector('.cs-faq-q').value,
      a: getQuillHtml(row.querySelector('.cs-faq-a'))
    }))
  };
}

// -- Tabelle --
function createTableBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'table';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Tabelle</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-table-wrap"></div>
    <div class="admin-table-actions">
      <button type="button" class="admin-add-btn cs-table-add-row">+ Zeile</button>
      <button type="button" class="admin-add-btn cs-table-add-col">+ Spalte</button>
    </div>
  `;
  const tableData = {
    columns: cs.columns && cs.columns.length ? cs.columns.slice() : ['Spalte 1', 'Spalte 2'],
    rows: cs.rows && cs.rows.length ? cs.rows.map(r => r.slice()) : [['', '']]
  };
  tableBlockData.set(section, tableData);
  const wrap = section.querySelector('.cs-table-wrap');

  function renderTable() {
    wrap.innerHTML = '';
    const table = document.createElement('div');
    table.className = 'admin-table-editor';

    const headRow = document.createElement('div');
    headRow.className = 'admin-table-row admin-table-head';
    tableData.columns.forEach((col, ci) => {
      const cell = document.createElement('div');
      cell.className = 'admin-table-cell';
      cell.innerHTML = `<input type="text" value="${escapeAttr(col)}">`;
      cell.querySelector('input').addEventListener('input', e => { tableData.columns[ci] = e.target.value; });
      if (tableData.columns.length > 1) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'admin-table-cell-remove';
        del.title = 'Spalte entfernen';
        del.textContent = '×';
        del.addEventListener('click', () => {
          tableData.columns.splice(ci, 1);
          tableData.rows.forEach(r => r.splice(ci, 1));
          renderTable();
        });
        cell.appendChild(del);
      }
      headRow.appendChild(cell);
    });
    table.appendChild(headRow);

    tableData.rows.forEach((row, ri) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'admin-table-row';
      row.forEach((val, ci) => {
        const cell = document.createElement('div');
        cell.className = 'admin-table-cell';
        cell.innerHTML = `<input type="text" value="${escapeAttr(val)}">`;
        cell.querySelector('input').addEventListener('input', e => { tableData.rows[ri][ci] = e.target.value; });
        rowEl.appendChild(cell);
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'admin-table-row-remove';
      del.title = 'Zeile entfernen';
      del.textContent = '×';
      del.addEventListener('click', () => {
        tableData.rows.splice(ri, 1);
        if (!tableData.rows.length) tableData.rows.push(tableData.columns.map(() => ''));
        renderTable();
      });
      rowEl.appendChild(del);
      table.appendChild(rowEl);
    });

    wrap.appendChild(table);
  }
  renderTable();

  section.querySelector('.cs-table-add-row').addEventListener('click', () => {
    tableData.rows.push(tableData.columns.map(() => ''));
    renderTable();
  });
  section.querySelector('.cs-table-add-col').addEventListener('click', () => {
    tableData.columns.push('Spalte ' + (tableData.columns.length + 1));
    tableData.rows.forEach(r => r.push(''));
    renderTable();
  });

  return finishBlockCard(section);
}
function collectTableBlockCard(section) {
  const tableData = tableBlockData.get(section) || { columns: [], rows: [] };
  return {
    id: section.dataset.sectionKey,
    type: 'table',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    columns: tableData.columns.slice(),
    rows: tableData.rows.map(r => r.slice())
  };
}

// -- Bildergalerie --
function createGalleryBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'gallery';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Bildergalerie</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-gallery-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-gallery-add">+ Bild hinzufügen</button>
  `;
  const list = section.querySelector('.cs-gallery-list');
  let slotSeq = 0;
  function addSlot(imagePath) {
    const slotIndex = slotSeq++;
    const row = document.createElement('div');
    row.className = 'admin-repeater-item admin-gallery-slot';
    row.dataset.slotIndex = String(slotIndex);
    row.dataset.imagePath = imagePath || '';
    row.innerHTML = `
      <div class="admin-image-row">
        <img class="admin-image-preview cs-gallery-preview" src="${escapeAttr(blockImagePreviewSrc(imagePath))}">
        <input type="file" accept="image/*" class="cs-gallery-file">
      </div>
    `;
    const preview = row.querySelector('.cs-gallery-preview');
    row.querySelector('.cs-gallery-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      pendingBlockImages[cs.id + '::' + slotIndex] = file;
      preview.src = URL.createObjectURL(file);
    });
    row.appendChild(makeRemoveBtn(() => {
      delete pendingBlockImages[cs.id + '::' + slotIndex];
      row.remove();
    }));
    list.appendChild(row);
  }
  (cs.images && cs.images.length ? cs.images : ['']).forEach(addSlot);
  section.querySelector('.cs-gallery-add').addEventListener('click', () => addSlot(''));
  return finishBlockCard(section);
}
function collectGalleryBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'gallery',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    images: [...section.querySelectorAll('.admin-gallery-slot')].map(row => row.dataset.imagePath || '').filter(Boolean)
  };
}

// -- Zitat --
function createQuoteBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'quote';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Zitat</h2>
    <label class="admin-field"><span>Zitat-Text</span><textarea class="cs-quote-text" rows="3">${escapeHtml(cs.text || '')}</textarea></label>
    <label class="admin-field"><span>Autor / Quelle (optional)</span><input class="cs-quote-author" type="text" value="${escapeAttr(cs.author || '')}"></label>
  `;
  return finishBlockCard(section);
}
function collectQuoteBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'quote',
    text: section.querySelector('.cs-quote-text').value,
    author: section.querySelector('.cs-quote-author').value
  };
}

// -- Call-to-Action --
function createCtaBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'cta';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Call-to-Action</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field"><span>Text</span><textarea class="cs-cta-text" rows="2">${escapeHtml(cs.text || '')}</textarea></label>
    <label class="admin-field"><span>Button-Text</span><input class="cs-cta-label" type="text" value="${escapeAttr(cs.buttonLabel || '')}"></label>
    <label class="admin-field"><span>Button-Link (z. B. tel:+43…, mailto:…, https://…)</span><input class="cs-cta-url" type="text" value="${escapeAttr(cs.buttonUrl || '')}"></label>
  `;
  return finishBlockCard(section);
}
function collectCtaBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'cta',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    text: section.querySelector('.cs-cta-text').value,
    buttonLabel: section.querySelector('.cs-cta-label').value,
    buttonUrl: section.querySelector('.cs-cta-url').value
  };
}

// -- Video --
function createVideoBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'video';
  section.innerHTML = `
    <h2><span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span> Video</h2>
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field"><span>YouTube- oder Vimeo-Link</span><input class="cs-video-url" type="text" placeholder="https://www.youtube.com/watch?v=…" value="${escapeAttr(cs.videoUrl || '')}"></label>
  `;
  return finishBlockCard(section);
}
function collectVideoBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'video',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    videoUrl: section.querySelector('.cs-video-url').value
  };
}

// -- Block-Registry / Baustein-Bibliothek --
const BLOCK_TYPES = {
  textimage: {
    label: 'Textblock mit Bild',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="8" rx="1"/><circle cx="6" cy="7.2" r="1"/><path d="M3.8 10.8L6 8.6l2.2 2.2"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="9" x2="21" y2="9"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="3" y1="19" x2="15" y2="19"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'textimage', eyebrow: '', title: 'Neue Überschrift', text: '', image: '', imagePosition: 'left' }),
    create: createTextImageCard,
    collect: collectTextImageCard
  },
  faq: {
    label: 'FAQ-Liste',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.2 9.5a2.8 2.8 0 015.4 1c0 1.8-2.6 1.6-2.6 3.6"/><line x1="12" y1="17" x2="12" y2="17.1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'faq', eyebrow: '', title: 'Häufige Fragen', items: [{ q: '', a: '' }] }),
    create: createFaqBlockCard,
    collect: collectFaqBlockCard
  },
  table: {
    label: 'Tabelle',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'table', eyebrow: '', title: 'Tabelle', columns: ['Spalte 1', 'Spalte 2'], rows: [['', '']] }),
    create: createTableBlockCard,
    collect: collectTableBlockCard
  },
  gallery: {
    label: 'Bildergalerie',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'gallery', eyebrow: '', title: 'Galerie', images: [] }),
    create: createGalleryBlockCard,
    collect: collectGalleryBlockCard
  },
  quote: {
    label: 'Zitat',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8c-2.2 0-3.5 1.6-3.5 3.7 0 1.8 1.1 3 2.7 3 1.3 0 2.3-.9 2.3-2.2 0-1.1-.8-1.9-1.9-1.9-.2 0-.4 0-.5.1.2-1.3 1.3-2.2 2.6-2.3"/><path d="M16 8c-2.2 0-3.5 1.6-3.5 3.7 0 1.8 1.1 3 2.7 3 1.3 0 2.3-.9 2.3-2.2 0-1.1-.8-1.9-1.9-1.9-.2 0-.4 0-.5.1.2-1.3 1.3-2.2 2.6-2.3"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'quote', text: '', author: '' }),
    create: createQuoteBlockCard,
    collect: collectQuoteBlockCard
  },
  cta: {
    label: 'Call-to-Action',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="3.5"/><line x1="9" y1="12.5" x2="15" y2="12.5"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'cta', eyebrow: '', title: 'Bereit für den ersten Termin?', text: '', buttonLabel: 'Jetzt anrufen', buttonUrl: '' }),
    create: createCtaBlockCard,
    collect: collectCtaBlockCard
  },
  video: {
    label: 'Video',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'video', eyebrow: '', title: 'Video', videoUrl: '' }),
    create: createVideoBlockCard,
    collect: collectVideoBlockCard
  }
};

function createBlockCard(cs) {
  const type = BLOCK_TYPES[cs.type] ? cs.type : 'textimage';
  return BLOCK_TYPES[type].create(cs);
}

function renderCustomSectionCards(customSections) {
  draggableSections.querySelectorAll('[data-custom="1"]').forEach(el => el.remove());
  customSections.forEach(cs => {
    draggableSections.appendChild(createBlockCard(cs));
  });
}

function collectCustomSections() {
  return [...draggableSections.querySelectorAll('[data-custom="1"]')].map(section => {
    const type = BLOCK_TYPES[section.dataset.blockType] ? section.dataset.blockType : 'textimage';
    return BLOCK_TYPES[type].collect(section);
  });
}

function renderBlockPicker() {
  const grid = document.getElementById('blockPickerGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(BLOCK_TYPES).map(([type, def]) => `
    <button type="button" class="admin-block-picker-btn" data-block-type="${type}">
      <span class="admin-block-picker-icon">${def.icon}</span>
      <span class="admin-block-picker-label">${escapeHtml(def.label)}</span>
    </button>
  `).join('');
  grid.querySelectorAll('.admin-block-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const def = BLOCK_TYPES[btn.dataset.blockType];
      if (!def) return;
      const card = def.create(def.defaults());
      draggableSections.appendChild(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}
renderBlockPicker();

async function uploadPendingBlockImages(token, data) {
  if (!Object.keys(pendingBlockImages).length) return;
  const sections = [...draggableSections.querySelectorAll('[data-custom="1"]')];
  for (const section of sections) {
    const id = section.dataset.sectionKey;
    const type = section.dataset.blockType;
    const cs = data.customSections.find(c => c.id === id);
    if (!cs) continue;

    if (type === 'textimage' && pendingBlockImages[id]) {
      const file = pendingBlockImages[id];
      const path = 'Assets/Blocks/' + id + '-' + sanitizeFilename(file.name);
      const base64 = await fileToBase64(file);
      const existingSha = await ghGetSha(token, path);
      await ghPutBinaryFile(token, path, base64, 'Bild hochgeladen über Admin-Panel', existingSha);
      cs.image = path;
      section.dataset.imagePath = path;
      delete pendingBlockImages[id];
    }

    if (type === 'gallery') {
      const rows = [...section.querySelectorAll('.admin-gallery-slot')];
      const images = [];
      for (const row of rows) {
        const slotIndex = row.dataset.slotIndex;
        const key = id + '::' + slotIndex;
        if (pendingBlockImages[key]) {
          const file = pendingBlockImages[key];
          const path = 'Assets/Blocks/' + id + '-' + slotIndex + '-' + sanitizeFilename(file.name);
          const base64 = await fileToBase64(file);
          const existingSha = await ghGetSha(token, path);
          await ghPutBinaryFile(token, path, base64, 'Galerie-Bild hochgeladen über Admin-Panel', existingSha);
          row.dataset.imagePath = path;
          delete pendingBlockImages[key];
          images.push(path);
        } else if (row.dataset.imagePath) {
          images.push(row.dataset.imagePath);
        }
      }
      cs.images = images;
    }
  }
}

// ---------- Drag & drop reordering (SortableJS) ----------
Sortable.create(draggableSections, {
  handle: '.admin-drag-handle',
  animation: 150,
  ghostClass: 'admin-sortable-ghost',
  chosenClass: 'dragging',
  onStart: () => document.body.classList.add('admin-dragging-active'),
  onEnd: () => document.body.classList.remove('admin-dragging-active')
});

function applySectionOrder(order) {
  order.forEach(key => {
    const el = draggableSections.querySelector(`[data-section-key="${key}"]`);
    if (el) draggableSections.appendChild(el);
  });
}

function collectSectionOrder() {
  return [...draggableSections.querySelectorAll('.draggable')].map(el => el.dataset.sectionKey);
}

// ---------- Hide/show core sections ----------
function setSectionHidden(section, hidden) {
  section.classList.toggle('hidden-section', hidden);
  section.dataset.hidden = hidden ? '1' : '';
  const btn = section.querySelector('.admin-hide-btn');
  if (btn) btn.textContent = hidden ? 'Wieder einblenden' : 'Ausblenden';
}

document.querySelectorAll('.admin-hide-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.draggable');
    setSectionHidden(section, section.dataset.hidden !== '1');
  });
});

function applyHiddenSections(hiddenKeys) {
  draggableSections.querySelectorAll('.draggable[data-section-key]').forEach(section => {
    setSectionHidden(section, hiddenKeys.includes(section.dataset.sectionKey));
  });
}

function collectHiddenSections() {
  return [...draggableSections.querySelectorAll('.draggable[data-hidden="1"]')].map(el => el.dataset.sectionKey);
}

// ---------- Remove/restore core sections ----------
const CORE_SECTION_NAMES = {
  hero: 'Startbereich',
  about: 'Über mich',
  leistungen: 'Leistungen & Angebote',
  faq: 'FAQ',
  kontakt: 'Kontakt'
};
const removedSectionsEl = document.getElementById('removedSections');
const removedSectionsWrap = document.getElementById('removedSectionsWrap');

function updateRemovedWrapVisibility() {
  removedSectionsWrap.hidden = removedSectionsEl.children.length === 0;
}

function removeCoreSection(section) {
  const key = section.dataset.sectionKey;
  section.style.display = 'none';
  removedSectionsEl.appendChild(section);

  const row = document.createElement('div');
  row.className = 'admin-removed-row';
  row.innerHTML = `<span>${CORE_SECTION_NAMES[key] || key}</span>`;
  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.className = 'admin-restore-btn';
  restoreBtn.textContent = 'Wiederherstellen';
  restoreBtn.addEventListener('click', () => {
    section.style.display = '';
    draggableSections.appendChild(section);
    row.remove();
    updateRemovedWrapVisibility();
  });
  row.appendChild(restoreBtn);
  removedSectionsEl.appendChild(row);
  updateRemovedWrapVisibility();
}

document.querySelectorAll('.admin-remove-core-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.draggable');
    const name = CORE_SECTION_NAMES[section.dataset.sectionKey] || 'diese Sektion';
    if (confirm(`"${name}" wirklich entfernen? Du kannst sie danach über die Liste "Entfernte Sektionen" weiter unten wiederherstellen.`)) {
      removeCoreSection(section);
    }
  });
});

function resetRemovedSections() {
  Object.keys(CORE_SECTION_NAMES).forEach(key => {
    const section = removedSectionsEl.querySelector(`[data-section-key="${key}"]`);
    if (section) {
      section.style.display = '';
      draggableSections.appendChild(section);
    }
  });
  removedSectionsEl.innerHTML = '';
  updateRemovedWrapVisibility();
}

function applyRemovedSections(order) {
  resetRemovedSections();
  Object.keys(CORE_SECTION_NAMES).forEach(key => {
    if (!order.includes(key)) {
      const section = draggableSections.querySelector(`[data-section-key="${key}"]`);
      if (section) removeCoreSection(section);
    }
  });
}

function fillFixedFields(data) {
  document.getElementById('meta_title').value = data.meta.title;
  document.getElementById('meta_description').value = data.meta.description;

  document.getElementById('design_primaryColor').value = data.design.primaryColor;
  document.getElementById('design_accentColor').value = data.design.accentColor;
  populateFontSelects(data.customFonts || []);
  document.getElementById('design_headingFont').value = data.design.headingFont;
  document.getElementById('design_bodyFont').value = data.design.bodyFont;
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

  document.getElementById('site_phone').value = data.site.phone;
  document.getElementById('site_phoneHref').value = data.site.phoneHref;
  document.getElementById('site_address').value = data.site.address;
  document.getElementById('site_email').value = data.site.email;
  document.getElementById('site_instagramHandle').value = data.site.instagramHandle;
  document.getElementById('site_instagramUrl').value = data.site.instagramUrl;

  document.getElementById('hero_eyebrow').value = data.hero.eyebrow;
  document.getElementById('hero_title').value = data.hero.title;
  document.getElementById('hero_subtitle').value = data.hero.subtitle;
  setQuillHtml('hero_text', data.hero.text);
  document.getElementById('hero_ctaPrimary').value = data.hero.ctaPrimary;
  document.getElementById('hero_ctaSecondary').value = data.hero.ctaSecondary;

  document.getElementById('about_eyebrow').value = data.about.eyebrow;
  document.getElementById('about_title').value = data.about.title;
  setQuillHtml('about_text', data.about.text);

  document.getElementById('leistungen_eyebrow').value = data.leistungen.eyebrow;
  document.getElementById('leistungen_title').value = data.leistungen.title;
  document.getElementById('service0_title').value = data.leistungen.services[0].title;
  setQuillHtml('service0_text', data.leistungen.services[0].text);
  document.getElementById('service1_title').value = data.leistungen.services[1].title;
  setQuillHtml('service1_text', data.leistungen.services[1].text);
  document.getElementById('angeboteEyebrow').value = data.leistungen.angeboteEyebrow;
  document.getElementById('angeboteTitle').value = data.leistungen.angeboteTitle;

  document.getElementById('faq_eyebrow').value = data.faq.eyebrow;
  document.getElementById('faq_title').value = data.faq.title;
  document.getElementById('faq_text').value = data.faq.text;

  document.getElementById('kontakt_eyebrow').value = data.kontakt.eyebrow;
  document.getElementById('kontakt_title').value = data.kontakt.title;
  setQuillHtml('kontakt_text', data.kontakt.text);
}

function readFixedFields(data) {
  data.meta.title = document.getElementById('meta_title').value.trim();
  data.meta.description = document.getElementById('meta_description').value.trim();

  data.design.primaryColor = document.getElementById('design_primaryColor').value;
  data.design.accentColor = document.getElementById('design_accentColor').value;
  data.design.headingFont = document.getElementById('design_headingFont').value;
  data.design.bodyFont = document.getElementById('design_bodyFont').value;
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

  data.site.phone = document.getElementById('site_phone').value.trim();
  data.site.phoneHref = document.getElementById('site_phoneHref').value.trim();
  data.site.address = document.getElementById('site_address').value.trim();
  data.site.email = document.getElementById('site_email').value.trim();
  data.site.instagramHandle = document.getElementById('site_instagramHandle').value.trim();
  data.site.instagramUrl = document.getElementById('site_instagramUrl').value.trim();

  data.hero.eyebrow = document.getElementById('hero_eyebrow').value;
  data.hero.title = document.getElementById('hero_title').value;
  data.hero.subtitle = document.getElementById('hero_subtitle').value;
  data.hero.text = getQuillHtml('hero_text');
  data.hero.ctaPrimary = document.getElementById('hero_ctaPrimary').value;
  data.hero.ctaSecondary = document.getElementById('hero_ctaSecondary').value;

  data.about.eyebrow = document.getElementById('about_eyebrow').value;
  data.about.title = document.getElementById('about_title').value;
  data.about.text = getQuillHtml('about_text');

  data.leistungen.eyebrow = document.getElementById('leistungen_eyebrow').value;
  data.leistungen.title = document.getElementById('leistungen_title').value;
  data.leistungen.services[0].title = document.getElementById('service0_title').value;
  data.leistungen.services[0].text = getQuillHtml('service0_text');
  data.leistungen.services[1].title = document.getElementById('service1_title').value;
  data.leistungen.services[1].text = getQuillHtml('service1_text');
  data.leistungen.angeboteEyebrow = document.getElementById('angeboteEyebrow').value;
  data.leistungen.angeboteTitle = document.getElementById('angeboteTitle').value;

  data.faq.eyebrow = document.getElementById('faq_eyebrow').value;
  data.faq.title = document.getElementById('faq_title').value;
  data.faq.text = document.getElementById('faq_text').value;

  data.kontakt.eyebrow = document.getElementById('kontakt_eyebrow').value;
  data.kontakt.title = document.getElementById('kontakt_title').value;
  data.kontakt.text = getQuillHtml('kontakt_text');
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
        <div class="admin-richtext faq-a"></div>
      </label>
    `;
    row.querySelector('.faq-a').innerHTML = item.a;
    initQuillEditors(row);
    row.appendChild(makeRemoveBtn(() => { row.remove(); }));
    list.appendChild(row);
  });
}
function collectFaq() {
  return [...document.querySelectorAll('#faqList .admin-repeater-item')].map(row => ({
    q: row.querySelector('.faq-q').value,
    a: getQuillHtml(row.querySelector('.faq-a'))
  }));
}

// ---------- Rich text editor (Quill, bubble theme: options appear on text selection) ----------
function quillToolbarOptions() {
  return [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ];
}

function initQuillEditors(container) {
  const roots = container.matches && container.matches('.admin-richtext') ? [container] : [];
  if (container.querySelectorAll) roots.push(...container.querySelectorAll('.admin-richtext'));
  roots.forEach(el => {
    if (el.__quill) return;
    const initialHtml = el.innerHTML;
    el.innerHTML = '';
    const quill = new Quill(el, { theme: 'bubble', modules: { toolbar: quillToolbarOptions() } });
    if (initialHtml) quill.clipboard.dangerouslyPasteHTML(initialHtml);
    el.__quill = quill;
  });
}

function getQuillHtml(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  return el && el.__quill ? el.__quill.root.innerHTML : (el ? el.innerHTML : '');
}

function setQuillHtml(el, html) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  if (el.__quill) {
    el.__quill.setText('');
    el.__quill.clipboard.dangerouslyPasteHTML(html || '');
  } else {
    el.innerHTML = html || '';
  }
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

// ---------- Fonts ----------
const FONT_OPTIONS = {
  poppins: 'Poppins',
  inter: 'Inter',
  montserrat: 'Montserrat',
  playfair: 'Playfair Display',
  lora: 'Lora',
  roboto: 'Roboto'
};
const pendingFonts = {}; // tempId -> File

function populateFontSelects(customFonts) {
  const selects = [document.getElementById('design_headingFont'), document.getElementById('design_bodyFont')];
  selects.forEach(select => {
    const current = select.value;
    select.innerHTML = '';
    Object.entries(FONT_OPTIONS).forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
    });
    customFonts.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = f.name + ' (eigene Schriftart)';
      select.appendChild(opt);
    });
    if (current) select.value = current;
  });
}

function renderCustomFontsList(customFonts) {
  const list = document.getElementById('customFontsList');
  list.innerHTML = '';
  customFonts.forEach(f => {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.dataset.fontName = f.name;
    row.dataset.fontFile = f.file;
    row.innerHTML = `<span>${escapeHtml(f.name)}</span> <span class="admin-hint" style="display:inline;margin:0;">(${escapeHtml(f.file)})</span>`;
    row.appendChild(makeRemoveBtn(() => {
      row.remove();
      populateFontSelects(collectCustomFonts());
    }));
    list.appendChild(row);
  });
}

function collectCustomFonts() {
  return [...document.querySelectorAll('#customFontsList .admin-repeater-item')].map(row => ({
    name: row.dataset.fontName,
    file: row.dataset.fontFile
  }));
}

document.getElementById('addFontBtn').addEventListener('click', () => {
  const nameInput = document.getElementById('newFontName');
  const fileInput = document.getElementById('newFontFile');
  const name = nameInput.value.trim();
  const file = fileInput.files[0];
  if (!name || !file) {
    alert('Bitte einen Namen eingeben und eine Schriftart-Datei auswählen.');
    return;
  }
  const tempId = 'pending-' + Date.now();
  pendingFonts[tempId] = file;

  const row = document.createElement('div');
  row.className = 'admin-repeater-item';
  row.dataset.fontName = name;
  row.dataset.fontFile = '';
  row.dataset.pendingId = tempId;
  row.innerHTML = `<span>${escapeHtml(name)}</span> <span class="admin-hint" style="display:inline;margin:0;">(wird beim Speichern hochgeladen)</span>`;
  row.appendChild(makeRemoveBtn(() => {
    delete pendingFonts[tempId];
    row.remove();
    populateFontSelects(collectCustomFonts());
  }));
  document.getElementById('customFontsList').appendChild(row);

  populateFontSelects(collectCustomFonts());
  nameInput.value = '';
  fileInput.value = '';
});

async function uploadPendingFonts(token, data) {
  const rows = [...document.querySelectorAll('#customFontsList .admin-repeater-item')];
  for (const row of rows) {
    const tempId = row.dataset.pendingId;
    if (!tempId) continue;
    const file = pendingFonts[tempId];
    if (!file) continue;
    const path = 'Assets/Fonts/' + sanitizeFilename(file.name);
    const base64 = await fileToBase64(file);
    const existingSha = await ghGetSha(token, path);
    await ghPutBinaryFile(token, path, base64, 'Schriftart hochgeladen über Admin-Panel (' + row.dataset.fontName + ')', existingSha);
    row.dataset.fontFile = path;
    delete row.dataset.pendingId;
    delete pendingFonts[tempId];
  }
  data.customFonts = collectCustomFonts();
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
  updateStickybarHeight();
}
function showLogin() {
  pinScreen.style.display = 'none';
  editorScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
}

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

    renderCustomFontsList(data.customFonts || []);
    fillFixedFields(data);
    fillImagePreviews(data.images);
    renderTimeline(data.about.timeline);
    renderAngebote(data.leistungen.angebote);
    renderFaq(data.faq.items);
    renderCustomSectionCards(data.customSections || []);
    const order = data.order || ['hero', 'about', 'leistungen', 'faq', 'kontakt'];
    applySectionOrder(order);
    applyHiddenSections(data.hiddenSections || []);
    applyRemovedSections(order);

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
  state.data.hiddenSections = collectHiddenSections();

  const hasImageUploads = IMAGE_KEYS.some(key => pendingImages[key]);
  const hasFontUploads = Object.keys(pendingFonts).length > 0;
  const hasBlockImageUploads = Object.keys(pendingBlockImages).length > 0;

  [saveStatus].forEach(el => { el.className = 'admin-status'; el.textContent = (hasImageUploads || hasFontUploads || hasBlockImageUploads) ? 'Lade Dateien hoch …' : 'Speichere …'; });

  try {
    if (hasImageUploads) {
      await uploadPendingImages(state.token, state.data);
    }
    if (hasBlockImageUploads) {
      await uploadPendingBlockImages(state.token, state.data);
    }
    if (hasFontUploads) {
      await uploadPendingFonts(state.token, state.data);
    } else {
      state.data.customFonts = collectCustomFonts();
    }
    if (hasImageUploads || hasFontUploads || hasBlockImageUploads) {
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
initQuillEditors(document);

document.getElementById('design_borderRadius').addEventListener('input', e => {
  document.getElementById('design_borderRadius_val').textContent = e.target.value;
});
document.getElementById('design_textScale').addEventListener('input', e => {
  document.getElementById('design_textScale_val').textContent = e.target.value;
});

// ---------- PIN gate (obscures the login form from casual visitors; the
// GitHub token is still the real access control) ----------
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function pinLockRemainingMs() {
  let until = 0;
  try { until = Number(sessionStorage.getItem(PIN_LOCK_KEY) || 0); } catch (e) {}
  return Math.max(0, until - Date.now());
}

function pinDelayForAttempts(n) {
  const steps = [0, 0, 0, 5, 15, 30, 60, 120, 300];
  return (steps[Math.min(n, steps.length - 1)] ?? 300) * 1000;
}

let pinLockTimer = null;
function updatePinLockUI() {
  const remaining = pinLockRemainingMs();
  clearTimeout(pinLockTimer);
  if (remaining > 0) {
    pinBtn.disabled = true;
    pinInput.disabled = true;
    pinError.textContent = 'Zu viele Versuche. Bitte warte ' + Math.ceil(remaining / 1000) + ' Sekunden.';
    pinLockTimer = setTimeout(updatePinLockUI, 1000);
  } else {
    pinBtn.disabled = false;
    pinInput.disabled = false;
    if (pinError.textContent.startsWith('Zu viele Versuche')) pinError.textContent = '';
  }
}

function showPinGate() {
  loginScreen.style.display = 'none';
  editorScreen.style.display = 'none';
  pinScreen.style.display = 'flex';
  updatePinLockUI();
}

async function submitPin() {
  if (pinLockRemainingMs() > 0) return;
  const value = pinInput.value;
  if (!value) return;

  pinBtn.disabled = true;
  pinBtn.textContent = 'Prüfe …';
  const hash = await sha256Hex(value);
  pinBtn.textContent = 'Weiter';

  if (hash === PIN_HASH) {
    try {
      sessionStorage.setItem(PIN_SESSION_KEY, '1');
      sessionStorage.removeItem(PIN_ATTEMPTS_KEY);
      sessionStorage.removeItem(PIN_LOCK_KEY);
    } catch (e) {}
    pinInput.value = '';
    pinError.textContent = '';
    showLogin();
  } else {
    let attempts = 0;
    try {
      attempts = Number(sessionStorage.getItem(PIN_ATTEMPTS_KEY) || 0) + 1;
      sessionStorage.setItem(PIN_ATTEMPTS_KEY, String(attempts));
      const delay = pinDelayForAttempts(attempts);
      if (delay > 0) sessionStorage.setItem(PIN_LOCK_KEY, String(Date.now() + delay));
    } catch (e) {}
    pinInput.value = '';
    pinInput.focus();
    pinError.textContent = 'Falsches Passwort.';
    updatePinLockUI();
  }
}

pinBtn.addEventListener('click', submitPin);
pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitPin(); });

// ---------- Initial screen ----------
(function () {
  let pinAlreadyOk = false;
  try { pinAlreadyOk = sessionStorage.getItem(PIN_SESSION_KEY) === '1'; } catch (e) {}
  if (pinAlreadyOk) {
    showLogin();
  } else {
    showPinGate();
  }
})();

// ---------- Spellcheck: turn off everywhere, including fields added later ----------
function disableSpellcheck(root) {
  const candidates = [];
  if (root.matches && root.matches('input[type="text"], textarea, [contenteditable="true"]')) candidates.push(root);
  if (root.querySelectorAll) candidates.push(...root.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]'));
  candidates.forEach(el => {
    el.spellcheck = false;
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('autocapitalize', 'off');
  });
}
disableSpellcheck(document);
new MutationObserver(mutations => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node.nodeType === 1) disableSpellcheck(node);
    });
  });
}).observe(editorScreen, { childList: true, subtree: true });

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

// ---------- Sticky bar height (for scroll offset) ----------
const adminStickybar = document.querySelector('.admin-stickybar');
function updateStickybarHeight() {
  if (adminStickybar) {
    document.documentElement.style.setProperty('--stickybar-height', adminStickybar.offsetHeight + 16 + 'px');
  }
}
window.addEventListener('resize', updateStickybarHeight);
updateStickybarHeight();

// ---------- Quick nav (jump to section) ----------
document.querySelectorAll('.admin-quicknav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ---------- Search / filter ----------
const adminSearchInput = document.getElementById('adminSearch');
const adminSearchEmpty = document.getElementById('adminSearchEmpty');

function nearestSubheadingText(el) {
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.classList.contains('admin-subheading')) return sib.textContent;
    if (sib.matches('.admin-field, .admin-image-field, .admin-repeater-item, .admin-color-row, .admin-repeater')) break;
    sib = sib.previousElementSibling;
  }
  return '';
}

function sectionHeadingText(section) {
  const heading = section.querySelector(':scope > h2, :scope > .admin-section-header > h2');
  return heading ? heading.textContent.toLowerCase() : '';
}

function filterSection(section, query) {
  if (!query) {
    section.hidden = false;
    section.querySelectorAll('.admin-search-hidden').forEach(el => el.classList.remove('admin-search-hidden'));
    return true;
  }

  const headingMatches = sectionHeadingText(section).includes(query);

  const blocks = [...section.querySelectorAll('.admin-color-row, .admin-field, .admin-image-field, .admin-repeater-item')]
    .filter(el => {
      if (el.classList.contains('admin-field') && el.closest('.admin-color-row')) return false;
      if ((el.classList.contains('admin-field') || el.classList.contains('admin-image-field')) && el.closest('.admin-repeater-item')) return false;
      return true;
    });

  let anyVisible = headingMatches;

  blocks.forEach(block => {
    const haystack = (block.textContent + ' ' + nearestSubheadingText(block)).toLowerCase();
    const matches = headingMatches || haystack.includes(query);
    block.classList.toggle('admin-search-hidden', !matches);
    if (matches) anyVisible = true;
  });

  section.hidden = !anyVisible;
  return anyVisible;
}

function filterAdminContent() {
  const query = adminSearchInput.value.trim().toLowerCase();
  const sections = document.querySelectorAll('.admin-content .admin-section');
  let anySectionVisible = !query;
  sections.forEach(section => {
    if (filterSection(section, query)) anySectionVisible = true;
  });
  adminSearchEmpty.hidden = !query || anySectionVisible;
}

if (adminSearchInput) {
  adminSearchInput.addEventListener('input', filterAdminContent);
}
