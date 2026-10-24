// V2-Effekte: Lichtschein unter der Maus, 3D-Neigung der Karten, Glitzer, Scroll-Fortschritt,
// Klick-Töne, Wassertropfen beim Klicken und aufsteigende Glasblasen
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Töne (werden im Browser erzeugt, keine Dateien) ---------- */
  const sound = (() => {
    let ctx = null;
    let on = true;
    try { on = localStorage.getItem('sound') !== 'off'; } catch (e) {}
    let lastHover = 0;

    function audio() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    // Ein kurzer Ton mit weichem Ausklang
    function tone(freq, endFreq, dur, vol, type, delay) {
      const a = audio();
      if (!a) return;
      const t = a.currentTime + (delay || 0);
      const osc = a.createOscillator();
      const gain = a.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(a.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    // Leises Rauschen für ein knackiges „Tick“
    function tick(vol) {
      const a = audio();
      if (!a) return;
      const len = Math.floor(a.sampleRate * 0.03);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      const src = a.createBufferSource();
      const filter = a.createBiquadFilter();
      const gain = a.createGain();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 1.2;
      gain.gain.value = vol;
      src.buffer = buf;
      src.connect(filter).connect(gain).connect(a.destination);
      src.start();
    }

    const sounds = {
      click() { tick(0.5); tone(520, 180, 0.09, 0.22, 'sine'); },
      pop() { tone(380, 900, 0.07, 0.16, 'sine'); tone(900, 1400, 0.05, 0.06, 'triangle', 0.03); },
      bubble() { tone(600 + Math.random() * 300, 1500 + Math.random() * 500, 0.08, 0.05, 'sine'); },
      open() { tone(330, 660, 0.12, 0.14, 'sine'); tick(0.25); },
      close() { tone(660, 300, 0.12, 0.12, 'sine'); tick(0.2); },
      chime() { [784, 988, 1319].forEach((f, i) => tone(f, f * 1.01, 0.5, 0.08, 'sine', i * 0.07)); },
      drop() { tone(1200, 260, 0.14, 0.12, 'sine'); },
      burst() { tick(0.9); tone(700, 2200, 0.06, 0.2, 'sine'); tone(1800, 400, 0.18, 0.08, 'triangle', 0.02); },
      boing() { tone(220, 520, 0.16, 0.1, 'sine'); tone(520, 300, 0.2, 0.05, 'sine', 0.08); }
    };

    return {
      get on() { return on; },
      set on(v) { on = v; try { localStorage.setItem('sound', v ? 'on' : 'off'); } catch (e) {} },
      play(name) { if (on && sounds[name]) sounds[name](); },
      hover() {
        const now = performance.now();
        if (!on || !ctx || now - lastHover < 90) return;
        lastHover = now;
        sounds.bubble();
      }
    };
  })();

  // Ton-Knopf neben dem Farbschema-Knopf
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle sound-toggle';
    btn.title = 'Töne';
    btn.setAttribute('aria-label', 'Töne an oder aus');
    btn.innerHTML = '<svg class="sound-icon-on" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg><svg class="sound-icon-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    const sync = () => { btn.setAttribute('aria-pressed', String(sound.on)); btn.classList.toggle('is-off', !sound.on); };
    sync();
    btn.addEventListener('click', () => { sound.on = !sound.on; sync(); sound.play('pop'); });
    themeToggle.parentNode.insertBefore(btn, themeToggle);
  }

  // Welcher Ton zu welchem Klick gehört
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button, summary');
    if (!t || t.classList.contains('sound-toggle')) return;
    if (t.id === 'themeToggle') sound.play('chime');
    else if (t.classList.contains('accordion-trigger')) {
      const item = t.closest('.accordion-item');
      sound.play(item && item.classList.contains('open') ? 'open' : 'close');
    } else if (t.classList.contains('btn')) sound.play('click');
    else sound.play('pop');
  });

  /* ---------- Scroll-Fortschritt ---------- */
  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const onScroll = () => {
    const max = root.scrollHeight - root.clientHeight;
    root.style.setProperty('--scroll', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  /* ---------- Glitzer ---------- */
  const sparkles = document.createElement('div');
  sparkles.className = 'fx-sparkles';
  sparkles.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
    s.style.animationDuration = (4 + Math.random() * 5).toFixed(2) + 's';
    s.style.setProperty('--size', (2 + Math.random() * 4).toFixed(1) + 'px');
    sparkles.appendChild(s);
  }
  document.body.appendChild(sparkles);

  /* ---------- Aufsteigende Glasblasen ---------- */
  const bubbles = document.createElement('div');
  bubbles.className = 'fx-bubbles';
  bubbles.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('i');
    const size = 14 + Math.random() * 46;
    b.style.left = Math.random() * 100 + '%';
    b.style.width = b.style.height = size.toFixed(0) + 'px';
    b.style.animationDuration = (12 + Math.random() * 14).toFixed(1) + 's, ' + (2.5 + Math.random() * 2).toFixed(1) + 's';
    b.style.animationDelay = (-Math.random() * 20).toFixed(1) + 's, 0s';
    bubbles.appendChild(b);
  }
  document.body.appendChild(bubbles);

  /* ---------- Blasen im Startbereich: schieben, werfen, platzen lassen ---------- */
  const hero = document.querySelector('.hero');
  if (hero) {
    const play = document.createElement('div');
    play.className = 'fx-play';
    play.setAttribute('aria-hidden', 'true');
    hero.appendChild(play);

    const small = window.innerWidth < 700;
    const count = small ? 4 : 7;
    const items = [];
    let W = 0, H = 0;
    const measure = () => { W = hero.clientWidth; H = hero.clientHeight; };
    measure();
    window.addEventListener('resize', measure);

    function spawn(b, fromBottom) {
      b.r = (small ? 18 : 34) + Math.random() * (small ? 24 : 70);
      b.x = (small ? 0.35 : 0.5) * W + Math.random() * (W * (small ? 0.6 : 0.48) - b.r * 2);
      b.y = fromBottom ? H + b.r : 90 + Math.random() * (H - 140 - b.r * 2);
      b.vx = (Math.random() - 0.5) * 1.2;
      b.vy = fromBottom ? -4 - Math.random() * 3 : (Math.random() - 0.5) * 1.2;
      b.el.style.width = b.el.style.height = (b.r * 2).toFixed(0) + 'px';
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`;
      b.el.classList.remove('is-popping');
      b.el.classList.add('is-new');
      b.alive = true;
    }

    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      el.className = 'fx-ball';
      play.appendChild(el);
      const b = { el, drag: false, squash: 0 };
      spawn(b, false);
      items.push(b);
      el.addEventListener('animationend', (e) => { if (e.animationName === 'fx-ball-in') el.classList.remove('is-new'); });

      let startX = 0, startY = 0, lastX = 0, lastY = 0, lastT = 0, moved = 0;
      el.addEventListener('pointerdown', (e) => {
        if (!b.alive) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        b.drag = true;
        el.classList.add('is-grabbed');
        startX = lastX = e.clientX; startY = lastY = e.clientY; lastT = performance.now(); moved = 0;
        b.vx = b.vy = 0;
        sound.play('pop');
      });
      el.addEventListener('pointermove', (e) => {
        if (!b.drag) return;
        const now = performance.now();
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        const dt = Math.max(8, now - lastT);
        b.x += dx; b.y += dy;
        b.vx = dx / dt * 16; b.vy = dy / dt * 16;
        lastX = e.clientX; lastY = e.clientY; lastT = now;
        moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
      });
      const release = () => {
        if (!b.drag) return;
        b.drag = false;
        el.classList.remove('is-grabbed');
        if (moved < 6) pop(b);
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
    }

    function pop(b) {
      b.alive = false;
      b.el.classList.add('is-popping');
      sound.play('burst');
      const cx = b.x + b.r, cy = b.y + b.r;
      for (let k = 0; k < 12; k++) {
        const d = document.createElement('span');
        d.className = 'fx-splash';
        const a = (k / 12) * Math.PI * 2 + Math.random() * 0.4;
        const dist = b.r * (1.1 + Math.random() * 0.9);
        d.style.left = cx + 'px';
        d.style.top = cy + 'px';
        d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--s', (4 + Math.random() * 6).toFixed(1) + 'px');
        play.appendChild(d);
        d.addEventListener('animationend', () => d.remove());
      }
      setTimeout(() => spawn(b, true), 1800);
    }

    let running = false, lastHit = 0;
    function step() {
      if (!running) return;
      for (const b of items) {
        if (!b.alive || b.drag) continue;
        b.vx += (Math.random() - 0.5) * 0.06;
        b.vy += (Math.random() - 0.5) * 0.06 - 0.003;
        b.vx *= 0.992; b.vy *= 0.992;
        b.x += b.vx; b.y += b.vy;
        const d = b.r * 2;
        let hit = 0;
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.85; hit = Math.abs(b.vx); }
        if (b.x > W - d) { b.x = W - d; b.vx = -Math.abs(b.vx) * 0.85; hit = Math.abs(b.vx); }
        if (b.y < 80) { b.y = 80; b.vy = Math.abs(b.vy) * 0.85; hit = Math.abs(b.vy); }
        if (b.y > H - d) {
          if (b.vy < -2) { /* steigt gerade frisch auf */ } else { b.y = H - d; b.vy = -Math.abs(b.vy) * 0.85; hit = Math.abs(b.vy); }
        }
        if (hit > 3) {
          b.squash = Math.min(0.3, hit / 30);
          const now = performance.now();
          if (now - lastHit > 120) { lastHit = now; sound.play('boing'); }
        }
      }
      // Blasen stoßen sich voneinander ab
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], c = items[j];
          if (!a.alive || !c.alive) continue;
          const dx = (c.x + c.r) - (a.x + a.r), dy = (c.y + c.r) - (a.y + a.r);
          const dist = Math.hypot(dx, dy) || 1, min = a.r + c.r;
          if (dist < min) {
            const nx = dx / dist, ny = dy / dist, push = (min - dist) / 2;
            if (!a.drag) { a.x -= nx * push; a.y -= ny * push; }
            if (!c.drag) { c.x += nx * push; c.y += ny * push; }
            const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
            if (rel < 0) {
              a.vx += rel * nx * 0.9; a.vy += rel * ny * 0.9;
              c.vx -= rel * nx * 0.9; c.vy -= rel * ny * 0.9;
              if (-rel > 2.5) { a.squash = c.squash = Math.min(0.25, -rel / 25); sound.hover(); }
            }
          }
        }
      }
      for (const b of items) {
        b.squash *= 0.86;
        const s = 1 + b.squash;
        b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) scale(${s.toFixed(3)}, ${(2 - s).toFixed(3)})`;
      }
      requestAnimationFrame(step);
    }
    new IntersectionObserver(([entry]) => {
      const was = running;
      running = entry.isIntersecting;
      if (running && !was) requestAnimationFrame(step);
    }).observe(hero);
  }

  /* ---------- Wassertropfen beim Klicken ---------- */
  document.addEventListener('pointerdown', (e) => {
    const drop = document.createElement('span');
    drop.className = 'fx-drop';
    drop.style.left = e.clientX + 'px';
    drop.style.top = e.clientY + 'px';
    document.body.appendChild(drop);
    drop.addEventListener('animationend', () => drop.remove());

    const btn = e.target.closest('.btn, .theme-toggle, .nav-link, .accordion-trigger');
    if (btn) {
      btn.classList.remove('fx-jelly');
      void btn.offsetWidth;
      btn.classList.add('fx-jelly');
    }
  });
  document.addEventListener('animationend', (e) => {
    if (e.animationName === 'fx-jelly') e.target.classList.remove('fx-jelly');
  });

  if (!fine) return;

  /* ---------- Lichtschein unter der Maus ---------- */
  const glow = document.createElement('div');
  glow.className = 'fx-cursor';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);
  window.addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  // Leises Blubbern beim Darüberfahren
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('.btn, .nav-link, .theme-toggle, .accordion-trigger, .service-card, .offer-card');
    if (t && !t.contains(e.relatedTarget)) sound.hover();
  });

  /* ---------- Karten neigen sich zur Maus ---------- */
  const tiltSelector = '.service-card, .offer-card, .contact-list, .about-portrait, .custom-testimonial-card, .custom-pricing-card';
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest(tiltSelector);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--px', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--py', (y * 100).toFixed(1) + '%');
    card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
    card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
    card.classList.add('fx-tilting');
  });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest && e.target.closest(tiltSelector);
    if (card && !card.contains(e.relatedTarget)) card.classList.remove('fx-tilting');
  });

  /* ---------- Knöpfe ziehen sich magnetisch zur Maus ---------- */
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
    b.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + 'px');
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (b && !b.contains(e.relatedTarget)) { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); }
  });
})();
