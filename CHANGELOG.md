# Änderungen

Neueste Änderungen stehen oben.

## 22.10.2026 – Termin-Auswahl mit Pfeil

### Geändert
- „Termin vereinbaren“ (oben in der Kopfleiste und im Startbereich) öffnet jetzt ein kleines Auswahlfeld mit Pfeil direkt unter dem Knopf: „Anrufen“ mit Telefonnummer oder „E-Mail schreiben“ mit Adresse.
- Das Auswahlfeld schließt bei Klick daneben, mit Escape oder erneutem Klick auf den Knopf. Am Handy passt es sich der Bildschirmbreite an.
- Website spricht Besucher durchgehend mit „Sie“ an.

### Entfernt
- Das große Fenster in der Bildschirmmitte mit „Wie möchtest du Kontakt aufnehmen?“.

## 22.10.2026 – Überschriften: Überlappung ganz weg

### Gefixt
- Zeilenabstand der Überschriften von 1,3 auf 1,4 erhöht. Die Markierung einer Zeile ist bei der Schrift Source Serif 4 genau 1,38 Zeilen hoch, ab 1,4 überlappt nichts mehr. Schriftgröße und Schriftart unverändert.

## 22.10.2026 – Überschriften ohne Überlappung

### Gefixt
- Mehrzeilige Überschriften (z. B. „Ich freue mich auf Ihre Nachricht“): Beim Markieren überlappen sich die Zeilen nicht mehr. Zeilenabstand der Überschriften von 1,15 auf 1,3 erhöht, Schriftgröße und Schriftart unverändert.

## 22.10.2026 – Handy-Menü ruhiger

### Geändert
- Das Handy-Menü öffnet und schließt langsamer und gleichmäßiger.
- Das Menü klappt jetzt unter der Kopfleiste auf und verschwindet beim Schließen auch wieder darunter, statt über die Leiste zu fahren.
- Größere Bewegungen (Menü, Popups, FAQ aufklappen, Einblenden beim Scrollen) nutzen eine gemeinsame, langsamere Geschwindigkeit `--motion-slow` (0,45 s). Kleine Hover-Effekte bleiben bei `--motion` (0,2 s).

### Neu
- Diese Änderungsliste (CHANGELOG.md).

## 22.10.2026 – Texte, Link-Vorschau, Animationen

### Neu
- Vorschaubild beim Teilen per WhatsApp oder E-Mail (`Assets/vorschau.jpg`) mit Logo, Name und Ort, dazu Titel und Beschreibung für die Link-Vorschau.
- Website-Editor: Feld „Vorschaubild beim Teilen“. Beim Speichern werden Seitentitel, Beschreibung und Vorschaubild auch in `index.html` geschrieben.
- FAQ-Antworten können Listen und mehrere Absätze enthalten.

### Geändert
- Texte von Über mich, Leistungen, Therapie Angebote und FAQ sind wieder wortgleich mit pkphysiotherapie.at.
- Alle Animationen laufen über eine gemeinsame Einstellung.

### Gefixt
- Menü-Knopf am Handy: Striche mittig, keine blaue Markierung beim Antippen.

## 22.10.2026 – Kopfleiste und Hell/Dunkel

### Neu
- Hell/Dunkel-Knopf mit Sonne/Mond direkt in der Kopfleiste, am Handy oben rechts neben dem Menü.

### Geändert
- Kopfleiste und Editor-Leisten haben einen deckenden Hintergrund statt Glas-Effekt.
- Knöpfe, Aufklapp-Felder, Galerie-Bilder usw. zeigen die Hand als Cursor.
- Handy-Menü: Links linksbündig über die ganze Breite.

### Entfernt
- Schiebeschalter für Hell/Dunkel.

## 22.10.2026 – Ruhigeres Design

### Neu
- Admin-Login prüft, ob das GitHub-Token Schreibrechte auf das Repository hat.

### Geändert
- Schriften: Source Serif 4 für Überschriften, Public Sans für Fließtext.
- Akzentfarbe nur noch für Hauptknöpfe und Schalter, dezentere Hover-Effekte.
- Admin-Menü und Login schlichter.

### Entfernt
- Fortschrittsbalken oben, Farbverlauf hinter dem Porträt, die meisten Schatten.
- Kleine Beschriftungen über den Abschnitts-Überschriften.
