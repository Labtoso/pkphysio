# Änderungen

Neueste Änderungen stehen oben.

## 29.10.2026 – Einheitliche Eckenrundung

### Geändert
- Alle Ecken auf der Website richten sich jetzt nach dem Regler „Eckenrundung“ im Website-Editor (aktuell 10 px). Vorher hatten Knöpfe, Sonne/Mond-Knopf, Menü-Knopf und die Auswahl bei „Termin vereinbaren“ fest 6 px und die FAQ-Einträge 8 px.
- Im Website-Editor, im Admin-Bereich und in der Statistik nutzen Knöpfe, Eingabefelder und Karten ebenfalls dieselbe Rundung.
- Runde Elemente (Porträtkreise, Punkte, Pillen-Knöpfe) bleiben rund.

### Entfernt
- Der zweite, kleinere Rundungswert (Eckenrundung minus 2 px) entfällt.

## 23.10.2026 – Impressum als Baustein

### Neu
- Website-Editor: Unter „Baustein hinzufügen“ gibt es in der neuen Gruppe „Rechtliches“ den Baustein „Impressum“. Er erscheint nicht auf der Startseite, sondern auf einer eigenen Seite `/impressum/` mit derselben Kopfleiste und demselben Design.
- Der Baustein startet mit einer Vorlage nach § 5 E-Commerce-Gesetz und § 25 Mediengesetz. Name, Adresse, Telefon und E-Mail kommen aus den Kontaktdaten, fehlende Angaben stehen in eckigen Klammern zum Ergänzen.
- Das Textfeld des Impressums kann zusätzlich Überschriften (H2, H3), dazu wie gewohnt Fett, Listen und Links.
- „Seite ansehen“ im Baustein öffnet das Impressum in einem neuen Tab.
- Im Footer steht neben „© Jahr Pascal Krieger“ ein Link „Impressum“, sobald der Baustein existiert.
- Die Impressum-Seite steht in der Sitemap.

### Geändert
- Das Impressum gibt es nur einmal. Wer es ein zweites Mal hinzufügt, landet beim vorhandenen Baustein.
- Ohne Impressum-Baustein leitet `/impressum/` auf die Startseite weiter.

## 23.10.2026 – Copyright mittig, ohne eigene Leiste

### Geändert
- Der Copyright-Hinweis steht jetzt mittig und hat keine eigene dunkle Leiste mehr. Er sitzt auf demselben Hintergrund wie der Kontakt-Bereich.

### Gefixt
- Der unsichtbare Link auf „Made by Sebastian“ lag nur auf dem kleinen ©. Jetzt ist der ganze Text „© Jahr Pascal Krieger“ klickbar.

## 23.10.2026 – Copyright unten auf der Seite

### Neu
- Ganz unten auf der Website steht jetzt „© <Jahr> Pascal Krieger“. Das Jahr stellt sich jedes Jahr von selbst um. Den Namen kann man im Website-Editor unter Kontakt → Kontaktdaten ändern.
- Ein Klick auf das © führt auf eine eigene Seite mit „Made by Sebastian“ groß in der Mitte. Der Link sieht aus wie normaler Text. Die Seite ist für Suchmaschinen gesperrt (`noindex`), steht nicht in der Sitemap, und der Link trägt `nofollow`.

## 23.10.2026 – Schnellnavigation entfernt, Rechtschreibung

### Entfernt
- Website-Editor: Die Leiste mit den Bereichsknöpfen (Design, SEO & Tab, Navigation …) unter der Kopfleiste ist weg, auch am Desktop. Die eingeklappten Bereiche und die Suche reichen als Übersicht.

### Gefixt
- Rechtschreibung auf der Website: „Wie viel“ statt „Wieviel“ (2× in den FAQ), „wiederherstellen zu können.“ statt „wieder herstellen zu können .“, „bestmöglich“ statt „bestmöglichst“, „20-jährigen“, „Therapieangebote“, „Sport-Physiotherapie“, „Langstrecken-Auto-/Motorradrennen“, „SVS-Versicherte“, „ÖGK- oder BVAEB-Versicherte“, „Physio-Einheit à 45 min“, fehlende Kommas („zielt darauf ab, die …“, „vor vielen Jahren, als …“, „Motorsport, speziell …“, „Was passiert, wenn …“), „zu trainieren und zu optimieren“ sowie Leerzeichen vor € und bei „45 min“ und „24 h“. Der Wortlaut bleibt sonst gleich.
- Website-Editor: „als klickbarer Link“ statt „als klickbaren Link“, deutsche Anführungszeichen, Zwischenüberschrift „Therapieangebote“, deutsche Standard-Commit-Nachricht.

## 23.10.2026 – Website-Editor aufgeräumt, Fehlersuche

### Geändert
- Website-Editor: Alle Bereiche starten eingeklappt als ruhige Liste. Ein Klick auf den Titel öffnet den Bereich (mit Tastatur: Enter oder Leertaste). „Ausblenden“ und „Entfernen“ erscheinen erst im geöffneten Bereich.
- Website-Editor: Weniger Rahmen und Flächen. Einträge in Listen haben keinen eigenen Hintergrund mehr, Zwischenüberschriften sind nicht mehr farbig, „Baustein hinzufügen“ ist ein schlichter gestrichelter Knopf statt eines runden Farbknopfs.
- Website-Editor am Handy: Die Kopfleiste ist nur noch zweizeilig (Titel und Knöpfe, darunter die Suche). „Abmelden“ ist dort ein Symbol, die Schnellnavigation entfällt, weil die eingeklappten Bereiche selbst die Übersicht sind.
- Website-Editor: Textfelder wachsen mit dem Inhalt. FAQ-Fragen und Zeitleisten-Beschreibungen werden nicht mehr abgeschnitten.
- Website-Editor: Dateiauswahl und das Feld „Eigene Schriftart hochladen“ sehen aus wie die übrigen Felder.
- Startseite am Desktop: Der obere Bereich steht jetzt bündig mit Logo und den übrigen Abschnitten.
- Admin-Anmeldung und Statistik am Handy: weniger Innenabstand, damit mehr Platz für Text bleibt.

### Gefixt
- Website-Editor: Aufzählungen aus Textfeldern mit Formatierung wurden beim Speichern als nummerierte Liste mit Hilfscode des Editors abgelegt. Sie werden jetzt wieder als normale Aufzählung gespeichert.
- Website-Editor: Textfelder mit Formatierung hatten keinen sichtbaren Rahmen.
- Website-Editor: Ein Speichern ohne Änderung an Titel oder Beschreibung legt keinen unnötigen Commit für `index.html` mehr an.
- Menü am Handy und Tablet: Nach einem Sprung lag die Überschrift halb unter der Kopfleiste. Sie steht jetzt mit etwas Abstand darunter.
- Menü am Handy: schließt jetzt auch mit Escape und bei einem Tipp neben das Menü.
- Statistik am Handy: Der Hinweis auf die Anleitung ragte über den Rand. Er ist jetzt ein Link zur Anleitung auf GitHub, weil die Datei selbst nicht mehr mit veröffentlicht wird.
- Besucherzählung: Das Zählskript wird ausdrücklich über https geladen.

## 23.10.2026 – „Mit GitHub anmelden“ freigeschaltet

### Neu
- Der Anmelde-Dienst läuft unter `https://pkphysio-login.anmelde-dienst.workers.dev`, die GitHub-App „pkphysio Admin“ ist eingerichtet. Der Knopf „Mit GitHub anmelden“ im Admin-Panel funktioniert jetzt.

## 23.10.2026 – Admin nicht in Suchmaschinen

### Geändert
- Die Admin-Seiten (Menü, Website-Editor, Statistik) sagen Suchmaschinen noch deutlicher, dass sie nicht aufgenommen, nicht zwischengespeichert und nicht als Vorschau gezeigt werden sollen (`noindex, nofollow, noarchive, nosnippet`, zusätzlich für Google).
- Auf der Website landen nur noch die Dateien, die sie braucht. Anleitungen (`*.md`), dieser Changelog, der Anmelde-Dienst und die Workflows werden nicht mehr mit veröffentlicht und können damit auch nicht gefunden werden.
- Der Anmelde-Dienst schickt bei jeder Antwort „nicht aufnehmen“ an Suchmaschinen.

### Geprüft
- Keine Seite der Website verlinkt auf das Admin-Panel, die Sitemap enthält nur die Startseite, und die Suche nach dem Admin-Pfad findet nichts.

## 22.10.2026 – Admin: Anmeldung wählen

### Neu
- Admin-Panel: Beim Öffnen wählt man zwischen „Mit GitHub anmelden“ und „Mit Passwort und Token“ (die bisherige Anmeldung). Beide sind gleichwertig, Zugang gibt es nur mit Schreibrechten auf pkphysio.
- „Andere Anmeldung wählen“ führt von Passwort und Token zurück zur Auswahl.

### Geändert
- Die Passwort-Abfrage ist wieder da, aber nur für den Weg über das Token.
- Solange der Anmelde-Dienst nicht eingerichtet ist, ist „Mit GitHub anmelden“ ausgegraut und mit Hinweis versehen.

## 22.10.2026 – Admin: Anmeldung mit GitHub

### Neu
- Admin-Panel: Knopf „Mit GitHub anmelden“. Kein Passwort und kein Token mehr nötig, nur das GitHub-Konto mit Schreibrechten auf pkphysio. Aktiv, sobald der kleine Anmelde-Dienst eingerichtet ist (`anmelde-dienst/ANLEITUNG.md`).
- Ordner `anmelde-dienst/` mit dem Cloudflare Worker, der die Anmeldung bei GitHub abschließt. Das Client Secret liegt nur dort, nie im Repository.

### Geändert
- Die Anmeldung mit Token gibt es weiter als Notlösung unter „Stattdessen mit Token anmelden“.
- Knöpfe übernehmen überall die Schrift der Seite und haben keinen grauen Standardrahmen mehr.

### Entfernt
- Die Passwort-Abfrage vor der Anmeldung.

## 22.10.2026 – Überschriften: Markierung nahtlos

### Gefixt
- Mehrzeilige Überschriften: Beim Markieren stoßen die Zeilen jetzt genau aneinander, ohne Überlappung und ohne Lücke. Die Zeilenhöhe wird im Browser auf die Höhe der Markierung gemessen, damit es auf jedem Gerät und jeder Bildschirmgröße passt (vorher fest 1,4, was unter Windows eine 1-Pixel-Lücke ließ). Schriftart und Schriftgröße unverändert.

## 22.10.2026 – Handy-Menü zügiger

### Geändert
- Größere Bewegungen (Handy-Menü, Auswahlfeld, FAQ, Einblenden) laufen jetzt in 0,3 s statt 0,45 s, mit sanftem Auslaufen (`--motion-slow: .3s cubic-bezier(.25, .8, .25, 1)`). Das Menü ist sofort da und kommt ruhig zum Stehen, klappt weiter unter der Kopfleiste auf.

## 22.10.2026 – Commits nur noch unter eigenem Namen

### Neu
- Automatische Commit-Prüfung bei jedem Push (GitHub Actions, „Commit-Prüfung“): schlägt Alarm, wenn ein Commit eine Co-authored-by-Zeile enthält oder nicht die GitHub-noreply-Adresse nutzt. So fällt sofort auf, falls jemand Fremdes als Mitautor eingetragen wird.

### Geändert
- Website-Editor: Speichern legt Commits jetzt immer mit der GitHub-noreply-Adresse des angemeldeten Kontos an, nie mit der privaten E-Mail.

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
