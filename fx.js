// V2-Effekte: Lichtschein unter der Maus, 3D-Neigung der Karten, Glitzer, Scroll-Fortschritt,
// Klick-Töne, Wassertropfen beim Klicken und aufsteigende Glasblasen
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- Töne: echte Aufnahmen (Tastatur, Blasen), sonst im Browser erzeugt ---------- */
  const SOUND_BASE = new URL('Assets/sounds/', document.currentScript ? document.currentScript.src : location.href).href;
  const sound = (() => {
    let ctx = null;
    let on = true;
    try { on = localStorage.getItem('sound') !== 'off'; } catch (e) {}
    let lastHover = 0;

    let master = null;
    let dry = null;

    // Alles läuft durch eine weiche Kette: Tiefpass, Kompressor und ein kleiner, naher Raumhall
    function audio() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 6200;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -24;
        comp.ratio.value = 4;
        comp.attack.value = 0.002;
        comp.release.value = 0.12;
        const room = ctx.createConvolver();
        const len = Math.floor(ctx.sampleRate * 0.6);
        const ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
        }
        room.buffer = ir;
        const wet = ctx.createGain();
        wet.gain.value = 0.22;
        master = ctx.createGain();
        master.gain.value = 0.9;
        dry = ctx.createGain();
        dry.gain.value = 1;
        const dryRoom = ctx.createGain();
        dryRoom.gain.value = 0.25;
        dry.connect(comp);
        dry.connect(dryRoom).connect(room);
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
      const pan = opt.pan && a.createStereoPanner ? a.createStereoPanner() : null;
      if (pan) pan.pan.value = opt.pan;
      osc.connect(g);
      (pan ? g.connect(pan) : g).connect(master);
      osc.start(t);
      osc.stop(t + opt.dur + 0.05);
    }

    const rnd = (v, spread) => v * (1 + (Math.random() - 0.5) * spread);

    // Wassertropfen: Ton schnellt nach oben, wie ein Tropfen in ein Glas Wasser
    function water(freq, vol, pan, delay) {
      body({ freq, toFreq: freq * 2.4, glide: 0.028, dur: 0.075, vol, attack: 0.002, pan, delay });
      noise({ freq: freq * 5, q: 3, dur: 0.004, vol: vol * 0.6, pan, delay });
    }

    // Glas: mehrere Obertöne, die lange und weich ausklingen
    function glass(freq, vol, delay) {
      [[1, 1], [2.76, 0.42], [5.4, 0.2], [8.9, 0.08]].forEach(([m, v], i) => {
        body({ freq: freq * m, dur: 1.2 - i * 0.22, vol: vol * v, attack: 0.002, delay, pan: (i % 2 ? 0.25 : -0.25) });
      });
    }

    // Echte Aufnahmen: cremige Tastatur (Mechvibes, MIT) und Blasen-Plopp (OpenGameArt, CC0), siehe Assets/sounds/QUELLEN.txt
    const samples = {};
    let samplesLoading = false;
    const SAMPLE_FILES = {
      r0: 'cream/press/GENERIC_R0.mp3', r1: 'cream/press/GENERIC_R1.mp3', r2: 'cream/press/GENERIC_R2.mp3',
      r3: 'cream/press/GENERIC_R3.mp3', r4: 'cream/press/GENERIC_R4.mp3',
      space: 'cream/press/SPACE.mp3', enter: 'cream/press/ENTER.mp3', backspace: 'cream/press/BACKSPACE.mp3',
      up: 'cream/release/GENERIC.mp3', upSpace: 'cream/release/SPACE.mp3', upEnter: 'cream/release/ENTER.mp3', upBackspace: 'cream/release/BACKSPACE.mp3',
      pop: 'pop.mp3'
    };
    function loadSamples() {
      if (samplesLoading || !ctx) return;
      samplesLoading = true;
      Object.entries(SAMPLE_FILES).forEach(([name, file]) => {
        fetch(SOUND_BASE + file)
          .then(r => r.arrayBuffer())
          .then(buf => new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej)))
          .then(audioBuf => {
            // Aufnahmen sind unterschiedlich laut aufgenommen, darum auf gleiche Lautstärke bringen
            let peak = 0;
            const d = audioBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
            audioBuf.norm = peak > 0 ? Math.min(8, 0.7 / peak) : 1;
            samples[name] = audioBuf;
          })
          .catch(() => {});
      });
    }
    // Spielt eine Aufnahme; gibt false zurück, solange sie noch nicht geladen ist
    function sample(name, opt) {
      const a = audio();
      if (!a) return false;
      loadSamples();
      const buf = samples[name];
      if (!buf) return false;
      opt = opt || {};
      const t = a.currentTime + (opt.delay || 0);
      const src = a.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opt.rate || 1;
      const g = a.createGain();
      g.gain.value = (opt.vol == null ? 1 : opt.vol) * (buf.norm || 1);
      const pan = opt.pan && a.createStereoPanner ? a.createStereoPanner() : null;
      if (pan) pan.pan.value = opt.pan;
      src.connect(g);
      (pan ? g.connect(pan) : g).connect(dry);
      src.start(t);
      return true;
    }

    const sounds = {
      // Knöpfe: weiches Tastatur-Thock
      click() {
        sounds.thock({ size: 1.5, row: 3, pan: 0 });
      },
      // Links: Wassertropfen
      pop() {
        water(rnd(520, 0.15), 0.32, (Math.random() - 0.5) * 0.4);
      },
      // Darüberfahren: ganz leiser, kleiner Tropfen
      bubble() {
        water(rnd(900, 0.35), 0.08, (Math.random() - 0.5) * 1.2);
      },
      // FAQ auf: drei Tropfen steigen auf, dazu ein Hauch und ein leises Glas
      open() {
        [392, 523, 659].forEach((f, i) => water(rnd(f, 0.04), 0.26 - i * 0.04, -0.4 + i * 0.4, i * 0.065));
        noise({ freq: 1800, toFreq: 7000, q: 0.7, dur: 0.28, vol: 0.06, curve: 1.2, delay: 0.02 });
        glass(1568, 0.025, 0.2);
      },
      // FAQ zu: zwei Tropfen sinken ab, dazu ein weiches Fwump
      close() {
        [523, 392].forEach((f, i) => water(rnd(f, 0.04), 0.22, 0.3 - i * 0.6, i * 0.07));
        noise({ freq: 420, type: 'lowpass', dur: 0.12, vol: 0.4, curve: 2.2, delay: 0.05 });
      },
      // Farbschema: Weinglas
      chime() {
        glass(1046, 0.09);
        glass(1568, 0.04, 0.09);
      },
      // Knackiges Blasen-Platzen
      burst() {
        noise({ freq: 3000, type: 'highpass', dur: 0.014, vol: 0.7, curve: 3 });
        body({ freq: rnd(1100, 0.2), toFreq: 240, glide: 0.035, dur: 0.06, vol: 0.4 });
        for (let i = 0; i < 4; i++) noise({ freq: rnd(4500, 0.4), q: 6, dur: 0.006, vol: 0.25, delay: 0.03 + i * rnd(0.018, 0.6), pan: (Math.random() - 0.5) * 1.4 });
        for (let i = 0; i < 3; i++) water(rnd(1200 + i * 300, 0.2), 0.07, (Math.random() - 0.5) * 1.6, 0.05 + i * rnd(0.04, 0.5));
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
      // Cremiges Thock wie bei einer geschmierten (prelubed) Linear-Tastatur:
      // tiefer, runder Kern, hohles Gehäuse, keine Feder-Pings, keine kratzigen Höhen (k = { size, row, pan, soft })
      thock(k) {
        const kk = k || {};
        const sz = kk.size || 1;
        const rowName = 'r' + Math.max(0, Math.min(4, Math.round(kk.row == null ? 2 : kk.row)));
        const name = sz >= 5 ? 'space' : sz >= 2 ? 'enter' : sz >= 1.5 ? 'backspace' : rowName;
        if (sample(name, { rate: rnd(1, 0.06), vol: 0.9 * (kk.soft || 1), pan: kk.pan || 0 })) return;
        const size = (k && k.size) || 1;
        const row = (k && k.row) || 0;
        const pan = k && typeof k.pan === 'number' ? k.pan : 0;
        const soft = (k && k.soft) || 1;
        const deep = Math.min(1.7, 0.85 + size * 0.13);
        // Runder, tiefer Kern
        body({ freq: rnd(190 / deep + row * 5, 0.06), toFreq: 105 / deep, glide: 0.035, dur: 0.07 + size * 0.012, vol: 0.62 * soft, attack: 0.0025, pan });
        // Hohles Gehäuse: der eigentliche „Thock“
        noise({ freq: rnd(330 / deep + row * 12, 0.08), q: 7, dur: 0.06 + size * 0.01, vol: 1.9 * soft, curve: 3.2, pan });
        // Kappe trifft gedämpft auf (nur tiefe Höhen, daher cremig)
        noise({ freq: rnd(1150 / deep, 0.1), type: 'lowpass', q: 0.9, dur: 0.022, vol: 0.85 * soft, curve: 5, pan });
        // Ganz feine Textur, kaum hörbar
        noise({ freq: 2100, q: 1.2, dur: 0.008, vol: 0.12 * soft, curve: 7, pan });
        // Große Tasten: weich gedämpfter Stabilisator, kein Klappern
        if (size >= 2) noise({ freq: rnd(520, 0.1), q: 5, dur: 0.05, vol: 0.5 * soft, curve: 3, delay: 0.008, pan });
      },
      // Loslassen: leiser, runder „Tock“ nach oben
      clack(k) {
        const kk = k || {};
        const sz = kk.size || 1;
        const upName = sz >= 5 ? 'upSpace' : sz >= 2 ? 'upEnter' : sz >= 1.5 ? 'upBackspace' : 'up';
        if (sample(upName, { rate: rnd(1, 0.05), vol: 0.8 * (kk.soft || 1), pan: kk.pan || 0 })) return;
        const pan = k && typeof k.pan === 'number' ? k.pan : 0;
        const soft = (k && k.soft) || 1;
        noise({ freq: rnd(620, 0.1), q: 5, dur: 0.035, vol: 0.75 * soft, curve: 4, pan });
        body({ freq: rnd(300, 0.08), toFreq: 230, dur: 0.035, vol: 0.14 * soft, pan });
      },
      // Spiel: richtig getippt
      ding() {
        body({ freq: 1568, dur: 0.35, vol: 0.06, attack: 0.002 });
        body({ freq: 2349, dur: 0.25, vol: 0.035, attack: 0.002, delay: 0.05 });
      },
      // Spiel: falsche Taste
      buzz() {
        body({ freq: 120, toFreq: 90, dur: 0.12, vol: 0.18, wave: 'triangle' });
      },
      // Ganz feines Rasten beim Scrollen, wie ein Drehrad
      ratchet() {
        noise({ freq: rnd(3400, 0.15), q: 8, dur: 0.008, vol: 0.22, curve: 6 });
      }
    };
    // Überall dasselbe cremige Tastatur-Gefühl
    const later = (fn, ms) => setTimeout(fn, ms);
    Object.assign(sounds, {
      click() { sounds.thock({ size: 1.5, row: 3 }); later(() => sounds.clack({ soft: 0.8 }), 85); },
      pop() { sounds.thock({ size: 1, row: 1, soft: 0.8 }); later(() => sounds.clack({ soft: 0.6 }), 70); },
      bubble() { sounds.thock({ size: 1, row: 0, soft: 0.18, pan: (Math.random() - 0.5) * 0.8 }); },
      open() { sounds.thock({ size: 2.25, row: 2 }); later(() => sounds.clack({ soft: 0.8 }), 110); },
      close() { sounds.thock({ size: 2, row: 3, soft: 0.85 }); later(() => sounds.clack({ soft: 0.7 }), 95); },
      chime() { sounds.thock({ size: 6.25, row: 4 }); later(() => sounds.clack({ soft: 0.9 }), 130); },
      burst(r) { if (!sample('pop', { rate: Math.max(0.55, Math.min(1.6, 40 / Math.max(14, r || 40))) * rnd(1, 0.08), vol: 1, pan: (Math.random() - 0.5) * 0.6 })) sounds.thock({ size: 1.25, row: 1 }); },
      split() { sounds.thock({ size: 6.25, row: 4, soft: 0.95 }); later(() => sounds.clack({ soft: 0.8 }), 90); },
      glassTap(r) { sample('pop', { rate: 2.2 * rnd(1, 0.1), vol: 0.18, pan: (Math.random() - 0.5) * 0.8 }); },
      plip(r) { sample('pop', { rate: Math.min(2.4, 40 / Math.max(8, r || 20)) * rnd(1, 0.1), vol: 0.35, pan: (Math.random() - 0.5) * 1.2 }); },
      knock(r) { sample('pop', { rate: Math.min(2, 60 / Math.max(10, r || 30)) * rnd(1, 0.1), vol: 0.22, pan: (Math.random() - 0.5) * 0.8 }); },
      boing(r) { sample('pop', { rate: Math.min(1.8, 50 / Math.max(10, r || 30)) * rnd(1, 0.1), vol: 0.25 }); },
      rise() { [0, 1, 2].forEach(i => sample('pop', { rate: 1.6 + i * 0.3, vol: 0.2, delay: i * 0.08 })); },
      ratchet() { sounds.thock({ size: 1, row: 0, soft: 0.14 }); },
      ding() { sounds.thock({ size: 2.25, row: 2, soft: 0.7 }); later(() => sounds.thock({ size: 1, row: 0, soft: 0.5 }), 90); },
      buzz() { sounds.thock({ size: 2.75, row: 3, soft: 0.6 }); later(() => sounds.thock({ size: 2.75, row: 3, soft: 0.45 }), 80); }
    });
    // Diese Töne kommen erst, wenn schon einmal geklickt wurde (Browser erlauben vorher keinen Ton)
    const passive = ['bubble', 'glassTap', 'ratchet', 'boing', 'knock', 'rise'];

    // Aufnahmen schon beim ersten Klick oder Tastendruck laden, damit sie sofort bereit sind
    const warmUp = () => { if (on && audio()) loadSamples(); };
    window.addEventListener('pointerdown', warmUp, { once: true, capture: true });
    window.addEventListener('keydown', warmUp, { once: true, capture: true });

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

  // Für das geheime Tastatur-Spiel (thock.js)
  window.pkSound = sound;

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
    btn.addEventListener('click', () => {
      sound.on = !sound.on;
      sync();
      sound.play('pop');
      if (!sound.on) unlock('mute');
    });
    themeToggle.parentNode.insertBefore(btn, themeToggle);
  }

  // Erfolge oben in der Mitte: „Flashbangt“ (helles Farbschema) und „Warum höre ich nix“ (Ton aus)
  let achievementTimer = null;
  // Alle Erfolge; geheime zeigen bis zum Freischalten nur ???
  const ACHIEVEMENTS = [
    { id: 'flash', title: 'Flashbangt', tip: 'Wechsle ins helle Farbschema.', flash: true },
    { id: 'mute', title: 'Warum höre ich nix', tip: 'Schalte den Ton aus.' },
    { id: 'pop1', title: 'Plopp', tip: 'Lass oben im Startbereich eine Blase platzen.' },
    { id: 'pop10', title: 'Blasen-Profi', tip: 'Lass 10 Blasen platzen.' },
    { id: 'throw', title: 'Weitwurf', tip: 'Wirf eine Blase richtig schnell weg.' },
    { id: 'flood', title: 'Land unter', tip: 'Flute den Startbereich mit Blasen.' },
    { id: 'faq', title: 'Wissbegierig', tip: 'Öffne jede Frage in den FAQ.' },
    { id: 'bottom', title: 'Ganz unten', tip: 'Scroll bis ganz nach unten.' },
    { id: 'thock', title: 'Thock', secret: true, tip: 'Tippe irgendwo auf der Seite „thock“.' },
    { id: 'typer', title: 'Tipp-Maschine', secret: true, tip: '5 Wörter in Folge im Thock-Spiel.' },
    { id: 'disco', title: 'Disco', secret: true, tip: 'Wechsle das Farbschema ganz oft hintereinander.' }
  ];
  const ICON_TROPHY = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3a2a00" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
  const ICON_LOCK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const unlocked = new Set();
  function unlock(id) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a || unlocked.has(id)) return;
    unlocked.add(id);
    achievement(a.title, a.flash);
  }
  window.pkUnlock = unlock;

  // Liste aller Erfolge dieses Besuchs, öffnet sich mit Klick auf einen Erfolg
  let achPanel = null;
  function openAchievements() {
    if (!achPanel) {
      achPanel = document.createElement('div');
      achPanel.className = 'fx-ach-overlay';
      achPanel.innerHTML = '<div class="fx-ach-panel" role="dialog" aria-modal="true" aria-label="Erfolge"><div class="fx-ach-panel-head"><h2>Erfolge</h2><span class="fx-ach-count"></span><button type="button" class="kb-close fx-ach-close" aria-label="Schließen" title="Schließen (Esc)">×</button></div><ul class="fx-ach-list"></ul></div>';
      document.body.appendChild(achPanel);
      achPanel.addEventListener('click', (e) => { if (e.target === achPanel || e.target.closest('.fx-ach-close')) closeAchievements(); });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && achPanel.classList.contains('is-open')) closeAchievements(); });
    }
    achPanel.querySelector('.fx-ach-count').textContent = unlocked.size + ' / ' + ACHIEVEMENTS.length;
    achPanel.querySelector('.fx-ach-list').innerHTML = ACHIEVEMENTS.map((a, i) => {
      const got = unlocked.has(a.id);
      const hidden = a.secret && !got;
      return '<li class="fx-ach-item' + (got ? ' is-got' : '') + (hidden ? ' is-secret' : '') + '" style="--i:' + i + '">' +
        '<span class="fx-ach-item-icon" aria-hidden="true">' + (got ? ICON_TROPHY : hidden ? '?' : ICON_LOCK) + '</span>' +
        '<span class="fx-ach-item-text"><strong>' + (hidden ? '???' : a.title) + '</strong>' +
        '<small>' + (hidden ? 'Geheimer Erfolg' : got ? 'Freigeschaltet' : 'Tipp: ' + a.tip) + '</small></span></li>';
    }).join('');
    achPanel.classList.add('is-open');
    sound.play('open');
  }
  function closeAchievements() {
    achPanel.classList.remove('is-open');
    sound.play('close');
  }

  // Jeder Erfolg kommt nur einmal pro Seitenbesuch (nach Neuladen wieder)
  const shownAchievements = new Set();
  function achievement(title, flash) {
    if (shownAchievements.has(title)) return;
    shownAchievements.add(title);
    if (flash) {
      const f = document.createElement('div');
      f.className = 'fx-flash';
      f.setAttribute('aria-hidden', 'true');
      document.body.appendChild(f);
      f.addEventListener('animationend', () => f.remove());
    }

    document.querySelectorAll('.fx-achievement').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = 'fx-achievement';
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<span class="fx-ach-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg></span>' +
      '<span class="fx-ach-text"><small>Erfolg freigeschaltet</small><strong>' + title + '</strong></span>' +
      '<span class="fx-ach-bar" aria-hidden="true"></span>';
    for (let i = 0; i < 18; i++) {
      const c = document.createElement('i');
      c.className = 'fx-ach-confetti';
      const a = Math.random() * Math.PI - Math.PI;
      const d = 60 + Math.random() * 90;
      c.style.setProperty('--dx', (Math.cos(a) * d * 1.8).toFixed(0) + 'px');
      c.style.setProperty('--dy', (Math.sin(a) * -d * 0.6 + 40).toFixed(0) + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      c.style.setProperty('--h', Math.floor(Math.random() * 360));
      c.style.animationDelay = (0.35 + Math.random() * 0.15).toFixed(2) + 's';
      toast.appendChild(c);
    }
    toast.title = 'Alle Erfolge ansehen';
    toast.addEventListener('click', openAchievements);
    document.body.appendChild(toast);

    // Fanfare aus Tastenanschlägen, von tief nach hoch (bei Ton aus bleibt sie natürlich stumm)
    [4, 3, 2, 1, 0].forEach((row, i) => setTimeout(() => sound.play('thock', { size: i === 4 ? 2.25 : 1, row, soft: 0.8, pan: -0.6 + i * 0.3 }), 380 + i * 75));
    setTimeout(() => sound.play('thock', { size: 6.25, row: 4 }), 380 + 5 * 75 + 60);

    clearTimeout(achievementTimer);
    achievementTimer = setTimeout(() => {
      toast.classList.add('is-leaving');
      toast.addEventListener('animationend', (e) => { if (e.animationName === 'fx-ach-out') toast.remove(); });
    }, 3800);
  }
  let themeClicks = [];
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    setTimeout(() => { if (root.classList.contains('light')) unlock('flash'); }, 0);
    const now = performance.now();
    themeClicks = themeClicks.filter(x => now - x < 4000);
    themeClicks.push(now);
    if (themeClicks.length >= 6) unlock('disco');
  });

  const faqSeen = new Set();
  document.addEventListener('click', (e) => {
    const trig = e.target.closest('#accordion .accordion-trigger');
    if (!trig) return;
    const items = [...document.querySelectorAll('#accordion .accordion-item')];
    faqSeen.add(items.indexOf(trig.closest('.accordion-item')));
    if (items.length && faqSeen.size >= items.length) unlock('faq');
  });

  // Welcher Ton zu welchem Klick gehört
  document.addEventListener('click', (e) => {
    const t = e.target.closest('a, button, summary');
    if (!t || t.classList.contains('sound-toggle') || t.closest('.kb-overlay')) return;
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
    bar.style.transform = 'scaleX(' + (max > 0 ? (window.scrollY / max).toFixed(4) : 0) + ')';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4) unlock('bottom');
  }, { passive: true });

  if (reduce) return;

  /* ---------- Startbereich: Wörter gleiten einzeln herein ---------- */
  function splitWords(el, startDelay) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'fx-word';
            w.style.animationDelay = (startDelay + i++ * 0.035).toFixed(3) + 's';
            w.textContent = part;
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  }
  const heroSub = document.getElementById('heroSubtitle');
  const heroText = document.getElementById('heroText');
  if (heroSub) splitWords(heroSub, 0.5);
  if (heroText) splitWords(heroText, 0.8);

  /* ---------- Wellenlinien zwischen den Bereichen, die sich selbst zeichnen ---------- */
  document.querySelectorAll('main > section.section').forEach(section => {
    const wave = document.createElement('div');
    wave.className = 'fx-wave';
    wave.setAttribute('aria-hidden', 'true');
    wave.innerHTML = '<svg viewBox="0 0 1200 40" preserveAspectRatio="none"><path pathLength="1" d="M0 20 C 100 0, 200 40, 300 20 S 500 0, 600 20 S 800 40, 900 20 S 1100 0, 1200 20"/></svg>';
    section.prepend(wave);
  });
  const waveObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      waveObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.fx-wave').forEach(w => waveObserver.observe(w));

  /* ---------- Glitzer ---------- */
  const sparkles = document.createElement('div');
  sparkles.className = 'fx-sparkles';
  sparkles.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 16; i++) {
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
  for (let i = 0; i < 8; i++) {
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
    const MAX_BALLS = small ? 16 : 28;
    const TOP = small ? 90 : 110;
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
      b.y = b.fromBottom ? H + b.r : 120 + Math.random() * Math.max(10, H - 170 - b.r * 2);
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
        else if (Math.hypot(b.vx, b.vy) > 8) { sound.play('whoosh'); if (Math.hypot(b.vx, b.vy) > 22) unlock('throw'); }
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

    // Spritzer fliegen nach außen und fallen leicht nach unten, Größe passt sich der Blase an
    function splash(cx, cy, r, n) {
      for (let k = 0; k < n; k++) {
        const d = document.createElement('span');
        d.className = 'fx-splash';
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.5;
        const dist = r * (1.2 + Math.random() * 1.1);
        d.style.left = cx + 'px';
        d.style.top = cy + 'px';
        d.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        d.style.setProperty('--s', (2 + Math.random() * Math.max(4, r / 7)).toFixed(1) + 'px');
        d.style.animationDelay = (0.06 + Math.random() * 0.05).toFixed(2) + 's';
        play.appendChild(d);
        d.addEventListener('animationend', () => d.remove());
      }
    }

    // Die Blase zerplatzt an Ort und Stelle: Haut wabert, reißt auf, Ring und Fetzen fliegen weg
    function pop(b) {
      if (!b.alive) return;
      b.alive = false;
      const d = b.r * 2;
      const cx = b.x + b.r, cy = b.y + b.r;
      b.vx = b.vy = 0;
      b.el.classList.add('is-popping');
      sound.play('burst', b.r);

      const ring = document.createElement('span');
      ring.className = 'fx-pop-ring';
      ring.style.left = cx + 'px';
      ring.style.top = cy + 'px';
      ring.style.width = ring.style.height = d + 'px';
      play.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove());

      const shards = 7;
      for (let k = 0; k < shards; k++) {
        const s = document.createElement('span');
        s.className = 'fx-shard';
        const a = (k / shards) * 360 + Math.random() * 30;
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';
        s.style.width = s.style.height = d + 'px';
        s.style.setProperty('--a', a.toFixed(0) + 'deg');
        s.style.setProperty('--out', (b.r * (0.6 + Math.random() * 0.6)).toFixed(0) + 'px');
        s.style.setProperty('--spin', ((Math.random() - 0.5) * 90).toFixed(0) + 'deg');
        play.appendChild(s);
        s.addEventListener('animationend', () => s.remove());
      }

      splash(cx, cy, b.r, Math.round(10 + b.r / 5));
      popped++;
      unlock('pop1');
      if (popped >= 10) unlock('pop10');
      if (b.child) {
        // Zusätzliche Blasen (Fluten, Große) verschwinden ganz
        setTimeout(() => { b.el.remove(); const i = items.indexOf(b); if (i >= 0) items.splice(i, 1); }, 500);
      } else {
        setTimeout(() => { b.fromBottom = true; respawn(b); sound.play('rise'); }, respawnDelay);
      }
    }

    let popped = 0;
    let respawnDelay = 1900;

    // Knöpfe unten im Startbereich: fluten, große Blase, alle löschen
    const controls = document.createElement('div');
    controls.className = 'fx-ball-controls';
    controls.innerHTML =
      '<button type="button" data-act="flood">Fluten</button>' +
      '<button type="button" data-act="big">Große Blase</button>' +
      '<button type="button" data-act="clear">Alle löschen</button>';
    hero.appendChild(controls);
    const aliveCount = () => items.filter(i => i.alive).length;

    // Fluten: Wasser steigt über den ganzen Bildschirm, voller aufsteigender Blasen, und läuft wieder ab
    let flooding = false;
    function floodScreen() {
      if (flooding) return;
      flooding = true;
      const layer = document.createElement('div');
      layer.className = 'fx-flood';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = '<div class="fx-flood-water"><svg viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 C 150 0, 300 60, 450 30 S 750 0, 900 30 S 1150 60, 1200 30 V 60 H 0 Z"/></svg></div>';
      const count = small ? 34 : 70;
      for (let i = 0; i < count; i++) {
        const b = document.createElement('i');
        const s = 8 + Math.random() * (small ? 36 : 60);
        b.style.left = (Math.random() * 100).toFixed(1) + '%';
        b.style.width = b.style.height = s.toFixed(0) + 'px';
        b.style.animationDelay = (0.3 + Math.random() * 2.6).toFixed(2) + 's';
        b.style.animationDuration = (1.8 + Math.random() * 2.2).toFixed(2) + 's';
        layer.appendChild(b);
      }
      document.body.appendChild(layer);
      for (let i = 0; i < 18; i++) setTimeout(() => sound.play('plip', 10 + Math.random() * 30), 250 + i * 160 + Math.random() * 120);
      setTimeout(() => sound.play('whoosh'), 3300);
      setTimeout(() => { layer.remove(); flooding = false; }, 4700);
    }
    function spawnExtra(r, x) {
      if (aliveCount() >= MAX_BALLS) return false;
      makeBall({ child: true, r, x: x == null ? Math.random() * (W - r * 2) : x - r, y: H + r * 0.2, vx: (Math.random() - 0.5) * 3, vy: -6 - Math.random() * 5 });
      return true;
    }
    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'flood') {
        floodScreen();
        unlock('flood');
      } else if (act === 'big') {
        // Riesenblase, viel größer als alle normalen; darf auch kommen, wenn schon viele da sind
        const r = Math.min(W * 0.42, H * 0.4, small ? 170 : 340);
        makeBall({ child: true, r, x: W / 2 - r, y: H + r * 0.1, vx: (Math.random() - 0.5) * 1.5, vy: -4 });
        sound.play('rise');
      } else if (act === 'clear') {
        respawnDelay = 6000;
        items.filter(i => i.alive).forEach((b, i) => setTimeout(() => pop(b), i * 45));
        setTimeout(() => { respawnDelay = 1900; }, 1500);
      }
    });

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
        if (b.y < TOP) { b.y = TOP; b.vy = Math.abs(b.vy) * 0.95; hit = Math.abs(b.vy); }
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

    const btn = e.target.closest('.btn, .theme-toggle, .nav-link');
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
  // Der Schein gleitet weich hinterher statt hart zu springen
  let tx = -999, ty = -999, gx = -999, gy = -999, gliding = false;
  function glide() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px, ' + gy.toFixed(1) + 'px, 0)';
    gliding = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5;
    if (gliding) requestAnimationFrame(glide);
  }
  window.addEventListener('pointermove', (e) => {
    if (gx < -900) { gx = e.clientX; gy = e.clientY; }
    tx = e.clientX; ty = e.clientY;
    if (!gliding) { gliding = true; requestAnimationFrame(glide); }
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
