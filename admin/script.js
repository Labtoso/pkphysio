const REPO_OWNER = 'Labtoso';
const REPO_NAME = 'pkphysio';
const REPO_BRANCH = 'main';
const CONTENT_PATH = 'content.js';
const TOKEN_KEY = 'pk_admin_token';
const NAV_TOKEN_KEY = 'pk_admin_nav';

const PIN_HASH = 'eec9bb67f607e0a241a430dd814b9407ef7a46084ddbdd7f4fb2f8e44760ad45';
const PIN_SESSION_KEY = 'pk_admin_pin_ok';
const PIN_ATTEMPTS_KEY = 'pk_admin_pin_attempts';
const PIN_LOCK_KEY = 'pk_admin_pin_lock_until';

function base64ToUtf8(b64) {
  return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

function ghHeaders(token) {
  return {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json'
  };
}

async function ghGetFile(token) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONTENT_PATH}?ref=${REPO_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) {
    const err = new Error('GitHub-Fehler beim Laden (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return { sha: json.sha, text: base64ToUtf8(json.content.replace(/\n/g, '')) };
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Keine Antwort von GitHub nach ' + (ms / 1000) + ' Sekunden. Evtl. blockiert eine Firewall/Antivirus/VPN die Verbindung zu api.github.com.')), ms))
  ]);
}

const pinScreen = document.getElementById('pinScreen');
const pinInput = document.getElementById('pinInput');
const pinBtn = document.getElementById('pinBtn');
const pinError = document.getElementById('pinError');
const loginScreen = document.getElementById('loginScreen');
const tokenInput = document.getElementById('tokenInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const menuScreen = document.getElementById('menuScreen');

function showMenu() {
  pinScreen.style.display = 'none';
  loginScreen.style.display = 'none';
  menuScreen.style.display = 'flex';
}
function showLogin() {
  pinScreen.style.display = 'none';
  menuScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
}
function showPinGate() {
  loginScreen.style.display = 'none';
  menuScreen.style.display = 'none';
  pinScreen.style.display = 'flex';
  updatePinLockUI();
}

async function verifyAndEnter(token) {
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Prüfe Zugang …';
  try {
    await withTimeout(ghGetFile(token), 10000);
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
    showMenu();
  } catch (err) {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    if (err.status === 401) {
      loginError.textContent = 'Token ungültig oder abgelaufen.';
    } else if (err.status === 404) {
      loginError.textContent = 'Repository oder content.js nicht gefunden. Wurde der Code schon nach GitHub gepusht?';
    } else if (err.status === 403) {
      loginError.textContent = 'Kein Zugriff. Prüfe, ob das Token Zugriff auf "pkphysio" mit "Contents: Read and write" hat.';
    } else {
      loginError.textContent = err.message || 'Unbekannter Fehler.';
    }
    showLogin();
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Anmelden';
  }
}

loginBtn.addEventListener('click', () => {
  loginError.textContent = '';
  const token = tokenInput.value.trim();
  if (!token) {
    loginError.textContent = 'Bitte ein Token eingeben.';
    return;
  }
  verifyAndEnter(token);
});
tokenInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });

document.querySelectorAll('.admin-menu-card').forEach(link => {
  link.addEventListener('click', () => {
    const token = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    try { sessionStorage.setItem(NAV_TOKEN_KEY, token); } catch (e) {}
  });
});

document.getElementById('menuLogoutBtn').addEventListener('click', () => {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  try { sessionStorage.removeItem(NAV_TOKEN_KEY); } catch (e) {}
  try { sessionStorage.removeItem(PIN_SESSION_KEY); } catch (e) {}
  try { sessionStorage.removeItem(PIN_ATTEMPTS_KEY); } catch (e) {}
  try { sessionStorage.removeItem(PIN_LOCK_KEY); } catch (e) {}
  tokenInput.value = '';
  showPinGate();
});

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function pinLockRemainingMs() {
  let until = 0;
  try { until = Number(sessionStorage.getItem(PIN_LOCK_KEY) || 0); } catch (e) {}
  return Math.max(0, until - Date.now());
}

function pinDelayForAttempts(n) {
  const steps = [0, 0, 0, 5, 15, 30, 60, 120, 300];
  return (steps[Math.min(n, steps.length - 1)] ?? 300) * 1000;
}

let pinLockTimer = null;
function updatePinLockUI() {
  const remaining = pinLockRemainingMs();
  clearTimeout(pinLockTimer);
  if (remaining > 0) {
    pinBtn.disabled = true;
    pinInput.disabled = true;
    pinError.textContent = 'Zu viele Versuche. Bitte warte ' + Math.ceil(remaining / 1000) + ' Sekunden.';
    pinLockTimer = setTimeout(updatePinLockUI, 1000);
  } else {
    pinBtn.disabled = false;
    pinInput.disabled = false;
    if (pinError.textContent.startsWith('Zu viele Versuche')) pinError.textContent = '';
  }
}

async function submitPin() {
  if (pinLockRemainingMs() > 0) return;
  const value = pinInput.value;
  if (!value) return;

  pinBtn.disabled = true;
  pinBtn.textContent = 'Prüfe …';
  const hash = await sha256Hex(value);
  pinBtn.textContent = 'Weiter';

  if (hash === PIN_HASH) {
    try {
      sessionStorage.setItem(PIN_SESSION_KEY, '1');
      sessionStorage.removeItem(PIN_ATTEMPTS_KEY);
      sessionStorage.removeItem(PIN_LOCK_KEY);
    } catch (e) {}
    pinInput.value = '';
    pinError.textContent = '';
    showLogin();
  } else {
    let attempts = 0;
    try {
      attempts = Number(sessionStorage.getItem(PIN_ATTEMPTS_KEY) || 0) + 1;
      sessionStorage.setItem(PIN_ATTEMPTS_KEY, String(attempts));
      const delay = pinDelayForAttempts(attempts);
      if (delay > 0) sessionStorage.setItem(PIN_LOCK_KEY, String(Date.now() + delay));
    } catch (e) {}
    pinInput.value = '';
    pinInput.focus();
    pinError.textContent = 'Falsches Passwort.';
    updatePinLockUI();
  }
}

pinBtn.addEventListener('click', submitPin);
pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitPin(); });

const themeToggle = document.getElementById('themeToggle');
themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});

(function () {
  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
  if (token) {
    verifyAndEnter(token);
    return;
  }

  let pinAlreadyOk = false;
  try { pinAlreadyOk = sessionStorage.getItem(PIN_SESSION_KEY) === '1'; } catch (e) {}
  if (pinAlreadyOk) {
    showLogin();
  } else {
    showPinGate();
  }
})();
