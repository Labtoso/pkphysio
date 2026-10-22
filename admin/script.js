const REPO_OWNER = 'Labtoso';
const REPO_NAME = 'pkphysio';
const REPO_BRANCH = 'main';
const CONTENT_PATH = 'content.js';
const TOKEN_KEY = 'pk_admin_token';
const NAV_TOKEN_KEY = 'pk_admin_nav';

// Adresse des kleinen Anmelde-Dienstes (Ordner anmelde-dienst/), z. B. https://pkphysio-login.<name>.workers.dev
// Leer = nur Anmeldung mit Token.
const LOGIN_URL = '';
const LOGIN_STATE_KEY = 'pk_admin_login_state';

function base64ToUtf8(b64) {
  return decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

function ghHeaders(token) {
  return {
    Authorization: 'token ' + token,
    Accept: 'application/vnd.github+json'
  };
}

async function ghCheckWriteAccess(token) {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, { headers: ghHeaders(token) });
  if (!res.ok) {
    const err = new Error('GitHub-Fehler beim Prüfen des Tokens (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  const repo = await res.json();
  if (!repo.permissions || !repo.permissions.push) {
    const err = new Error('Dieses Token hat keine Schreibrechte auf ' + REPO_NAME + '.');
    err.status = 403;
    throw err;
  }
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

const githubLoginBtn = document.getElementById('githubLoginBtn');
const tokenLogin = document.getElementById('tokenLogin');
const loginScreen = document.getElementById('loginScreen');
const tokenInput = document.getElementById('tokenInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const menuScreen = document.getElementById('menuScreen');

function showMenu() {
  loginScreen.style.display = 'none';
  menuScreen.style.display = 'flex';
}
function showLogin() {
  menuScreen.style.display = 'none';
  loginScreen.style.display = 'flex';
}

async function verifyAndEnter(token) {
  loginError.textContent = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Prüfe Zugang …';
  githubLoginBtn.disabled = true;
  try {
    await withTimeout(ghCheckWriteAccess(token), 10000);
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch (e) {}
    showMenu();
  } catch (err) {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    if (err.status === 401) {
      loginError.textContent = 'Anmeldung ungültig oder abgelaufen. Bitte erneut anmelden.';
    } else if (err.status === 404) {
      loginError.textContent = 'Repository oder content.js nicht gefunden. Wurde der Code schon nach GitHub gepusht?';
    } else if (err.status === 403) {
      loginError.textContent = 'Dieses GitHub-Konto hat keine Schreibrechte auf pkphysio.';
    } else {
      loginError.textContent = err.message || 'Unbekannter Fehler.';
    }
    showLogin();
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Mit Token anmelden';
    githubLoginBtn.disabled = false;
  }
}

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

githubLoginBtn.addEventListener('click', () => {
  const state = randomId();
  try { sessionStorage.setItem(LOGIN_STATE_KEY, state); } catch (e) {}
  window.location.href = LOGIN_URL.replace(/\/$/, '') + '/login?state=' + encodeURIComponent(state);
});

// Rückkehr von GitHub: Token steht im #-Teil der Adresse und wird sofort daraus entfernt
function takeLoginResult() {
  if (!window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('token');
  const error = params.get('error');
  if (!token && !error) return null;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  let expected = null;
  try {
    expected = sessionStorage.getItem(LOGIN_STATE_KEY);
    sessionStorage.removeItem(LOGIN_STATE_KEY);
  } catch (e) {}
  if (error) return { error: error === 'access_denied' ? 'Anmeldung bei GitHub abgebrochen.' : 'Anmeldung bei GitHub fehlgeschlagen.' };
  if (!expected || params.get('state') !== expected) return { error: 'Anmeldung konnte nicht bestätigt werden. Bitte erneut versuchen.' };
  return { token };
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
  tokenInput.value = '';
  showLogin();
});

const themeToggle = document.getElementById('themeToggle');
themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('light')));
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.setAttribute('aria-pressed', String(isLight));
  try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch (e) {}
});

if (!LOGIN_URL) {
  githubLoginBtn.style.display = 'none';
  tokenLogin.open = true;
}

(function () {
  const result = takeLoginResult();
  if (result && result.token) {
    verifyAndEnter(result.token);
    return;
  }
  if (result && result.error) {
    loginError.textContent = result.error;
    showLogin();
    return;
  }

  let token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
  if (token) {
    verifyAndEnter(token);
    return;
  }
  showLogin();
})();
