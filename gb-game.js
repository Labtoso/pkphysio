// Game-Boy-Look: klassisches Block-Stapelspiel „Blockfall“ in vier Grüntönen mit Chiptune-Tönen.
// Eigene Umsetzung, keine fremden Grafiken oder Namen.
(function () {
  const fx = window.pkFx;
  if (!fx) return;
  const root = document.documentElement;

  fx.achievements.push({ id: 'gb10', points: 150, title: 'Zeilenfresser', tip: 'Räum im Game-Boy-Look 10 Reihen in Blockfall ab.' });

  const C = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];
  const W = 10, H = 18, S = 16;
  const SHAPES = [
    [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]
  ];

  // Chiptune: kurze Rechteck-Töne
  let ac = null;
  function beep(f, d, delay) {
    if (!fx.sound.on) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== 'running') ac.resume();
      const t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    } catch (e) {}
  }

  /* ---------- Startknopf (nur im Game-Boy-Look sichtbar) ---------- */
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'gb-launch';
  launch.title = 'Blockfall';
  launch.setAttribute('aria-label', 'Blockfall spielen');
  launch.innerHTML = '<span class="gb-launch-screen"></span><span class="gb-launch-pad"></span>';
  launch.addEventListener('click', open);
  document.body.appendChild(launch);

  let overlay = null, timer = null, board, piece, next, score, lines, over, paused;

  function open() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'gb-overlay';
    overlay.innerHTML =
      '<div class="gb-console" role="dialog" aria-label="Blockfall">' +
        '<div class="gb-screen-frame"><span class="gb-power"></span><canvas width="' + (W * S + 64) + '" height="' + (H * S) + '"></canvas></div>' +
        '<div class="gb-brand">BLOCKFALL</div>' +
        '<div class="gb-controls"><div class="gb-dpad"><button data-k="up">▲</button><button data-k="left">◀</button><button data-k="right">▶</button><button data-k="down">▼</button></div>' +
        '<div class="gb-ab"><button data-k="b">B</button><button data-k="a">A</button></div></div>' +
        '<div class="gb-meta"><button data-k="select">SELECT</button><button data-k="start">START</button></div>' +
        '<button class="gb-close" aria-label="Schließen" title="Schließen (Esc)">×</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('[data-k]');
      if (b) { e.preventDefault(); press(b.dataset.k); }
      if (e.target === overlay || e.target.closest('.gb-close')) close();
    });
    window.addEventListener('keydown', onKey, true);
    reset();
    [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.12, i * 0.1));
  }
  function close() {
    clearInterval(timer);
    window.removeEventListener('keydown', onKey, true);
    if (overlay) overlay.remove();
    overlay = null;
  }
  function onKey(e) {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'up', ' ': 'b', x: 'a', Enter: 'start', Escape: 'esc' };
    const k = map[e.key];
    if (!k) return;
    e.preventDefault();
    e.stopPropagation();
    if (k === 'esc') close(); else press(k);
  }

  const rand = () => SHAPES[Math.floor(Math.random() * SHAPES.length)].map(r => r.slice());
  function reset() {
    board = Array.from({ length: H }, () => Array(W).fill(0));
    next = rand();
    score = 0; lines = 0; over = false; paused = false;
    spawn();
    restartTimer();
    draw();
  }
  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => { if (!paused && !over) { drop(); draw(); } }, Math.max(110, 600 - Math.floor(lines / 5) * 60));
  }
  function spawn() {
    piece = { m: next, x: Math.floor((W - next[0].length) / 2), y: 0 };
    next = rand();
    if (collide(piece.m, piece.x, piece.y)) { over = true; [392, 330, 262, 196].forEach((f, i) => beep(f, 0.2, i * 0.15)); }
  }
  function collide(m, x, y) {
    return m.some((row, dy) => row.some((v, dx) => v && (y + dy >= H || x + dx < 0 || x + dx >= W || (y + dy >= 0 && board[y + dy][x + dx]))));
  }
  function rotate(m) { return m[0].map((_, i) => m.map(r => r[i]).reverse()); }
  function lock() {
    piece.m.forEach((row, dy) => row.forEach((v, dx) => { if (v && piece.y + dy >= 0) board[piece.y + dy][piece.x + dx] = 3; }));
    let cleared = 0;
    for (let y = H - 1; y >= 0; y--) {
      if (board[y].every(v => v)) { board.splice(y, 1); board.unshift(Array(W).fill(0)); cleared++; y++; }
    }
    if (cleared) {
      lines += cleared;
      score += [0, 40, 100, 300, 1200][cleared];
      [784, 988, 1175].slice(0, cleared + 1).forEach((f, i) => beep(f, 0.08, i * 0.07));
      if (lines >= 10 && root.classList.contains('theme-gb')) fx.unlock('gb10');
      restartTimer();
    } else beep(196, 0.05);
    spawn();
  }
  function drop() {
    if (!collide(piece.m, piece.x, piece.y + 1)) piece.y++;
    else lock();
  }
  function press(k) {
    if (over) { if (k === 'start' || k === 'a') reset(); return; }
    if (k === 'start') { paused = !paused; beep(paused ? 330 : 660, 0.08); draw(); return; }
    if (paused) return;
    if (k === 'left' && !collide(piece.m, piece.x - 1, piece.y)) { piece.x--; beep(440, 0.02); }
    if (k === 'right' && !collide(piece.m, piece.x + 1, piece.y)) { piece.x++; beep(440, 0.02); }
    if (k === 'down') { drop(); score++; }
    if (k === 'up' || k === 'a') {
      const r = rotate(piece.m);
      for (const off of [0, -1, 1, -2, 2]) { if (!collide(r, piece.x + off, piece.y)) { piece.m = r; piece.x += off; beep(523, 0.03); break; } }
    }
    if (k === 'b') { while (!collide(piece.m, piece.x, piece.y + 1)) { piece.y++; score += 2; } lock(); }
    draw();
  }

  function draw() {
    if (!overlay) return;
    const cv = overlay.querySelector('canvas'), g = cv.getContext('2d');
    g.fillStyle = C[0];
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = C[1];
    g.fillRect(W * S, 0, 64, cv.height);
    const cell = (x, y, shade) => {
      g.fillStyle = C[shade];
      g.fillRect(x * S + 1, y * S + 1, S - 2, S - 2);
      g.fillStyle = C[shade === 3 ? 2 : 1];
      g.fillRect(x * S + 4, y * S + 4, S - 8, S - 8);
    };
    board.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x, y, 3); }));
    // Schatten, wo das Teil landet
    let gy = piece.y;
    while (!collide(piece.m, piece.x, gy + 1)) gy++;
    piece.m.forEach((row, dy) => row.forEach((v, dx) => { if (v) { g.fillStyle = C[1]; g.fillRect((piece.x + dx) * S + 2, (gy + dy) * S + 2, S - 4, S - 4); } }));
    piece.m.forEach((row, dy) => row.forEach((v, dx) => { if (v) cell(piece.x + dx, piece.y + dy, 3); }));
    g.fillStyle = C[3];
    g.font = '8px "Press Start 2P", monospace';
    g.fillText('PUNKTE', W * S + 6, 16);
    g.fillText(String(score), W * S + 6, 30);
    g.fillText('REIHEN', W * S + 6, 52);
    g.fillText(String(lines), W * S + 6, 66);
    g.fillText('NÄCHST', W * S + 6, 92);
    next.forEach((row, dy) => row.forEach((v, dx) => { if (v) { g.fillStyle = C[3]; g.fillRect(W * S + 10 + dx * 10, 100 + dy * 10, 9, 9); } }));
    if (paused || over) {
      g.fillStyle = 'rgba(155,188,15,.85)';
      g.fillRect(0, H * S / 2 - 24, W * S, 48);
      g.fillStyle = C[3];
      g.fillText(over ? 'GAME OVER' : 'PAUSE', 38, H * S / 2 - 4);
      g.fillText(over ? 'START = NEU' : 'START = WEITER', 18, H * S / 2 + 12);
    }
  }
})();
