// ---------- Design (colors, fonts, sizes) ----------
const FONT_OPTIONS = {
  poppins: '"Poppins", sans-serif',
  inter: '"Inter", sans-serif',
  montserrat: '"Montserrat", sans-serif',
  playfair: '"Playfair Display", serif',
  lora: '"Lora", serif',
  roboto: '"Roboto", sans-serif'
};

function fontFormatFromPath(path) {
  const ext = String(path).split('.').pop().toLowerCase();
  return { woff2: 'woff2', woff: 'woff', otf: 'opentype', ttf: 'truetype' }[ext] || 'truetype';
}

function injectCustomFonts(customFonts) {
  const existing = document.getElementById('customFontFaces');
  if (existing) existing.remove();
  if (!customFonts || !customFonts.length) return;
  const style = document.createElement('style');
  style.id = 'customFontFaces';
  style.textContent = customFonts.map(f => `
    @font-face {
      font-family: "${f.name}";
      src: url("${f.file}") format("${fontFormatFromPath(f.file)}");
      font-display: swap;
    }
  `).join('\n');
  document.head.appendChild(style);
}

function resolveFont(key, customFonts) {
  if (FONT_OPTIONS[key]) return FONT_OPTIONS[key];
  const custom = (customFonts || []).find(f => f.name === key);
  if (custom) return `"${custom.name}", sans-serif`;
  return FONT_OPTIONS.poppins;
}

function hexToRgb(hex) {
  const parts = String(hex).replace('#', '').match(/.{1,2}/g) || ['17', 'b6', 'a4'];
  return parts.map(p => parseInt(p, 16));
}
function shadeColor(hex, factor) {
  const [r, g, b] = hexToRgb(hex);
  const f = c => Math.max(0, Math.min(255, Math.round(c * factor)));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
function tintColor(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyDesign(design, customFonts) {
  if (!design) return;
  const root = document.documentElement.style;
  root.setProperty('--color-primary', design.primaryColor);
  root.setProperty('--color-primary-dark', shadeColor(design.primaryColor, 0.62));
  root.setProperty('--color-primary-light', tintColor(design.primaryColor, 0.16));
  root.setProperty('--color-accent', design.accentColor);
  root.setProperty('--radius', design.borderRadius + 'px');
  root.setProperty('--radius-sm', Math.max(4, design.borderRadius - 2) + 'px');
  root.setProperty('--portrait-width', design.portraitWidth + 'px');
  root.setProperty('--logo-height', design.logoHeight + 'px');
  document.documentElement.style.fontSize = design.textScale + '%';

  injectCustomFonts(customFonts);
  root.setProperty('--font-head', resolveFont(design.headingFont, customFonts));
  root.setProperty('--font-body', resolveFont(design.bodyFont, customFonts));
}

// ---------- Render content from content.js ----------
function applyTemplate(text, site) {
  return String(text)
    .replaceAll('{{phone}}', '<a href="tel:' + site.phoneHref + '">' + site.phone + '</a>')
    .replaceAll('{{phoneHref}}', site.phoneHref);
}

function renderContent(data) {
  const site = data.site;

  applyDesign(data.design, data.customFonts);

  // tel-links (href everywhere, text only where marked)
  document.querySelectorAll('.tel-link').forEach(el => {
    el.href = 'tel:' + site.phoneHref;
  });

  // Meta / tab
  if (data.meta) {
    document.title = data.meta.title;
    const descEl = document.getElementById('pageDescription');
    if (descEl) descEl.setAttribute('content', data.meta.description);
  }
  const faviconEl = document.getElementById('favicon');
  if (faviconEl && data.images) faviconEl.href = data.images.favicon;

  // Nav
  if (data.nav) {
    document.getElementById('navUeberMich').textContent = data.nav.ueberMich;
    document.getElementById('navLeistungen').textContent = data.nav.leistungen;
    document.getElementById('navFaq').textContent = data.nav.faq;
    document.getElementById('navKontakt').textContent = data.nav.kontakt;
  }

  // Images
  if (data.images) {
    document.getElementById('logoImgDark').src = data.images.logoDark;
    document.getElementById('logoImgLight').src = data.images.logoLight;
    document.getElementById('portraitImg').src = data.images.portrait;
  }

  // Buttons
  if (data.buttons) {
    document.getElementById('headerCta').textContent = data.buttons.headerCta;
    document.getElementById('kontaktCta').textContent = data.buttons.kontaktCta;
    document.getElementById('mobileCta').textContent = data.buttons.mobileCta;
  }

  // Hero
  document.getElementById('heroEyebrow').textContent = data.hero.eyebrow;
  document.getElementById('heroTitle').textContent = data.hero.title;
  document.getElementById('heroSubtitle').textContent = data.hero.subtitle;
  document.getElementById('heroText').innerHTML = data.hero.text;
  document.getElementById('heroCtaPrimary').textContent = data.hero.ctaPrimary;
  document.getElementById('heroCtaSecondary').textContent = data.hero.ctaSecondary;

  // About
  document.getElementById('aboutEyebrow').textContent = data.about.eyebrow;
  document.getElementById('aboutTitle').textContent = data.about.title;
  document.getElementById('aboutText').innerHTML = data.about.text;

  const timelineEl = document.getElementById('aboutTimeline');
  timelineEl.innerHTML = data.about.timeline.map(item => `
    <li>
      <span class="timeline-dot"></span>
      <div>
        <strong>${item.date}</strong>
        <p>${item.text}</p>
      </div>
    </li>
  `).join('');

  // Leistungen
  document.getElementById('leistungenEyebrow').textContent = data.leistungen.eyebrow;
  document.getElementById('leistungenTitle').textContent = data.leistungen.title;

  const servicesGrid = document.getElementById('servicesGrid');
  servicesGrid.innerHTML = data.leistungen.services.map(service => `
    <div class="service-card reveal">
      <h3>${service.title}</h3>
      <p>${service.text}</p>
    </div>
  `).join('');

  document.getElementById('angeboteEyebrow').textContent = data.leistungen.angeboteEyebrow;
  document.getElementById('angeboteTitle').textContent = data.leistungen.angeboteTitle;

  const offersGrid = document.getElementById('offersGrid');
  offersGrid.innerHTML = data.leistungen.angebote.map(offer => `
    <div class="offer-card reveal">
      <h3>${offer.title}</h3>
      <ul class="offer-list">
        ${offer.items.map(item => `<li>${item}</li>`).join('')}
        ${offer.subitems && offer.subitems.length ? `
          <li>
            ${offer.subheading}
            <ul class="offer-sublist">
              ${offer.subitems.map(sub => `<li>${sub}</li>`).join('')}
            </ul>
          </li>
        ` : ''}
      </ul>
    </div>
  `).join('');

  // FAQ
  document.getElementById('faqEyebrow').textContent = data.faq.eyebrow;
  document.getElementById('faqTitle').textContent = data.faq.title;
  document.getElementById('faqText').textContent = data.faq.text;

  const accordionEl = document.getElementById('accordion');
  accordionEl.innerHTML = data.faq.items.map(item => `
    <div class="accordion-item">
      <button class="accordion-trigger">${item.q}</button>
      <div class="accordion-panel">
        <p>${applyTemplate(item.a, site)}</p>
      </div>
    </div>
  `).join('');

  // Kontakt
  document.getElementById('kontaktEyebrow').textContent = data.kontakt.eyebrow;
  document.getElementById('kontaktTitle').textContent = data.kontakt.title;
  document.getElementById('kontaktText').innerHTML = data.kontakt.text;

  const contactList = document.getElementById('contactList');
  contactList.innerHTML = `
    <li><div><strong>Adresse</strong><p>${site.address}</p></div></li>
    <li><div><strong>Telefon</strong><p><a href="tel:${site.phoneHref}">${site.phone}</a></p></div></li>
    <li><div><strong>E-Mail</strong><p><a href="mailto:${site.email}">${site.email}</a></p></div></li>
    <li><div><strong>Instagram</strong><p><a href="${site.instagramUrl}" target="_blank" rel="noopener">${site.instagramHandle}</a></p></div></li>
  `;

  document.getElementById('kontaktMap').src =
    'https://maps.google.com/maps?q=' + encodeURIComponent(site.address) + '&t=&z=14&ie=UTF8&iwloc=&output=embed';

  // Custom sections + section order
  renderCustomSections(data.customSections || [], site);
  reorderSections(
    data.order || ['hero', 'about', 'leistungen', 'faq', 'kontakt'],
    data.hiddenSections || []
  );
}

const SECTION_ID_MAP = {
  hero: 'hero-section',
  about: 'ueber-mich',
  leistungen: 'leistungen',
  faq: 'faq',
  kontakt: 'kontakt'
};

function renderCustomSections(customSections, site) {
  const main = document.getElementById('top');
  main.querySelectorAll('.custom-section').forEach(el => el.remove());

  customSections.forEach((cs, i) => {
    const section = document.createElement('section');
    section.id = cs.id;
    section.className = 'section custom-section' + (i % 2 === 1 ? ' section-alt' : '');
    section.innerHTML = `
      <div class="container custom-section-inner">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-section-text reveal">${applyTemplate(cs.text || '', site)}</div>
      </div>
    `;
    main.appendChild(section);
  });
}

function reorderSections(order, hiddenSections) {
  const main = document.getElementById('top');
  order.forEach(key => {
    const id = SECTION_ID_MAP[key] || key;
    const el = document.getElementById(id);
    if (!el) return;
    main.appendChild(el);
    el.style.display = hiddenSections.includes(key) ? 'none' : '';
  });
}

if (window.SITE_CONTENT) {
  renderContent(window.SITE_CONTENT);
}

// ---------- Header scroll state + progress bar ----------
const header = document.getElementById('siteHeader');
const progressBar = document.getElementById('progressBar');

function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 10);

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = progress + '%';
}
document.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Mobile menu ----------
const burger = document.getElementById('burgerBtn');
const nav = document.getElementById('mainNav');

burger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  burger.classList.toggle('open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Active nav link on scroll ----------
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(section => navObserver.observe(section));

// ---------- Scroll reveal ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ---------- Theme toggle ----------
const themeToggle = document.getElementById('themeToggle');

themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});

// ---------- FAQ accordion ----------
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.accordion-item');
    const panel = item.querySelector('.accordion-panel');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.accordion-item.open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-panel').style.maxHeight = null;
      }
    });

    if (isOpen) {
      item.classList.remove('open');
      panel.style.maxHeight = null;
    } else {
      item.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});
