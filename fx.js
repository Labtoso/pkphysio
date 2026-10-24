// V2-Effekte: Lichtschein unter der Maus, 3D-Neigung der Karten, Glitzer, Scroll-Fortschritt
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

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

  if (!fine) return;

  const glow = document.createElement('div');
  glow.className = 'fx-cursor';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);
  window.addEventListener('pointermove', (e) => {
    root.style.setProperty('--mx', e.clientX + 'px');
    root.style.setProperty('--my', e.clientY + 'px');
  }, { passive: true });

  // Karten neigen sich zur Maus und tragen einen eigenen Lichtpunkt
  const tiltSelector = '.service-card, .offer-card, .contact-list, .about-portrait, .custom-testimonial-card, .custom-pricing-card';
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest(tiltSelector);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--px', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--py', (y * 100).toFixed(1) + '%');
    card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
    card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
    card.classList.add('fx-tilting');
  });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest && e.target.closest(tiltSelector);
    if (card && !card.contains(e.relatedTarget)) card.classList.remove('fx-tilting');
  });
})();
