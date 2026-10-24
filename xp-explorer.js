// Windows XP: ein funktionierender Explorer mit versteckten Dateien, einem unheimlichen Tagebuch,
// einem Rätsel um eine verschlüsselte Zip-Datei und einem Admin-Trick über das Benutzerkonto.
// Passwörter und Rätsel werden bei jedem Seitenbesuch neu ausgewürfelt.
// Alles ist nur ein Spiel auf der Website und hat nichts mit dem echten Admin-Bereich zu tun.
(function () {
  const fx = window.pkFx;
  if (!fx) return;
  const sound = fx.sound;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pad = (n) => String(n).padStart(2, '0');

  // Alle Windows-Erfolge sind geheim
  fx.achievements.push(
    { id: 'hidden', points: 100, secret: true, title: 'Ausgeblendet', tip: 'Zeig im XP-Explorer die versteckten Dateien an.' },
    { id: 'diary', points: 150, secret: true, title: 'Tagebuch', tip: 'Lies jeden Novembereintrag im versteckten Tagebuch.' },
    { id: 'riddle', points: 250, secret: true, title: 'Entschlüsselt', tip: 'Öffne die verschlüsselte Zip-Datei.' },
    { id: 'admin', points: 200, secret: true, title: 'Administrator', tip: 'Werde im XP-Startmenü Administrator mit vollen Rechten.' },
    { id: 'bsod', points: 100, secret: true, title: 'Bluescreen', tip: 'Lass als Administrator den Computer abstürzen.' }
  );
  ['xp', 'retro'].forEach(id => { const a = fx.achievements.find(x => x.id === id); if (a) a.secret = true; });

  /* ---------- Rätsel für diesen Besuch auswürfeln ---------- */
  const WORDS = ['RUECKEN', 'NACKEN', 'SCHULTER', 'MUSKEL', 'GELENK', 'FASZIE', 'SEHNE', 'WIRBEL', 'KNOCHEN', 'DEHNUNG', 'HUEFTE'];
  const ENDWORDS = {
    A: ['Atem', 'Abend'], B: ['Bildschirm', 'Brummen'], C: ['Computer', 'Cursor'], D: ['Dunkel', 'Datei'],
    E: ['Echo', 'Ende'], F: ['Flimmern', 'Fenster'], G: ['Geräusch', 'Gänsehaut'], H: ['Hall', 'Heizungsrohr'],
    I: ['Irrtum', 'Inhalt'], K: ['Kaffee', 'Knacken'], L: ['Lüfter', 'Licht'], M: ['Monitor', 'Mauszeiger'],
    N: ['Nacht', 'Nebel'], O: ['Ordner', 'Ohrensausen'], R: ['Rauschen', 'Rascheln'], S: ['Stille', 'Schatten'],
    T: ['Tastatur', 'Treppenhaus'], U: ['Uhr', 'Unruhe'], W: ['Wecker', 'Warteraum'], Z: ['Zeiger', 'Zittern']
  };
  const LINES = [
    'Der Praxis-PC lief schon, als ich aufgesperrt habe.',
    'Im Editor stand wieder diese eine Zeile: „thock thock thock“.',
    'Die Tastatur tippt nachts. Ganz gleichmäßig, wie jemand, der Wiederholungen zählt.',
    'Der Bildschirmschoner zeigt Blasen, die ich nie installiert habe.',
    'Ich habe den Stecker gezogen. Die Festplatte lief trotzdem weiter.',
    'Im Wartezimmer roch es nach Kaffee, obwohl niemand da war.',
    'Die Maus hat sich bewegt. Nicht viel. Nur bis zum Ordner „Eigene Dateien“.',
    'Auf dem Monitor stand ein Satz: „aufstehen. strecken. weiter.“',
    'Die Uhr im Infobereich ging plötzlich zwölf Minuten nach.',
    'Ich habe gezählt. Genau dreiunddreißig Anschläge, dann war Ruhe.',
    'Im Papierkorb lag etwas, das ich nie gelöscht habe.',
    'Das Licht im Gang flackert immer im selben Takt wie die Festplatte.',
    'Ich glaube, er will nichts Böses. Er will nur, dass jemand zuhört.',
    'Eine neue Datei: fuer_dich.zip. Sie will ein Kennwort.'
  ];
  const CLOSERS = [
    'Danach war da nur noch: {W}.', 'Ich drehte mich um. Hinter mir: {W}.', 'Das Letzte, was blieb: {W}.',
    'Ich schrieb nur ein Wort auf: {W}.', 'Zurück blieb nur: {W}.', 'Überall nur noch: {W}.'
  ];
  const word = pick(WORDS);
  const used = new Set();
  function endWord(letter) {
    const opts = (ENDWORDS[letter] || ['Stille']).filter(w => !used.has(w));
    const w = pick(opts.length ? opts : ENDWORDS[letter]);
    used.add(w);
    return w;
  }
  const adminTime = pad(1 + Math.floor(Math.random() * 4)) + ':' + pad(Math.floor(Math.random() * 60));
  const startDay = 2 + Math.floor(Math.random() * 6);
  const EXERCISES = ['Schultern kreisen, 10x vor, 10x zurück', 'Katze-Kuh im Vierfüßlerstand, 10x', 'Hüftbeuger-Dehnung im Ausfallschritt, je 30 Sekunden', 'Wadendehnung an der Wand, je 30 Sekunden', 'Brustöffner im Türrahmen, 20 Sekunden', 'Beckenkippen in Rückenlage, 15x', 'Kindhaltung, 40 Sekunden'];
  const neckSeconds = pick([15, 20, 25, 30, 35, 40, 45]);
  const exerciseList = ['Nacken: Ohr zur Schulter, ' + neckSeconds + ' Sekunden halten'].concat(shuffle(EXERCISES).slice(0, 2 + Math.floor(Math.random() * 4)));
  const exercises = shuffle(exerciseList);
  const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const OTHER = ['Lymphdrainage', 'Sportbetreuung', 'Kinesiotaping', 'Bürotag', 'Massage'];
  const backCount = 1 + Math.floor(Math.random() * 4);
  const schedule = shuffle(DAYS.map((d, i) => i < backCount ? 'Rücken-Gruppe' : pick(OTHER)));
  const termineText = DAYS.map((d, i) => (d + '            ').slice(0, 12) + pad(8 + Math.floor(Math.random() * 10)) + ':' + pick(['00', '30']) + '  ' + schedule[i]).join('\n') + '\n\nNicht vergessen: PC abends AUSSCHALTEN.';
  const privatCode = String(exercises.length * neckSeconds + backCount);
  // Verschlüsselung der Uhrzeit: jede Ziffer um shift weiter (nach 9 kommt 0), eventuell rückwärts
  const shift = 1 + Math.floor(Math.random() * 3);
  const reversed = Math.random() < 0.5;
  let code = adminTime.replace(':', '').split('').map(d => (Number(d) + shift) % 10);
  if (reversed) code = code.reverse();
  code = code.join('');
  const SHIFT_WORD = ['', 'eins', 'zwei', 'drei'][shift];
  const RULE = 'Uhrzeiten schreibe ich nie im Klartext auf.\nJede Ziffer zähle ich ' + SHIFT_WORD + ' weiter, nach der 9 kommt wieder die 0.' + (reversed ? '\nUnd dann lese ich alles von hinten.' : '\nDie Reihenfolge lasse ich, wie sie ist.');
  const entries = [...word].map((letter, i) => {
    const day = startDay + i * 2 + Math.floor(Math.random() * 2);
    const lines = shuffle(LINES).slice(0, 2);
    if (i === 2) lines[0] = 'Den Wecker habe ich weggeworfen. Er klingelte jede Nacht zur selben Zeit.';
    return { date: pad(day) + '.11.2006', text: lines.join('\n') + '\n' + pick(CLOSERS).replace('{W}', endWord(letter)), real: true };
  });
  // Dateinamen nach Datum: im Ordner stehen die Einträge schon in der richtigen Reihenfolge
  const diaryFiles = entries.map((e, i) => ({ name: 'Tag ' + (i + 1) + ' (' + e.date + ').txt', type: 'txt', text: e.date + '\n\n' + e.text, diary: e.real, date: e.date }));
  const realCount = entries.filter(e => e.real).length;
  const plain = word.toLowerCase();
  const PASSWORDS = [plain, plain.replace(/ue/g, 'ü')];
  const ADMIN_PASSWORDS = [adminTime, adminTime.replace(':', '')];
  const RIGHT_KEY = pick(['full_rights', 'elevated_access', 'root_access', 'unrestricted', 'grant_all']);
  const policyFile = {
    name: pick(['policy.txt', 'secpol.txt', 'gpo_local.txt', 'access.txt']), type: 'txt', hidden: true, date: '13.11.2006 ' + adminTime,
    text: '; Local Security Policy - do not edit\n; Changes take effect immediately.\n\n[Account:Besucher]\nenabled = true\n' + RIGHT_KEY + ' = false\n\n[Account:Administrator]\nenabled = true\n' + RIGHT_KEY + ' = false\n\n; Set ' + RIGHT_KEY + ' to true for the account that should control this machine.'
  };
  // Volle Rechte erst, wenn beim Administrator der Schalter auf true steht
  function hasFullRights() {
    const m = policyFile.text.split('[Account:Administrator]')[1] || '';
    const block = m.split('[')[0];
    return new RegExp('^\\s*' + RIGHT_KEY + '\\s*=\\s*(true|1|yes)\\s*$', 'mi').test(block);
  }

  /* ---------- Dateisystem ---------- */
  const NOW = '14.11.2006 03:33';
  const F = (name, children, extra) => Object.assign({ name, type: 'folder', children: children || [], date: '01.11.2006 08:12' }, extra || {});
  const T = (name, text, extra) => Object.assign({ name, type: 'txt', text, date: '03.11.2006 17:40' }, extra || {});
  const recycle = F('Papierkorb', [
    T('wecker.txt', 'Admin-Kennwort (verschlüsselt): ' + code + '\n\n' + RULE + '\n\nDas Ergebnis ist eine Uhrzeit, ohne Doppelpunkt eintippen.', { deletedFrom: 'Eigene Dateien', date: '13.11.2006 03:33' })
  ], { recycle: true });
  const myFiles = F('Eigene Dateien', [
    F('Bilder', [
      { name: 'Praxis.jpg', type: 'jpg', src: 'Assets/vorschau.jpg', date: '02.11.2006 11:05' },
      { name: 'Team.jpg', type: 'jpg', src: 'Assets/Pascal_Krieger.avif', date: '02.11.2006 11:06' },
      F('.thumbs', [T('Thumbs.db', 'Miniaturansichten-Cache.\n\nZuletzt geöffnet: fuer_dich.zip\nKommentar gelesen: nein')], { hidden: true }),
      policyFile
    ]),
    F('Musik', [T('Playlist.m3u', '#EXTM3U\nWarteraum-Musik 1.mp3\nWarteraum-Musik 2.mp3')]),
    T('Termine.txt', termineText),
    T('Dehnübungen.txt', exercises.map((e, i) => (i + 1) + '. ' + e).join('\n') + '\n\nLangsam. Gleichmäßig. Mitzählen.'),
    F('Tagebuch', diaryFiles, { hidden: true, date: '14.11.2006 03:33' }),
    T('notiz.txt', 'Das Kennwort für fuer_dich.zip steht im Tagebuch.\nNimm von jedem Tag den ersten Buchstaben des LETZTEN Wortes.\nTag 1 zuerst, dann Tag 2 und so weiter.\n\n– M.', { hidden: true, date: NOW }),
    { name: 'fuer_dich.zip', type: 'zip', hidden: true, date: NOW, comment: 'Von jedem Eintrag aus dem November: der erste Buchstabe des letzten Wortes. Alles andere zählt nicht.' },
    T('desktop.ini', '[.ShellClassInfo]\nInfoTip=Nicht alles, was gelöscht ist, ist weg.', { hidden: true, system: true })
  ], { date: '01.11.2006 08:10' });
  const windowsDir = F('WINDOWS', [
    F('system32', [
      T('readme.txt', 'Systemordner.\nWer Systemdateien sehen will, entfernt in den Ordneroptionen den Haken bei\n„Geschützte Systemdateien ausblenden“.'),
      T('konten.sys', 'Kontowechsel: Klick auf das Bild oben im Startmenü.\nDas Kennwort steht im Papierkorb.\nVolle Rechte: versteckte Datei im Ordner Bilder öffnen und beim Administrator false auf true ändern.', { system: true, hidden: true }),
      T('uhr.ini', '[Notiz]\n' + RULE.replace(/\n/g, '\n'), { hidden: true, system: true, date: '12.11.2006 23:58' }),
      { name: 'notepad.exe', type: 'exe', app: 'notepad', date: '23.08.2001 12:00' },
      { name: 'explorer.exe', type: 'exe', app: 'explorer', date: '23.08.2001 12:00' }
    ]),
    T('win.ini', '; for 16-bit app support\n[fonts]\n[extensions]\n[mci extensions]\n[files]\n[Mail]\nMAPI=1')
  ], { date: '23.08.2001 12:00' });
  const cDrive = F('Lokaler Datenträger (C:)', [
    F('Dokumente und Einstellungen', [F('Besucher', [myFiles, F('Desktop', [])]), F('Administrator', [], { locked: true })]),
    F('Programme', [F('Internet Explorer'), F('Windows Media Player')]),
    windowsDir
  ], { drive: true });
  const ROOT = F('Arbeitsplatz', [cDrive, recycle], { computer: true });
  (function link(node, parent) { node.parent = parent; (node.children || []).forEach(c => link(c, node)); })(ROOT, null);

  let showHidden = false, showSystem = false, view = 'icons', showTree = false;
  const readDiary = new Set();
  let zIndex = 1700, isAdmin = false;

  const sizeOf = (f) => f.type === 'folder' ? '' : f.type === 'zip' ? '2 KB' : f.type === 'jpg' ? '84 KB' : f.type === 'exe' ? '68 KB' : Math.max(1, Math.ceil((f.text || '').length / 1024)) + ' KB';
  const typeOf = (f) => ({ folder: 'Dateiordner', txt: 'Textdokument', zip: 'ZIP-komprimierter Ordner', jpg: 'JPEG-Bild', exe: 'Anwendung' })[f.type] || 'Datei';
  const pathOf = (f) => { const p = []; let n = f; while (n && n !== ROOT) { p.unshift(n.drive ? 'C:' : n.name); n = n.parent; } return p.length ? p.join('\\') : 'Arbeitsplatz'; };
  const visible = (f) => (!f.hidden || showHidden) && (!f.system || showSystem);

  /* ---------- Fenster ---------- */
  function makeWindow(title, cls, w, h) {
    const win = document.createElement('div');
    win.className = 'xpw ' + (cls || '');
    win.style.width = w + 'px';
    if (h) win.style.height = h + 'px';
    const vw = window.innerWidth, vh = window.innerHeight;
    win.style.left = Math.max(4, Math.min(vw - w - 4, (vw - w) / 2 + (Math.random() - 0.5) * 80)) + 'px';
    win.style.top = Math.max(4, Math.min(vh - (h || 260) - 44, (vh - (h || 260)) / 2 - 20 + (Math.random() - 0.5) * 60)) + 'px';
    win.style.zIndex = ++zIndex;
    win.innerHTML = '<div class="xpw-title"><span></span><div class="xpw-btns"><i></i><i></i><i class="xpw-close" role="button" aria-label="Schließen"></i></div></div><div class="xpw-body"></div>';
    win.querySelector('.xpw-title span').textContent = title;
    document.body.appendChild(win);
    win.addEventListener('pointerdown', () => { win.style.zIndex = ++zIndex; });
    win.querySelector('.xpw-close').addEventListener('click', () => { win.remove(); sound.play('click'); });
    win.querySelector('.xpw-btns i:nth-child(2)').addEventListener('click', () => win.classList.toggle('is-max'));
    const bar = win.querySelector('.xpw-title');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.xpw-btns') || win.classList.contains('is-max')) return;
      const sx = e.clientX - win.offsetLeft, sy = e.clientY - win.offsetTop;
      bar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        win.style.left = Math.max(-w + 60, Math.min(window.innerWidth - 60, ev.clientX - sx)) + 'px';
        win.style.top = Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - sy)) + 'px';
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.xpw-btns')) win.classList.toggle('is-max'); });
    return { win, body: win.querySelector('.xpw-body'), setTitle: (t) => { win.querySelector('.xpw-title span').textContent = t; } };
  }
  function msgBox(title, text, icon) {
    const { win, body } = makeWindow(title, 'xpw-dialog', 320);
    body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-' + (icon || 'error') + '"></span><div></div></div><div class="xpw-dialog-btns"><button type="button">OK</button></div>';
    body.querySelector('.xpw-dialog-row div').textContent = text;
    body.querySelector('button').addEventListener('click', () => win.remove());
    sound.play('buzz');
  }

  /* ---------- Programme ---------- */
  function openText(file) {
    const { body } = makeWindow((file ? file.name : 'Unbenannt') + ' - Editor', 'xpw-notepad', 470, 330);
    body.innerHTML = '<div class="xpw-menubar"><span>Datei</span><span>Bearbeiten</span><span>Format</span><span>Ansicht</span><span>?</span></div><textarea class="xpw-text" spellcheck="false"></textarea>';
    const ta = body.querySelector('textarea');
    ta.value = file ? file.text : '';
    ta.addEventListener('keydown', (e) => e.stopPropagation());
    ta.addEventListener('input', () => { if (file && file.type === 'txt' && !file.readonly) file.text = ta.value; });
    sound.play('click');
    if (file && file.diary) {
      readDiary.add(file.name);
      if (readDiary.size >= realCount) fx.unlock('diary');
    }
  }
  function openImage(file) {
    const { body } = makeWindow(file.name + ' - Windows Bild- und Faxanzeige', 'xpw-viewer', 520, 420);
    body.innerHTML = '<div class="xpw-imgwrap"><img alt=""></div><div class="xpw-viewer-bar"><button type="button">◀</button><button type="button">▶</button></div>';
    body.querySelector('img').src = file.src;
    const imgs = file.parent.children.filter(f => f.type === 'jpg' && visible(f));
    const nav = (d) => { const i = imgs.indexOf(file); file = imgs[(i + d + imgs.length) % imgs.length]; body.querySelector('img').src = file.src; };
    const btns = body.querySelectorAll('.xpw-viewer-bar button');
    btns[0].addEventListener('click', () => nav(-1));
    btns[1].addEventListener('click', () => nav(1));
  }
  function openZip(file) {
    const { win, body } = makeWindow('Kennwort erforderlich', 'xpw-dialog', 340);
    body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-lock"></span><div>„' + file.name + '“ ist kennwortgeschützt.<br>Kennwort:</div></div><input type="password" class="xpw-input" autocomplete="off" spellcheck="false"><div class="xpw-dialog-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Abbrechen</button></div>';
    const input = body.querySelector('input');
    setTimeout(() => input.focus(), 50);
    const tryIt = () => {
      const v = input.value.trim().toLowerCase();
      if (PASSWORDS.includes(v)) {
        win.remove();
        fx.unlock('riddle');
        openText({ name: 'geheim.txt', readonly: true, text: 'Du hast es gelöst. Das Wort war ' + word.replace('UE', 'Ü') + '.\n\nEr war nie ein Geist. Nur ein alter Praxis-PC, der jede Nacht\nfür alle mitgezählt hat, die tagsüber zu lange gesessen sind.\n\nAlso: Steh kurz auf. Streck dich. Roll die Schultern.\nEr zählt mit.\n\nThock.   Thock.   Thock.' });
      } else {
        sound.play('buzz');
        input.value = '';
        win.classList.remove('xpw-shake');
        requestAnimationFrame(() => win.classList.add('xpw-shake'));
      }
    };
    body.querySelector('[data-ok]').addEventListener('click', tryIt);
    body.querySelector('[data-cancel]').addEventListener('click', () => win.remove());
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryIt(); });
  }
  function openFile(f) {
    if (f.type === 'txt') openText(f);
    else if (f.type === 'jpg') openImage(f);
    else if (f.type === 'zip') openZip(f);
    else if (f.type === 'exe') {
      if (f.app === 'notepad') openText(null);
      else if (f.app === 'virus') msgBox(f.name, 'Zugriff verweigert.\n\nDie Datei wird gerade von einem anderen Prozess verwendet.');
      else openExplorer();
    }
  }

  function unlockFolder(node, done) {
    const { win, body } = makeWindow('Kennwort erforderlich', 'xpw-dialog', 340);
    body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-lock"></span><div>Der Ordner „' + node.name + '“ ist geschützt.<br>Kennwort:</div></div><input type="password" class="xpw-input" autocomplete="off"><div class="xpw-dialog-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Abbrechen</button></div>';
    const input = body.querySelector('input');
    setTimeout(() => input.focus(), 50);
    const tryIt = () => {
      if (input.value.trim() === node.lockedPassword) { node.unlocked = true; win.remove(); if (node.onUnlock) node.onUnlock(); done(); }
      else { sound.play('buzz'); input.value = ''; win.classList.remove('xpw-shake'); requestAnimationFrame(() => win.classList.add('xpw-shake')); }
    };
    body.querySelector('[data-ok]').addEventListener('click', tryIt);
    body.querySelector('[data-cancel]').addEventListener('click', () => win.remove());
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryIt(); });
  }

  /* ---------- Eigenschaften ---------- */
  function properties(f, onChange) {
    const { win, body } = makeWindow('Eigenschaften von ' + f.name, 'xpw-dialog xpw-props', 360);
    body.innerHTML = '<div class="xpw-tabs"><span class="is-active" data-tab="0">Allgemein</span>' + (f.comment ? '<span data-tab="1">Zusammenfassung</span>' : '') + '</div>' +
      '<div class="xpw-tabpage" data-page="0"><div class="xpw-prop-head"><span class="xpw-icon xpw-icon-' + f.type + '"></span><b></b></div><hr>' +
      '<dl><dt>Typ:</dt><dd>' + typeOf(f) + '</dd><dt>Ort:</dt><dd>' + pathOf(f.parent || ROOT) + '</dd><dt>Größe:</dt><dd>' + (sizeOf(f) || (f.children || []).length + ' Objekte') + '</dd><dt>Geändert:</dt><dd>' + (f.date || '') + '</dd></dl><hr>' +
      '<label><input type="checkbox" disabled' + (f.readonly ? ' checked' : '') + '> Schreibgeschützt</label><label><input type="checkbox" data-hid' + (f.hidden ? ' checked' : '') + '> Versteckt</label></div>' +
      (f.comment ? '<div class="xpw-tabpage" data-page="1" hidden><dl><dt>Titel:</dt><dd>' + f.name + '</dd><dt>Autor:</dt><dd>M.</dd><dt>Kommentar:</dt><dd></dd></dl></div>' : '') +
      '<div class="xpw-dialog-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Abbrechen</button></div>';
    body.querySelector('.xpw-prop-head b').textContent = f.name;
    if (f.comment) body.querySelector('[data-page="1"] dd:last-child').textContent = f.comment;
    body.querySelector('.xpw-tabs').addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (!t) return;
      body.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('is-active', x === t));
      body.querySelectorAll('[data-page]').forEach(p => { p.hidden = p.dataset.page !== t.dataset.tab; });
    });
    body.querySelector('[data-ok]').addEventListener('click', () => { f.hidden = body.querySelector('[data-hid]').checked; win.remove(); onChange(); });
    body.querySelector('[data-cancel]').addEventListener('click', () => win.remove());
  }

  /* ---------- Ordneroptionen ---------- */
  function folderOptions() {
    const { win, body } = makeWindow('Ordneroptionen', 'xpw-dialog', 400);
    body.innerHTML = '<div class="xpw-tabs"><span>Allgemein</span><span class="is-active">Ansicht</span><span>Dateitypen</span></div><div class="xpw-tabpage"><b>Erweiterte Einstellungen:</b><label><input type="checkbox" data-sys' + (showSystem ? '' : ' checked') + '> Geschützte Systemdateien ausblenden (empfohlen)</label><label><input type="checkbox" data-hidden' + (showHidden ? ' checked' : '') + '> Ausgeblendete Dateien und Ordner anzeigen</label><label><input type="checkbox" checked disabled> Erweiterungen bei bekannten Dateitypen ausblenden</label></div><div class="xpw-dialog-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Abbrechen</button></div>';
    body.querySelector('[data-ok]').addEventListener('click', () => {
      showHidden = body.querySelector('[data-hidden]').checked;
      showSystem = !body.querySelector('[data-sys]').checked;
      if (showHidden) fx.unlock('hidden');
      win.remove();
      sound.play('click');
      explorers.forEach(ex => ex.render());
    });
    body.querySelector('[data-cancel]').addEventListener('click', () => win.remove());
  }

  /* ---------- Explorer ---------- */
  const explorers = new Set();
  function openExplorer(startAt) {
    if (startAt === 'root') startAt = ROOT;
    if (startAt === 'bin') startAt = recycle;
    const ui = makeWindow('', 'xpw-explorer', 680, 460);
    const { win, body } = ui;
    let current = startAt || myFiles, history = [], future = [], selected = null, sortKey = 'name', sortDir = 1;
    body.innerHTML =
      '<div class="xpw-menubar">' +
        '<span class="xpw-menu" data-menu="file">Datei<div class="xpw-drop" hidden><button data-cmd="newfolder">Neu &gt; Ordner</button><button data-cmd="rename">Umbenennen</button><button data-cmd="delete">Löschen</button><button data-cmd="props">Eigenschaften</button><hr><button data-cmd="close">Schließen</button></div></span>' +
        '<span class="xpw-menu" data-menu="edit">Bearbeiten<div class="xpw-drop" hidden><button data-cmd="restore">Wiederherstellen</button><button data-cmd="empty">Papierkorb leeren</button></div></span>' +
        '<span class="xpw-menu" data-menu="view">Ansicht<div class="xpw-drop" hidden><button data-cmd="v-icons">Symbole</button><button data-cmd="v-list">Liste</button><button data-cmd="v-details">Details</button><hr><button data-cmd="tree">Explorer-Leiste: Ordner</button><button data-cmd="refresh">Aktualisieren</button></div></span>' +
        '<span>Favoriten</span>' +
        '<span class="xpw-menu" data-menu="tools">Extras<div class="xpw-drop" hidden><button data-cmd="options">Ordneroptionen...</button></div></span>' +
        '<span class="xpw-menu" data-menu="help">?<div class="xpw-drop" hidden><button data-cmd="about">Info</button></div></span>' +
      '</div>' +
      '<div class="xpw-toolbar"><button type="button" data-cmd="back">◀ Zurück</button><button type="button" data-cmd="fwd">▶</button><button type="button" data-cmd="up">▲</button><button type="button" data-cmd="tree">Ordner</button><button type="button" data-cmd="cycle">Ansichten</button></div>' +
      '<div class="xpw-address"><span>Adresse</span><input type="text" spellcheck="false"><button type="button" data-cmd="go">Wechseln zu</button></div>' +
      '<div class="xpw-main"><div class="xpw-side"></div><div class="xpw-files" tabindex="0"></div></div>' +
      '<div class="xpw-status"></div>';
    const side = body.querySelector('.xpw-side'), filesEl = body.querySelector('.xpw-files'), addr = body.querySelector('.xpw-address input'), status = body.querySelector('.xpw-status');

    function go(node, noHistory) {
      if (node.lockedPassword && !node.unlocked) { unlockFolder(node, () => go(node, noHistory)); return; }
    if (node.locked && !isAdmin) { msgBox(node.name, 'Auf C:\\Dokumente und Einstellungen\\' + node.name + ' kann nicht zugegriffen werden.\n\nZugriff verweigert.'); return; }
      if (!noHistory && current !== node) { history.push(current); future = []; }
      current = node;
      selected = null;
      render();
      sound.play('click');
    }
    function sorted(list) {
      const key = { name: (f) => f.name.toLowerCase(), size: (f) => sizeOf(f), type: (f) => typeOf(f), date: (f) => f.date || '' }[sortKey];
      return list.slice().sort((a, b) => ((b.type === 'folder') - (a.type === 'folder')) || (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * sortDir);
    }
    function renderSide() {
      if (showTree) {
        side.className = 'xpw-side is-tree';
        side.innerHTML = '<b>Ordner</b>';
        const ul = document.createElement('ul');
        (function walk(node, parentEl, depth) {
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.style.paddingLeft = (depth * 12 + 4) + 'px';
          btn.innerHTML = '<span class="xpw-icon xpw-icon-mini xpw-icon-' + (node.computer ? 'computer' : node.drive ? 'drive' : node.recycle ? 'recycle' : 'folder') + '"></span>';
          btn.append(node.name);
          if (node === current) btn.classList.add('is-current');
          btn.addEventListener('click', () => go(node));
          li.appendChild(btn);
          parentEl.appendChild(li);
          let n = current, open = node === ROOT;
          while (n) { if (n === node) open = true; n = n.parent; }
          if (open) (node.children || []).filter(c => c.type === 'folder' && visible(c)).forEach(c => walk(c, parentEl, depth + 1));
        })(ROOT, ul, 0);
        side.appendChild(ul);
      } else {
        side.className = 'xpw-side';
        side.innerHTML = '<b>Datei- und Ordneraufgaben</b><button type="button" data-cmd="newfolder">Neuen Ordner erstellen</button>' +
          (selected ? '<button type="button" data-cmd="rename">Datei umbenennen</button><button type="button" data-cmd="delete">Datei löschen</button><button type="button" data-cmd="props">Eigenschaften</button>' : '') +
          (current.recycle ? '<button type="button" data-cmd="empty">Papierkorb leeren</button>' : '') +
          '<b>Andere Orte</b><button type="button" data-go="my">Eigene Dateien</button><button type="button" data-go="pc">Arbeitsplatz</button><button type="button" data-go="bin">Papierkorb</button>' +
          '<b>Details</b><span>' + (selected ? selected.name + '<br>' + typeOf(selected) + '<br>' + (selected.date || '') : current.name) + '</span>';
      }
    }
    function render() {
      ui.setTitle(current.name);
      addr.value = pathOf(current);
      renderSide();
      const list = sorted((current.children || []).filter(visible));
      filesEl.className = 'xpw-files is-' + view;
      filesEl.innerHTML = view === 'details' ? '<div class="xpw-dhead"><span data-sort="name">Name</span><span data-sort="size">Größe</span><span data-sort="type">Typ</span><span data-sort="date">Geändert am</span></div>' : '';
      if (!list.length) filesEl.insertAdjacentHTML('beforeend', '<p class="xpw-empty">Dieser Ordner ist leer.</p>');
      list.forEach(f => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'xpw-file' + (f.hidden || f.system ? ' is-hidden' : '') + (f === selected ? ' is-selected' : '');
        const icon = f.computer ? 'computer' : f.drive ? 'drive' : f.recycle ? (f.children.length ? 'recycle-full' : 'recycle') : f.type;
        el.innerHTML = '<span class="xpw-icon xpw-icon-' + icon + '"></span><span class="xpw-fname"></span>' + (view === 'details' ? '<span>' + sizeOf(f) + '</span><span>' + typeOf(f) + '</span><span>' + (f.date || '') + '</span>' : '');
        el.querySelector('.xpw-fname').textContent = f.name;
        el.addEventListener('click', (e) => {
          selected = f;
          filesEl.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected'));
          el.classList.add('is-selected');
          renderSide();
          updateStatus();
          if (window.matchMedia('(hover: none)').matches) activate(f);
          else sound.play('click');
          e.stopPropagation();
        });
        el.addEventListener('dblclick', () => activate(f));
        el.addEventListener('contextmenu', (e) => { e.preventDefault(); selected = f; render(); contextMenu(e.clientX, e.clientY, f); });
        filesEl.appendChild(el);
      });
      updateStatus();
      body.querySelector('[data-cmd="back"]').disabled = !history.length;
      body.querySelector('[data-cmd="fwd"]').disabled = !future.length;
      body.querySelector('[data-cmd="up"]').disabled = !current.parent;
    }
    function updateStatus() {
      const n = (current.children || []).filter(visible).length;
      status.textContent = selected ? '1 Objekt markiert · ' + (sizeOf(selected) || typeOf(selected)) : n + ' Objekt' + (n === 1 ? '' : 'e');
    }
    function activate(f) { if (f.type === 'folder') go(f); else openFile(f); }

    function contextMenu(x, y, f) {
      document.querySelectorAll('.xpw-context').forEach(m => m.remove());
      const m = document.createElement('div');
      m.className = 'xpw-context';
      m.style.left = x + 'px';
      m.style.top = y + 'px';
      m.style.zIndex = ++zIndex;
      m.innerHTML = '<button data-cmd="open"><b>Öffnen</b></button>' + (current.recycle ? '<button data-cmd="restore">Wiederherstellen</button>' : '<button data-cmd="rename">Umbenennen</button><button data-cmd="delete">Löschen</button>') + '<hr><button data-cmd="props">Eigenschaften</button>';
      document.body.appendChild(m);
      m.addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) { m.remove(); cmd(b.dataset.cmd); } });
      setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
    }

    function rename() {
      if (!selected || current === ROOT || selected.drive || selected.recycle) return;
      const el = filesEl.querySelector('.is-selected .xpw-fname');
      if (!el) return;
      const input = document.createElement('input');
      input.className = 'xpw-rename';
      input.value = selected.name;
      el.replaceWith(input);
      input.focus();
      input.select();
      const done = (ok) => {
        const v = input.value.trim();
        if (ok && v && !current.children.some(c => c !== selected && c.name === v)) selected.name = v;
        render();
      };
      input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
      input.addEventListener('blur', () => done(true));
    }
    function del() {
      if (!selected || selected.drive || selected.recycle || current === ROOT) return;
      if (current.recycle) { msgBox('Löschen', 'Objekte im Papierkorb werden beim Leeren endgültig gelöscht.', 'info'); return; }
      current.children.splice(current.children.indexOf(selected), 1);
      selected.deletedFrom = current;
      selected.parent = recycle;
      recycle.children.push(selected);
      selected = null;
      sound.play('click');
      explorers.forEach(ex => ex.render());
    }
    function restore() {
      if (!current.recycle || !selected) return;
      const target = typeof selected.deletedFrom === 'object' ? selected.deletedFrom : myFiles;
      recycle.children.splice(recycle.children.indexOf(selected), 1);
      selected.parent = target;
      target.children.push(selected);
      selected = null;
      explorers.forEach(ex => ex.render());
    }
    function cmd(c) {
      if (c === 'back' && history.length) { future.push(current); go(history.pop(), true); }
      if (c === 'fwd' && future.length) { history.push(current); go(future.pop(), true); }
      if (c === 'up' && current.parent) go(current.parent);
      if (c === 'tree') { showTree = !showTree; explorers.forEach(ex => ex.render()); }
      if (c === 'cycle') { view = view === 'icons' ? 'list' : view === 'list' ? 'details' : 'icons'; render(); }
      if (c === 'v-icons' || c === 'v-list' || c === 'v-details') { view = c.slice(2); render(); }
      if (c === 'refresh') render();
      if (c === 'options') folderOptions();
      if (c === 'open' && selected) activate(selected);
      if (c === 'props') properties(selected || current, render);
      if (c === 'rename') rename();
      if (c === 'delete') del();
      if (c === 'restore') restore();
      if (c === 'empty' && recycle.children.length) { recycle.children.length = 0; explorers.forEach(ex => ex.render()); sound.play('click'); }
      if (c === 'newfolder' && current !== ROOT && !current.recycle) {
        let name = 'Neuer Ordner', i = 2;
        while (current.children.some(x => x.name === name)) name = 'Neuer Ordner (' + i++ + ')';
        const nf = F(name, [], { date: new Date().toLocaleDateString('de-AT') });
        nf.parent = current;
        current.children.push(nf);
        selected = nf;
        render();
        rename();
      }
      if (c === 'close') { win.remove(); }
      if (c === 'about') msgBox('Info über Windows', 'Microsoft Windows XP\nVersion 2002, Service Pack 2\n\nLizenziert für: Besucher\nPraxis-PC, Rainfeld', 'info');
      if (c === 'go') navigateTo(addr.value);
    }
    function navigateTo(text) {
      const t = text.trim().replace(/\\+$/, '').toLowerCase();
      const found = (function find(node) {
        if (pathOf(node).toLowerCase() === t || node.name.toLowerCase() === t) return node;
        for (const c of node.children || []) { if (c.type === 'folder' && visible(c)) { const r = find(c); if (r) return r; } }
        return null;
      })(ROOT);
      if (found) go(found); else msgBox(text, 'Windows findet „' + text + '“ nicht. Überprüfen Sie die Schreibweise, und wiederholen Sie den Vorgang.');
    }

    body.addEventListener('click', (e) => {
      const menu = e.target.closest('.xpw-menu');
      const c = e.target.closest('[data-cmd]');
      const g = e.target.closest('[data-go]');
      const s = e.target.closest('[data-sort]');
      body.querySelectorAll('.xpw-drop').forEach(d => { if (!menu || !menu.contains(d)) d.hidden = true; });
      if (c) { if (menu) menu.querySelector('.xpw-drop').hidden = true; cmd(c.dataset.cmd); return; }
      if (menu) { const d = menu.querySelector('.xpw-drop'); d.hidden = !d.hidden; return; }
      if (g) go(g.dataset.go === 'my' ? myFiles : g.dataset.go === 'pc' ? ROOT : recycle);
      if (s) { sortDir = sortKey === s.dataset.sort ? -sortDir : 1; sortKey = s.dataset.sort; render(); }
    });
    filesEl.addEventListener('click', (e) => { if (e.target === filesEl) { selected = null; render(); } });
    addr.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') navigateTo(addr.value); });
    win.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'F2') { e.preventDefault(); rename(); }
      if (e.key === 'Delete') { e.preventDefault(); del(); }
      if (e.key === 'Enter' && selected) { e.preventDefault(); activate(selected); }
      if (e.key === 'Backspace') { e.preventDefault(); cmd('back'); }
    });
    const ex = { render };
    explorers.add(ex);
    new MutationObserver((_, obs) => { if (!document.body.contains(win)) { explorers.delete(ex); obs.disconnect(); } }).observe(document.body, { childList: true });
    render();
  }

  /* ---------- Benutzerkonto: mit einem Trick zum Administrator ---------- */
  document.addEventListener('click', (e) => { if (e.target.closest('.xp-avatar') && e.target.closest('.xp-menu-head')) openAccounts(); });

  function openAccounts() {
    const { win, body } = makeWindow('Benutzerkonten', 'xpw-dialog', 360);
    body.innerHTML =
      '<div class="xpw-accounts">' +
        '<button type="button" class="xpw-account' + (isAdmin ? '' : ' is-current') + '"><span class="xp-avatar"></span><span><b>Besucher</b><small>Eingeschränktes Konto</small></span></button>' +
        '<button type="button" class="xpw-account' + (isAdmin ? ' is-current' : '') + '" data-admin><span class="xp-avatar xp-avatar-admin"></span><span><b>Administrator</b><small>Computeradministrator · Kennwortgeschützt</small></span></button>' +
      '</div>' +
      '<div class="xpw-login" hidden><div>Kennwort für Administrator:</div><input type="password" class="xpw-input" autocomplete="off" spellcheck="false"><div class="xpw-hint" hidden>Kennworthinweis: Weggeworfen ist nicht vergessen.</div><div class="xpw-dialog-btns"><button type="button" data-hint>?</button><button type="button" data-ok>Anmelden</button></div></div>';
    const login = body.querySelector('.xpw-login');
    const input = body.querySelector('input');
    body.querySelector('[data-admin]').addEventListener('click', () => {
      if (isAdmin) return;
      login.hidden = false;
      setTimeout(() => input.focus(), 30);
    });
    body.querySelector('[data-hint]').addEventListener('click', () => { body.querySelector('.xpw-hint').hidden = false; });
    const tryIt = () => {
      if (ADMIN_PASSWORDS.includes(input.value.trim())) {
        win.remove();
        becomeAdmin();
      } else {
        sound.play('buzz');
        input.value = '';
        win.classList.remove('xpw-shake');
        requestAnimationFrame(() => win.classList.add('xpw-shake'));
      }
    };
    body.querySelector('[data-ok]').addEventListener('click', tryIt);
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryIt(); });
  }

  function becomeAdmin() {
    isAdmin = true;
    window.dispatchEvent(new Event('pk-admin'));
    document.querySelectorAll('.xp-menu-head').forEach(h => { h.lastChild.textContent = 'Administrator'; });
    const menuBody = document.querySelector('.xp-menu-body');
    if (menuBody && !menuBody.querySelector('[data-admin-tools]')) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xp-menu-strong';
      b.dataset.adminTools = '';
      b.textContent = 'Systemsteuerung (Admin)';
      b.addEventListener('click', openAdminTools);
      menuBody.prepend(b);
    }
    openAdminTools();
  }

  /* ---------- Admin-Werkzeuge: verrückte Sachen ---------- */
  function openAdminTools() {
    if (!hasFullRights()) {
      msgBox('Systemsteuerung', 'Zugriff verweigert.\n\nDas Konto „Administrator“ hat auf diesem Computer keine vollen Rechte. Die lokale Sicherheitsrichtlinie verhindert den Zugriff.');
      return;
    }
    fx.unlock('admin');
    const { body } = makeWindow('Systemsteuerung', 'xpw-dialog xpw-admin', 380);
    body.innerHTML =
      '<div class="xpw-admin-grid">' +
        '<button type="button" data-a="bsod">Bluescreen</button>' +
        '<button type="button" data-a="errors">Fehler-Regen</button>' +
        '<button type="button" data-a="shake">Erdbeben</button>' +
        '<button type="button" data-a="trail">Mauszeiger-Spur</button>' +
        '<button type="button" data-a="points">+500 Punkte</button>' +
        '<button type="button" data-a="upside">Kopfstand</button>' +
      '</div>';
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'bsod') bluescreen();
      if (a === 'errors') errorRain();
      if (a === 'shake') { document.body.classList.remove('xp-quake'); requestAnimationFrame(() => document.body.classList.add('xp-quake')); sound.play('buzz'); }
      if (a === 'trail') toggleTrail();
      if (a === 'points' && window.pkShop) { window.pkShop.bonus(500); b.disabled = true; sound.play('ding'); }
      if (a === 'upside') document.documentElement.classList.toggle('xp-upside');
    });
  }

  function bluescreen() {
    fx.unlock('bsod');
    const s = document.createElement('div');
    s.className = 'xp-bsod';
    s.innerHTML = '<pre>Es wurde ein Problem festgestellt. Windows wurde heruntergefahren, damit\nder Computer nicht beschädigt wird.\n\nDER_RUECKEN_IST_VERSPANNT\n\nFalls diese Fehlermeldung zum ersten Mal angezeigt wird, stehen Sie auf\nund dehnen Sie sich. Wird die Meldung erneut angezeigt, gehen Sie wie\nfolgt vor:\n\nSchultern kreisen, Nacken lockern, tief durchatmen.\n\nTechnische Informationen:\n\n*** STOP: 0x00000333 (0x0000THOCK, 0xC0FFEE00, 0x00000000, 0x00000000)\n\n\nBeliebige Taste drücken oder klicken, um fortzufahren _</pre>';
    document.body.appendChild(s);
    sound.play('buzz');
    const close = () => { s.remove(); window.removeEventListener('keydown', close, true); };
    setTimeout(() => { s.addEventListener('click', close); window.addEventListener('keydown', close, true); }, 600);
  }

  function errorRain() {
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const { win, body } = makeWindow('Fehler', 'xpw-dialog xpw-error', 300);
        win.style.left = (40 + i * 22) + 'px';
        win.style.top = (40 + i * 22) + 'px';
        body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-error"></span><div>Zu lange gesessen.<br>Bitte kurz aufstehen.</div></div><div class="xpw-dialog-btns"><button type="button">OK</button></div>';
        body.querySelector('button').addEventListener('click', () => win.remove());
        sound.play('buzz');
      }, i * 110);
    }
  }

  let trail = null;
  function toggleTrail() {
    if (trail) { window.removeEventListener('pointermove', trail); trail = null; return; }
    let last = 0;
    trail = (e) => {
      const now = performance.now();
      if (now - last < 35) return;
      last = now;
      const c = document.createElement('span');
      c.className = 'xp-trail';
      c.style.left = e.clientX + 'px';
      c.style.top = e.clientY + 'px';
      document.body.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    };
    window.addEventListener('pointermove', trail);
  }

  window.pkXpExplorer = () => openExplorer();
  window.pkXp = {
    makeWindow, msgBox, openText, openExplorer, properties, F, T,
    ROOT, myFiles, recycle, puzzle: { word, privatCode },
    refresh: () => explorers.forEach(ex => ex.render())
  };
})();
