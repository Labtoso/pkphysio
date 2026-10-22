# Anmelde-Dienst für „Mit GitHub anmelden“

Das Admin-Panel liegt auf GitHub Pages und kann deshalb kein Geheimnis speichern. Der Tausch „Code von GitHub gegen Zugangs-Token“ braucht aber das Client Secret einer GitHub-App. Diesen Schritt übernimmt dieser kleine Cloudflare Worker (kostenlos). Das Secret liegt nur im Worker und nie im Repository.

Ablauf: Admin-Panel → Worker `/login` → GitHub fragt nach Erlaubnis → Worker `/callback` tauscht den Code → zurück ins Admin-Panel. Das Token steht im #-Teil der Adresse und wird dort sofort entfernt. Das Admin-Panel prüft dann wie bisher, ob das Konto Schreibrechte auf pkphysio hat.

## Einrichten

1. Worker veröffentlichen (im Ordner `anmelde-dienst`): `npx wrangler login`, danach `npx wrangler deploy`. Die Adresse notieren, z. B. `https://pkphysio-login.<name>.workers.dev`.
2. GitHub-App anlegen: github.com/settings/apps/new
   - GitHub App name: `pkphysio Admin`
   - Homepage URL: `https://labtoso.github.io/pkphysio/`
   - Callback URL: `<Worker-Adresse>/callback`
   - Webhook: „Active“ ausschalten
   - Repository permissions → Contents: **Read and write**
   - Where can this GitHub App be installed: **Only on this account**
   - Create GitHub App, dann „Generate a new client secret“
3. App installieren: in der App links „Install App“ → Labtoso → **Only select repositories** → pkphysio.
4. In Cloudflare beim Worker `pkphysio-login` → Settings → Variables and Secrets:
   - `GITHUB_CLIENT_SECRET` als **Secret** (das Client Secret der App)
   - Die Client ID kommt in `wrangler.toml` bei `GITHUB_CLIENT_ID` (nicht geheim), danach erneut `npx wrangler deploy`.
5. In `admin/script.js` bei `LOGIN_URL` die Worker-Adresse eintragen und pushen.

Ohne `LOGIN_URL` ist „Mit GitHub anmelden“ ausgegraut, „Mit Passwort und Token“ funktioniert immer.
