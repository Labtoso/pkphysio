// Firebase project config for the self-built, lightweight analytics
// (page views + a handful of link clicks). Loaded by both the public
// website (which writes counters) and the admin Statistik dashboard
// (which reads them).
//
// These values are meant to be public — Firebase does not treat the
// config as a secret. Access is controlled entirely by the Firestore
// Security Rules on the project (see admin/Statistik/FIRESTORE_SETUP.md),
// not by hiding this file.
//
// ---------- Setup ----------
// 1. Go to https://console.firebase.google.com and create a project
//    (or reuse one).
// 2. Project settings (gear icon) -> General -> "Your apps" -> Web app
//    (</> icon) -> register an app -> copy the config object shown there.
// 3. Paste the values below, replacing the placeholders.
// 4. Firestore Database -> Create database -> production mode.
// 5. Firestore -> Rules tab -> paste the rules from
//    admin/Statistik/FIRESTORE_SETUP.md -> Publish.
window.FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME'
};
