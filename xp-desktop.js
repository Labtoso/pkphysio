// Windows XP: Website-Fenster schließen (Rechtsklick auf die Taskleiste), Desktop mit Programmen
// und weitere Rätsel. Alles wird bei jedem Besuch neu ausgewürfelt und ist nur ein Spiel.
(function () {
  const fx = window.pkFx, xp = window.pkXp;
  if (!fx || !xp) return;
  const sound = fx.sound;
  const root = document.documentElement;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  fx.achievements.push(
    { id: 'escaped', points: 150, secret: true, title: 'Escaped', tip: 'Schließ in Windows XP das Website-Fenster.' },
    { id: 'mines', points: 150, secret: true, title: 'Minenräumer', tip: 'Gewinn eine Runde Minesweeper.' },
    { id: 'privat', points: 200, secret: true, title: 'Privatsache', tip: 'Öffne den geschützten Ordner auf dem Desktop.' },
    { id: 'cipher', points: 200, secret: true, title: 'Geheimschrift', tip: 'Entschlüssle den Favoriten im Internet Explorer.' }
  );

  /* ---------- Rätsel: Geheimschrift ---------- */
  // Verschiebung = Länge des Zip-Kennworts, das Lösungswort muss man bei Start > Ausführen eingeben
  const SECRET = pick(['DEHNEN', 'ATMEN', 'STRECKEN', 'LOCKERN', 'BEWEGEN', 'AUFSTEHEN']);
  const SHIFT = xp.puzzle.word.length;
  const caesar = (s, k) => s.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65));
  const CIPHER = caesar(SECRET, SHIFT);

  /* ---------- Desktop-Dateien ---------- */
  const desktopNode = xp.F('Desktop', [], {});
  const privat = xp.F('Privat', [
    xp.T('brief.txt', 'Liebe M.,\n\ndanke, dass du jede Nacht nach dem alten PC gesehen hast.\nEr war nie kaputt. Er hat nur gezählt, für alle, die zu lange sitzen.\n\nWenn du das liest, bist du weiter gekommen als alle anderen.\nSteh auf. Streck dich. Er zählt mit.\n\n– P.')
  ], { lockedPassword: xp.puzzle.privatCode, comment: 'Kennwort = Anzahl der Dehnübungen × Sekunden beim Nacken + Termine der Rücken-Gruppe.', onUnlock: () => fx.unlock('privat') });
  const readme = xp.T('LIES MICH.txt', 'Für den nächsten, der hier sitzt:\n\nNicht alles auf diesem Desktop ist, was es scheint.\nDer Explorer kennt mehr, als er zeigt.\nUnd wer zu lange sitzt, sollte die Favoriten lesen.');
  const favNote = xp.T('favoriten.txt', 'Meine Favoriten schreibe ich nie im Klartext.\nJeder Buchstabe wird so viele Stellen im Alphabet weitergeschoben,\nwie das Kennwort der Zip-Datei Buchstaben hat. Nach Z kommt wieder A.\n\nWas dabei herauskommt, sollst du nicht lesen, sondern ausführen.', { hidden: true });
  desktopNode.children.push(privat, readme, favNote);
  [privat, readme, favNote].forEach(f => { f.parent = desktopNode; });
  // Desktop-Ordner im Explorer ersetzen
  const besucher = xp.myFiles.parent;
  const oldDesk = besucher.children.find(c => c.name === 'Desktop');
  if (oldDesk) besucher.children.splice(besucher.children.indexOf(oldDesk), 1, desktopNode);
  desktopNode.parent = besucher;

  /* ---------- Desktop ---------- */
  const ICONS = [
    { id: 'pc', name: 'Arbeitsplatz', icon: 'computer' },
    { id: 'my', name: 'Eigene Dateien', icon: 'folder' },
    { id: 'bin', name: 'Papierkorb', icon: 'recycle' },
    { id: 'ie', name: 'Internet Explorer', icon: 'ie' },
    { id: 'notepad', name: 'Editor', icon: 'txt' },
    { id: 'calc', name: 'Rechner', icon: 'calc' },
    { id: 'mines', name: 'Minesweeper', icon: 'mines' },
    { id: 'cmd', name: 'Eingabeaufforderung', icon: 'cmd' },
    { id: 'privat', name: 'Privat', icon: 'folder' },
    { id: 'readme', name: 'LIES MICH.txt', icon: 'txt' },
    { id: 'site', name: 'Pascal Krieger', icon: 'site' }
  ];
  let desktop = null;
  function buildDesktop() {
    if (desktop) return;
    desktop = document.createElement('div');
    desktop.className = 'xp-desktop';
    ICONS.forEach(ic => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'xp-dicon';
      b.innerHTML = '<span class="xpw-icon xpw-icon-' + ic.icon + '"></span><span></span>';
      b.lastChild.textContent = ic.name;
      b.addEventListener('click', () => {
        desktop.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected'));
        b.classList.add('is-selected');
        sound.play('click');
        if (window.matchMedia('(hover: none)').matches) launch(ic.id);
      });
      b.addEventListener('dblclick', () => launch(ic.id));
      desktop.appendChild(b);
    });
    document.body.appendChild(desktop);
  }
  function launch(id) {
    if (id === 'pc') xp.openExplorer('root');
    if (id === 'my') xp.openExplorer();
    if (id === 'bin') xp.openExplorer('bin');
    if (id === 'notepad') xp.openText(null);
    if (id === 'readme') xp.openText(readme);
    if (id === 'privat') xp.openExplorer(desktopNode);
    if (id === 'ie') internetExplorer();
    if (id === 'calc') calculator();
    if (id === 'mines') minesweeper();
    if (id === 'cmd') commandPrompt();
    if (id === 'site') showSite();
  }

  /* ---------- Website-Fenster schließen / minimieren / wiederherstellen ---------- */
  function hideSite(closed) {
    root.classList.add('xp-site-hidden');
    buildDesktop();
    if (closed) fx.unlock('escaped');
    sound.play('click');
  }
  function showSite() {
    root.classList.remove('xp-site-hidden');
    sound.play('click');
  }
  document.addEventListener('contextmenu', (e) => {
    if (!root.classList.contains('theme-xp')) return;
    const task = e.target.closest('.xp-task');
    const title = e.target.closest('.site-header');
    if (!task && !title) return;
    e.preventDefault();
    document.querySelectorAll('.xpw-context').forEach(m => m.remove());
    const m = document.createElement('div');
    m.className = 'xpw-context';
    m.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
    m.style.top = Math.min(e.clientY, window.innerHeight - 120) + 'px';
    m.style.zIndex = 4000;
    m.innerHTML = '<button data-w="restore">Wiederherstellen</button><button data-w="min">Minimieren</button><hr><button data-w="close"><b>Schließen</b></button>';
    document.body.appendChild(m);
    m.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-w]');
      if (!b) return;
      m.remove();
      if (b.dataset.w === 'close') hideSite(true);
      if (b.dataset.w === 'min') hideSite(false);
      if (b.dataset.w === 'restore') showSite();
    });
    setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.xp-task') && root.classList.contains('xp-site-hidden')) showSite();
  });
  // Beim Verlassen von XP immer zurück zur Website
  new MutationObserver(() => { if (!root.classList.contains('theme-xp')) root.classList.remove('xp-site-hidden'); }).observe(root, { attributes: true, attributeFilter: ['class'] });

  /* ---------- Start > Ausführen ---------- */
  function runDialog() {
    const { win, body } = xp.makeWindow('Ausführen', 'xpw-dialog', 360);
    body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-run"></span><div>Geben Sie den Namen eines Programms, Ordners, Dokuments oder einer Internetressource an.</div></div><div class="xpw-run-row">Öffnen: <input type="text" class="xpw-input" spellcheck="false"></div><div class="xpw-dialog-btns"><button type="button" data-ok>OK</button><button type="button" data-cancel>Abbrechen</button></div>';
    const input = body.querySelector('input');
    setTimeout(() => input.focus(), 50);
    const go = () => { const v = input.value.trim(); win.remove(); run(v); };
    body.querySelector('[data-ok]').addEventListener('click', go);
    body.querySelector('[data-cancel]').addEventListener('click', () => win.remove());
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); });
  }
  function run(cmd) {
    const c = cmd.toLowerCase().replace(/\.exe$/, '');
    if (!c) return;
    if (c === 'notepad') xp.openText(null);
    else if (c === 'explorer') xp.openExplorer();
    else if (c === 'calc') calculator();
    else if (c === 'winmine') minesweeper();
    else if (c === 'cmd') commandPrompt();
    else if (c === 'iexplore') internetExplorer();
    else if (c === SECRET.toLowerCase()) {
      fx.unlock('cipher');
      xp.openText({ name: 'danke.txt', text: 'Richtig: ' + SECRET + '.\n\nGenau das hat er die ganze Zeit gemeint.\nNicht nur lesen. Machen.\n\nThock.' });
    } else xp.msgBox(cmd, 'Windows findet „' + cmd + '“ nicht. Stellen Sie sicher, dass Sie den Namen richtig eingegeben haben, und wiederholen Sie den Vorgang.');
  }
  // Ausführen ins Startmenü einhängen, sobald es existiert
  new MutationObserver(() => {
    const body = document.querySelector('.xp-menu-body');
    if (body && !body.querySelector('[data-run]')) {
      const hr = document.createElement('hr');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.run = '';
      b.textContent = 'Ausführen...';
      b.addEventListener('click', () => { document.querySelector('.xp-menu').hidden = true; runDialog(); });
      body.append(hr, b);
    }
  }).observe(document.body, { childList: true });

  /* ---------- Internet Explorer ---------- */
  function internetExplorer() {
    const { body } = xp.makeWindow('Die Seite kann nicht angezeigt werden - Microsoft Internet Explorer', 'xpw-ie', 560, 380);
    body.innerHTML =
      '<div class="xpw-menubar"><span>Datei</span><span>Bearbeiten</span><span>Ansicht</span><span class="xpw-menu" data-menu="fav">Favoriten<div class="xpw-drop" hidden><button>MSN.de</button><button>Windows Update</button><hr><button data-fav>' + CIPHER + '</button></div></span><span>Extras</span><span>?</span></div>' +
      '<div class="xpw-address"><span>Adresse</span><input type="text" value="http://www.msn.de/" spellcheck="false"><button type="button">Wechseln zu</button></div>' +
      '<div class="xpw-iepage"><h3>Die Seite kann nicht angezeigt werden.</h3><p>Die gesuchte Seite ist zurzeit nicht verfügbar. Möglicherweise ist die Website ausgelastet, oder Sie müssen die Browsereinstellungen anpassen.</p><hr><p>Versuchen Sie Folgendes:</p><ul><li>Klicken Sie auf <b>Aktualisieren</b>, oder wiederholen Sie den Vorgang später.</li><li>Stehen Sie kurz auf und strecken Sie sich.</li></ul></div>';
    const menu = body.querySelector('[data-menu="fav"]');
    menu.addEventListener('click', (e) => {
      const d = menu.querySelector('.xpw-drop');
      if (e.target.closest('[data-fav]')) { d.hidden = true; xp.msgBox('Favorit', 'Die Adresse „' + CIPHER + '“ ist ungültig.\n\nVerschiebung unbekannt.', 'info'); return; }
      d.hidden = !d.hidden;
    });
    body.querySelector('.xpw-address input').addEventListener('keydown', (e) => e.stopPropagation());
  }

  /* ---------- Rechner ---------- */
  function calculator() {
    const { body } = xp.makeWindow('Rechner', 'xpw-calc', 240);
    body.innerHTML = '<input class="xpw-calc-display" value="0" readonly><div class="xpw-calc-keys">' +
      ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', 'C', '=', '+'].map(k => '<button type="button" data-k="' + k + '">' + k + '</button>').join('') + '</div>';
    const disp = body.querySelector('input');
    let expr = '';
    body.querySelector('.xpw-calc-keys').addEventListener('click', (e) => {
      const k = e.target.closest('[data-k]');
      if (!k) return;
      const v = k.dataset.k;
      sound.play('click');
      if (v === 'C') expr = '';
      else if (v === '=') {
        // Nur Ziffern und Grundrechenarten, links nach rechts mit Punkt vor Strich
        try { expr = /^[\d+\-*/. ]+$/.test(expr) ? String(Math.round(Function('"use strict";return (' + expr + ')')() * 1e8) / 1e8) : ''; } catch (err) { expr = ''; }
      } else expr += v;
      disp.value = expr || '0';
    });
  }

  /* ---------- Minesweeper ---------- */
  function minesweeper() {
    const W = 9, H = 9, M = 10;
    const { body } = xp.makeWindow('Minesweeper', 'xpw-mines', 230);
    body.innerHTML = '<div class="xpw-mines-head"><span data-left>010</span><button type="button" data-face>🙂</button><span data-time>000</span></div><div class="xpw-mines-grid"></div>';
    const grid = body.querySelector('.xpw-mines-grid'), face = body.querySelector('[data-face]'), left = body.querySelector('[data-left]'), timeEl = body.querySelector('[data-time]');
    let cells, over, opened, flags, timer, t;
    function reset() {
      cells = Array.from({ length: W * H }, () => ({ mine: false, open: false, flag: false, n: 0 }));
      over = false; opened = 0; flags = 0; t = 0; clearInterval(timer); timer = null;
      face.textContent = '🙂'; left.textContent = '010'; timeEl.textContent = '000';
      draw();
    }
    function plant(skip) {
      let placed = 0;
      while (placed < M) { const i = Math.floor(Math.random() * W * H); if (i !== skip && !cells[i].mine) { cells[i].mine = true; placed++; } }
      cells.forEach((c, i) => { c.n = around(i).filter(j => cells[j].mine).length; });
    }
    function around(i) {
      const x = i % W, y = Math.floor(i / W), r = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) r.push(ny * W + nx); }
      return r;
    }
    function open(i) {
      const c = cells[i];
      if (c.open || c.flag) return;
      c.open = true; opened++;
      if (c.n === 0 && !c.mine) around(i).forEach(open);
    }
    function draw() {
      grid.innerHTML = cells.map((c, i) => '<button type="button" data-i="' + i + '" class="' + (c.open ? 'is-open' : '') + (c.open && c.mine ? ' is-boom' : '') + '">' + (c.open ? (c.mine ? '✹' : (c.n || '')) : (c.flag ? '⚑' : '')) + '</button>').join('');
    }
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b || over) return;
      const i = Number(b.dataset.i);
      if (!timer) { plant(i); timer = setInterval(() => { t++; timeEl.textContent = String(Math.min(999, t)).padStart(3, '0'); }, 1000); }
      if (cells[i].flag) return;
      sound.play('click');
      if (cells[i].mine) {
        over = true; clearInterval(timer); face.textContent = '😵';
        cells.forEach(c => { if (c.mine) c.open = true; });
        draw(); sound.play('buzz'); return;
      }
      open(i);
      if (opened === W * H - M) { over = true; clearInterval(timer); face.textContent = '😎'; fx.unlock('mines'); sound.play('ding'); }
      draw();
    });
    grid.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const b = e.target.closest('[data-i]');
      if (!b || over) return;
      const c = cells[Number(b.dataset.i)];
      if (c.open) return;
      c.flag = !c.flag; flags += c.flag ? 1 : -1;
      left.textContent = String(M - flags).padStart(3, '0');
      draw();
    });
    face.addEventListener('click', reset);
    reset();
  }

  /* ---------- Eingabeaufforderung ---------- */
  function commandPrompt() {
    const { win, body } = xp.makeWindow('C:\\WINDOWS\\system32\\cmd.exe', 'xpw-cmd', 520, 300);
    body.innerHTML = '<pre class="xpw-cmd-out"></pre><div class="xpw-cmd-line"><span>C:\\Dokumente und Einstellungen\\Besucher&gt;</span><input type="text" spellcheck="false" autocomplete="off"></div>';
    const out = body.querySelector('pre'), input = body.querySelector('input');
    const print = (s) => { out.textContent += s + '\n'; out.scrollTop = out.scrollHeight; };
    print('Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright 1985-2001 Microsoft Corp.\n');
    setTimeout(() => input.focus(), 50);
    body.addEventListener('click', () => input.focus());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key !== 'Enter') return;
      const v = input.value.trim();
      input.value = '';
      print('C:\\Dokumente und Einstellungen\\Besucher>' + v);
      const [c, ...rest] = v.split(' ');
      const arg = rest.join(' ');
      switch ((c || '').toLowerCase()) {
        case '': break;
        case 'help': print('CLS      Löscht den Bildschirm.\nDATE     Zeigt das Datum an.\nDIR      Listet Dateien auf.\nECHO     Zeigt Meldungen an.\nEXIT     Beendet CMD.EXE.\nSTART    Startet ein Programm.\nTIME     Zeigt die Uhrzeit an.\nVER      Zeigt die Windows-Version an.\nWHOAMI   Zeigt den aktuellen Benutzer an.'); break;
        case 'cls': out.textContent = ''; break;
        case 'ver': print('\nMicrosoft Windows XP [Version 5.1.2600]'); break;
        case 'date': print('Aktuelles Datum: 14.11.2006'); break;
        case 'time': print('Aktuelle Zeit: 03:33:00,00'); break;
        case 'echo': print(arg); break;
        case 'whoami': print('praxis-pc\\besucher'); break;
        case 'dir': print(' Verzeichnis von C:\\Dokumente und Einstellungen\\Besucher\n\n14.11.2006  03:33    <DIR>          Desktop\n14.11.2006  03:33    <DIR>          Eigene Dateien\n               0 Datei(en)\n               2 Verzeichnis(se)'); break;
        case 'start': if (arg) run(arg); break;
        case 'exit': win.remove(); break;
        default:
          if (SECRET.toLowerCase() === c.toLowerCase()) run(c);
          else print('Der Befehl "' + c + '" ist entweder falsch geschrieben oder\nkonnte nicht gefunden werden.');
      }
      print('');
    });
  }
})();
