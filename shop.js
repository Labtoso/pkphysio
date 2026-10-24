// Erfolge-Knopf, Punkte und Shop neben dem Logo. Alles gilt nur für diesen Seitenbesuch.
(function () {
  const fx = window.pkFx;
  if (!fx) return;
  const sound = fx.sound;
  const root = document.documentElement;
  const header = document.querySelector('.header-inner');
  const logo = document.querySelector('.logo-link');
  if (!header || !logo) return;

  // Weitere Erfolge (die Liste in fx.js wird hier ergänzt)
  fx.achievements.push(
    { id: 'shop1', points: 10, title: 'Shopping-Tour', tip: 'Kauf etwas im Shop.' },
    { id: 'rich', points: 20, title: 'Großverdiener', tip: 'Sammle insgesamt 150 Punkte.' },
    { id: 'retro', points: 15, title: 'Zeitreise', tip: 'Schalte einen Retro-Look ein.' },
    { id: 'snake20', points: 30, title: 'Schlangenbeschwörer', tip: 'Schaff 20 Punkte in Snake.' },
    { id: 'react', points: 30, title: 'Blitzschnell', tip: 'Reagier im Reaktionstest unter 250 ms.' },
    { id: 'cps', points: 25, title: 'Klick-Monster', tip: 'Schaff 8 Klicks pro Sekunde im Klick-Rekord.' },
    { id: 'hunt30', points: 30, title: 'Blasen-Jäger', tip: 'Lass in der Blasen-Jagd 30 Blasen platzen.' },
    { id: 'konami', points: 40, title: 'Cheat-Code', tip: 'Ein berühmter Cheat-Code aus alten Videospielen.' },
    { id: 'rainbow', points: 30, title: 'Regenbogen', tip: 'Kauf alle Farben im Shop.' },
    { id: 'night', points: 20, title: 'Nachteule', tip: 'Besuch die Seite zwischen Mitternacht und 4 Uhr.' }
  );
  if (new Date().getHours() < 4) setTimeout(() => fx.unlock('night'), 2500);
  fx.onUnlock(() => { if (fx.earnedPoints() >= 150) setTimeout(() => fx.unlock('rich'), 4200); });

  // Konami-Code: ↑ ↑ ↓ ↓ ← → ← → B A
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiPos = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = k === KONAMI[konamiPos] ? konamiPos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (konamiPos === KONAMI.length) { konamiPos = 0; fx.unlock('konami'); }
  });

  let spent = 0;
  const balance = () => fx.earnedPoints() - spent;
  const owned = new Set();
  const active = new Set();

  const ICON_TROPHY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
  const ICON_SHOP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

  /* ---------- Knöpfe neben dem Logo ---------- */
  const hud = document.createElement('div');
  hud.className = 'fx-hud';
  hud.innerHTML =
    '<button type="button" class="fx-hud-btn" data-hud="ach" title="Erfolge" aria-label="Erfolge">' + ICON_TROPHY + '<span class="fx-hud-badge" data-badge>0</span></button>' +
    '<button type="button" class="fx-hud-btn" data-hud="shop" title="Shop" aria-label="Shop">' + ICON_SHOP + '</button>';
  logo.after(hud);
  const badge = hud.querySelector('[data-badge]');
  function updateBadge() {
    badge.textContent = balance();
    badge.classList.remove('is-bump');
    requestAnimationFrame(() => badge.classList.add('is-bump'));
    if (shopPanel && shopPanel.classList.contains('is-open')) renderShop();
  }
  fx.onUnlock(updateBadge);
  hud.addEventListener('click', (e) => {
    const b = e.target.closest('[data-hud]');
    if (!b) return;
    if (b.dataset.hud === 'ach') fx.openAchievements();
    else openShop();
  });

  /* ---------- Was es zu kaufen gibt ---------- */
  const SHOP = [
    { group: 'Farben', exclusive: 'color', items: [
      { id: 'c-teal', name: 'Teal', price: 0, color: '#17b6a4', free: true },
      { id: 'c-violet', name: 'Lila', price: 15, color: '#8b5cf6' },
      { id: 'c-pink', name: 'Pink', price: 15, color: '#ec4899' },
      { id: 'c-gold', name: 'Gold', price: 15, color: '#f5b301' },
      { id: 'c-ocean', name: 'Ozean', price: 15, color: '#2f80ed' },
      { id: 'c-red', name: 'Feuerrot', price: 15, color: '#ef4444' }
    ] },
    { group: 'Modi', items: [
      { id: 'm-disco', name: 'Disco-Modus', price: 30 },
      { id: 'm-gravity', name: 'Schwerkraft für Blasen', price: 25 },
      { id: 'm-mirror', name: 'Spiegel-Modus', price: 20 },
      { id: 'm-crt', name: 'Röhrenbildschirm', price: 30 },
      { id: 'm-pixel', name: 'Pixel-Mauszeiger', price: 15 }
    ] },
    { group: 'Spiele', items: [
      { id: 'g-hunt', name: 'Blasen-Jagd', price: 40, game: true },
      { id: 'g-thock', name: 'Thock-Spiel', price: 10, game: true },
      { id: 'g-snake', name: 'Snake', price: 50, game: true },
      { id: 'g-react', name: 'Reaktionstest', price: 30, game: true },
      { id: 'g-cps', name: 'Klick-Rekord', price: 20, game: true }
    ] },
    { group: 'Töne', exclusive: 'sound', items: [
      { id: 's-normal', name: 'Cremig (Standard)', price: 0, free: true },
      { id: 's-deep', name: 'Tiefes Thock', price: 15 },
      { id: 's-bright', name: 'Helles Clack', price: 15 },
      { id: 's-retro', name: 'Retro-Piepser', price: 20 }
    ] },
    { group: 'Retro', exclusive: 'skin', items: [
      { id: 'r-modern', name: 'Modern (Standard)', price: 0, free: true },
      { id: 'xp', name: 'Windows XP', price: 60 },
      { id: 'r-98', name: 'Windows 98', price: 50 },
      { id: 'r-dos', name: 'MS-DOS', price: 45 },
      { id: 'r-gb', name: 'Game Boy', price: 45 }
    ] }
  ];
  const findItem = (id) => { for (const g of SHOP) for (const it of g.items) if (it.id === id) return { g, it }; return null; };
  SHOP.forEach(g => g.items.forEach(it => { if (it.free) { owned.add(it.id); } }));
  active.add('c-teal');
  active.add('s-normal');
  active.add('r-modern');

  /* ---------- Wirkung der Käufe ---------- */
  function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function applyColor(hex) {
    const [r, g, b] = hexToRgb(hex);
    root.style.setProperty('--color-primary', hex);
    root.style.setProperty('--color-primary-light', `rgba(${r}, ${g}, ${b}, .16)`);
    root.style.setProperty('--orb-1', `rgba(${r}, ${g}, ${b}, .5)`);
  }
  function apply(id, on) {
    const found = findItem(id);
    if (!found) return;
    const { it } = found;
    if (it.color) { if (on) applyColor(it.color); return; }
    if (id === 'm-disco') root.classList.toggle('mode-disco', on);
    if (id === 'm-mirror') root.classList.toggle('mode-mirror', on);
    if (id === 'm-gravity' && fx.balls) fx.balls.setGravity(on);
    if (id === 'm-crt') root.classList.toggle('mode-crt', on);
    if (id === 'm-pixel') root.classList.toggle('mode-pixel', on);
    if (id === 'r-98') root.classList.toggle('theme-98', on);
    if (id === 'r-dos') root.classList.toggle('theme-dos', on);
    if (id === 'r-gb') { root.classList.toggle('theme-gb', on); if (on) loadPixelFont(); }
    if (on && ['xp', 'r-98', 'r-dos', 'r-gb'].includes(id)) fx.unlock('retro');
    if (id === 's-normal' && on) sound.setVariant(null);
    if (id === 's-deep' && on) sound.setVariant('deep');
    if (id === 's-bright' && on) sound.setVariant('bright');
    if (id === 's-retro' && on) sound.setVariant('retro');
    if (id === 'xp') {
      root.classList.toggle('theme-xp', on);
      if (on) {
        prevVariant = sound.variant;
        sound.setVariant('xp');
        buildTaskbar();
        xpChime();
      } else {
        sound.setVariant(prevVariant);
        closeStartMenu();
        xpShutdown();
      }
    }
  }

  function activate(id) {
    const { g, it } = findItem(id);
    if (it.game) { closeShop(); startGame(id); return; }
    if (g.exclusive) {
      g.items.forEach(x => { if (x.id !== id && active.has(x.id)) { active.delete(x.id); apply(x.id, false); } });
      active.add(id);
      apply(id, true);
    } else if (active.has(id)) {
      active.delete(id);
      apply(id, false);
    } else {
      active.add(id);
      apply(id, true);
    }
  }

  function buy(id, btn) {
    const { it } = findItem(id);
    if (owned.has(id)) { activate(id); sound.play('click'); renderShop(); return; }
    if (balance() < it.price) {
      btn.classList.remove('is-nope');
      requestAnimationFrame(() => btn.classList.add('is-nope'));
      if (root.classList.contains('theme-xp')) xpError(); else sound.play('buzz');
      return;
    }
    spent += it.price;
    owned.add(id);
    fx.unlock('shop1');
    if (SHOP[0].items.every(x => owned.has(x.id))) fx.unlock('rainbow');
    sound.play('ding');
    updateBadge();
    activate(id);
    renderShop();
  }

  /* ---------- Shop-Fenster ---------- */
  let shopPanel = null;
  function openShop() {
    if (!shopPanel) {
      shopPanel = document.createElement('div');
      shopPanel.className = 'fx-ach-overlay fx-shop';
      shopPanel.innerHTML = '<div class="fx-ach-panel" role="dialog" aria-modal="true" aria-label="Shop"><div class="fx-ach-panel-head"><h2>Shop</h2><span class="fx-ach-count" data-balance></span><button type="button" class="kb-close fx-ach-close" aria-label="Schließen" title="Schließen (Esc)">×</button></div><div class="fx-shop-body"></div></div>';
      document.body.appendChild(shopPanel);
      shopPanel.addEventListener('click', (e) => {
        if (e.target === shopPanel || e.target.closest('.fx-ach-close')) { closeShop(); return; }
        const btn = e.target.closest('[data-buy]');
        if (btn) buy(btn.dataset.buy, btn);
      });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && shopPanel.classList.contains('is-open')) closeShop(); });
    }
    renderShop();
    shopPanel.classList.add('is-open');
    sound.play('open');
  }
  function closeShop() {
    shopPanel.classList.remove('is-open');
    sound.play('close');
  }
  function renderShop() {
    shopPanel.querySelector('[data-balance]').textContent = balance() + ' Punkte';
    shopPanel.querySelector('.fx-shop-body').innerHTML = SHOP.map(g =>
      '<h3 class="fx-shop-group">' + g.group + '</h3><div class="fx-shop-grid">' + g.items.map(it => {
        const has = owned.has(it.id);
        const on = active.has(it.id);
        const label = it.game ? (has ? 'Spielen' : it.price + ' P') : has ? (on ? 'Aktiv' : 'Benutzen') : it.price + ' P';
        return '<button type="button" class="fx-shop-item' + (on ? ' is-on' : '') + (has ? ' is-owned' : '') + (!has && balance() < it.price ? ' is-locked' : '') + '" data-buy="' + it.id + '">' +
          (it.color ? '<span class="fx-shop-swatch" style="background:' + it.color + '"></span>' : '') +
          '<span class="fx-shop-name">' + it.name + '</span><span class="fx-shop-price">' + label + '</span></button>';
      }).join('') + '</div>').join('');
  }

  /* ---------- Spiele ---------- */
  function startGame(id) {
    if (id === 'g-thock') {
      'thock'.split('').forEach(k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })));
      return;
    }
    if (id === 'g-hunt') bubbleHunt();
    if (id === 'g-snake') snakeGame();
    if (id === 'g-react') reactionGame();
    if (id === 'g-cps') cpsGame();
  }

  // Blasen-Jagd: 20 Sekunden lang so viele Blasen wie möglich platzen lassen
  let hunting = false;
  function bubbleHunt() {
    if (hunting || !fx.balls) return;
    hunting = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const bar = document.createElement('div');
    bar.className = 'fx-hunt';
    bar.innerHTML = '<span data-time>20</span><b data-score>0</b><small>Blasen</small>';
    document.body.appendChild(bar);
    let score = 0, time = 20;
    const timeEl = bar.querySelector('[data-time]'), scoreEl = bar.querySelector('[data-score]');
    fx.balls.onPop(() => {
      if (!hunting) return;
      score++;
      scoreEl.textContent = score;
      scoreEl.classList.remove('kb-bump');
      requestAnimationFrame(() => scoreEl.classList.add('kb-bump'));
    });
    const spawner = setInterval(() => fx.balls.spawn(14 + Math.random() * 26), 380);
    const timer = setInterval(() => {
      time--;
      timeEl.textContent = time;
      if (time <= 5) sound.play('thock', { size: 1, row: 0, soft: 0.6 });
      if (time <= 0) {
        clearInterval(timer);
        clearInterval(spawner);
        hunting = false;
        bar.classList.add('is-done');
        bar.innerHTML = '<b>' + score + '</b><small>Blasen geschafft</small>';
        if (score >= 30) fx.unlock('hunt30');
        sound.play('ding');
        setTimeout(() => bar.remove(), 3500);
      }
    }, 1000);
  }

  /* ---------- Windows XP ---------- */
  let prevVariant = null;
  let taskbar = null;

  // Taskleiste unten mit Start-Knopf, Startmenü und Uhr
  function buildTaskbar() {
    buildWinButtons();
    if (taskbar) return;
    taskbar = document.createElement('div');
    taskbar.className = 'xp-taskbar';
    taskbar.innerHTML =
      '<button type="button" class="xp-start"><span class="xp-flag" aria-hidden="true"><i></i><i></i><i></i><i></i></span>start</button>' +
      '<div class="xp-task">Pascal Krieger – Physiotherapie</div>' +
      '<div class="xp-tray"><span class="xp-tray-icon" aria-hidden="true"></span><span data-clock></span></div>' +
      '<div class="xp-menu" hidden>' +
        '<div class="xp-menu-head"><span class="xp-avatar" aria-hidden="true"></span>Besucher</div>' +
        '<div class="xp-menu-body">' +
          '<a href="#ueber-mich">Über mich</a><a href="#leistungen">Leistungen</a><a href="#faq">FAQ</a><a href="#kontakt">Kontakt</a>' +
          '<hr><button type="button" data-xp="ach">Erfolge</button><button type="button" data-xp="shop">Shop</button><button type="button" data-xp="thock">Thock</button>' +
        '</div>' +
        '<div class="xp-menu-foot"><button type="button" data-xp="off">Abmelden</button></div>' +
      '</div>';
    document.body.appendChild(taskbar);
    const clock = taskbar.querySelector('[data-clock]');
    const tick = () => { const d = new Date(); clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
    tick();
    setInterval(tick, 15000);
    const menu = taskbar.querySelector('.xp-menu');
    taskbar.querySelector('.xp-start').addEventListener('click', () => { menu.hidden = !menu.hidden; });
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a, [data-xp]');
      if (!a) return;
      menu.hidden = true;
      const act = a.dataset.xp;
      if (act === 'ach') fx.openAchievements();
      if (act === 'shop') openShop();
      if (act === 'thock') startGame('g-thock');
      if (act === 'off') { active.delete('xp'); active.add('r-modern'); apply('xp', false); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.xp-taskbar')) menu.hidden = true; });
  }
  function closeStartMenu() {
    if (taskbar) taskbar.querySelector('.xp-menu').hidden = true;
  }

  // Eigene, nachempfundene Systemklänge (keine Original-Dateien von Microsoft)
  function xpPlay(notes, len) {
    if (!sound.on) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      notes.forEach(([f, d, vol]) => {
        [1, 2.01].forEach((m, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = i ? 'sine' : 'triangle';
          o.frequency.value = f * m;
          const t = ctx.currentTime + d;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime((vol || 0.08) * (i ? 0.3 : 1), t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 1.4));
          o.connect(g).connect(ctx.destination);
          o.start(t);
          o.stop(t + (len || 1.4) + 0.1);
        });
      });
      setTimeout(() => ctx.close(), ((len || 1.4) + 1.5) * 1000);
    } catch (e) {}
  }
  // Hochfahren: weiche, aufsteigende Akkorde
  function xpChime() { xpPlay([[311, 0], [466, 0.18], [415, 0.36], [311, 0.6], [622, 0.6], [466, 0.78]]); }
  // Herunterfahren: absteigend und leiser werdend
  function xpShutdown() { xpPlay([[831, 0, 0.07], [622, 0.22, 0.07], [415, 0.44, 0.07], [466, 0.66, 0.08], [311, 0.66, 0.05]], 1.6); }
  // Fehler: kurzer, harter Doppelton
  function xpError() { xpPlay([[659, 0, 0.1], [988, 0, 0.06], [494, 0.14, 0.1]], 0.5); }

  // Minimieren, Maximieren, Schließen in der Kopfleiste
  function buildWinButtons() {
    if (header.querySelector('.xp-winbtns')) return;
    const w = document.createElement('div');
    w.className = 'xp-winbtns';
    w.innerHTML = '<i role="button" tabindex="0" aria-label="Minimieren"></i><i role="button" tabindex="0" aria-label="Maximieren"></i><i role="button" tabindex="0" aria-label="Schließen"></i>';
    header.appendChild(w);
    w.addEventListener('click', (e) => {
      const i = [...w.children].indexOf(e.target.closest('i'));
      if (i === 2) { active.delete('xp'); active.add('r-modern'); apply('xp', false); }
      else if (i >= 0) xpError();
    });
  }

  /* ---------- Game-Boy-Schrift (nur bei Bedarf laden) ---------- */
  let pixelFont = false;
  function loadPixelFont() {
    if (pixelFont) return;
    pixelFont = true;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(l);
  }

  /* ---------- Spielfenster für die kleinen Spiele ---------- */
  function gameWindow(title, onClose) {
    const ov = document.createElement('div');
    ov.className = 'fx-ach-overlay fx-game is-open';
    ov.innerHTML = '<div class="fx-ach-panel fx-game-panel" role="dialog" aria-modal="true" aria-label="' + title + '"><div class="fx-ach-panel-head"><h2>' + title + '</h2><span class="fx-ach-count" data-score>0</span><button type="button" class="kb-close fx-ach-close" aria-label="Schließen" title="Schließen (Esc)">×</button></div><div class="fx-game-body"></div></div>';
    document.body.appendChild(ov);
    const close = () => { ov.remove(); window.removeEventListener('keydown', esc, true); if (onClose) onClose(); sound.play('close'); };
    const esc = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    window.addEventListener('keydown', esc, true);
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('.fx-ach-close')) close(); });
    sound.play('open');
    return { ov, body: ov.querySelector('.fx-game-body'), score: ov.querySelector('[data-score]'), close };
  }

  // Snake: Pfeiltasten oder WASD, am Handy die Knöpfe
  function snakeGame() {
    const N = 18;
    let timer = null, snake, dir, nextDir, food, score;
    const win = gameWindow('Snake', () => clearInterval(timer));
    win.body.innerHTML = '<canvas class="fx-snake" width="360" height="360"></canvas><div class="fx-pad"><button type="button" data-d="up">▲</button><button type="button" data-d="left">◀</button><button type="button" data-d="down">▼</button><button type="button" data-d="right">▶</button></div><button type="button" class="btn btn-primary fx-game-restart">Neu starten</button>';
    const cv = win.body.querySelector('canvas'), g = cv.getContext('2d'), S = cv.width / N;
    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    function place() {
      do { food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (snake.some(s => s[0] === food[0] && s[1] === food[1]));
    }
    function reset() {
      snake = [[8, 9], [7, 9], [6, 9]];
      dir = nextDir = 'right';
      score = 0;
      win.score.textContent = '0';
      place();
      clearInterval(timer);
      timer = setInterval(step, 115);
    }
    function color(v) { return getComputedStyle(root).getPropertyValue(v).trim() || '#17b6a4'; }
    function draw() {
      g.clearRect(0, 0, cv.width, cv.height);
      g.fillStyle = 'rgba(255,255,255,.06)';
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) g.fillRect(x * S, y * S, S, S);
      const c = color('--color-primary');
      snake.forEach((s, i) => {
        g.fillStyle = c;
        g.globalAlpha = 1 - i / (snake.length * 1.6);
        g.beginPath();
        g.roundRect ? g.roundRect(s[0] * S + 1, s[1] * S + 1, S - 2, S - 2, 6) : g.rect(s[0] * S + 1, s[1] * S + 1, S - 2, S - 2);
        g.fill();
      });
      g.globalAlpha = 1;
      const fx0 = food[0] * S + S / 2, fy0 = food[1] * S + S / 2;
      const grad = g.createRadialGradient(fx0 - 3, fy0 - 3, 1, fx0, fy0, S / 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, 'rgba(111,231,255,.5)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(fx0, fy0, S / 2 - 2, 0, Math.PI * 2);
      g.fill();
    }
    function step() {
      dir = nextDir;
      const head = [snake[0][0] + DIRS[dir][0], snake[0][1] + DIRS[dir][1]];
      if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || snake.some(s => s[0] === head[0] && s[1] === head[1])) {
        clearInterval(timer);
        sound.play('buzz');
        win.ov.querySelector('.fx-game-panel').classList.add('kb-hurt');
        return;
      }
      snake.unshift(head);
      if (head[0] === food[0] && head[1] === food[1]) {
        score++;
        win.score.textContent = score;
        sound.play('plip', 18);
        if (score >= 20) fx.unlock('snake20');
        place();
      } else {
        snake.pop();
      }
      draw();
    }
    function turn(d) {
      const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (d && d !== opp[dir]) nextDir = d;
    }
    const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    const onKey = (e) => { const d = keyMap[e.key]; if (d) { e.preventDefault(); turn(d); } };
    window.addEventListener('keydown', onKey);
    const stopKeys = new MutationObserver(() => { if (!document.body.contains(win.ov)) { window.removeEventListener('keydown', onKey); stopKeys.disconnect(); } });
    stopKeys.observe(document.body, { childList: true });
    win.body.querySelector('.fx-pad').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-d]'); if (b) { e.preventDefault(); turn(b.dataset.d); } });
    win.body.querySelector('.fx-game-restart').addEventListener('click', () => { win.ov.querySelector('.fx-game-panel').classList.remove('kb-hurt'); reset(); });
    reset();
    draw();
  }

  // Reaktionstest: warten, bis es grün wird, dann so schnell wie möglich drücken
  function reactionGame() {
    const win = gameWindow('Reaktionstest');
    win.body.innerHTML = '<button type="button" class="fx-react is-idle">Start</button><div class="fx-react-times"></div>';
    const pad = win.body.querySelector('.fx-react'), list = win.body.querySelector('.fx-react-times');
    let state = 'idle', t0 = 0, wait = null;
    const times = [];
    function arm() {
      state = 'wait';
      pad.className = 'fx-react is-wait';
      pad.textContent = 'Warten …';
      wait = setTimeout(() => { state = 'go'; pad.className = 'fx-react is-go'; pad.textContent = 'Jetzt!'; t0 = performance.now(); }, 1200 + Math.random() * 2800);
    }
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state === 'idle' || state === 'done') { arm(); return; }
      if (state === 'wait') {
        clearTimeout(wait);
        state = 'done';
        pad.className = 'fx-react is-early';
        pad.textContent = 'Zu früh!';
        sound.play('buzz');
        return;
      }
      if (state === 'go') {
        const ms = Math.round(performance.now() - t0);
        times.unshift(ms);
        state = 'done';
        pad.className = 'fx-react is-done';
        pad.textContent = ms + ' ms';
        win.score.textContent = 'Bestzeit ' + Math.min(...times) + ' ms';
        list.innerHTML = times.slice(0, 5).map(x => '<span>' + x + ' ms</span>').join('');
        sound.play('ding');
        if (ms < 250) fx.unlock('react');
      }
    });
  }

  // Klick-Rekord: 5 Sekunden so oft wie möglich drücken
  function cpsGame() {
    const win = gameWindow('Klick-Rekord');
    win.body.innerHTML = '<button type="button" class="fx-cps">Start</button><div class="fx-cps-bar"><i></i></div>';
    const btn = win.body.querySelector('.fx-cps'), bar = win.body.querySelector('.fx-cps-bar i');
    let clicks = 0, running = false, t0 = 0, raf = 0;
    function frame() {
      const p = Math.min(1, (performance.now() - t0) / 5000);
      bar.style.transform = 'scaleX(' + (1 - p) + ')';
      if (p >= 1) {
        running = false;
        const cps = (clicks / 5).toFixed(1);
        btn.textContent = cps + ' / s';
        btn.classList.add('is-done');
        win.score.textContent = clicks + ' Klicks';
        if (clicks / 5 >= 8) fx.unlock('cps');
        sound.play('ding');
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!running && !btn.classList.contains('is-done')) {
        running = true; clicks = 0; t0 = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (btn.classList.contains('is-done')) {
        btn.classList.remove('is-done');
        btn.textContent = 'Start';
        bar.style.transform = 'scaleX(1)';
        return;
      }
      if (!running) return;
      clicks++;
      btn.textContent = clicks;
      win.score.textContent = clicks + ' Klicks';
      btn.classList.remove('is-hit');
      requestAnimationFrame(() => btn.classList.add('is-hit'));
      sound.play('thock', { size: 1, row: clicks % 5, soft: 0.8 });
    });
  }

  updateBadge();
})();
