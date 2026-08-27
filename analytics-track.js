// ---------- Lightweight self-built analytics: tracking ----------
// Counts page views and a handful of link clicks into one Firestore
// document per day (dailyStats/YYYY-MM-DD), using atomic increments.
// No cookies, no personal data, no IP addresses stored. Never blocks
// or breaks the page for visitors — every failure is swallowed.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, setDoc, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

function todayId() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

let db = null;
try {
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey && window.FIREBASE_CONFIG.apiKey !== 'REPLACE_ME') {
    db = getFirestore(initializeApp(window.FIREBASE_CONFIG));
  }
} catch (e) { /* analytics must never break the site */ }

async function bump(field) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'dailyStats', todayId()), {
      [field]: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) { /* ignore — analytics is best-effort */ }
}

// Page view, once per page load.
bump('pageviews');

// Known, fixed click targets (by id) -> counter key.
const TRACKED_IDS = {
  headerCta: 'clicks.phone_header',
  heroCtaPrimary: 'clicks.phone_hero',
  kontaktCta: 'clicks.phone_kontakt'
};

document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;

  if (link.id && TRACKED_IDS[link.id]) {
    bump(TRACKED_IDS[link.id]);
    return;
  }
  if (link.closest('#contactList') && link.href && link.href.includes('instagram.com')) {
    bump('clicks.instagram');
    return;
  }
  if (link.classList.contains('custom-social-icon')) {
    bump('clicks.social_block');
    return;
  }
  if (link.closest('.custom-cta-container')) {
    bump('clicks.cta_block');
  }
});
