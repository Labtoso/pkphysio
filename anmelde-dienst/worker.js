// Anmelde-Dienst für das Admin-Panel (Cloudflare Worker).
// Tauscht den Code von GitHub gegen ein Zugangs-Token. Dafür braucht es das
// Client-Secret der GitHub-App, das deshalb nur hier als Worker-Secret liegt
// und nie im Repository.
//
// Einstellungen im Worker:
//   GITHUB_CLIENT_ID      Client ID der GitHub-App (Variable)
//   GITHUB_CLIENT_SECRET  Client Secret der GitHub-App (Secret)
//   ADMIN_URL             Adresse des Admin-Panels (Variable)

const NO_INDEX = { 'X-Robots-Tag': 'noindex, nofollow' };
const STATE_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

function backToAdmin(env, params) {
  const url = new URL(env.ADMIN_URL);
  url.hash = new URLSearchParams(params).toString();
  return redirect(url.toString());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/login') {
      const state = url.searchParams.get('state') || '';
      if (!STATE_PATTERN.test(state)) return new Response('Ungültige Anfrage', { status: 400, headers: NO_INDEX });
      const auth = new URL('https://github.com/login/oauth/authorize');
      auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      auth.searchParams.set('redirect_uri', url.origin + '/callback');
      auth.searchParams.set('state', state);
      return redirect(auth.toString());
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') || '';
      if (url.searchParams.get('error')) return backToAdmin(env, { error: 'access_denied' });
      if (!code || !STATE_PATTERN.test(state)) return backToAdmin(env, { error: 'invalid' });

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'pkphysio-anmeldung'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: url.origin + '/callback'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!data.access_token) return backToAdmin(env, { error: 'exchange' });
      return backToAdmin(env, { token: data.access_token, state });
    }

    return new Response('Nicht gefunden', { status: 404, headers: NO_INDEX });
  }
};
