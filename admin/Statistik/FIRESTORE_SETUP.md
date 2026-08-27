# Statistik-Setup (Firebase / Firestore)

Diese Website hat kein eigenes Backend (GitHub Pages ist rein statisch),
deshalb braucht die Statistik-Funktion einen kleinen, kostenlosen
Datenspeicher im Hintergrund. Das ist **kein fertiges Analytics-Tool** –
das Tracking auf der Website und das Dashboard hier im Admin-Bereich sind
komplett selbst gebaut, Firebase liefert nur die Datenbank.

## Was wird gespeichert?

Ein Dokument pro Tag (`dailyStats/2026-08-27` z. B.), mit reinen Zählern:

```
{
  pageviews: 42,
  clicks: {
    phone_header: 3,
    phone_hero: 5,
    phone_kontakt: 2,
    instagram: 4,
    social_block: 1,
    cta_block: 0
  },
  updatedAt: <Zeitstempel>
}
```

Keine Cookies, keine IP-Adressen, keine Namen oder sonstige personenbezogene
Daten – nur Zähler pro Tag.

## Einrichtung (einmalig, ca. 5 Minuten)

1. Gehe auf **https://console.firebase.google.com** und melde dich mit
   deinem Google-Account an (z. B. dem, mit dem du hier eingeloggt bist).
2. **Projekt erstellen** (Name ist egal, z. B. "pkphysio-stats"). Google
   Analytics für das Firebase-Projekt kannst du dabei ablehnen/überspringen
   – wird hier nicht gebraucht.
3. Im Projekt: **Projekteinstellungen** (Zahnrad oben links) → Reiter
   **Allgemein** → ganz unten bei "Meine Apps" → **Web-App hinzufügen**
   (Symbol `</>`) → einen Namen vergeben → registrieren.
4. Es erscheint ein Code-Block mit einem `firebaseConfig`-Objekt
   (`apiKey`, `authDomain`, `projectId`, ...). Diese Werte brauche ich –
   schick sie mir, oder trag sie selbst in die Datei `firebase-config.js`
   im Hauptordner des Repos ein (ersetzt die `REPLACE_ME`-Platzhalter).
5. Im Menü links: **Firestore Database** → **Datenbank erstellen** →
   Standort egal (z. B. `eur3 (europe-west)`) → **Im Produktionsmodus
   starten**.
6. Im Firestore-Bereich → Reiter **Regeln** → den kompletten Inhalt dort
   ersetzen durch den Block unten → **Veröffentlichen**.

## Firestore-Regeln (genau so einfügen)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dailyStats/{date} {
      allow read: if true;
      allow create, update: if
        date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$') &&
        request.resource.data.keys().hasOnly(['pageviews', 'clicks', 'updatedAt']) &&
        (!('pageviews' in request.resource.data) || request.resource.data.pageviews is number) &&
        (!('clicks' in request.resource.data) ||
          request.resource.data.clicks.keys().hasOnly(
            ['phone_header', 'phone_hero', 'phone_kontakt', 'instagram', 'social_block', 'cta_block']
          )) &&
        request.resource.data.updatedAt == request.time;
      allow delete: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Was diese Regeln tun:** Jede:r darf Zähler in `dailyStats` erhöhen (nötig,
damit die Website ohne Login mitzählen kann) — aber nur mit einer
gültigen Datums-ID, nur diese drei Felder, und nur bekannte Klick-Namen.
Löschen ist komplett gesperrt. Lesen ist offen (nötig, damit das
Dashboard die Zahlen abrufen kann, ohne dass wir dafür extra einen
zweiten Login gegen Firebase bauen) — das sind aber wirklich nur
Zähler, keine sensiblen Daten.

## Bekannte Grenze

Da das Zählen ganz ohne eigenen Server läuft (nur über die
Firestore-Regeln abgesichert), könnte theoretisch jemand mit technischem
Aufwand die Zähler künstlich hochtreiben. Das ist bei jeder rein
client-seitigen, kostenlosen Lösung so (auch bei fertigen Tools wie
GoatCounter) — für die eigene, grobe Übersicht über Seitenaufrufe und
Link-Klicks ist das aber unproblematisch.

## Danach

Sobald `firebase-config.js` echte Werte hat, füllt sich `/admin/Statistik/`
automatisch mit echten Zahlen, sobald ein paar Tage Daten gesammelt wurden.
Am ersten Tag zeigt "Gestern"/"letzte Woche"/"letzter Monat" logischerweise
noch 0 an, weil es noch keine Vergleichsdaten gibt.
