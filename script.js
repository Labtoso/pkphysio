// ---------- Render content from content.js ----------
function applyTemplate(text, site) {
  return String(text)
    .replaceAll('{{phone}}', '<a href="tel:' + site.phoneHref + '">' + site.phone + '</a>')
    .replaceAll('{{phoneHref}}', site.phoneHref);
}

function renderContent(data) {
  const site = data.site;

  // tel-links (href everywhere, text only where marked)
  document.querySelectorAll('.tel-link').forEach(el => {
    el.href = 'tel:' + site.phoneHref;
  });

  // Hero
  document.getElementById('heroEyebrow').textContent = data.hero.eyebrow;
  document.getElementById('heroTitle').textContent = data.hero.title;
  document.getElementById('heroSubtitle').textContent = data.hero.subtitle;
  document.getElementById('heroText').textContent = data.hero.text;
  document.getElementById('heroCtaPrimary').textContent = data.hero.ctaPrimary;
  document.getElementById('heroCtaSecondary').textContent = data.hero.ctaSecondary;

  // About
  document.getElementById('aboutEyebrow').textContent = data.about.eyebrow;
  document.getElementById('aboutTitle').textContent = data.about.title;
  document.getElementById('aboutText').textContent = data.about.text;

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
  document.getElementById('kontaktText').textContent = data.kontakt.text;

  const contactList = document.getElementById('contactList');
  contactList.innerHTML = `
    <li><div><strong>Adresse</strong><p>${site.address}</p></div></li>
    <li><div><strong>Telefon</strong><p><a href="tel:${site.phoneHref}">${site.phone}</a></p></div></li>
    <li><div><strong>E-Mail</strong><p><a href="mailto:${site.email}">${site.email}</a></p></div></li>
    <li><div><strong>Instagram</strong><p><a href="${site.instagramUrl}" target="_blank" rel="noopener">${site.instagramHandle}</a></p></div></li>
  `;

  document.getElementById('kontaktMap').src =
    'https://maps.google.com/maps?q=' + encodeURIComponent(site.address) + '&t=&z=14&ie=UTF8&iwloc=&output=embed';
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
