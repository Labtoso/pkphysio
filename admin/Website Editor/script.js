const REPO_OWNER = 'Labtoso';
const REPO_NAME = 'pkphysio';
const REPO_BRANCH = 'main';
const CONTENT_PATH = 'content.js';
const TOKEN_KEY = 'pk_admin_token';
const PIN_SESSION_KEY = 'pk_admin_pin_ok';
const PIN_ATTEMPTS_KEY = 'pk_admin_pin_attempts';
const PIN_LOCK_KEY = 'pk_admin_pin_lock_until';

function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode('0x' + hex)));
}
function base64ToUtf8(b64) {
  return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

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

let state = { token: null, sha: null, data: null };

const editorScreen = document.getElementById('editorScreen');
const saveStatus = document.getElementById('saveStatus');
const draggableSections = document.getElementById('draggableSections');

const pendingBlockImages = {};
const tableBlockData = new WeakMap();

function blockUid() {
  return 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}
function blockImagePreviewSrc(path) {
  return path ? '../../' + path : '';
}
const PENCIL_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M14 7l3 3"/></svg>';

function blockHeaderHtml(cs, typeLabel) {
  const displayLabel = cs.customLabel || typeLabel;
  return `
    <div class="admin-section-header">
      <h2>
        <span class="admin-drag-handle" title="Ziehen zum Verschieben">≡</span>
        <span class="admin-block-label" data-default-label="${escapeAttr(typeLabel)}">${escapeHtml(displayLabel)}</span>
        <button type="button" class="admin-block-rename-btn" title="Namen bearbeiten" aria-label="Namen bearbeiten">${PENCIL_ICON}</button>
      </h2>
      <div class="admin-header-actions"></div>
    </div>
  `;
}
function wireBlockRename(section) {
  const labelSpan = section.querySelector('.admin-block-label');
  const renameBtn = section.querySelector('.admin-block-rename-btn');
  if (!labelSpan || !renameBtn) return;
  renameBtn.addEventListener('click', () => {
    const current = labelSpan.textContent;
    const defaultLabel = labelSpan.dataset.defaultLabel;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'admin-block-label-input';
    input.value = current === defaultLabel ? '' : current;
    input.placeholder = defaultLabel;
    labelSpan.replaceWith(input);
    input.focus();
    input.select();
    const commit = () => {
      const value = input.value.trim();
      const newSpan = document.createElement('span');
      newSpan.className = 'admin-block-label';
      newSpan.dataset.defaultLabel = defaultLabel;
      newSpan.textContent = value || defaultLabel;
      section.dataset.customLabel = value;
      input.replaceWith(newSpan);
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); input.value = current === defaultLabel ? '' : current; input.blur(); }
    });
  });
}
function finishBlockCard(section, cs) {
  section.dataset.customLabel = cs.customLabel || '';
  wireBlockRename(section);
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'admin-remove-core-btn';
  removeBtn.textContent = 'Entfernen';
  removeBtn.addEventListener('click', () => openRemoveBlockModal(section));
  const actions = section.querySelector('.admin-header-actions');
  if (actions) actions.appendChild(removeBtn);
  else section.appendChild(removeBtn);
  return section;
}

function createTextImageCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'textimage';
  section.dataset.imagePath = cs.image || '';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Textblock mit Bild')}
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
        <button type="button" class="admin-image-remove-btn cs-image-remove">Bild entfernen</button>
      </div>
    </div>
    <div class="admin-radio-row">
      <label><input type="radio" name="cs-pos-${cs.id}" class="cs-pos" value="left" ${cs.imagePosition !== 'right' ? 'checked' : ''}> Bild links</label>
      <label><input type="radio" name="cs-pos-${cs.id}" class="cs-pos" value="right" ${cs.imagePosition === 'right' ? 'checked' : ''}> Bild rechts</label>
    </div>
    <h3 class="admin-subheading">Weitere Unterabschnitte (optional)</h3>
    <p class="admin-hint">Zusätzliche Überschrift-und-Text-Blöcke, die unter dem Haupttext dieses Bausteins erscheinen.</p>
    <div class="cs-subblocks-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-subblock-add">+ Unterabschnitt hinzufügen</button>
  `;
  section.querySelector('.cs-text').innerHTML = cs.text || '';
  const preview = section.querySelector('.cs-image-preview');
  const fileInput = section.querySelector('.cs-image-file');
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    pendingBlockImages[cs.id] = file;
    preview.src = URL.createObjectURL(file);
  });
  section.querySelector('.cs-image-remove').addEventListener('click', () => {
    delete pendingBlockImages[cs.id];
    section.dataset.imagePath = '';
    preview.src = '';
    fileInput.value = '';
  });
  const subList = section.querySelector('.cs-subblocks-list');
  function renderSubRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Unterüberschrift (optional)</span><input class="cs-sub-heading" type="text" value="${escapeAttr(item.heading || '')}"></label>
      <label class="admin-field">
        <span>Text</span>
        <div class="admin-richtext cs-sub-text"></div>
      </label>
    `;
    row.querySelector('.cs-sub-text').innerHTML = item.text || '';
    initQuillEditors(row);
    row.appendChild(makeRemoveBtn(() => row.remove()));
    subList.appendChild(row);
  }
  (cs.subblocks || []).forEach(renderSubRow);
  section.querySelector('.cs-subblock-add').addEventListener('click', () => renderSubRow({ heading: '', text: '' }));
  initQuillEditors(section);
  return finishBlockCard(section, cs);
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
    imagePosition: posEl ? posEl.value : 'left',
    subblocks: [...section.querySelectorAll('.cs-subblocks-list .admin-repeater-item')].map(row => ({
      heading: row.querySelector('.cs-sub-heading').value,
      text: getQuillHtml(row.querySelector('.cs-sub-text'))
    }))
  };
}

function createFaqBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'faq';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'FAQ-Liste')}
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
  return finishBlockCard(section, cs);
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

function createTableBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'table';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Tabelle')}
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

  return finishBlockCard(section, cs);
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

const GALLERY_LAYOUTS = [
  ['grid', 'Raster'],
  ['masonry', 'Mauerwerk'],
  ['carousel', 'Karussell'],
  ['featured', 'Hervorgehoben'],
  ['mosaic', 'Mosaik'],
  ['offset', 'Versetzt'],
  ['justified', 'Zeilenweise'],
  ['circles', 'Kreise'],
  ['stack', 'Liste'],
  ['diagonal', 'Diagonal'],
  ['marquee-left', 'Laufband nach links'],
  ['marquee-right', 'Laufband nach rechts']
];
const GALLERY_SIZES = [
  ['small', 'Klein'],
  ['medium', 'Mittel'],
  ['large', 'Groß'],
  ['xlarge', 'Sehr groß']
];
const GALLERY_ANIMATIONS = [
  ['fade', 'Sanft einblenden'],
  ['zoom', 'Hineinzoomen'],
  ['slide', 'Von der Seite'],
  ['flip', 'Kippen'],
  ['blur', 'Unschärfe auflösen']
];

function createGalleryBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'gallery';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Bildergalerie')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="admin-color-row">
      <label class="admin-field admin-field-inline"><span>Layout</span>
        <select class="cs-gallery-layout">
          ${GALLERY_LAYOUTS.map(([v, l]) => `<option value="${v}" ${cs.layout === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
      <label class="admin-field admin-field-inline"><span>Spalten</span>
        <select class="cs-gallery-columns">
          ${[2, 3, 4, 5, 6].map(n => `<option value="${n}" ${(cs.columns || 3) === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="admin-color-row">
      <label class="admin-field admin-field-inline"><span>Bildgröße</span>
        <select class="cs-gallery-size">
          ${GALLERY_SIZES.map(([v, l]) => `<option value="${v}" ${(cs.size || 'medium') === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
      <label class="admin-field admin-field-inline"><span>Animation</span>
        <select class="cs-gallery-animation">
          ${GALLERY_ANIMATIONS.map(([v, l]) => `<option value="${v}" ${(cs.animation || 'fade') === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
    </div>
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
  return finishBlockCard(section, cs);
}
function collectGalleryBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'gallery',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    layout: section.querySelector('.cs-gallery-layout').value,
    columns: Number(section.querySelector('.cs-gallery-columns').value) || 3,
    size: section.querySelector('.cs-gallery-size').value,
    animation: section.querySelector('.cs-gallery-animation').value,
    images: [...section.querySelectorAll('.admin-gallery-slot')].map(row => row.dataset.imagePath || '').filter(Boolean)
  };
}

function createQuoteBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'quote';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Zitat')}
    <label class="admin-field"><span>Zitat-Text</span><textarea class="cs-quote-text" rows="3">${escapeHtml(cs.text || '')}</textarea></label>
    <label class="admin-field"><span>Autor / Quelle (optional)</span><input class="cs-quote-author" type="text" value="${escapeAttr(cs.author || '')}"></label>
  `;
  return finishBlockCard(section, cs);
}
function collectQuoteBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'quote',
    text: section.querySelector('.cs-quote-text').value,
    author: section.querySelector('.cs-quote-author').value
  };
}

function createCtaBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'cta';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Call-to-Action')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field"><span>Text</span><textarea class="cs-cta-text" rows="2">${escapeHtml(cs.text || '')}</textarea></label>
    <label class="admin-field"><span>Button-Text</span><input class="cs-cta-label" type="text" value="${escapeAttr(cs.buttonLabel || '')}"></label>
    <label class="admin-field"><span>Button-Link (z. B. tel:+43…, mailto:…, https://…)</span><input class="cs-cta-url" type="text" value="${escapeAttr(cs.buttonUrl || '')}"></label>
  `;
  return finishBlockCard(section, cs);
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

function createVideoBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'video';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Video')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field"><span>YouTube- oder Vimeo-Link</span><input class="cs-video-url" type="text" placeholder="https://www.youtube.com/watch?v=…" value="${escapeAttr(cs.videoUrl || '')}"></label>
  `;
  return finishBlockCard(section, cs);
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

function createStatsBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'stats';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Statistik-Reihe')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift (optional)</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-stats-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-stats-add">+ Zahl hinzufügen</button>
  `;
  const list = section.querySelector('.cs-stats-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Zahl / Wert</span><input class="cs-stat-value" type="text" placeholder="15+" value="${escapeAttr(item.value || '')}"></label>
      <label class="admin-field"><span>Beschreibung</span><input class="cs-stat-label" type="text" placeholder="Jahre Erfahrung" value="${escapeAttr(item.label || '')}"></label>
    `;
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.items && cs.items.length ? cs.items : [{ value: '', label: '' }]).forEach(renderRow);
  section.querySelector('.cs-stats-add').addEventListener('click', () => renderRow({ value: '', label: '' }));
  return finishBlockCard(section, cs);
}
function collectStatsBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'stats',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    items: [...section.querySelectorAll('.cs-stats-list .admin-repeater-item')].map(row => ({
      value: row.querySelector('.cs-stat-value').value,
      label: row.querySelector('.cs-stat-label').value
    }))
  };
}

function createHoursBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'hours';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Öffnungszeiten')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-hours-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-hours-add">+ Zeile hinzufügen</button>
  `;
  const list = section.querySelector('.cs-hours-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Tag(e)</span><input class="cs-hours-day" type="text" placeholder="Montag – Freitag" value="${escapeAttr(item.day || '')}"></label>
      <label class="admin-field"><span>Uhrzeit</span><input class="cs-hours-time" type="text" placeholder="08:00 – 18:00 Uhr" value="${escapeAttr(item.time || '')}"></label>
    `;
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.rows && cs.rows.length ? cs.rows : [{ day: '', time: '' }]).forEach(renderRow);
  section.querySelector('.cs-hours-add').addEventListener('click', () => renderRow({ day: '', time: '' }));
  return finishBlockCard(section, cs);
}
function collectHoursBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'hours',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    rows: [...section.querySelectorAll('.cs-hours-list .admin-repeater-item')].map(row => ({
      day: row.querySelector('.cs-hours-day').value,
      time: row.querySelector('.cs-hours-time').value
    }))
  };
}

function createColumnsBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'columns';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Zwei-Spalten-Text')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <h3 class="admin-subheading">Linke Spalte</h3>
    <label class="admin-field"><span>Titel</span><input class="cs-col-left-title" type="text" value="${escapeAttr(cs.leftTitle || '')}"></label>
    <label class="admin-field">
      <span>Text</span>
      <div class="admin-richtext cs-col-left-text"></div>
    </label>
    <h3 class="admin-subheading">Rechte Spalte</h3>
    <label class="admin-field"><span>Titel</span><input class="cs-col-right-title" type="text" value="${escapeAttr(cs.rightTitle || '')}"></label>
    <label class="admin-field">
      <span>Text</span>
      <div class="admin-richtext cs-col-right-text"></div>
    </label>
  `;
  section.querySelector('.cs-col-left-text').innerHTML = cs.leftText || '';
  section.querySelector('.cs-col-right-text').innerHTML = cs.rightText || '';
  initQuillEditors(section);
  return finishBlockCard(section, cs);
}
function collectColumnsBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'columns',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    leftTitle: section.querySelector('.cs-col-left-title').value,
    leftText: getQuillHtml(section.querySelector('.cs-col-left-text')),
    rightTitle: section.querySelector('.cs-col-right-title').value,
    rightText: getQuillHtml(section.querySelector('.cs-col-right-text'))
  };
}

function createDividerBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'divider';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Trenner')}
    <label class="admin-field">
      <span>Stil</span>
      <select class="cs-divider-style">
        <option value="line" ${cs.style !== 'space' ? 'selected' : ''}>Linie mit Freiraum</option>
        <option value="space" ${cs.style === 'space' ? 'selected' : ''}>Nur Freiraum (unsichtbar)</option>
      </select>
    </label>
    <label class="admin-field"><span>Text auf der Linie (optional)</span><input class="cs-divider-label" type="text" value="${escapeAttr(cs.label || '')}"></label>
  `;
  return finishBlockCard(section, cs);
}
function collectDividerBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'divider',
    style: section.querySelector('.cs-divider-style').value,
    label: section.querySelector('.cs-divider-label').value
  };
}

function createMapBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'map';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Karte')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <label class="admin-field"><span>Adresse</span><input class="cs-map-address" type="text" placeholder="Leer lassen für die Praxis-Adresse aus Kontakt" value="${escapeAttr(cs.address || '')}"></label>
    <p class="admin-hint">Leer lassen, um automatisch die Adresse aus dem Kontakt-Bereich zu verwenden.</p>
  `;
  return finishBlockCard(section, cs);
}
function collectMapBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'map',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    address: section.querySelector('.cs-map-address').value
  };
}

function createTeamBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'team';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Team')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-team-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-team-add">+ Teammitglied hinzufügen</button>
  `;
  const list = section.querySelector('.cs-team-list');
  let slotSeq = 0;
  function addMember(m) {
    const slotIndex = slotSeq++;
    const row = document.createElement('div');
    row.className = 'admin-repeater-item admin-team-slot';
    row.dataset.slotIndex = String(slotIndex);
    row.dataset.imagePath = m.photo || '';
    row.innerHTML = `
      <div class="admin-image-row">
        <img class="admin-image-preview cs-team-preview" src="${escapeAttr(blockImagePreviewSrc(m.photo))}">
        <input type="file" accept="image/*" class="cs-team-file">
        <button type="button" class="admin-image-remove-btn cs-team-remove-photo">Bild entfernen</button>
      </div>
      <label class="admin-field"><span>Name</span><input class="cs-team-name" type="text" value="${escapeAttr(m.name || '')}"></label>
      <label class="admin-field"><span>Rolle / Funktion</span><input class="cs-team-role" type="text" value="${escapeAttr(m.role || '')}"></label>
      <label class="admin-field"><span>Kurzbeschreibung (optional)</span><textarea class="cs-team-bio" rows="2">${escapeHtml(m.bio || '')}</textarea></label>
    `;
    const preview = row.querySelector('.cs-team-preview');
    const fileInput = row.querySelector('.cs-team-file');
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      pendingBlockImages[cs.id + '::' + slotIndex] = file;
      preview.src = URL.createObjectURL(file);
    });
    row.querySelector('.cs-team-remove-photo').addEventListener('click', () => {
      delete pendingBlockImages[cs.id + '::' + slotIndex];
      row.dataset.imagePath = '';
      preview.src = '';
      fileInput.value = '';
    });
    row.appendChild(makeRemoveBtn(() => {
      delete pendingBlockImages[cs.id + '::' + slotIndex];
      row.remove();
    }));
    list.appendChild(row);
  }
  (cs.members && cs.members.length ? cs.members : [{ photo: '', name: '', role: '', bio: '' }]).forEach(addMember);
  section.querySelector('.cs-team-add').addEventListener('click', () => addMember({ photo: '', name: '', role: '', bio: '' }));
  return finishBlockCard(section, cs);
}
function collectTeamBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'team',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    members: [...section.querySelectorAll('.admin-team-slot')].map(row => ({
      photo: row.dataset.imagePath || '',
      name: row.querySelector('.cs-team-name').value,
      role: row.querySelector('.cs-team-role').value,
      bio: row.querySelector('.cs-team-bio').value
    }))
  };
}

function createTestimonialsBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'testimonials';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Bewertungen')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-testimonials-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-testimonial-add">+ Bewertung hinzufügen</button>
  `;
  const list = section.querySelector('.cs-testimonials-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Text</span><textarea class="cs-testimonial-text" rows="3">${escapeHtml(item.text || '')}</textarea></label>
      <label class="admin-field"><span>Name</span><input class="cs-testimonial-author" type="text" value="${escapeAttr(item.author || '')}"></label>
      <label class="admin-field"><span>Rolle / Info (optional)</span><input class="cs-testimonial-role" type="text" placeholder="Patientin seit 2022" value="${escapeAttr(item.role || '')}"></label>
    `;
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.items && cs.items.length ? cs.items : [{ text: '', author: '', role: '' }]).forEach(renderRow);
  section.querySelector('.cs-testimonial-add').addEventListener('click', () => renderRow({ text: '', author: '', role: '' }));
  return finishBlockCard(section, cs);
}
function collectTestimonialsBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'testimonials',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    items: [...section.querySelectorAll('.cs-testimonials-list .admin-repeater-item')].map(row => ({
      text: row.querySelector('.cs-testimonial-text').value,
      author: row.querySelector('.cs-testimonial-author').value,
      role: row.querySelector('.cs-testimonial-role').value
    }))
  };
}

function createPricingBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'pricing';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Preisliste')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <label class="admin-field"><span>Überschrift</span><input class="cs-title" type="text" value="${escapeAttr(cs.title || '')}"></label>
    <div class="cs-pricing-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-pricing-add">+ Angebot hinzufügen</button>
  `;
  const list = section.querySelector('.cs-pricing-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    row.innerHTML = `
      <label class="admin-field"><span>Name</span><input class="cs-price-name" type="text" value="${escapeAttr(item.name || '')}"></label>
      <div class="admin-color-row">
        <label class="admin-field admin-field-inline"><span>Preis</span><input class="cs-price-value" type="text" placeholder="ab 60 €" value="${escapeAttr(item.price || '')}"></label>
        <label class="admin-field admin-field-inline"><span>Zusatz (optional)</span><input class="cs-price-period" type="text" placeholder="/ Einheit" value="${escapeAttr(item.period || '')}"></label>
      </div>
      <label class="admin-field"><span>Beschreibung</span><textarea class="cs-price-desc" rows="2">${escapeHtml(item.description || '')}</textarea></label>
      <label class="admin-field"><span>Leistungen (eine Zeile pro Punkt)</span><textarea class="cs-price-features" rows="3">${escapeHtml((item.features || []).join('\n'))}</textarea></label>
      <label class="admin-field admin-field-inline"><input type="checkbox" class="cs-price-highlight" ${item.highlighted ? 'checked' : ''}> Hervorheben (empfohlen)</label>
    `;
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.plans && cs.plans.length ? cs.plans : [{ name: '', price: '', period: '', description: '', features: [], highlighted: false }]).forEach(renderRow);
  section.querySelector('.cs-pricing-add').addEventListener('click', () => renderRow({ name: '', price: '', period: '', description: '', features: [], highlighted: false }));
  return finishBlockCard(section, cs);
}
function collectPricingBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'pricing',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    title: section.querySelector('.cs-title').value,
    plans: [...section.querySelectorAll('.cs-pricing-list .admin-repeater-item')].map(row => ({
      name: row.querySelector('.cs-price-name').value,
      price: row.querySelector('.cs-price-value').value,
      period: row.querySelector('.cs-price-period').value,
      description: row.querySelector('.cs-price-desc').value,
      features: row.querySelector('.cs-price-features').value.split('\n').map(s => s.trim()).filter(Boolean),
      highlighted: row.querySelector('.cs-price-highlight').checked
    }))
  };
}

function createLogosBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'logos';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Logo-Leiste')}
    <label class="admin-field"><span>Kleiner Text über der Überschrift (optional)</span><input class="cs-eyebrow" type="text" value="${escapeAttr(cs.eyebrow || '')}"></label>
    <div class="cs-logos-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-logos-add">+ Logo hinzufügen</button>
  `;
  const list = section.querySelector('.cs-logos-list');
  let slotSeq = 0;
  function addLogo(l) {
    const slotIndex = slotSeq++;
    const row = document.createElement('div');
    row.className = 'admin-repeater-item admin-logos-slot';
    row.dataset.slotIndex = String(slotIndex);
    row.dataset.imagePath = l.image || '';
    row.innerHTML = `
      <div class="admin-image-row">
        <img class="admin-image-preview cs-logos-preview" src="${escapeAttr(blockImagePreviewSrc(l.image))}">
        <input type="file" accept="image/*" class="cs-logos-file">
        <button type="button" class="admin-image-remove-btn cs-logos-remove-photo">Bild entfernen</button>
      </div>
      <label class="admin-field"><span>Link (optional)</span><input class="cs-logos-url" type="text" placeholder="https://..." value="${escapeAttr(l.url || '')}"></label>
    `;
    const preview = row.querySelector('.cs-logos-preview');
    const fileInput = row.querySelector('.cs-logos-file');
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      pendingBlockImages[cs.id + '::' + slotIndex] = file;
      preview.src = URL.createObjectURL(file);
    });
    row.querySelector('.cs-logos-remove-photo').addEventListener('click', () => {
      delete pendingBlockImages[cs.id + '::' + slotIndex];
      row.dataset.imagePath = '';
      preview.src = '';
      fileInput.value = '';
    });
    row.appendChild(makeRemoveBtn(() => {
      delete pendingBlockImages[cs.id + '::' + slotIndex];
      row.remove();
    }));
    list.appendChild(row);
  }
  (cs.logos && cs.logos.length ? cs.logos : ['']).forEach(l => addLogo(typeof l === 'string' ? { image: l, url: '' } : l));
  section.querySelector('.cs-logos-add').addEventListener('click', () => addLogo({ image: '', url: '' }));
  return finishBlockCard(section, cs);
}
function collectLogosBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'logos',
    eyebrow: section.querySelector('.cs-eyebrow').value,
    logos: [...section.querySelectorAll('.admin-logos-slot')].map(row => ({
      image: row.dataset.imagePath || '',
      url: row.querySelector('.cs-logos-url').value
    })).filter(l => l.image)
  };
}

const SOCIAL_PLATFORMS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  email: 'E-Mail',
  phone: 'Telefon'
};
function createSocialBlockCard(cs) {
  const section = document.createElement('section');
  section.className = 'admin-section draggable';
  section.dataset.sectionKey = cs.id;
  section.dataset.custom = '1';
  section.dataset.blockType = 'social';
  section.innerHTML = `
    ${blockHeaderHtml(cs, 'Social-Media-Icons')}
    <div class="cs-social-list admin-repeater"></div>
    <button type="button" class="admin-add-btn cs-social-add">+ Icon hinzufügen</button>
  `;
  const list = section.querySelector('.cs-social-list');
  function renderRow(item) {
    const row = document.createElement('div');
    row.className = 'admin-repeater-item';
    const options = Object.entries(SOCIAL_PLATFORMS).map(([value, label]) =>
      `<option value="${value}" ${item.platform === value ? 'selected' : ''}>${label}</option>`
    ).join('');
    row.innerHTML = `
      <div class="admin-color-row">
        <label class="admin-field admin-field-inline"><span>Plattform</span><select class="cs-social-platform">${options}</select></label>
        <label class="admin-field admin-field-inline"><span>Link / Adresse</span><input class="cs-social-url" type="text" placeholder="https://..." value="${escapeAttr(item.url || '')}"></label>
      </div>
    `;
    row.appendChild(makeRemoveBtn(() => row.remove()));
    list.appendChild(row);
  }
  (cs.items && cs.items.length ? cs.items : [{ platform: 'instagram', url: '' }]).forEach(renderRow);
  section.querySelector('.cs-social-add').addEventListener('click', () => renderRow({ platform: 'instagram', url: '' }));
  return finishBlockCard(section, cs);
}
function collectSocialBlockCard(section) {
  return {
    id: section.dataset.sectionKey,
    type: 'social',
    items: [...section.querySelectorAll('.cs-social-list .admin-repeater-item')].map(row => ({
      platform: row.querySelector('.cs-social-platform').value,
      url: row.querySelector('.cs-social-url').value
    }))
  };
}

const BLOCK_CATEGORIES = {
  text: 'Text & Inhalt',
  media: 'Medien',
  data: 'Daten & Listen',
  contact: 'Kontakt & Vertrauen',
  layout: 'Struktur'
};

const BLOCK_TYPES = {
  textimage: {
    label: 'Textblock mit Bild',
    category: 'text',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="8" rx="1"/><circle cx="6" cy="7.2" r="1"/><path d="M3.8 10.8L6 8.6l2.2 2.2"/><line x1="13" y1="6" x2="21" y2="6"/><line x1="13" y1="9" x2="21" y2="9"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="3" y1="19" x2="15" y2="19"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'textimage', eyebrow: '', title: 'Neue Überschrift', text: '', image: '', imagePosition: 'left', subblocks: [] }),
    create: createTextImageCard,
    collect: collectTextImageCard
  },
  faq: {
    label: 'FAQ-Liste',
    category: 'text',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.2 9.5a2.8 2.8 0 015.4 1c0 1.8-2.6 1.6-2.6 3.6"/><line x1="12" y1="17" x2="12" y2="17.1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'faq', eyebrow: '', title: 'Häufige Fragen', items: [{ q: '', a: '' }] }),
    create: createFaqBlockCard,
    collect: collectFaqBlockCard
  },
  quote: {
    label: 'Zitat',
    category: 'text',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8c-2.2 0-3.5 1.6-3.5 3.7 0 1.8 1.1 3 2.7 3 1.3 0 2.3-.9 2.3-2.2 0-1.1-.8-1.9-1.9-1.9-.2 0-.4 0-.5.1.2-1.3 1.3-2.2 2.6-2.3"/><path d="M16 8c-2.2 0-3.5 1.6-3.5 3.7 0 1.8 1.1 3 2.7 3 1.3 0 2.3-.9 2.3-2.2 0-1.1-.8-1.9-1.9-1.9-.2 0-.4 0-.5.1.2-1.3 1.3-2.2 2.6-2.3"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'quote', text: '', author: '' }),
    create: createQuoteBlockCard,
    collect: collectQuoteBlockCard
  },
  columns: {
    label: 'Zwei-Spalten-Text',
    category: 'text',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'columns', eyebrow: '', title: '', leftTitle: '', leftText: '', rightTitle: '', rightText: '' }),
    create: createColumnsBlockCard,
    collect: collectColumnsBlockCard
  },
  gallery: {
    label: 'Bildergalerie',
    category: 'media',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'gallery', eyebrow: '', title: 'Galerie', layout: 'grid', columns: 3, size: 'medium', animation: 'fade', images: [] }),
    create: createGalleryBlockCard,
    collect: collectGalleryBlockCard
  },
  video: {
    label: 'Video',
    category: 'media',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'video', eyebrow: '', title: 'Video', videoUrl: '' }),
    create: createVideoBlockCard,
    collect: collectVideoBlockCard
  },
  logos: {
    label: 'Logo-Leiste',
    category: 'media',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"/><rect x="12" y="6" width="8" height="5" rx="1"/><rect x="12" y="13" width="8" height="5" rx="1"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'logos', eyebrow: '', logos: [] }),
    create: createLogosBlockCard,
    collect: collectLogosBlockCard
  },
  table: {
    label: 'Tabelle',
    category: 'data',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="10" y1="4" x2="10" y2="20"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'table', eyebrow: '', title: 'Tabelle', columns: ['Spalte 1', 'Spalte 2'], rows: [['', '']] }),
    create: createTableBlockCard,
    collect: collectTableBlockCard
  },
  stats: {
    label: 'Statistik-Reihe',
    category: 'data',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="6"/><line x1="19" y1="20" x2="19" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'stats', eyebrow: '', title: '', items: [{ value: '15+', label: 'Jahre Erfahrung' }] }),
    create: createStatsBlockCard,
    collect: collectStatsBlockCard
  },
  hours: {
    label: 'Öffnungszeiten',
    category: 'data',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'hours', eyebrow: '', title: 'Öffnungszeiten', rows: [{ day: 'Montag – Freitag', time: '08:00 – 18:00 Uhr' }] }),
    create: createHoursBlockCard,
    collect: collectHoursBlockCard
  },
  pricing: {
    label: 'Preisliste',
    category: 'data',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l7-7 8 8-7 7z"/><circle cx="9.5" cy="9.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'pricing', eyebrow: '', title: 'Preise', plans: [{ name: '', price: '', period: '', description: '', features: [], highlighted: false }] }),
    create: createPricingBlockCard,
    collect: collectPricingBlockCard
  },
  cta: {
    label: 'Call-to-Action',
    category: 'contact',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="7" rx="3.5"/><line x1="9" y1="12.5" x2="15" y2="12.5"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'cta', eyebrow: '', title: 'Bereit für den ersten Termin?', text: '', buttonLabel: 'Jetzt anrufen', buttonUrl: '' }),
    create: createCtaBlockCard,
    collect: collectCtaBlockCard
  },
  map: {
    label: 'Karte',
    category: 'contact',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'map', eyebrow: '', title: 'Anfahrt', address: '' }),
    create: createMapBlockCard,
    collect: collectMapBlockCard
  },
  team: {
    label: 'Team',
    category: 'contact',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.8-3.4 3-5 5.5-5s4.7 1.6 5.5 5"/><circle cx="17.5" cy="9" r="2.2"/><path d="M15 19c.5-2.5 1.9-3.8 3.6-3.8"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'team', eyebrow: '', title: 'Unser Team', members: [{ photo: '', name: '', role: '', bio: '' }] }),
    create: createTeamBlockCard,
    collect: collectTeamBlockCard
  },
  testimonials: {
    label: 'Bewertungen',
    category: 'contact',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17.3l-5.4 3 1-6-4.4-4.3 6-.9L12 3l2.8 6.1 6 .9-4.4 4.3 1 6z"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'testimonials', eyebrow: '', title: 'Das sagen meine Patient:innen', items: [{ text: '', author: '', role: '' }] }),
    create: createTestimonialsBlockCard,
    collect: collectTestimonialsBlockCard
  },
  social: {
    label: 'Social-Media-Icons',
    category: 'contact',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.6"/><circle cx="17" cy="6" r="2.6"/><circle cx="17" cy="18" r="2.6"/><line x1="8.2" y1="10.8" x2="14.8" y2="7.2"/><line x1="8.2" y1="13.2" x2="14.8" y2="16.8"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'social', items: [{ platform: 'instagram', url: '' }] }),
    create: createSocialBlockCard,
    collect: collectSocialBlockCard
  },
  divider: {
    label: 'Trenner',
    category: 'layout',
    icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="9" x2="9" y2="9"/><line x1="15" y1="9" x2="21" y2="9"/><circle cx="12" cy="9" r="2"/><line x1="3" y1="16" x2="21" y2="16" stroke-dasharray="1 3"/></svg>',
    defaults: () => ({ id: blockUid(), type: 'divider', style: 'line', label: '' }),
    create: createDividerBlockCard,
    collect: collectDividerBlockCard
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
    const cs = BLOCK_TYPES[type].collect(section);
    if (section.dataset.customLabel) cs.customLabel = section.dataset.customLabel;
    return cs;
  });
}

function renderBlockPicker() {
  const grid = document.getElementById('blockPickerGrid');
  if (!grid) return;
  const byCategory = {};
  Object.entries(BLOCK_TYPES).forEach(([type, def]) => {
    const cat = def.category || 'text';
    (byCategory[cat] = byCategory[cat] || []).push([type, def]);
  });
  grid.innerHTML = Object.keys(BLOCK_CATEGORIES).filter(cat => byCategory[cat]).map(cat => `
    <div class="admin-block-category">
      <h3 class="admin-block-category-title">${escapeHtml(BLOCK_CATEGORIES[cat])}</h3>
      <div class="admin-block-picker-grid">
        ${byCategory[cat].map(([type, def]) => `
          <button type="button" class="admin-block-picker-btn" data-block-type="${type}">
            <span class="admin-block-picker-icon">${def.icon}</span>
            <span class="admin-block-picker-label">${escapeHtml(def.label)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.admin-block-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const def = BLOCK_TYPES[btn.dataset.blockType];
      if (!def) return;
      pendingBlockLibraryType = btn.dataset.blockType;
      showBlockLibraryStep('name');
      const nameInput = document.getElementById('blockLibraryNameInput');
      nameInput.value = '';
      nameInput.focus();
    });
  });
}
renderBlockPicker();

function filterBlockPicker(query) {
  const q = query.trim().toLowerCase();
  const grid = document.getElementById('blockPickerGrid');
  if (!grid) return;
  let anyVisible = false;
  grid.querySelectorAll('.admin-block-category').forEach(cat => {
    let catHasVisible = false;
    cat.querySelectorAll('.admin-block-picker-btn').forEach(btn => {
      const label = btn.querySelector('.admin-block-picker-label').textContent.toLowerCase();
      const match = !q || label.includes(q);
      btn.hidden = !match;
      if (match) catHasVisible = true;
    });
    cat.hidden = !catHasVisible;
    if (catHasVisible) anyVisible = true;
  });
  const noResults = document.getElementById('blockLibraryNoResults');
  if (noResults) noResults.hidden = anyVisible;
}

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

    if (type === 'team') {
      const rows = [...section.querySelectorAll('.admin-team-slot')];
      for (const row of rows) {
        const slotIndex = row.dataset.slotIndex;
        const key = id + '::' + slotIndex;
        if (pendingBlockImages[key]) {
          const file = pendingBlockImages[key];
          const path = 'Assets/Blocks/' + id + '-' + slotIndex + '-' + sanitizeFilename(file.name);
          const base64 = await fileToBase64(file);
          const existingSha = await ghGetSha(token, path);
          await ghPutBinaryFile(token, path, base64, 'Team-Foto hochgeladen über Admin-Panel', existingSha);
          row.dataset.imagePath = path;
          delete pendingBlockImages[key];
        }
      }
      cs.members = rows.map(row => ({
        photo: row.dataset.imagePath || '',
        name: row.querySelector('.cs-team-name').value,
        role: row.querySelector('.cs-team-role').value,
        bio: row.querySelector('.cs-team-bio').value
      }));
    }

    if (type === 'logos') {
      const rows = [...section.querySelectorAll('.admin-logos-slot')];
      for (const row of rows) {
        const slotIndex = row.dataset.slotIndex;
        const key = id + '::' + slotIndex;
        if (pendingBlockImages[key]) {
          const file = pendingBlockImages[key];
          const path = 'Assets/Blocks/' + id + '-' + slotIndex + '-' + sanitizeFilename(file.name);
          const base64 = await fileToBase64(file);
          const existingSha = await ghGetSha(token, path);
          await ghPutBinaryFile(token, path, base64, 'Logo hochgeladen über Admin-Panel', existingSha);
          row.dataset.imagePath = path;
          delete pendingBlockImages[key];
        }
      }
      cs.logos = rows.map(row => ({
        image: row.dataset.imagePath || '',
        url: row.querySelector('.cs-logos-url').value
      })).filter(l => l.image);
    }
  }
}

const AUTO_SCROLL_ZONE = 140;
const AUTO_SCROLL_MAX_SPEED = 32;
let autoScrollSpeed = 0;
let autoScrollRAF = null;

function autoScrollStep() {
  if (autoScrollSpeed === 0) {
    autoScrollRAF = null;
    return;
  }
  window.scrollBy(0, autoScrollSpeed);
  autoScrollRAF = requestAnimationFrame(autoScrollStep);
}
function updateAutoScroll(clientY) {
  if (typeof clientY !== 'number') return;
  const vh = window.innerHeight;
  if (clientY < AUTO_SCROLL_ZONE) {
    const intensity = (AUTO_SCROLL_ZONE - clientY) / AUTO_SCROLL_ZONE;
    autoScrollSpeed = -Math.ceil(intensity * AUTO_SCROLL_MAX_SPEED);
  } else if (clientY > vh - AUTO_SCROLL_ZONE) {
    const intensity = (clientY - (vh - AUTO_SCROLL_ZONE)) / AUTO_SCROLL_ZONE;
    autoScrollSpeed = Math.ceil(intensity * AUTO_SCROLL_MAX_SPEED);
  } else {
    autoScrollSpeed = 0;
  }
  if (autoScrollSpeed !== 0 && autoScrollRAF === null) {
    autoScrollRAF = requestAnimationFrame(autoScrollStep);
  }
}
function stopAutoScroll() {
  autoScrollSpeed = 0;
  if (autoScrollRAF !== null) {
    cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }
}

Sortable.create(draggableSections, {
  handle: '.admin-drag-handle',
  animation: 150,
  ghostClass: 'admin-sortable-ghost',
  chosenClass: 'dragging',
  forceFallback: true,
  fallbackClass: 'admin-sortable-drag-clone',
  fallbackOnBody: true,
  scroll: false,
  onStart: () => document.body.classList.add('admin-dragging-active'),
  onMove: evt => {
    const oe = evt.originalEvent;
    if (oe) updateAutoScroll(oe.touches ? oe.touches[0].clientY : oe.clientY);
  },
  onEnd: () => {
    document.body.classList.remove('admin-dragging-active');
    stopAutoScroll();
  }
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

function quillToolbarOptions() {
  return [
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
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
    document.getElementById('preview_' + key).src = '../../' + images[key];
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

const FONT_OPTIONS = {
  poppins: 'Poppins',
  inter: 'Inter',
  montserrat: 'Montserrat',
  playfair: 'Playfair Display',
  lora: 'Lora',
  roboto: 'Roboto'
};
const pendingFonts = {};

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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Keine Antwort von GitHub nach ' + (ms / 1000) + ' Sekunden. Evtl. blockiert eine Firewall/Antivirus/VPN die Verbindung zu api.github.com.')), ms))
  ]);
}

function showEditor() {
  editorScreen.style.display = 'block';
  updateStickybarHeight();
}
function backToAdminHome() {
  window.location.href = '../';
}

async function login(token) {
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
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    backToAdminHome();
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  state = { token: null, sha: null, data: null };
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  try { sessionStorage.removeItem('pk_admin_nav'); } catch (e) {}
  try { sessionStorage.removeItem(PIN_SESSION_KEY); } catch (e) {}
  try { sessionStorage.removeItem(PIN_ATTEMPTS_KEY); } catch (e) {}
  try { sessionStorage.removeItem(PIN_LOCK_KEY); } catch (e) {}
  backToAdminHome();
});

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
    const commitMessageInput = document.getElementById('commitMessageInput');
    const commitMessage = (commitMessageInput.value.trim()) || 'Inhalte übers Admin-Panel aktualisiert';
    const newSha = await ghPutFile(state.token, state.sha, newText, commitMessage);
    state.sha = newSha;
    commitMessageInput.value = '';
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

const saveModalOverlay = document.getElementById('saveModalOverlay');
const saveModalCommitInput = document.getElementById('commitMessageInput');

function openSaveModal() {
  saveModalOverlay.hidden = false;
  saveModalCommitInput.focus();
}
function closeSaveModal() {
  saveModalOverlay.hidden = true;
}

document.getElementById('saveBtn').addEventListener('click', openSaveModal);
document.getElementById('saveBtnBottom').addEventListener('click', openSaveModal);
document.getElementById('saveModalClose').addEventListener('click', closeSaveModal);
saveModalOverlay.addEventListener('click', e => {
  if (e.target === saveModalOverlay) closeSaveModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !saveModalOverlay.hidden) closeSaveModal();
});
document.getElementById('saveModalConfirm').addEventListener('click', () => {
  closeSaveModal();
  save();
});
saveModalCommitInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    closeSaveModal();
    save();
  }
});

const removeBlockOverlay = document.getElementById('removeBlockOverlay');
const removeBlockStepConfirm = document.getElementById('removeBlockStepConfirm');
const removeBlockStepType = document.getElementById('removeBlockStepType');
const removeBlockName = document.getElementById('removeBlockName');
const removeBlockNameRepeat = document.getElementById('removeBlockNameRepeat');
const removeBlockTypeInput = document.getElementById('removeBlockTypeInput');
const removeBlockConfirmBtn = document.getElementById('removeBlockConfirm');
let pendingRemoveSection = null;
let pendingRemoveName = '';

function getBlockDisplayName(section) {
  const label = section.querySelector('.admin-block-label');
  if (label) return label.textContent.trim();
  const input = section.querySelector('.admin-block-label-input');
  if (input) return (input.value.trim() || input.placeholder || 'Baustein');
  return 'Baustein';
}

function showRemoveBlockStep(step) {
  removeBlockStepConfirm.hidden = step !== 'confirm';
  removeBlockStepType.hidden = step !== 'type';
}

function openRemoveBlockModal(section) {
  pendingRemoveSection = section;
  pendingRemoveName = getBlockDisplayName(section);
  removeBlockName.textContent = pendingRemoveName;
  removeBlockNameRepeat.textContent = pendingRemoveName;
  removeBlockTypeInput.value = '';
  removeBlockConfirmBtn.disabled = true;
  showRemoveBlockStep('confirm');
  removeBlockOverlay.hidden = false;
}
function closeRemoveBlockModal() {
  removeBlockOverlay.hidden = true;
  pendingRemoveSection = null;
  pendingRemoveName = '';
}

document.getElementById('removeBlockClose').addEventListener('click', closeRemoveBlockModal);
document.getElementById('removeBlockCancel').addEventListener('click', closeRemoveBlockModal);
removeBlockOverlay.addEventListener('click', e => {
  if (e.target === removeBlockOverlay) closeRemoveBlockModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !removeBlockOverlay.hidden) closeRemoveBlockModal();
});

document.getElementById('removeBlockContinue').addEventListener('click', () => {
  showRemoveBlockStep('type');
  removeBlockTypeInput.focus();
});
document.getElementById('removeBlockBack').addEventListener('click', () => {
  showRemoveBlockStep('confirm');
});
removeBlockTypeInput.addEventListener('input', () => {
  removeBlockConfirmBtn.disabled = removeBlockTypeInput.value.trim() !== pendingRemoveName;
});
removeBlockConfirmBtn.addEventListener('click', () => {
  if (removeBlockConfirmBtn.disabled || !pendingRemoveSection) return;
  pendingRemoveSection.remove();
  closeRemoveBlockModal();
});
removeBlockTypeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!removeBlockConfirmBtn.disabled) removeBlockConfirmBtn.click();
  }
});

const blockLibraryOverlay = document.getElementById('blockLibraryOverlay');
const blockLibrarySearch = document.getElementById('blockLibrarySearch');
const blockLibraryStepPick = document.getElementById('blockLibraryStepPick');
const blockLibraryStepName = document.getElementById('blockLibraryStepName');
const blockLibraryNameInput = document.getElementById('blockLibraryNameInput');
let pendingBlockLibraryType = null;

function showBlockLibraryStep(step) {
  blockLibraryStepPick.hidden = step !== 'pick';
  blockLibraryStepName.hidden = step !== 'name';
}

function openBlockLibrary() {
  blockLibraryOverlay.hidden = false;
  pendingBlockLibraryType = null;
  blockLibrarySearch.value = '';
  filterBlockPicker('');
  showBlockLibraryStep('pick');
  blockLibrarySearch.focus();
}
function closeBlockLibrary() {
  blockLibraryOverlay.hidden = true;
  pendingBlockLibraryType = null;
}
function addPendingBlock() {
  const def = BLOCK_TYPES[pendingBlockLibraryType];
  if (!def) return;
  const cs = def.defaults();
  const name = blockLibraryNameInput.value.trim();
  if (name) cs.customLabel = name;
  const card = def.create(cs);
  draggableSections.appendChild(card);
  closeBlockLibrary();
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('openBlockLibraryBtn').addEventListener('click', openBlockLibrary);
document.getElementById('blockLibraryClose').addEventListener('click', closeBlockLibrary);
document.getElementById('blockLibraryBack').addEventListener('click', () => showBlockLibraryStep('pick'));
document.getElementById('blockLibraryAddConfirm').addEventListener('click', addPendingBlock);
blockLibrarySearch.addEventListener('input', () => filterBlockPicker(blockLibrarySearch.value));
blockLibraryNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addPendingBlock(); }
});
blockLibraryOverlay.addEventListener('click', e => {
  if (e.target === blockLibraryOverlay) closeBlockLibrary();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !blockLibraryOverlay.hidden) closeBlockLibrary();
});

const adminThemeToggle = document.getElementById('themeToggle');
adminThemeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));
adminThemeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  adminThemeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});

initQuillEditors(document);

document.getElementById('design_borderRadius').addEventListener('input', e => {
  document.getElementById('design_borderRadius_val').textContent = e.target.value;
});
document.getElementById('design_textScale').addEventListener('input', e => {
  document.getElementById('design_textScale_val').textContent = e.target.value;
});

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

(function () {
  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
  if (token) {
    login(token);
  } else {
    backToAdminHome();
  }
})();

const adminStickybar = document.querySelector('.admin-stickybar');
function updateStickybarHeight() {
  if (adminStickybar) {
    document.documentElement.style.setProperty('--stickybar-height', adminStickybar.offsetHeight + 16 + 'px');
  }
}
window.addEventListener('resize', updateStickybarHeight);
updateStickybarHeight();

document.querySelectorAll('.admin-quicknav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

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
