# Statistik-Setup (GoatCounter)

Die Website zählt Seitenaufrufe und Klicks auf ein paar Links (Telefon,
Instagram, Social-Media-Icons, CTA-Bausteine) über **GoatCounter** —
ein kostenloses, datenschutzfreundliches Analytics-Tool (keine
Cookie-Banner nötig, keine personenbezogenen Daten). Das Dashboard hier
im Admin-Bereich (`/admin/Statistik/`) ist komplett selbst gebaut und
holt sich die Zahlen über die GoatCounter-API.

## Einrichtung (ca. 3 Minuten)

1. Gehe auf **https://www.goatcounter.com** → **Sign up** → kostenlosen
   Account erstellen (E-Mail reicht, kein Kreditkarte nötig).
2. Beim Erstellen der Site vergibst du einen **Site-Code**, z. B.
   `pkphysio` → die Website heißt dann `pkphysio.goatcounter.com`.
   Diesen Code brauchst du gleich zweimal (siehe unten).
3. Öffne `index.html` im Hauptordner des Repos und such die Zeile:
   ```html
   <script data-goatcounter="https://REPLACE_ME.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
   ```
   Ersetze `REPLACE_ME` durch deinen Site-Code (z. B. `pkphysio`).
4. In deinem GoatCounter-Dashboard: **Settings** → **API** → **New key**
   → Berechtigung **"Read stats"** reicht (kein Schreibzugriff nötig) →
   erstellen → den angezeigten Token kopieren (wird nur einmal
   angezeigt!).
5. Im Admin-Bereich auf `/admin/Statistik/` gehen → dort nach Site-Code
   (derselbe wie in Schritt 2/3) und dem eben erstellten API-Token
   fragen → "Verbinden".

Das Token wird **nirgends ins Repo geschrieben** — nur im Browser-Tab
gemerkt (wie das GitHub-Token beim Website-Editor). Nach dem Schließen
des Tabs ist es weg und muss beim nächsten Mal neu eingegeben werden.

## Was wird gezählt?

- Jeder Seitenaufruf (automatisch, durch das `count.js`-Script)
- Klicks auf: die drei Telefon-Buttons (Kopfzeile, Startbereich,
  Kontakt), den Instagram-Link, Social-Media-Icons (pro Plattform) und
  Buttons in Call-to-Action-Bausteinen — als "Events" markiert, per
  `data-goatcounter-click`-Attribut direkt im HTML, ganz ohne eigenes
  Tracking-JavaScript.

## Bekannte Grenzen

- Da alles rein clientseitig zählt, könnte jemand mit technischem
  Aufwand die Zahlen künstlich hochtreiben — gilt für jedes kostenlose,
  serverlose Tracking gleichermaßen.
- "Gestern" / "letzte Woche" / "letzter Monat" zeigen am Anfang
  logischerweise 0, solange noch keine Vergleichsdaten gesammelt wurden.
- Die kostenlose GoatCounter-Stufe hat ein Limit für Seitenaufrufe pro
  Monat (aktuell großzügig für eine kleine Praxis-Website) — reicht das
  irgendwann nicht mehr, gibt es günstige bezahlte Stufen.
