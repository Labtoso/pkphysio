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

function applyTemplate(text, site) {
  return String(text)
    .replaceAll('{{phone}}', '<a href="tel:' + site.phoneHref + '">' + site.phone + '</a>')
    .replaceAll('{{phoneHref}}', site.phoneHref);
}

const KONTAKT_MAP_COORDS = { lat: 48.0465791, lon: 15.7109788 };

function loadKontaktMap() {
  const frame = document.getElementById('kontaktMap');
  if (!frame) return;
  const { lat, lon } = KONTAKT_MAP_COORDS;
  const dLat = 0.004;
  const dLon = 0.006;
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat].join(',');
  frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bbox + '&layer=mapnik&marker=' + lat + ',' + lon;
}

function renderContent(data) {
  const site = data.site;

  applyDesign(data.design, data.customFonts);

  document.querySelectorAll('.tel-link').forEach(el => {
    el.href = 'tel:' + site.phoneHref;
  });

  if (data.meta) {
    document.title = data.meta.title;
    const descEl = document.getElementById('pageDescription');
    if (descEl) descEl.setAttribute('content', data.meta.description);
  }
  const faviconEl = document.getElementById('favicon');
  if (faviconEl && data.images) faviconEl.href = data.images.favicon;

  if (data.nav) {
    document.getElementById('navUeberMich').textContent = data.nav.ueberMich;
    document.getElementById('navLeistungen').textContent = data.nav.leistungen;
    document.getElementById('navFaq').textContent = data.nav.faq;
    document.getElementById('navKontakt').textContent = data.nav.kontakt;
  }

  if (data.images) {
    document.getElementById('logoImgDark').src = data.images.logoDark;
    document.getElementById('logoImgLight').src = data.images.logoLight;
    document.getElementById('portraitImg').src = data.images.portrait;
  }

  if (data.buttons) {
    document.getElementById('headerCta').textContent = data.buttons.headerCta;
    document.getElementById('kontaktCta').textContent = data.buttons.kontaktCta;
  }

  document.getElementById('heroEyebrow').textContent = data.hero.eyebrow;
  document.getElementById('heroTitle').textContent = data.hero.title;
  document.getElementById('heroSubtitle').textContent = data.hero.subtitle;
  document.getElementById('heroText').innerHTML = data.hero.text;
  document.getElementById('heroCtaPrimary').textContent = data.hero.ctaPrimary;
  document.getElementById('heroCtaSecondary').textContent = data.hero.ctaSecondary;

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

  document.getElementById('kontaktEyebrow').textContent = data.kontakt.eyebrow;
  document.getElementById('kontaktTitle').textContent = data.kontakt.title;
  document.getElementById('kontaktText').innerHTML = data.kontakt.text;

  const contactList = document.getElementById('contactList');
  contactList.innerHTML = `
    <li><div><strong>Adresse</strong><p>${site.address}</p><a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}" target="_blank" rel="noopener">In Google Maps öffnen</a></div></li>
    <li><div><strong>Telefon</strong><p><a href="tel:${site.phoneHref}">${site.phone}</a></p></div></li>
    <li><div><strong>E-Mail</strong><p><a href="mailto:${site.email}">${site.email}</a></p></div></li>
    <li><div><strong>Instagram</strong><p><a href="${site.instagramUrl}" target="_blank" rel="noopener" data-goatcounter-click="instagram">${site.instagramHandle}</a></p></div></li>
  `;

  loadKontaktMap();

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

function toEmbedUrl(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return 'https://www.youtube-nocookie.com/embed/' + yt[1];
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];
  return '';
}

const SOCIAL_ICON_LABELS = { instagram: 'IG', facebook: 'FB', whatsapp: 'WA', tiktok: 'TT', youtube: 'YT', linkedin: 'in', email: '@', phone: 'Tel' };
const SOCIAL_PLATFORM_NAMES = { instagram: 'Instagram', facebook: 'Facebook', whatsapp: 'WhatsApp', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', email: 'E-Mail', phone: 'Telefon' };
function socialHref(item) {
  const url = (item.url || '').trim();
  if (item.platform === 'email') return url.startsWith('mailto:') ? url : 'mailto:' + url;
  if (item.platform === 'phone') return url.startsWith('tel:') ? url : 'tel:' + url.replace(/\s+/g, '');
  return url;
}

const CUSTOM_BLOCK_RENDERERS = {
  textimage(cs, site) {
    const hasImage = !!cs.image;
    const posClass = cs.imagePosition === 'right' ? ' custom-section-imgright' : '';
    return `
      <div class="container custom-section-inner${hasImage ? ' has-image' + posClass : ''}">
        ${hasImage ? `<div class="custom-section-media reveal"><img src="${cs.image}" alt="${cs.title || ''}" loading="lazy"></div>` : ''}
        <div class="custom-section-body">
          <div class="section-head reveal custom-section-head">
            <p class="eyebrow">${cs.eyebrow || ''}</p>
            <h2>${cs.title || ''}</h2>
          </div>
          <div class="custom-section-text reveal">${applyTemplate(cs.text || '', site)}</div>
          ${(cs.subblocks || []).filter(sb => sb.heading || sb.text).map(sb => `
            <div class="custom-subblock reveal">
              ${sb.heading ? `<h3>${sb.heading}</h3>` : ''}
              <div class="custom-section-text">${applyTemplate(sb.text || '', site)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  faq(cs, site) {
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="accordion custom-block-accordion reveal">
          ${(cs.items || []).map(item => `
            <div class="accordion-item">
              <button class="accordion-trigger">${item.q}</button>
              <div class="accordion-panel">
                <p>${applyTemplate(item.a, site)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  table(cs) {
    const columns = cs.columns || [];
    const rows = cs.rows || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-table-wrap reveal">
          <table class="custom-table">
            <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  },
  gallery(cs) {
    const images = cs.images || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-gallery-grid reveal">
          ${images.map(src => `<img src="${src}" loading="lazy">`).join('')}
        </div>
      </div>
    `;
  },
  quote(cs, site) {
    return `
      <div class="container custom-quote-container">
        <blockquote class="custom-quote reveal">
          <p>${applyTemplate(cs.text || '', site)}</p>
          ${cs.author ? `<cite>${cs.author}</cite>` : ''}
        </blockquote>
      </div>
    `;
  },
  cta(cs, site) {
    const url = applyTemplate(cs.buttonUrl || '', site);
    const external = /^https?:/.test(url);
    return `
      <div class="container custom-cta-container reveal">
        <p class="eyebrow">${cs.eyebrow || ''}</p>
        <h2>${cs.title || ''}</h2>
        ${cs.text ? `<p class="custom-cta-text">${applyTemplate(cs.text, site)}</p>` : ''}
        ${cs.buttonLabel && url ? `<a class="btn btn-primary" href="${url}"${external ? ' target="_blank" rel="noopener"' : ''} data-goatcounter-click="cta_block">${cs.buttonLabel}</a>` : ''}
      </div>
    `;
  },
  video(cs) {
    const embed = toEmbedUrl(cs.videoUrl || '');
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        ${embed ? `<div class="custom-video-wrap reveal"><iframe src="${embed}" title="${cs.title || 'Video'}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ''}
      </div>
    `;
  },
  stats(cs) {
    const items = cs.items || [];
    return `
      <div class="container">
        ${cs.title || cs.eyebrow ? `
          <div class="section-head reveal custom-section-head">
            <p class="eyebrow">${cs.eyebrow || ''}</p>
            <h2>${cs.title || ''}</h2>
          </div>` : ''}
        <div class="custom-stats-grid reveal">
          ${items.map(item => `
            <div class="custom-stat">
              <span class="custom-stat-value">${item.value || ''}</span>
              <span class="custom-stat-label">${item.label || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  hours(cs) {
    const rows = cs.rows || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-hours-list reveal">
          ${rows.map(row => `
            <div class="custom-hours-row">
              <span class="custom-hours-day">${row.day || ''}</span>
              <span class="custom-hours-time">${row.time || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  columns(cs, site) {
    return `
      <div class="container">
        ${cs.title || cs.eyebrow ? `
          <div class="section-head reveal custom-section-head">
            <p class="eyebrow">${cs.eyebrow || ''}</p>
            <h2>${cs.title || ''}</h2>
          </div>` : ''}
        <div class="custom-columns-grid reveal">
          <div class="custom-column">
            ${cs.leftTitle ? `<h3>${cs.leftTitle}</h3>` : ''}
            <div class="custom-section-text">${applyTemplate(cs.leftText || '', site)}</div>
          </div>
          <div class="custom-column">
            ${cs.rightTitle ? `<h3>${cs.rightTitle}</h3>` : ''}
            <div class="custom-section-text">${applyTemplate(cs.rightText || '', site)}</div>
          </div>
        </div>
      </div>
    `;
  },
  divider(cs) {
    if (cs.style === 'space') return '<div class="custom-divider-space"></div>';
    return `
      <div class="container">
        <div class="custom-divider-line reveal">
          ${cs.label ? `<span>${cs.label}</span>` : ''}
        </div>
      </div>
    `;
  },
  map(cs, site) {
    const address = cs.address || site.address || '';
    const src = 'https://maps.google.com/maps?q=' + encodeURIComponent(address) + '&t=&z=14&ie=UTF8&iwloc=&output=embed';
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-map-wrap reveal">
          <iframe src="${src}" loading="lazy" title="${cs.title || 'Karte'}"></iframe>
        </div>
      </div>
    `;
  },
  team(cs) {
    const members = cs.members || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-team-grid reveal">
          ${members.map(m => `
            <div class="custom-team-card">
              ${m.photo ? `<img src="${m.photo}" alt="${m.name || ''}" loading="lazy" class="custom-team-photo">` : '<div class="custom-team-photo custom-team-photo-placeholder"></div>'}
              <h3>${m.name || ''}</h3>
              ${m.role ? `<p class="custom-team-role">${m.role}</p>` : ''}
              ${m.bio ? `<p class="custom-team-bio">${m.bio}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  testimonials(cs) {
    const items = cs.items || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-testimonials-grid reveal">
          ${items.map(item => `
            <div class="custom-testimonial-card">
              <p class="custom-testimonial-text">${item.text || ''}</p>
              <p class="custom-testimonial-author">${item.author || ''}${item.role ? ` <span>· ${item.role}</span>` : ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  pricing(cs) {
    const plans = cs.plans || [];
    return `
      <div class="container">
        <div class="section-head reveal custom-section-head">
          <p class="eyebrow">${cs.eyebrow || ''}</p>
          <h2>${cs.title || ''}</h2>
        </div>
        <div class="custom-pricing-grid reveal">
          ${plans.map(plan => `
            <div class="custom-pricing-card${plan.highlighted ? ' highlighted' : ''}">
              <h3>${plan.name || ''}</h3>
              <p class="custom-pricing-value">${plan.price || ''}${plan.period ? `<span>${plan.period}</span>` : ''}</p>
              ${plan.description ? `<p class="custom-pricing-desc">${plan.description}</p>` : ''}
              ${(plan.features || []).length ? `<ul class="custom-pricing-features">${plan.features.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  logos(cs) {
    const logos = cs.logos || [];
    return `
      <div class="container">
        ${cs.eyebrow ? `<p class="eyebrow custom-logos-eyebrow reveal">${cs.eyebrow}</p>` : ''}
        <div class="custom-logos-row reveal">
          ${logos.map(l => {
            const img = `<img src="${l.image}" loading="lazy" alt="">`;
            return l.url ? `<a href="${l.url}" target="_blank" rel="noopener">${img}</a>` : img;
          }).join('')}
        </div>
      </div>
    `;
  },
  social(cs) {
    const items = cs.items || [];
    return `
      <div class="container">
        <div class="custom-social-row reveal">
          ${items.map(item => {
            const label = SOCIAL_ICON_LABELS[item.platform] || '?';
            const href = socialHref(item);
            return `<a class="custom-social-icon" href="${href}" target="_blank" rel="noopener" aria-label="${SOCIAL_PLATFORM_NAMES[item.platform] || item.platform}" data-goatcounter-click="social_${item.platform}"><span>${label}</span></a>`;
          }).join('')}
        </div>
      </div>
    `;
  }
};

function renderCustomSections(customSections, site) {
  const main = document.getElementById('top');
  main.querySelectorAll('.custom-section').forEach(el => el.remove());

  customSections.forEach((cs, i) => {
    const type = CUSTOM_BLOCK_RENDERERS[cs.type] ? cs.type : 'textimage';
    const section = document.createElement('section');
    section.id = cs.id;
    section.className = 'section custom-section custom-block-' + type + (i % 2 === 1 ? ' section-alt' : '');
    section.innerHTML = CUSTOM_BLOCK_RENDERERS[type](cs, site);
    main.appendChild(section);
  });
}

function reorderSections(order, hiddenSections) {
  const main = document.getElementById('top');

  Object.keys(SECTION_ID_MAP).forEach(key => {
    if (order.includes(key)) return;
    const el = document.getElementById(SECTION_ID_MAP[key]);
    if (el) el.style.display = 'none';
  });

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

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const themeToggle = document.getElementById('themeToggle');

themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});

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
