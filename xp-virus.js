// Windows XP: Nach dem Admin-Login schleicht sich langsam ein (unechter) Virus ein.
// Erst kaum merkbar, dann immer deutlicher. Wer ihn stoppen will, muss seine Datei in system32
// finden und endgültig löschen und danach im Task-Manager den Prozess beenden.
// Alles ist nur ein Spiel auf der Website und verändert nichts am echten Computer.
(function () {
  const fx = window.pkFx, xp = window.pkXp;
  if (!fx || !xp) return;
  const sound = fx.sound;
  const root = document.documentElement;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  fx.achievements.push(
    { id: 'cured', points: 250, secret: true, title: 'Virenfrei', tip: 'Halte den Virus auf, bevor er den Computer übernimmt.' },
    { id: 'infected', points: 100, secret: true, title: 'Übernommen', tip: 'Lass den Virus gewinnen.' }
  );

  const NAME = pick(['svch0st.exe', 'rundl1.exe', 'thockd.exe', 'wscrlpt.exe', 'lsas.exe']);
  const TOTAL = 300; // Sekunden bis zur Übernahme
  let started = false, elapsed = 0, timer = null, stage = 0, done = false, processAlive = true;

  // Die Datei des Virus: versteckte Systemdatei in WINDOWS\system32
  const findNode = (node, name) => { if (node.name === name) return node; for (const c of node.children || []) { const r = findNode(c, name); if (r) return r; } return null; };
  const system32 = findNode(xp.ROOT, 'system32');
  const virusFile = { name: NAME, type: 'exe', app: 'virus', hidden: true, system: true, date: '14.11.2006 03:33' };
  const virusExists = () => {
    const inSys = system32 && system32.children.includes(virusFile);
    const inBin = xp.recycle.children.includes(virusFile);
    return inSys || inBin;
  };

  /* ---------- Start: erst nach dem Admin-Login ---------- */
  window.addEventListener('pk-admin', () => {
    if (started) return;
    started = true;
    virusFile.parent = system32;
    system32.children.push(virusFile);
    xp.refresh();
    timer = setInterval(tick, 1000);
  });

  function tick() {
    if (done || !root.classList.contains('theme-xp')) return; // läuft nur in XP weiter
    elapsed++;
    const p = Math.min(1, elapsed / TOTAL);
    // Bildschirm verliert langsam Farbe
    if (elapsed % 5 === 0) root.style.setProperty('--infect', (p * 0.9).toFixed(2));
    if (elapsed === 45) { stage = 1; addDesktopFile(); }
    if (elapsed === 120) { stage = 2; addTrayIcon(); }
    if (elapsed === 210) stage = 3;
    if (stage >= 1 && Math.random() < 0.06 + stage * 0.04) glitchIcon();
    if (stage >= 2 && Math.random() < 0.05 * stage) notResponding();
    if (stage >= 3 && elapsed % 22 === 0) errorPopup();
    if (elapsed >= TOTAL) takeover();
  }

  /* ---------- Zeichen der Infektion ---------- */
  function glitchIcon() {
    const icons = document.querySelectorAll('.xp-dicon');
    if (!icons.length) return;
    const ic = pick([...icons]);
    ic.classList.add('xp-glitch');
    setTimeout(() => ic.classList.remove('xp-glitch'), 700);
  }
  function notResponding() {
    const wins = [...document.querySelectorAll('.xpw:not(.xpw-taskmgr)')];
    if (!wins.length) return;
    const w = pick(wins), span = w.querySelector('.xpw-title span');
    if (!span || span.textContent.includes('Keine Rückmeldung')) return;
    const old = span.textContent;
    span.textContent = old + ' (Keine Rückmeldung)';
    w.classList.add('xpw-frozen');
    setTimeout(() => { if (span.textContent.includes('(Keine Rückmeldung)')) span.textContent = old; w.classList.remove('xpw-frozen'); }, 2500);
  }
  function errorPopup() {
    const { win, body } = xp.makeWindow(NAME + ' - Anwendungsfehler', 'xpw-dialog', 360);
    win.style.left = (40 + Math.random() * (window.innerWidth - 420)) + 'px';
    win.style.top = (40 + Math.random() * (window.innerHeight - 260)) + 'px';
    body.innerHTML = '<div class="xpw-dialog-row"><span class="xpw-icon xpw-icon-error"></span><div></div></div><div class="xpw-dialog-btns"><button type="button">OK</button></div>';
    body.querySelector('.xpw-dialog-row div').textContent = pick([
      'Die Anweisung in "0x00000333" verweist auf Speicher in "0x0000THOCK". Der Vorgang "read" konnte nicht im Speicher durchgeführt werden.',
      'Du sitzt schon zu lange. Ich auch.',
      'Speicher wird übernommen: ' + Math.round(elapsed / TOTAL * 100) + ' %',
      'Er zählt nicht mehr mit. Jetzt zähle ich.'
    ]);
    body.querySelector('button').addEventListener('click', () => win.remove());
    sound.play('buzz');
  }
  let deskFile = null;
  function addDesktopFile() {
    const text = 'Ich bin schon eine Weile hier.\nIn ' + NAME + ', zwischen den Systemdateien.\n\nDu hast das Admin-Konto geöffnet. Danke.\nJetzt gehört mir alles, was er gezählt hat.\n\nIn fünf Minuten bin ich überall.';
    deskFile = xp.T('hallo.txt', text, { date: '14.11.2006 03:33' });
    if (window.pkXpDesk) window.pkXpDesk.addFile(deskFile);
  }
  function addTrayIcon() {
    const tray = document.querySelector('.xp-tray');
    if (!tray || tray.querySelector('.xp-tray-virus')) return;
    const s = document.createElement('span');
    s.className = 'xp-tray-virus';
    s.title = 'Ihr Computer ist möglicherweise gefährdet';
    tray.prepend(s);
  }

  /* ---------- Übernahme (verloren) ---------- */
  function takeover() {
    done = true;
    clearInterval(timer);
    document.querySelectorAll('.xpw').forEach(w => w.remove());
    const s = document.createElement('div');
    s.className = 'xp-bsod xp-bsod-virus';
    s.innerHTML = '<pre>Es wurde ein Problem festgestellt. Windows gehört jetzt jemand anderem.\n\nSYSTEM_UEBERNOMMEN\n\nDer Prozess ' + NAME + ' hat alle Rechte übernommen.\nEr hat nie geschlafen. Er hat nur gewartet, bis du sitzt.\n\nTechnische Informationen:\n\n*** STOP: 0x00000333 (0xDEADBACC, 0x00000000, 0x00000000, 0x00000000)\n\n\nBeliebige Taste drücken, um neu zu starten _</pre>';
    document.body.appendChild(s);
    sound.play('buzz');
    fx.unlock('infected');
    const restart = () => { s.remove(); window.removeEventListener('keydown', restart, true); cleanup(); xp.msgBox('Windows', 'Windows wurde nach einem schwerwiegenden Fehler neu gestartet.', 'info'); };
    setTimeout(() => { s.addEventListener('click', restart); window.addEventListener('keydown', restart, true); }, 800);
  }

  /* ---------- Aufgehalten (gewonnen) ---------- */
  function cured() {
    done = true;
    clearInterval(timer);
    fx.unlock('cured');
    cleanup();
    xp.openText({ name: 'Virenfrei.txt', readonly: true, text: 'Der Prozess ' + NAME + ' wurde beendet und seine Datei gelöscht.\n\nDer alte PC atmet auf. Thock.\n\nUnd du: Steh kurz auf und streck dich. Du hast es dir verdient.' });
  }

  function cleanup() {
    root.style.removeProperty('--infect');
    document.querySelectorAll('.xp-tray-virus').forEach(e => e.remove());
    if (deskFile && window.pkXpDesk) window.pkXpDesk.removeFile(deskFile);
    if (system32) { const i = system32.children.indexOf(virusFile); if (i >= 0) system32.children.splice(i, 1); }
    xp.refresh();
  }

  /* ---------- Task-Manager ---------- */
  const SYSTEM_PROCS = [['System', 'SYSTEM', 0, '28 K'], ['smss.exe', 'SYSTEM', 0, '388 K'], ['csrss.exe', 'SYSTEM', 1, '3.412 K'], ['winlogon.exe', 'SYSTEM', 0, '4.120 K'], ['services.exe', 'SYSTEM', 0, '3.236 K'], ['svchost.exe', 'SYSTEM', 0, '4.900 K'], ['explorer.exe', 'Besucher', 2, '18.644 K']];
  function taskManager() {
    const { win, body } = xp.makeWindow('Windows Task-Manager', 'xpw-dialog xpw-taskmgr', 420);
    body.innerHTML = '<div class="xpw-tabs"><span data-tab="apps">Anwendungen</span><span class="is-active" data-tab="procs">Prozesse</span><span data-tab="perf">Systemleistung</span></div><div class="xpw-tabpage xpw-tm-page"></div><div class="xpw-dialog-btns"><button type="button" data-kill>Prozess beenden</button></div><div class="xpw-status"></div>';
    const page = body.querySelector('.xpw-tm-page'), status = body.querySelector('.xpw-status');
    let tab = 'procs', selected = null;
    function procs() {
      const list = SYSTEM_PROCS.map(([n, u, c, m]) => ({ n, u, c: c + Math.floor(Math.random() * 2), m }));
      if (started && processAlive && !done) {
        const cpu = Math.min(99, 20 + Math.round(elapsed / TOTAL * 79) + Math.floor(Math.random() * 3));
        list.push({ n: NAME, u: 'SYSTEM', c: cpu, m: (12000 + elapsed * 97).toLocaleString('de-AT') + ' K', virus: true });
      }
      return list;
    }
    function render() {
      body.querySelectorAll('[data-tab]').forEach(t => t.classList.toggle('is-active', t.dataset.tab === tab));
      const list = procs();
      const cpuTotal = Math.min(100, list.reduce((s, p) => s + p.c, 0));
      if (tab === 'procs') {
        page.innerHTML = '<div class="xpw-tm-head"><span>Abbildname</span><span>Benutzername</span><span>CPU</span><span>Speicher</span></div>' +
          list.map(p => '<button type="button" class="xpw-tm-row' + (p.n === selected ? ' is-selected' : '') + '" data-p="' + p.n + '"><span>' + p.n + '</span><span>' + p.u + '</span><span>' + String(p.c).padStart(2, '0') + '</span><span>' + p.m + '</span></button>').join('');
      } else if (tab === 'apps') {
        page.innerHTML = '<div class="xpw-tm-head"><span>Task</span><span>Status</span></div>' + [...document.querySelectorAll('.xpw')].map(w => '<div class="xpw-tm-row"><span>' + (w.querySelector('.xpw-title span') || {}).textContent + '</span><span>' + (w.classList.contains('xpw-frozen') ? 'Keine Rückmeldung' : 'Wird ausgeführt') + '</span></div>').join('');
      } else {
        page.innerHTML = '<b>CPU-Auslastung</b><div class="xpw-tm-cpu"><i style="height:' + cpuTotal + '%"></i></div><div>' + cpuTotal + ' %</div>';
      }
      status.textContent = 'Prozesse: ' + list.length + ' | CPU-Auslastung: ' + cpuTotal + ' %';
    }
    page.addEventListener('click', (e) => {
      const r = e.target.closest('[data-p]');
      if (!r) return;
      selected = r.dataset.p;
      render();
    });
    body.querySelector('.xpw-tabs').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; render(); } });
    body.querySelector('[data-kill]').addEventListener('click', () => {
      if (!selected) return;
      if (selected !== NAME) { xp.msgBox('Task-Manager-Warnung', 'Der Vorgang konnte nicht ausgeführt werden.\n\nZugriff verweigert.'); return; }
      if (virusExists()) {
        // Ohne gelöschte Datei startet er sofort neu
        xp.msgBox('Task-Manager-Warnung', 'Der Prozess „' + NAME + '“ wurde beendet und sofort neu gestartet.\n\nQuelle: C:\\WINDOWS\\system32\\' + NAME, 'error');
        return;
      }
      processAlive = false;
      selected = null;
      render();
      cured();
    });
    render();
    const iv = setInterval(() => { if (!document.body.contains(win)) clearInterval(iv); else render(); }, 1500);
  }
  window.pkXpTaskmgr = taskManager;
})();
