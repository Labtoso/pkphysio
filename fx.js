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

    let master = null;

    // Alles läuft durch eine weiche Kette: Tiefpass, Kompressor und ein kleiner, naher Raumhall
    function audio() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 7500;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -24;
        comp.ratio.value = 4;
        comp.attack.value = 0.002;
        comp.release.value = 0.12;
        const room = ctx.createConvolver();
        const len = Math.floor(ctx.sampleRate * 0.35);
        const ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }
        room.buffer = ir;
        const wet = ctx.createGain();
        wet.gain.value = 0.14;
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(lowpass);
        master.connect(room).connect(wet).connect(lowpass);
        lowpass.connect(comp).connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    // Kurzer Rausch-Impuls durch einen Filter: Klopfen, Klicken, Knistern
    function noise(opt) {
      const a = audio();
      if (!a) return;
      const t = a.currentTime + (opt.delay || 0);
      const len = Math.max(1, Math.floor(a.sampleRate * opt.dur));
      const buf = a.createBuffer(1, len, a.sampleRate);
      const data = buf.getChannelData(0);
      const curve = opt.curve || 4;
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = opt.type || 'bandpass';
      f.frequency.setValueAtTime(opt.freq, t);
      if (opt.toFreq) f.frequency.exponentialRampToValueAtTime(opt.toFreq, t + opt.dur);
      f.Q.value = opt.q || 1;
      const g = a.createGain();
      g.gain.value = opt.vol;
      const pan = a.createStereoPanner ? a.createStereoPanner() : null;
      if (pan) pan.pan.value = opt.pan || 0;
      src.connect(f).connect(g);
      (pan ? g.connect(pan) : g).connect(master);
      src.start(t);
    }

    // Weicher Sinus mit Tonhöhen-Gleiten: Plopp, Blubb, Ting
    function body(opt) {
      const a = audio();
      if (!a) return;
      const t = a.currentTime + (opt.delay || 0);
      const osc = a.createOscillator();
      const g = a.createGain();
      osc.type = opt.wave || 'sine';
      osc.frequency.setValueAtTime(opt.freq, t);
      osc.frequency.exponentialRampToValueAtTime(opt.toFreq || opt.freq, t + (opt.glide || opt.dur));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(opt.vol, t + (opt.attack || 0.003));
      g.gain.exponentialRampToValueAtTime(0.0001, t + opt.dur);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + opt.dur + 0.05);
    }

    const rnd = (v, spread) => v * (1 + (Math.random() - 0.5) * spread);

    const sounds = {
      // Tiefes, weiches „Thock“ wie eine gute Tastatur
      click() {
        noise({ freq: rnd(1900, 0.2), q: 3, dur: 0.012, vol: 0.9, curve: 6 });
        body({ freq: rnd(150, 0.1), toFreq: 90, dur: 0.07, vol: 0.5 });
        noise({ freq: 5200, type: 'highpass', dur: 0.004, vol: 0.12, delay: 0.002 });
      },
      // Lippen-Plopp
      pop() {
        body({ freq: rnd(260, 0.15), toFreq: 820, glide: 0.022, dur: 0.05, vol: 0.45 });
        noise({ freq: 2600, q: 2, dur: 0.006, vol: 0.35 });
      },
      // Ganz leises Wasser-„Plip“
      bubble() {
        body({ freq: rnd(700, 0.3), toFreq: rnd(1700, 0.2), glide: 0.018, dur: 0.045, vol: 0.12, pan: 0 });
      },
      // FAQ: Holz-„Tok“ mit leisem Wischen
      open() {
        noise({ freq: 950, q: 12, dur: 0.05, vol: 1.4, curve: 5 });
        noise({ freq: 600, toFreq: 2400, q: 0.8, dur: 0.09, vol: 0.12, curve: 1.5, delay: 0.01 });
      },
      close() {
        noise({ freq: 760, q: 12, dur: 0.05, vol: 1.3, curve: 5 });
        noise({ freq: 2400, toFreq: 600, q: 0.8, dur: 0.08, vol: 0.1, curve: 1.5, delay: 0.01 });
      },
      // Glas-„Ting“
      chime() {
        body({ freq: 2093, dur: 0.9, vol: 0.08, attack: 0.002 });
        body({ freq: 3136, dur: 0.6, vol: 0.035, attack: 0.002, delay: 0.004 });
        noise({ freq: 6000, q: 20, dur: 0.02, vol: 0.4 });
      },
      // Knackiges Blasen-Platzen
      burst() {
        noise({ freq: 3000, type: 'highpass', dur: 0.014, vol: 0.7, curve: 3 });
        body({ freq: rnd(1100, 0.2), toFreq: 240, glide: 0.035, dur: 0.06, vol: 0.4 });
        for (let i = 0; i < 4; i++) noise({ freq: rnd(4500, 0.4), q: 6, dur: 0.006, vol: 0.25, delay: 0.03 + i * rnd(0.018, 0.6), pan: (Math.random() - 0.5) * 1.4 });
      },
      // Weicher Gummi-„Boop“ beim Aufprall
      boing(r) {
        const p = 40 / Math.max(10, r || 40);
        body({ freq: rnd(210 * p, 0.15), toFreq: 140 * p, dur: 0.12, vol: 0.28 });
        noise({ freq: 700, type: 'lowpass', dur: 0.03, vol: 0.4, curve: 3 });
      },
      // Matschiges „Squish“ beim Anfassen einer Blase
      squish() {
        noise({ freq: 350, toFreq: 1600, q: 2.5, dur: 0.09, vol: 0.5, curve: 1.8 });
        body({ freq: 320, toFreq: 520, dur: 0.06, vol: 0.12 });
      },
      // Wie groß die Blase ist, so tief klingt sie (r = Radius in Pixeln)
      split(r) {
        const p = 60 / Math.max(14, r || 40);
        noise({ freq: 2600, type: 'highpass', dur: 0.012, vol: 0.55, curve: 3 });
        body({ freq: 520 * p, toFreq: 180 * p, glide: 0.05, dur: 0.09, vol: 0.38 });
        noise({ freq: 900, toFreq: 300, q: 1.5, dur: 0.12, vol: 0.22, curve: 2 });
      },
      plip(r) {
        const p = 40 / Math.max(8, r || 20);
        body({ freq: rnd(600 * p, 0.2), toFreq: rnd(1500 * p, 0.2), glide: 0.02, dur: 0.05, vol: 0.2 });
        noise({ freq: 4200, q: 4, dur: 0.004, vol: 0.18, pan: (Math.random() - 0.5) * 1.2 });
      },
      glassTap(r) {
        const p = 50 / Math.max(10, r || 40);
        body({ freq: rnd(1800 * p, 0.1), dur: 0.18, vol: 0.05, attack: 0.001 });
        noise({ freq: 5200, q: 14, dur: 0.01, vol: 0.25 });
      },
      knock(r) {
        const p = 40 / Math.max(10, r || 30);
        body({ freq: rnd(260 * p, 0.15), toFreq: 170 * p, dur: 0.06, vol: 0.2 });
        noise({ freq: 1400 * p, q: 6, dur: 0.02, vol: 0.5, curve: 5 });
      },
      unsquish() {
        noise({ freq: 1500, toFreq: 400, q: 2.5, dur: 0.08, vol: 0.4, curve: 1.8 });
      },
      whoosh() {
        noise({ freq: 400, toFreq: 3200, q: 0.9, dur: 0.22, vol: 0.35, curve: 1.2 });
      },
      rise() {
        for (let i = 0; i < 3; i++) body({ freq: 500 + i * 220, toFreq: 1100 + i * 300, glide: 0.03, dur: 0.06, vol: 0.08, delay: i * 0.07 });
      },
      // Ganz feines Rasten beim Scrollen, wie ein Drehrad
      ratchet() {
        noise({ freq: rnd(3400, 0.15), q: 8, dur: 0.008, vol: 0.22, curve: 6 });
      }
    };
    // Diese Töne kommen erst, wenn schon einmal geklickt wurde (Browser erlauben vorher keinen Ton)
    const passive = ['bubble', 'glassTap', 'ratchet', 'boing', 'knock', 'rise'];

    return {
      get on() { return on; },
      set on(v) { on = v; try { localStorage.setItem('sound', v ? 'on' : 'off'); } catch (e) {} },
      play(name, arg) { if (!on || !sounds[name] || (!ctx && passive.includes(name))) return; sounds[name](arg); },
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
  // Große Blasen zerfallen beim Platzen in kleinere, die kleinsten zerplatzen in Spritzer
  const hero = document.querySelector('.hero');
  if (hero) {
    const play = document.createElement('div');
    play.className = 'fx-play';
    play.setAttribute('aria-hidden', 'true');
    hero.appendChild(play);

    const small = window.innerWidth < 700;
    const count = small ? 4 : 7;
    const MIN_SPLIT = small ? 14 : 18;
    const MAX_BALLS = small ? 22 : 40;
    const items = [];
    let W = 0, H = 0;
    const measure = () => { W = hero.clientWidth; H = hero.clientHeight; };
    measure();
    window.addEventListener('resize', measure);

    function place(b) {
      b.el.style.width = b.el.style.height = (b.r * 2).toFixed(0) + 'px';
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`;
    }

    function respawn(b) {
      b.r = (small ? 18 : 34) + Math.random() * (small ? 24 : 70);
      b.x = (small ? 0.35 : 0.5) * W + Math.random() * Math.max(10, W * (small ? 0.6 : 0.48) - b.r * 2);
      b.y = b.fromBottom ? H + b.r : 90 + Math.random() * Math.max(10, H - 140 - b.r * 2);
      b.vx = (Math.random() - 0.5) * 1.2;
      b.vy = b.fromBottom ? -4 - Math.random() * 3 : (Math.random() - 0.5) * 1.2;
      b.el.classList.remove('is-popping');
      b.el.classList.add('is-new');
      b.alive = true;
      place(b);
    }

    function makeBall(opt) {
      const el = document.createElement('i');
      el.className = 'fx-ball' + (opt.child ? ' is-child' : '');
      play.appendChild(el);
      const b = { el, drag: false, squash: 0, alive: true, child: !!opt.child, fromBottom: false, born: performance.now() };
      items.push(b);
      el.addEventListener('animationend', (e) => { if (e.animationName === 'fx-ball-in') el.classList.remove('is-new'); });

      let startX = 0, startY = 0, lastX = 0, lastY = 0, lastT = 0, moved = 0;
      el.addEventListener('pointerdown', (e) => {
        if (!b.alive) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        b.drag = true;
        b.squash = 0.3;
        el.classList.add('is-grabbed');
        startX = lastX = e.clientX; startY = lastY = e.clientY; lastT = performance.now(); moved = 0;
        b.vx = b.vy = 0;
        sound.play('squish');
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
        else if (Math.hypot(b.vx, b.vy) > 8) sound.play('whoosh');
        else sound.play('unsquish');
      };
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerenter', () => { if (b.alive && !b.drag) { b.squash = 0.12; sound.play('glassTap', b.r); } });

      if (opt.child) {
        b.r = opt.r; b.x = opt.x; b.y = opt.y; b.vx = opt.vx; b.vy = opt.vy;
        el.classList.add('is-new');
        place(b);
      } else {
        respawn(b);
      }
      return b;
    }

    function splash(cx, cy, r, n) {
      for (let k = 0; k < n; k++) {
        const d = document.createElement('span');
        d.className = 'fx-splash';
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.4;
        const dist = r * (1.1 + Math.random() * 0.9);
        d.style.left = cx + 'px';
        d.style.top = cy + 'px';
        d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--s', (3 + Math.random() * 6).toFixed(1) + 'px');
        play.appendChild(d);
        d.addEventListener('animationend', () => d.remove());
      }
    }

    function pop(b) {
      if (!b.alive) return;
      b.alive = false;
      b.el.classList.add('is-popping');
      const cx = b.x + b.r, cy = b.y + b.r;
      const alive = items.filter(i => i.alive).length;
      const canSplit = b.r >= MIN_SPLIT && alive < MAX_BALLS;

      if (canSplit) {
        // In 2 bis 4 kleinere Blasen zerfallen, die nach außen schießen
        const n = b.r > 60 ? 4 : b.r > 34 ? 3 : 2;
        const childR = b.r * (n === 4 ? 0.5 : n === 3 ? 0.56 : 0.64);
        sound.play('split', b.r);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + Math.random() * 0.8;
          const speed = 3 + Math.random() * 3;
          setTimeout(() => {
            makeBall({ child: true, r: childR * (0.85 + Math.random() * 0.3), x: cx + Math.cos(a) * b.r * 0.4 - childR, y: cy + Math.sin(a) * b.r * 0.4 - childR, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed });
            sound.play('plip', childR - k * 3);
          }, 40 + k * 55);
        }
        splash(cx, cy, b.r, 8);
      } else {
        sound.play('burst');
        splash(cx, cy, b.r, 12);
      }

      b.el.addEventListener('animationend', () => {
        if (b.child) {
          b.el.remove();
          items.splice(items.indexOf(b), 1);
        }
      }, { once: true });
      if (!b.child) setTimeout(() => { b.fromBottom = true; respawn(b); sound.play('rise'); }, 2200);
    }

    for (let i = 0; i < count; i++) makeBall({});

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
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.95; hit = Math.abs(b.vx); }
        if (b.x > W - d) { b.x = W - d; b.vx = -Math.abs(b.vx) * 0.95; hit = Math.abs(b.vx); }
        if (b.y < 80) { b.y = 80; b.vy = Math.abs(b.vy) * 0.95; hit = Math.abs(b.vy); }
        if (b.y > H - d) {
          if (b.vy < -2 && !b.child) { /* steigt gerade frisch auf */ } else { b.y = H - d; b.vy = -Math.abs(b.vy) * 0.95; hit = Math.abs(b.vy); }
        }
        if (hit > 2.5) {
          b.squash = Math.min(0.42, hit / 18);
          const now = performance.now();
          if (now - lastHit > 90) { lastHit = now; sound.play('boing', b.r); }
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
              a.vx += rel * nx * 0.95; a.vy += rel * ny * 0.95;
              c.vx -= rel * nx * 0.95; c.vy -= rel * ny * 0.95;
              if (-rel > 2) {
                a.squash = c.squash = Math.min(0.35, -rel / 16);
                const now = performance.now();
                if (now - lastHit > 70) { lastHit = now; sound.play('knock', Math.min(a.r, c.r)); }
              }
            }
          }
        }
      }
      for (const b of items) {
        b.squash *= 0.88;
        const s = 1 + b.squash * Math.cos((performance.now() - b.born) / 40);
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

  /* ---------- Leises Plip, wenn Inhalte auftauchen ---------- */
  let lastReveal = 0;
  const revealSound = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealSound.unobserve(entry.target);
      const now = performance.now();
      if (now - lastReveal > 110) { lastReveal = now; sound.play('plip', 26); }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('main .reveal').forEach(el => revealSound.observe(el));

  /* ---------- Leises Ratschen beim Scrollen ---------- */
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (Math.abs(window.scrollY - lastScrollY) > 90) {
      lastScrollY = window.scrollY;
      sound.play('ratchet');
    }
  }, { passive: true });

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
