// Geheimes Tastatur-Spiel „Thock“: öffnet sich, wenn man auf der Seite „thock“ tippt
// oder den Ton-Knopf 5-mal schnell hintereinander drückt
(function () {
  const sound = window.pkSound;
  if (!sound) return;

  // Deutsche Tastatur, Positionen nach e.code (physische Taste), w = Breite in Tasten
  const ROWS = [
    [['Backquote', '^'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'], ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'], ['Digit8', '8'], ['Digit9', '9'], ['Digit0', '0'], ['Minus', 'ß'], ['Equal', '´'], ['Backspace', '⌫', 2]],
    [['Tab', 'Tab', 1.5], ['KeyQ', 'Q'], ['KeyW', 'W'], ['KeyE', 'E'], ['KeyR', 'R'], ['KeyT', 'T'], ['KeyY', 'Z'], ['KeyU', 'U'], ['KeyI', 'I'], ['KeyO', 'O'], ['KeyP', 'P'], ['BracketLeft', 'Ü'], ['BracketRight', '+'], ['Enter', '↵', 1.5]],
    [['CapsLock', '⇪', 1.75], ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D'], ['KeyF', 'F'], ['KeyG', 'G'], ['KeyH', 'H'], ['KeyJ', 'J'], ['KeyK', 'K'], ['KeyL', 'L'], ['Semicolon', 'Ö'], ['Quote', 'Ä'], ['Backslash', '#'], ['Enter', '', 1.25]],
    [['ShiftLeft', '⇧', 1.25], ['IntlBackslash', '<'], ['KeyZ', 'Y'], ['KeyX', 'X'], ['KeyC', 'C'], ['KeyV', 'V'], ['KeyB', 'B'], ['KeyN', 'N'], ['KeyM', 'M'], ['Comma', ','], ['Period', '.'], ['Slash', '-'], ['ShiftRight', '⇧', 2.75]],
    [['ControlLeft', 'Strg', 1.25], ['MetaLeft', '❖', 1.25], ['AltLeft', 'Alt', 1.25], ['Space', '', 6.25], ['AltRight', 'AltGr', 1.25], ['MetaRight', '❖', 1.25], ['ContextMenu', '☰', 1.25], ['ControlRight', 'Strg', 1.25]]
  ];

  const WORDS = ['physiotherapie', 'kraft', 'ausdauer', 'mobilität', 'gleichgewicht', 'koordination', 'kinesiotaping', 'rainfeld', 'motorsport', 'heilmassage', 'faszien', 'rücken', 'schulter', 'knie', 'sprunggelenk', 'dehnen', 'training', 'bewegung', 'lymphdrainage', 'massage', 'wirbelsäule', 'muskel', 'sehne', 'balance', 'regeneration', 'termin', 'thock'];

  let overlay = null;
  const keyEls = {};
  let word = '', pos = 0, score = 0, streak = 0, best = 0, typed = 0, startT = 0;
  let wordEl, scoreEl, streakEl, wpmEl, bestEl, fxLayer, panel;
  const allKeys = [];

  try { best = Number(localStorage.getItem('thock_best') || 0); } catch (e) {}

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'kb-overlay';
    overlay.innerHTML =
      '<div class="kb-blobs" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '<div class="kb-panel" role="dialog" aria-modal="true" aria-label="Thock">' +
        '<div class="kb-fx" aria-hidden="true"></div>' +
        '<div class="kb-head">' +
          '<h2 class="kb-title">Thock</h2>' +
          '<div class="kb-stats">' +
            '<span><b data-k="score">0</b><small>Wörter</small></span>' +
            '<span><b data-k="streak">0</b><small>Serie</small></span>' +
            '<span><b data-k="wpm">0</b><small>WPM</small></span>' +
            '<span><b data-k="best">0</b><small>Rekord</small></span>' +
          '</div>' +
          '<button class="kb-close" type="button" aria-label="Schließen" title="Schließen (Esc)">×</button>' +
        '</div>' +
        '<div class="kb-word" aria-live="polite"></div>' +
        '<div class="kb-board"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    wordEl = overlay.querySelector('.kb-word');
    scoreEl = overlay.querySelector('[data-k="score"]');
    streakEl = overlay.querySelector('[data-k="streak"]');
    wpmEl = overlay.querySelector('[data-k="wpm"]');
    bestEl = overlay.querySelector('[data-k="best"]');
    fxLayer = overlay.querySelector('.kb-fx');
    panel = overlay.querySelector('.kb-panel');

    const board = overlay.querySelector('.kb-board');
    ROWS.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      let x = 0;
      row.forEach(([code, label, w]) => {
        const size = w || 1;
        const key = document.createElement('button');
        key.type = 'button';
        key.className = 'kb-key' + (size > 1 ? ' is-wide' : '') + (code === 'Space' ? ' is-space' : '');
        key.style.flexGrow = size;
        key.dataset.code = code;
        key.dataset.row = r;
        key.dataset.size = size;
        key.dataset.cx = (x + size / 2).toFixed(2);
        key.dataset.pan = ((x + size / 2) / 15 * 2 - 1).toFixed(2);
        key.innerHTML = '<span class="kb-cap">' + label + '</span>';
        x += size;
        rowEl.appendChild(key);
        (keyEls[code] = keyEls[code] || []).push(key);
        allKeys.push(key);

        // Auch mit Maus oder Finger spielbar
        key.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          press(code, label.length === 1 ? label.toLowerCase() : (code === 'Space' ? ' ' : ''));
        });
        key.addEventListener('pointerup', () => release(code));
        key.addEventListener('pointerleave', () => { if (key.classList.contains('is-down')) release(code); });
      });
      board.appendChild(rowEl);
    });

    overlay.querySelector('.kb-close').addEventListener('click', close);
    overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
  }

  function info(code) {
    const el = keyEls[code] && keyEls[code][0];
    if (!el) return { size: 1, row: 2, pan: 0 };
    return { size: Number(el.dataset.size), row: Number(el.dataset.row), pan: Number(el.dataset.pan) };
  }

  function press(code, char) {
    const els = keyEls[code];
    if (els) els.forEach(el => {
      el.classList.remove('is-down', 'is-hit', 'is-miss');
      void el.offsetWidth;
      el.classList.add('is-down');
    });
    sound.play('thock', info(code));
    if (els) { ripple(els[0]); droplets(els[0], 4); }
    if (char) check(char, els);
  }

  function release(code) {
    const els = keyEls[code];
    if (els) els.forEach(el => {
      el.classList.remove('is-down');
      setTimeout(() => el.classList.remove('is-hit', 'is-miss'), 260);
    });
    sound.play('clack', info(code));
  }

  // Nachbartasten heben sich kurz nacheinander, wie eine Welle im Wasser
  function ripple(from) {
    const cx = Number(from.dataset.cx), row = Number(from.dataset.row);
    allKeys.forEach(k => {
      if (k === from) return;
      const d = Math.hypot(Number(k.dataset.cx) - cx, (Number(k.dataset.row) - row) * 1.1);
      if (d > 3.2) return;
      wave(k, d * 45, 1 - d / 3.6);
    });
  }
  function wave(k, delay, strength) {
    k.classList.remove('kb-wave');
    k.style.setProperty('--wd', delay.toFixed(0) + 'ms');
    k.style.setProperty('--ws', strength.toFixed(2));
    requestAnimationFrame(() => k.classList.add('kb-wave'));
  }

  // Kleine Glastropfen steigen aus der Taste auf
  function droplets(el, n, big) {
    const pr = panel.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.className = 'kb-drop' + (big ? ' is-big' : '');
      d.style.left = (r.left - pr.left + r.width * (0.2 + Math.random() * 0.6)) + 'px';
      d.style.top = (r.top - pr.top + r.height * 0.3) + 'px';
      d.style.setProperty('--dx', ((Math.random() - 0.5) * (big ? 160 : 40)).toFixed(0) + 'px');
      d.style.setProperty('--dy', (-(big ? 80 : 40) - Math.random() * (big ? 120 : 50)).toFixed(0) + 'px');
      d.style.setProperty('--s', ((big ? 10 : 5) + Math.random() * (big ? 14 : 6)).toFixed(1) + 'px');
      d.style.animationDelay = (Math.random() * 0.08).toFixed(2) + 's';
      fxLayer.appendChild(d);
      d.addEventListener('animationend', () => d.remove());
    }
  }

  // Zahl springt kurz, wenn sie sich ändert
  function bump(el, value) {
    if (el.textContent === String(value)) return;
    el.textContent = value;
    el.classList.remove('kb-bump');
    requestAnimationFrame(() => el.classList.add('kb-bump'));
  }

  // Wort geschafft: Welle über die ganze Tastatur, Tropfen aus dem Wort, Serien-Anzeige
  function celebrate() {
    allKeys.forEach(k => wave(k, Number(k.dataset.cx) * 28 + Number(k.dataset.row) * 18, 0.9));
    droplets(wordEl, 14, true);
    if (streak >= 2) {
      const c = document.createElement('span');
      c.className = 'kb-combo';
      c.textContent = 'Serie ×' + streak;
      const pr = panel.getBoundingClientRect(), wr = wordEl.getBoundingClientRect();
      c.style.left = (wr.left - pr.left + wr.width / 2) + 'px';
      c.style.top = (wr.top - pr.top) + 'px';
      fxLayer.appendChild(c);
      c.addEventListener('animationend', () => c.remove());
    }
  }

  function newWord() {
    let next;
    do { next = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (next === word && WORDS.length > 1);
    word = next;
    pos = 0;
    renderWord();
  }

  function renderWord() {
    wordEl.innerHTML = [...word].map((c, i) =>
      '<span style="--i:' + i + '" class="' + (i < pos ? 'is-done' : i === pos ? 'is-next' : '') + '">' + c + '</span>').join('');
    hint();
  }

  // Die nächste Taste leuchtet leise vor
  function hint() {
    overlay.querySelectorAll('.kb-key.is-target').forEach(el => el.classList.remove('is-target'));
    const c = word[pos];
    if (!c) return;
    overlay.querySelectorAll('.kb-key').forEach(el => {
      if (el.textContent.toLowerCase() === c) el.classList.add('is-target');
    });
  }

  function check(char, els) {
    if (!startT) startT = performance.now();
    if (char === word[pos]) {
      pos++;
      typed++;
      if (els) els.forEach(el => el.classList.add('is-hit'));
      if (pos >= word.length) {
        score++;
        streak++;
        if (streak > best) { best = streak; try { localStorage.setItem('thock_best', String(best)); } catch (e) {} }
        sound.play('ding');
        wordEl.classList.remove('is-win');
        void wordEl.offsetWidth;
        wordEl.classList.add('is-win');
        celebrate();
        setTimeout(newWord, 650);
      } else {
        renderWord();
      }
    } else {
      streak = 0;
      if (els) els.forEach(el => el.classList.add('is-miss'));
      sound.play('buzz');
      wordEl.classList.remove('is-shake');
      void wordEl.offsetWidth;
      wordEl.classList.add('is-shake');
      panel.classList.remove('kb-hurt');
      requestAnimationFrame(() => panel.classList.add('kb-hurt'));
    }
    const minutes = (performance.now() - startT) / 60000;
    bump(scoreEl, score);
    bump(streakEl, streak);
    bump(bestEl, best);
    bump(wpmEl, minutes > 0.02 ? Math.round(typed / 5 / minutes) : 0);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    if (e.repeat) return;
    const char = e.key.length === 1 ? e.key.toLowerCase() : '';
    press(e.code, char);
  }
  function onKeyUp(e) {
    if (e.key === 'Escape' || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    release(e.code);
  }

  function open() {
    if (!overlay) build();
    if (overlay.classList.contains('is-open')) return;
    score = streak = typed = 0;
    startT = 0;
    scoreEl.textContent = streakEl.textContent = wpmEl.textContent = '0';
    bestEl.textContent = best;
    overlay.classList.add('is-open');
    document.documentElement.classList.add('kb-lock');
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    newWord();
    sound.play('rise');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.documentElement.classList.remove('kb-lock');
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    sound.play('pop');
  }

  // Geheimer Zugang 1: „thock“ irgendwo auf der Seite tippen
  let buffer = '';
  window.addEventListener('keydown', (e) => {
    if (overlay && overlay.classList.contains('is-open')) return;
    if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-5);
    if (buffer === 'thock') { buffer = ''; open(); }
  });

  // Geheimer Zugang 2 (auch am Handy): Ton-Knopf 5-mal schnell drücken
  let taps = [];
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sound-toggle')) return;
    const now = performance.now();
    taps = taps.filter(t => now - t < 2000);
    taps.push(now);
    if (taps.length >= 5) {
      taps = [];
      // Nach 5-mal Drücken wäre der Ton aus, für das Spiel wieder einschalten
      if (!sound.on) e.target.closest('.sound-toggle').click();
      open();
    }
  });
})();
