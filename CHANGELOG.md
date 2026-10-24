# Änderungen

Neueste Änderungen stehen oben.

## 24.10.2026 – V2: Heimlicher Virus in Windows XP (Branch V2)

### Neu
- Nach dem Admin-Login schleicht sich in XP ein unechter Virus ein (`xp-virus.js`, Name jedes Mal anders, z. B. `rundl1.exe`). Nichts davon passiert am echten Computer, alles ist nur ein Spiel auf der Seite.
  - Anfangs merkt man nichts: Die Datei liegt versteckt zwischen den Systemdateien in `WINDOWS\system32`, und der Bildschirm verliert ganz langsam Farbe.
  - Nach 45 Sekunden flackern Desktop-Symbole, und auf dem Desktop taucht „hallo.txt“ auf.
  - Nach 2 Minuten erscheint ein rotes Warnsymbol im Infobereich, und Fenster zeigen kurz „(Keine Rückmeldung)“.
  - Nach 3½ Minuten kommen Fehlermeldungen des Virus.
  - Nach 5 Minuten übernimmt er den Computer mit schwarzem Bluescreen „SYSTEM_UEBERNOMMEN“ (geheimer Erfolg „Übernommen“, 100). Danach startet Windows neu, und der Virus ist weg.
- Task-Manager (Startmenü, Ausführen „taskmgr“ oder Eingabeaufforderung) mit den Registern Anwendungen, Prozesse und Systemleistung. Der Virus-Prozess braucht immer mehr CPU und Speicher.
- So hält man ihn auf: Seine Datei in system32 finden, löschen und den Papierkorb leeren, dann im Task-Manager den Prozess beenden. Solange die Datei noch existiert, startet er sofort neu. Geschafft gibt es den geheimen Erfolg „Virenfrei“ (250).
- Eingabeaufforderung kennt jetzt auch TASKMGR und TASKLIST.

### Geändert
- Preise angehoben, damit es weiter genau aufgeht: 32 Erfolge bringen 4160 Punkte, alles im Shop kostet 4160. Windows XP 800, Windows 98 530, MS-DOS und Game Boy je 480, Snake 350, Blasen-Jagd 310.
- Datei-Versionen auf `?v=24s`.

## 24.10.2026 – V2: Sauberer Retro-Mauszeiger (Branch V2)

### Geändert
- Der Pixel-Mauszeiger war grob und hässlich (doppelt große Pixel, ausgefranste Kanten). Neu sind pixelgenaue, klassische Zeiger wie bei Windows 98/XP: ein schwarz umrandeter weißer Pfeil (12 × 19 Pixel) und dazu die passende Hand über Links und Knöpfen. Beide sind scharf und ohne Unschärfe, und die Spitze sitzt genau auf dem Klickpunkt.
- Diese Zeiger gibt es beim gekauften Pixel-Mauszeiger und automatisch in Windows XP und Windows 98. In Textfeldern bleibt der normale Textcursor.
- Datei-Versionen auf `?v=24r`.

## 24.10.2026 – V2: Admin-Hinweis wieder rätselhafter (Branch V2)

### Geändert
- Der Kennworthinweis für das Administrator-Konto lautet jetzt „Weggeworfen ist nicht vergessen.“ statt den Papierkorb direkt zu nennen.
- Datei-Versionen auf `?v=24q`.

## 24.10.2026 – V2: Rätsel leichter (Branch V2)

### Geändert
- Zip-Rätsel: Die Tagebuch-Dateien heißen jetzt „Tag 1 (Datum).txt“, „Tag 2 …“ und stehen schon in der richtigen Reihenfolge. Die Täuschungs-Einträge sind weg. Die versteckte Notiz erklärt die ganze Regel direkt, man muss nicht mehr in den Eigenschaften suchen.
- Admin-Kennwort: Die Datei im Papierkorb enthält jetzt das verschlüsselte Kennwort und gleich die Regel zum Entschlüsseln. Der Kennworthinweis sagt „Schau in den Papierkorb (wecker.txt)“. Die Systemdatei erklärt auch, wie man volle Rechte bekommt.
- Geheimschrift: „favoriten.txt“ liegt sichtbar auf dem Desktop und nennt die Verschiebung direkt (1 bis 5 Stellen, mit Beispiel). Sie hängt nicht mehr vom Zip-Kennwort ab. Der Internet Explorer verweist auf die Datei.
- „LIES MICH.txt“ auf dem Desktop ist jetzt eine kurze Anleitung zu allen Rätseln.
- Alles wird weiterhin bei jedem Besuch neu ausgewürfelt.
- Datei-Versionen auf `?v=24p`.

## 24.10.2026 – V2: Erfolge überall sichtbar, XP-Taskleiste live (Branch V2)

### Neu
- XP-Taskleiste zeigt jedes offene Fenster als eigenen Knopf (Explorer, Editor, Minesweeper, Rechner, Eingabeaufforderung …). Neu geöffnete und geschlossene Fenster erscheinen und verschwinden sofort. Titel, zum Beispiel beim Navigieren im Explorer, ändern sich mit. Das vorderste Fenster ist hervorgehoben.
- Klick auf einen Taskleisten-Knopf holt das Fenster nach vorn, minimiert es, wenn es schon vorne ist, und holt minimierte Fenster zurück. Der Minimieren-Knopf in den Fenstern funktioniert.

### Geändert
- Erfolge werden immer und überall angezeigt: auch auf dem XP-Desktop nach „Escaped“ und über allen Fenstern, Spielen und dem Shop.
- Die Uhr in der Taskleiste aktualisiert sich jede Sekunde.
- Datei-Versionen auf `?v=24o`.

## 24.10.2026 – V2: Interne Testhilfe (Branch V2)

### Neu
- Interne Testhilfe.

## 24.10.2026 – V2: Kein Einfrieren mehr, normale Töne zurück (Branch V2)

### Gefixt
- Die Seite fror ein, wenn man oft auf Licht/Dunkel oder auf den Ton-Knopf klickte, und der Farbwechsel kam erst nach dem Neuladen. Ursache war eine Endlosschleife im XP-Teil: Ein Beobachter für Änderungen an der Seite hat bei jeder Änderung selbst wieder eine ausgelöst. Jetzt gehen 30 schnelle Klicks ohne Hänger durch (gemessen: längste Pause 100 ms).
- Schnelles Klicken auf den Ton-Knopf öffnete ungewollt das Thock-Spiel. Der geheime Zugang am Handy ist jetzt: Ton-Knopf eine Sekunde lang gedrückt halten. Auf dem Computer geht weiterhin „thock“ tippen.

### Geändert
- Tastatur-Klänge gibt es nur noch im Thock-Spiel und in Windows XP. Auf der restlichen Website kommen wieder die normalen Töne: Knöpfe ploppen hell, Links tropfen, FAQ mit Tropfen, Farbschema mit Glas, Erfolge mit aufsteigenden Plopps und Glas, „falsch“ mit zwei weichen Tropfen.
- Automatischer Rundgang durch alle Funktionen am Computer und am Handy (Erfolge, Shop mit allen Käufen, alle Spiele, Thock, Blasen, FAQ, Licht, Ton, XP mit Explorer, Desktop und Escape, Impressum, Made-by): keine Skriptfehler, keine Hänger über 200 ms.
- Datei-Versionen auf `?v=24m`.

## 24.10.2026 – V2: Töne in Zen und Firefox (Branch V2)

### Gefixt
- Hatte man den Ton einmal ausgeschaltet, zum Beispiel für den Erfolg „Warum höre ich nix“, blieb er dauerhaft aus. Jetzt ist der Ton bei jedem Besuch wieder an.
- Firefox und Zen geben Ton im Browser erst bei einer echten Aktion frei. Die Seite versucht das jetzt bei jedem Klick, Tippen und Tastendruck erneut, nicht nur beim allerersten.
- In Firefox (die Grundlage von Zen) über file:// geprüft: Die eingebetteten Aufnahmen laden, ein Knopf-Klick spielt Thock und Loslassen, eine Blase spielt den Plopp.
- Datei-Versionen auf `?v=24l`.

## 24.10.2026 – V2: XP-Desktop, „Escaped“ und neue Rätsel (Branch V2)

### Neu
- Rechtsklick auf die Website in der Taskleiste (oder auf die Kopfleiste) zeigt das Menü Wiederherstellen, Minimieren und Schließen. „Schließen“ schließt das Website-Fenster und gibt den geheimen Erfolg „Escaped“ (150). Ein Klick auf die Taskleiste oder auf das Desktop-Symbol „Pascal Krieger“ holt die Website zurück.
- XP-Desktop (`xp-desktop.js`) mit Symbolen: Arbeitsplatz, Eigene Dateien, Papierkorb, Internet Explorer, Editor, Rechner, Minesweeper, Eingabeaufforderung, Ordner „Privat“, „LIES MICH.txt“ und „Pascal Krieger“.
- Programme:
  - Minesweeper: 9 × 9 mit 10 Minen, Fahnen per Rechtsklick, Zeit und Smiley. Ein Sieg gibt „Minenräumer“ (150).
  - Rechner mit Grundrechenarten.
  - Eingabeaufforderung mit HELP, DIR, CLS, VER, DATE, TIME, ECHO, WHOAMI, START und EXIT.
  - Internet Explorer mit Fehlerseite und Favoriten.
  - Start > Ausführen (notepad, explorer, calc, winmine, cmd, iexplore …).
- Neue Rätsel, bei jedem Besuch neu ausgewürfelt und logisch lösbar:
  - Privat (200): Der Ordner auf dem Desktop ist mit einer Zahl geschützt. Die Formel steht in seinen Eigenschaften (Zusammenfassung): Anzahl der Dehnübungen × Sekunden beim Nacken + Termine der Rücken-Gruppe. Übungen, Sekunden und Termine in „Dehnübungen.txt“ und „Termine.txt“ ändern sich jedes Mal.
  - Geheimschrift (200): Ein Favorit im Internet Explorer ist verschlüsselt. Eine versteckte Datei auf dem Desktop erklärt die Regel: Jeder Buchstabe ist so weit verschoben, wie das Zip-Kennwort lang ist. Das entschlüsselte Wort (z. B. DEHNEN, ATMEN, STRECKEN) muss man bei Start > Ausführen oder in der Eingabeaufforderung eingeben. Das Rätsel baut also auf dem Zip-Rätsel auf.
- Alle 4 neuen Erfolge sind geheim.

### Geändert
- In XP gibt es oben rechts an der Website keine Fenster-Knöpfe mehr. Schließen geht nur noch per Rechtsklick.
- Preise angehoben, damit es weiter genau aufgeht: 30 Erfolge bringen 3810 Punkte, alles im Shop kostet 3810. Windows XP 700, Windows 98 480, MS-DOS und Game Boy je 430, Snake 300, Blasen-Jagd 260, Reaktionstest 200, Klick-Rekord 180.
- Datei-Versionen auf `?v=24k`.

## 24.10.2026 – V2: Töne funktionieren auch als Datei, Thock cremiger, Admin-Kennwort verschlüsselt (Branch V2)

### Gefixt
- Wurde die Seite direkt als Datei geöffnet (file://), blockierte der Browser das Nachladen der Ton-Dateien. Deshalb fehlte der Blasen-Plopp, und statt Thock kam nur der Ersatzklang. Alle Töne stehen jetzt eingebettet in `Assets/sounds/sounds-data.js` (92 KB) und funktionieren überall.

### Geändert
- Technisch geprüft in Chrome über file:// (welche Aufnahme bei welcher Aktion startet und wie tief bzw. hell sie ist):
  - Knöpfe und Links spielen eine normale Taste plus Loslassen (vorher die klappernde Rücktaste).
  - Die Tastatur-Aufnahmen waren sehr hell und klickig, nur etwa 1 % tiefe Anteile. Sie laufen jetzt durch einen Filter mit mehr Bass, weniger Mitten und ohne scharfe Höhen und etwas tiefer. Der tiefe Anteil ist dadurch rund 12-mal so hoch, der helle halbiert, das ist das cremige Thock. Loslassen ist leicht gedämpft.
  - Der Blasen-Plopp wurde bei großen Blasen zu tief abgespielt (dumpf wie eine Trommel). Jetzt läuft er immer zwischen 1,35- und 2-fach mit hellem Filter.
- Keine Töne mehr ohne eigenes Zutun: Darüberfahren, Auftauchen von Inhalten und Scrollen sind jetzt still.
- XP-Admin-Kennwort viel schwerer: Im Papierkorb steht die Uhrzeit nur noch verschlüsselt. Die Regel (jede Ziffer um 1 bis 3 weiterzählen, eventuell rückwärts lesen) wechselt bei jedem Besuch und steht in einer versteckten Systemdatei in `WINDOWS\system32`. Das Tagebuch verrät die Uhrzeit nicht mehr. Auch der Kennworthinweis ist vager.

## 24.10.2026 – V2: XP-Explorer, Tagebuch, Rätsel und Admin-Trick (Branch V2)

### Neu
- Windows XP hat einen funktionierenden Explorer (`xp-explorer.js`), zu öffnen über Startmenü > „Eigene Dateien“:
  - Menüs Datei, Bearbeiten, Ansicht, Extras und ?, Knöpfe Zurück, Vorwärts und Aufwärts, eine Adressleiste zum Eintippen von Pfaden (mit Fehlermeldung, wenn es den Pfad nicht gibt) und eine Statusleiste.
  - Linke Leiste umschaltbar zwischen Aufgaben und Ordnerbaum. Ansichten Symbole, Liste und Details, in Details nach Spalten sortierbar.
  - Rechtsklick-Menü, Umbenennen (auch F2), neuer Ordner, Löschen in den Papierkorb (auch Entf), Wiederherstellen und Papierkorb leeren.
  - Eigenschaften-Fenster mit Typ, Ort, Größe, Datum und Haken „Versteckt“, bei manchen Dateien mit der Registerkarte „Zusammenfassung“. Fenster lassen sich ziehen und maximieren.
  - Editor zum Lesen und Bearbeiten von Textdateien, Bildanzeige mit Vor und Zurück. Laufwerk C: mit Dokumente und Einstellungen, Programme und WINDOWS\system32.
- Extras > Ordneroptionen > Ansicht: „Ausgeblendete Dateien und Ordner anzeigen“ und „Geschützte Systemdateien ausblenden“. Erst damit tauchen versteckte und Systemdateien auf.
- Rätsel, bei jedem Seitenbesuch neu ausgewürfelt:
  - Ein verstecktes, unheimliches Tagebuch mit Einträgen unter zufälligen Dateinamen, also durcheinander. Die richtige Reihenfolge verraten nur die Daten in den Einträgen. Dazu kommen zwei Täuschungs-Einträge aus Oktober und Dezember.
  - Eine versteckte Notiz verrät nur die halbe Regel, der Rest steht im Kommentar der Eigenschaften von `fuer_dich.zip`.
  - Das Kennwort ist ein zufälliges Körperteil (Rücken, Nacken, Schulter, Muskel, Gelenk …), gebildet aus dem ersten Buchstaben des letzten Wortes jedes Novembereintrags. Wer es richtig eingibt, öffnet die Zip-Datei und kann `geheim.txt` lesen.
- Admin-Trick, ebenfalls jedes Mal neu (nur ein Spiel auf der Seite, ohne Verbindung zum echten Admin-Bereich):
  - Klick auf das Bild im Startmenü öffnet die Benutzerkonten. Das Administrator-Kennwort ist eine zufällige Uhrzeit, die nur in einer gelöschten Datei im Papierkorb steht. Der Hinweis „?“ ist absichtlich vage.
  - Nach der Anmeldung gibt es noch keine Rechte („Zugriff verweigert“). Dafür muss man in einer versteckten, englischen Richtlinien-Datei im Ordner „Bilder“ (Name und Schalter wechseln jedes Mal) beim Administrator den Schalter von `false` auf `true` ändern.
  - Erst dann öffnet sich die Systemsteuerung mit Bluescreen („DER_RUECKEN_IST_VERSPANNT“), Fehler-Regen, Erdbeben, Mauszeiger-Spur, +500 Punkte und Kopfstand.
- Weitere versteckte Hinweise: `desktop.ini`, `Thumbs.db` in einem versteckten Ordner und eine Systemdatei in `WINDOWS\system32`.
- 5 neue, geheime Erfolge: Ausgeblendet (100), Tagebuch (150), Entschlüsselt (250), Administrator (200), Bluescreen (100). Auch „Zeitreise“ ist jetzt geheim, also alles, was mit Windows zu tun hat.
- Shop: Artikel, die noch Erfolge freischalten können, leuchten golden und zeigen „+Punkte“.

### Geändert
- Preise angehoben, damit es wieder genau aufgeht: Alle 26 Erfolge bringen 3110 Punkte, alles im Shop kostet 3110. Windows XP 500, Windows 98 380, MS-DOS und Game Boy je 330, Röhrenbildschirm 140, Snake 250, Blasen-Jagd 210, Reaktionstest 150, Klick-Rekord 130.
- In allen Retro-Looks gibt es keine Blasen, kein Fluten, keine Tropfen und keinen Glitzer mehr. Die Blasen-Knöpfe sind dort ausgeblendet.
- Beim Beenden von XP schließen sich alle XP-Fenster, und Kopfstand wird zurückgesetzt.
- Datei-Versionen auf `?v=24i`.

## 24.10.2026 – V2: Shop-Text repariert (Branch V2)

### Gefixt
- Im Shop überlappten bei langen Namen („Röhrenbildschirm“, „Pixel-Mauszeiger“) Name und Preis bzw. „Benutzen“. Jetzt nimmt der Name den freien Platz, der Preis bleibt rechts daneben und wird nie überdeckt. Die Kacheln sind etwas breiter.
- Am Handy steht der Shop in einer Spalte (Name links, Preis rechts), so wird kein Wort mitten drin getrennt.
- Datei-Versionen auf `?v=24g`, damit der Browser sicher die neuen Preise und den neuen Stil lädt.

## 24.10.2026 – V2: Shop teurer, Erfolge geben mehr Punkte (Branch V2)

### Geändert
- Alles im Shop ist teurer, besonders die Spezial-Sachen:
  - Farben je 40.
  - Modi: Disco 80, Schwerkraft 70, Spiegel 60, Röhrenbildschirm 90, Pixel-Mauszeiger 50.
  - Töne: Tiefes Thock 50, Helles Clack 50, Retro-Piepser 70.
  - Spiele: Blasen-Jagd 150, Thock-Spiel 60, Snake 180, Reaktionstest 120, Klick-Rekord 90.
  - Retro: Windows XP 300, Windows 98 250, MS-DOS 220, Game Boy 220.
- Erfolge geben dafür mehr Punkte (40 bis 220). Alle 21 Erfolge zusammen ergeben genau 2310 Punkte, und alles im Shop kostet zusammen genau 2310. Mit allen Erfolgen kann man also alles kaufen.
- „Großverdiener“ verlangt jetzt 1000 statt 150 gesammelte Punkte.

## 24.10.2026 – V2: Größerer Shop, drei neue Spiele, mehr Retro, mehr Erfolge (Branch V2)

### Neu
- Retro-Looks im Shop (immer nur einer aktiv, „Modern“ ist der Standard):
  - Windows 98 (50): Petrol-Desktop, graue 3D-Knöpfe, Fenster mit dunkelblauer Titelleiste, graue Kugeln.
  - MS-DOS (45): schwarzer Bildschirm, grüne leuchtende Schreibmaschinen-Schrift, Logo als `C:\PK> _` mit blinkendem Cursor, Kugeln als grüne Kreise.
  - Game Boy (45): vier Grüntöne, Pixel-Schrift „Press Start 2P“ (lädt erst beim Kauf), eckige Kugeln und Bilder in Game-Boy-Grün.
  - Windows XP (60) gehört jetzt in diese Gruppe.
- Neue Modi: Röhrenbildschirm (30, Bildzeilen, Flimmern und dunkle Ecken über allem), Pixel-Mauszeiger (15).
- Neue Spiele:
  - Snake (50): Pfeiltasten oder WASD, am Handy ein Steuerkreuz. Futter sind Glasblasen.
  - Reaktionstest (30): Man wartet, bis es grün wird, und drückt dann. Es zählt die Bestzeit und zeigt die letzten 5 Zeiten. Wer zu früh drückt, sieht „Zu früh!“.
  - Klick-Rekord (20): 5 Sekunden lang so oft wie möglich drücken, mit Zeitbalken und Klicks pro Sekunde.
- 10 neue Erfolge mit Tipps (jetzt 21, davon weiterhin 3 geheim): Shopping-Tour (10), Großverdiener (20, 150 Punkte), Zeitreise (15, Retro-Look), Schlangenbeschwörer (30, 20 in Snake), Blitzschnell (30, unter 250 ms), Klick-Monster (25, 8 Klicks pro Sekunde), Blasen-Jäger (30, 30 Blasen in der Blasen-Jagd), Cheat-Code (40, Konami-Code ↑↑↓↓←→←→BA), Regenbogen (30, alle Farben), Nachteule (20, Besuch zwischen 0 und 4 Uhr).

### Geändert
- Wechselt man in einer Gruppe (Farbe, Töne, Retro), wird das vorher Aktive sauber ausgeschaltet. Beim Wechsel weg von XP erklingt zum Beispiel das Herunterfahren und die Taskleiste verschwindet.
- Datei-Versionen auf `?v=24f`.

## 24.10.2026 – V2: Windows XP richtig alt, mit Maus-Klicks, alter Tastatur und Systemklängen (Branch V2)

### Neu
- Taskleiste unten mit grünem „start“-Knopf, Fenster-Schaltfläche, Infobereich und Uhr. Das Startmenü hat den Kopf „Besucher“, Links zu den Bereichen sowie Erfolge, Shop, Thock und „Abmelden“ (beendet XP).
- Die Kopfleiste wird zur Fenster-Titelleiste mit Minimieren, Maximieren und Schließen. Schließen beendet XP, die anderen beiden machen einen Fehlerton.
- Karten haben Fenster-Knöpfe in der blauen Titelleiste. Erfolge, Shop und Thock-Spiel öffnen sich als XP-Fenster, Erfolge erscheinen als gelbe Sprechblase. Dazu kommen klassische blaue Bildlaufleisten.
- Thock-Spiel in XP: uralte, beige Bürotastatur mit dicken Tastenkappen und Schreibmaschinen-Schrift. Sie klingt nach einer alten, klackernden Tastatur („MX Blue – Full Travel“ aus Mechvibes, MIT).
- Klicks klingen in XP nach einer echten alten Maus (Drücken und Loslassen, „Middle Mouse Click“ von 1j01, OpenGameArt, CC0).
- Eigene, nachempfundene XP-Systemklänge (keine Originaldateien): Hochfahren beim Einschalten, Herunterfahren beim Beenden, Fehlerton bei zu wenig Punkten und bei Minimieren/Maximieren.

### Geändert
- In XP gibt es keine ASMR-Töne mehr (kein Thock, kein Plopp), nur Maus-Klicks, die alte Tastatur und die Systemklänge.
- In XP ist alles Moderne aus: kein Glas, kein Glitzer, keine aufsteigenden Blasen, kein Mausschein, keine Wellenlinien, keine Feder-Animationen. Die Blasen oben sehen aus wie alte, blaue Bildschirmschoner-Kugeln.
- Datei-Versionen auf `?v=24e`.

## 24.10.2026 – V2: Erfolge-Knopf, Punkte und Shop (Branch V2)

### Neu
- Neben dem Logo gibt es zwei runde Knöpfe: Pokal (Erfolge-Liste) und Tasche (Shop). Am Pokal zeigt ein Abzeichen die Punkte, die man gerade ausgeben kann.
- Erfolge geben Punkte: 10 bis 25 für normale, 40 bis 50 für geheime, zusammen 250. Die Punkte stehen beim Erfolg-Hinweis („+25 Punkte“) und in der Liste neben jedem Erfolg.
- Shop (`shop.js`), alles gilt nur für diesen Seitenbesuch:
  - Farben: Lila, Pink, Gold, Ozean, Feuerrot (je 15) oder zurück zu Teal. Ändert die Akzentfarbe der ganzen Seite.
  - Modi: Disco-Modus (30, Hintergrund wechselt durch alle Farben), Schwerkraft für Blasen (25, Blasen fallen und springen am Boden), Spiegel-Modus (20, Seite gespiegelt). Lassen sich ein- und ausschalten.
  - Spiele: Blasen-Jagd (40, 20 Sekunden lang so viele Blasen wie möglich platzen lassen, mit Zeit und Zähler oben) und das Thock-Spiel (10, öffnet es direkt).
  - Töne: Tiefes Thock, Helles Clack (je 15), Retro-Piepser (20) oder zurück zu Cremig.
  - Windows XP (60): blaue XP-Kopfleiste, grüner Start-Knopf, Bliss-Hintergrund mit Himmel und grünem Hügel, Karten als XP-Fenster mit blauer Titelleiste, Tahoma-Schrift und eine kleine Start-Melodie.
- Zu wenig Punkte: Der Artikel wackelt und brummt. Gekaufte Artikel zeigen „Aktiv“ oder „Benutzen“.

### Gefixt
- Die Glasblase hinter den Bereichs-Überschriften war seit dem Leistungs-Umbau eckig (das waren die Quadrate). Sie ist wieder rund.

## 24.10.2026 – V2: Keine Trommel-Klänge mehr bei den Blasen (Branch V2)

### Geändert
- Blasen klingen nur noch nach dem echten Plopp und immer hell. Platzen wird nie tiefer als die Originalaufnahme, Aufprall an Rand und aneinander ist ein ganz leiser, hoher Plopp, und Anfassen ist ein kleiner Plopp.
- Datei-Versionen an Stil und Skripten (`?v=24c`), damit der Browser sicher die neuen Dateien lädt und keine alten aus dem Zwischenspeicher.

### Entfernt
- Alle im Browser erzeugten Klänge bei den Blasen: Squish, Unsquish, Whoosh und die tiefen Aufprall-Töne. Lädt der Plopp noch, bleibt es still, statt einen Ersatzklang zu spielen.

## 24.10.2026 – V2: Fluten über den ganzen Bildschirm, Riesenblase (Branch V2)

### Geändert
- „Fluten“ flutet jetzt den ganzen Bildschirm: Wasser mit Wellenkante steigt von unten auf, schwappt kurz, und Dutzende Glasblasen steigen auf (70, am Handy 34). Danach läuft das Wasser wieder ab. Dazu blubbert es, am Ende rauscht es ab. Der Erfolg „Land unter“ bleibt.
- „Große Blase“ lässt eine Riesenblase aufsteigen, viel größer als alle normalen (bis 680 Pixel breit, am Handy bis 340). Sie kommt auch, wenn schon viele Blasen da sind, und schiebt die anderen beiseite.

## 24.10.2026 – V2: Erfolge-Liste, Blasen-Knöpfe, keine Quadrate (Branch V2)

### Neu
- Ein Klick auf einen Erfolg öffnet die Liste aller Erfolge dieses Besuchs mit Zähler (z. B. 2 / 11). Freigeschaltete Erfolge leuchten golden mit Pokal, noch gesperrte zeigen ein Schloss und einen Tipp, wie man sie bekommt.
- 11 Erfolge, davon 3 geheim (in der Liste als „???“ bis zum Freischalten):
  - Flashbangt (helles Farbschema), Warum höre ich nix (Ton aus), Plopp (eine Blase platzen lassen), Blasen-Profi (10 Blasen), Weitwurf (Blase schnell werfen), Land unter (Startbereich fluten), Wissbegierig (jede FAQ-Frage öffnen), Ganz unten (bis ganz nach unten scrollen).
  - Geheim: Thock (geheimes Spiel öffnen), Tipp-Maschine (5 Wörter in Folge im Spiel), Disco (Farbschema ganz oft hintereinander wechseln).
- Knöpfe unten im Startbereich für die Blasen: „Fluten“ füllt den Bereich mit Blasen, die von unten aufsteigen (höchstens 28, am Handy 16). „Große Blase“ lässt eine riesige Blase aufsteigen. „Alle löschen“ lässt alle Blasen nacheinander platzen, neue kommen erst nach einigen Sekunden.
- Zusätzliche Blasen aus „Fluten“ und „Große Blase“ verschwinden nach dem Platzen ganz.

### Geändert
- Aus dem Erfolg sprühen runde Glasbläschen statt eckiger Konfetti-Stücke.

### Entfernt
- Die eckigen Konfetti-Quadrate.

## 24.10.2026 – V2: Echte Tastatur-Aufnahmen und echter Blasen-Plopp (Branch V2)

### Neu
- Echte Aufnahmen einer cremigen, geschmierten Tastatur („Full Creamy Goodness“ aus dem Projekt Mechvibes, Lizenz MIT). Es gibt je eine eigene Aufnahme für Drücken pro Tastenreihe, für Loslassen sowie für Leertaste, Enter und Rücktaste.
- Echter Blasen-Plopp („bubbles 'pop'“ von farfadet46, OpenGameArt, CC0). Große Blasen ploppen tiefer, kleine höher.
- `Assets/sounds/QUELLEN.txt` mit Herkunft und Lizenztext der Aufnahmen. Alle Töne zusammen sind 32 KB groß.
- Die Aufnahmen werden beim ersten Klick oder Tastendruck geladen und auf gleiche Lautstärke gebracht.

### Geändert
- Das Thock-Spiel, die Knöpfe, Links, FAQ, der Farbschema-Knopf und die Erfolgs-Fanfare nutzen die echten Tastatur-Aufnahmen.
- Platzen, Antippen, Aufprall und das Aufsteigen der Blasen nutzen den echten Plopp statt Trommel-Klängen.
- Solange die Aufnahmen noch laden, springt der im Browser erzeugte Klang ein.

## 24.10.2026 – V2: Blase zerplatzt an Ort und Stelle, Erfolge einmal pro Besuch (Branch V2)

### Geändert
- Blasen im Startbereich zerplatzen jetzt selbst: Die Haut wabert kurz, dehnt sich und reißt auf. Ein heller Ring breitet sich als Druckwelle aus, Fetzen der Blasenhaut fliegen als Lichtbögen weg, und Spritzer sprühen nach außen und fallen leicht nach unten. Größere Blasen machen mehr Spritzer.
- Erfolge kommen nur einmal pro Seitenbesuch. Nach dem Neuladen kann man sie wieder freischalten.

### Entfernt
- Das Zerfallen in kleinere Blasen, die herausfliegen.

## 24.10.2026 – V2: Viel flüssiger, zwei Erfolge, Thock-Spiel mit mehr Glas (Branch V2)

### Neu
- Erfolg „Flashbangt“: Beim Wechsel ins helle Farbschema blitzt der Bildschirm weiß auf, und unter der Kopfleiste fällt eine Glas-Pille herein. Sie zeigt einen goldenen Pokal, der sich hineindreht, Konfetti, einen Glanzstreifen und einen Balken, der voll läuft. Dazu spielt eine Fanfare aus Tastenanschlägen.
- Erfolg „Warum höre ich nix“: kommt im gleichen Stil, wenn man den Ton ausschaltet, ohne weißen Blitz.
- Thock-Spiel: Jeder Tastendruck schickt eine Welle über die Nachbartasten, und kleine Glastropfen steigen aus der Taste auf. Ein geschafftes Wort lässt alle Buchstaben nacheinander springen, über die ganze Tastatur läuft eine Welle, und große Glastropfen sprühen aus dem Wort. Ab 2 Wörtern in Folge steigt eine Anzeige „Serie ×N“ auf. Zahlen springen bei jeder Änderung, ein falscher Buchstabe lässt das Panel kurz zucken. Hinter dem Spiel schweben flüssige Glas-Blobs, über das Panel wandert eine Lichtkante.

### Geändert
- Mit gedrosselter CPU gemessen: Beim Scrollen läuft V2 jetzt mit 44 statt 14 Bildern pro Sekunde.
- Der Hintergrund steht still. Was sich hinter Glas bewegt, zwingt den Browser, die Unschärfe in jedem Bild neu zu rechnen.
- Glitzer, aufsteigende Blasen und Mausschein liegen vor dem Inhalt und unterhalb der Kopfleiste.
- Karten, FAQ, Kontakt und Karte haben keine echte Unschärfe mehr. Dahinter liegt nur ein weicher Verlauf, darum sieht es fast gleich aus. Echte Unschärfe gibt es nur noch an der Kopfleiste, im Handy-Menü, im Spiel und bei den Erfolgen.
- Glanzstreifen laufen über transform statt über die Position. Pulsierende Schatten und wandernde Farbverläufe in Schrift und Knöpfen sind still gestellt, die Farben bleiben.
- Bereiche außerhalb des Bildschirms werden nicht gezeichnet.
- Weniger Glitzer (10) und aufsteigende Blasen (5), beides ohne große Schatten. Die Blasen im Startbereich haben keinen äußeren Schatten mehr und verformen sich nur noch über transform.
- Blasen im Startbereich bleiben unter der Kopfleiste, es gibt höchstens 28 gleichzeitig (am Handy 16).

### Entfernt
- Bewegung der Lichtflecken, der Aurora und das Mitgehen mit der Maus im Hintergrund.

## 24.10.2026 – V2: Cremiges Thock überall (Branch V2)

### Geändert
- Tastatur-Klang neu wie bei einer geschmierten (prelubed) Linear-Tastatur: tiefer, runder Kern, hohles Gehäuse, gedämpfter Anschlag ohne kratzige Höhen, kein Feder-Ping. Große Tasten klingen tiefer und weich gedämpft statt klappernd. Beim Loslassen kommt ein leiser, runder Tock.
- Alle Töne der Seite nutzen jetzt dieses cremige Thock: Knöpfe, Links, FAQ auf und zu, Farbschema (wie eine Leertaste), Blasen platzen und zerfallen, Aufprall, Darüberfahren und Scrollen (ganz leise), Richtig und Falsch im Spiel.
- Zu jedem Drücken folgt kurz danach der Loslass-Tock, wie bei einer echten Taste.

## 24.10.2026 – V2: Kein Ruckeln mehr, ruhigere FAQ (Branch V2)

### Geändert
- FAQ ruhiger: Einträge hüpfen, wackeln und schwabbeln nicht mehr. Beim Darüberfahren wird der Eintrag nur sanft heller. Aufklappen gleitet gleichmäßig ohne Nachfedern, die Antwort blendet weich ein, das Plus dreht sich ruhig zum Kreuz.
- Glas etwas weniger stark verwischt (16 statt 28 Pixel), sieht fast gleich aus, rechnet aber deutlich weniger.
- Die Aurora im Hintergrund dreht sich jetzt über die Grafikkarte statt neu gezeichnet zu werden.
- Regenbogen-Ränder stehen still und drehen sich nur beim Darüberfahren.
- Weniger Glitzer (16 statt 28) und weniger aufsteigende Blasen (8 statt 14).
- Mausschein, Hintergrund-Bewegung und Scroll-Balken werden direkt am Element bewegt statt über Werte an der ganzen Seite.
- Inhalte und Wörter tauchen ohne Unschärfe-Filter auf, nur mit Bewegung und Einblenden.

### Entfernt
- Das Farbwechseln über den ganzen Hintergrund (Farb-Filter auf dem ganzen Bildschirm).
- Die flüssige Verzerrung der Lichtflecken (SVG-Filter), sie war der größte Leistungsfresser.
- Das dauernde Verformen von Karten, Portrait und Kontaktdaten.
- Die echte Unschärfe hinter beweglichen Blasen, Tropfen und Überschriften-Blasen. Der Glas-Look bleibt über Glanz und Ränder.
- Der Schatten-Filter am Namen und an den Wellenlinien.

## 24.10.2026 – V2: Geheimes Tastatur-Spiel, Wasser-Töne, flüssigere Animationen (Branch V2)

### Neu
- Geheimes Spiel „Thock“ (`thock.js`): Eine Glas-Tastatur mit deutschem Layout erscheint. Jeder Tastendruck drückt die passende Kappe sichtbar nach unten und macht ein tiefes, gedämpftes Thock, beim Loslassen ein leichtes Clack. Große Tasten wie Leertaste, Enter und Shift klingen tiefer und klappern leise nach. Der Klang kommt je nach Position der Taste von links oder rechts.
- Im Spiel erscheinen Wörter aus der Physiotherapie, die man abtippt. Die nächste Taste leuchtet vor. Richtig wird Teal mit Ding, falsch wird rot mit Wackeln. Es zählt Wörter, Serie, Tippgeschwindigkeit (WPM) und den Rekord, der gespeichert bleibt. Am Handy tippt man direkt auf die Tasten.
- So öffnet man das Spiel: auf der Startseite irgendwo „thock“ tippen, oder den Ton-Knopf oben 5-mal schnell hintereinander drücken. Schließen mit Esc, mit dem × oder mit einem Klick daneben.
- Wörter im Startbereich gleiten einzeln aus der Unschärfe herein.
- Zwischen den Bereichen zeichnet sich eine leuchtende Wellenlinie selbst, sobald man hinscrollt.
- Hinter jeder Bereichs-Überschrift schwebt eine flüssige Glasblase.
- Das Portrait öffnet sich als Kreis aus der Mitte.
- „Mehr erfahren“ füllt sich beim Darüberfahren mit einer Welle.
- Die Titel der Kontaktdaten unterstreichen sich beim Darüberfahren.
- Navigation und Knöpfe in der Kopfleiste springen beim Laden nacheinander herein.

### Geändert
- Töne: Statt Trommel-Klängen jetzt Wassertropfen und Glas. FAQ öffnen: drei aufsteigende Tropfen mit einem Hauch und leisem Glas. FAQ schließen: zwei sinkende Tropfen mit einem weichen Fwump. Links: ein Tropfen. Farbschema: ein Weinglas. Knöpfe: Tastatur-Thock. Platzen: zusätzlich feine Tropfen.
- Alle Töne laufen weicher (tieferer Filter) und mit etwas mehr Raum.
- Die Lichtflecken im Hintergrund wabern wie Flüssigkeit und folgen der Maus ein Stück.
- Der Lichtschein unter der Maus gleitet weich hinterher.
- Glaskarten wabern ganz leicht an den Ecken, FAQ-Einträge schwabbeln beim Darüberfahren.

## 24.10.2026 – V2: ASMR-Töne, Blasen zerfallen, alles bounciger (Branch V2)

### Neu
- Große Blasen im Startbereich zerfallen beim Platzen in 2 bis 4 kleinere Blasen, die nach außen schießen. Die kleinsten zerplatzen in Spritzer. Kleine Blasen bleiben, bis man sie platzen lässt, die großen kommen von unten neu.
- Neue Töne: Zerfallen mit tiefem Plopp, jede neue kleine Blase mit eigenem Plip, Anfassen mit Squish, Loslassen mit Unsquish, Werfen mit Whoosh, Antippen mit Glas-Ting, Aufprall an Rand und aneinander mit Gummi-Boop und Klopfen, neue Blasen steigen mit Plip-Plip-Plip auf. Kleinere Blasen klingen höher.
- Beim Scrollen rastet es ganz leise wie ein Drehrad, beim Auftauchen von Inhalten macht es leise Plip.
- Kopfleiste fällt beim Laden von oben herein und federt nach. Name und Überschriften landen gestaucht und federn aus.
- Lebenslauf und Angebots-Listen springen Punkt für Punkt herein.

### Geändert
- Alle Töne neu im ASMR-Stil: nah, weich und knackig statt Pieptöne. Klick klingt wie eine Tastatur (Thock), Links wie ein Lippen-Plopp, FAQ wie Holz, Farbschema wie ein Glas. Alles läuft durch einen weichen Filter mit kleinem Raumhall.
- Bounce überall stärker: Federn schwingen mehrmals nach (Auftauchen, Knöpfe, Navigation, Karten, FAQ, Plus-Zeichen).
- Knöpfe quetschen sich beim Drücken zusammen und springen zurück. Die Pille über dem Namen hüpft regelmäßig mit Stauchen.
- Karten und geöffnete FAQ wippen einmal durch.
- Blasen prallen fast ohne Verlust ab, quetschen sich stärker und schwabbeln nach.
- Aufsteigende Glasblasen wackeln stärker.

## 24.10.2026 – V2: Töne, Bounce, spielbare Blasen, Anmelden ohne Passwort (Branch V2)

### Neu
- Klick-Töne im ASMR-Stil, direkt im Browser erzeugt (keine Sounddateien): Klick bei Knöpfen, Plopp bei Links, Glockenspiel beim Farbschema, Auf- und Zu-Ton bei den FAQ, leises Blubbern beim Darüberfahren.
- Ton-Knopf mit Lautsprecher neben dem Farbschema-Knopf. Die Wahl bleibt gespeichert.
- Im Startbereich schweben Glasblasen, die man anfassen kann: ziehen, herumschieben und werfen. Sie prallen von den Rändern und voneinander ab und verformen sich dabei. Antippen lässt eine Blase mit Spritzern und Knall-Ton platzen, kurz darauf steigt eine neue von unten auf.
- Über die ganze Seite steigen kleine Glasblasen auf und wackeln dabei.
- Beim Klicken breitet sich an der Stelle ein Wassertropfen aus.
- Knöpfe, Navigation und FAQ wackeln beim Drücken wie Wackelpudding.
- Knöpfe ziehen sich am Computer leicht zur Maus hin.
- Admin: Neuer Knopf „Ohne Passwort anmelden“. Damit kann man den Website-Editor ohne Passwort und Token öffnen und alles ansehen. Speichern ist dabei gesperrt, dafür braucht es weiter die Anmeldung mit GitHub oder mit Passwort und Token.

### Geändert
- Inhalte springen beim Auftauchen mit Federung und leichter Drehung herein.
- Knöpfe springen beim Darüberfahren hoch, die Knöpfe im Startbereich hüpfen ab und zu von selbst, „Termin vereinbaren“ atmet mit einem Schein.
- Das Logo hüpft ab und zu, Navigationspunkte federn, der Ton-Knopf kippt beim Darüberfahren.
- Portrait und Kontaktdaten verformen sich langsam wie flüssiges Glas.
- Karten neigen sich stärker und federn zurück.
- FAQ-Antworten springen beim Öffnen herein, Einträge federn beim Darüberfahren.
- Lebenslauf, Angebote und Kontaktdaten rutschen beim Darüberfahren federnd zur Seite.
- Überschriften wippen leicht.

### Entfernt
- Die zwei festen Glaskugeln im Startbereich, an ihrer Stelle sind jetzt die beweglichen Blasen.

## 24.10.2026 – V2: Mehr Glas, viel mehr Bewegung (Branch V2)

### Neu
- Zwei schwebende Glaskugeln im Startbereich mit Spiegelung und Lichtkante.
- Um Kopfleiste, Karten, Portrait, Kontaktdaten, Karte und offene FAQ läuft ein Regenbogen-Rand im Kreis.
- Kleine Glitzerpunkte funkeln und steigen über die ganze Seite.
- Am Computer folgt ein weicher Lichtschein der Maus. Karten neigen sich in 3D zur Maus und tragen einen eigenen Lichtpunkt.
- Ganz oben zeigt ein leuchtender Farbbalken, wie weit man gescrollt hat.
- Name und Überschriften laufen in einem wandernden Farbverlauf von Teal über Cyan und Violett bis Pink.
- Die Pille über dem Namen pulsiert, sie und alle Knöpfe haben einen durchlaufenden Glanzstreifen.
- Die Punkte im Lebenslauf pulsieren nacheinander.
- Neue Datei `fx.js` für Mausschein, Neigung, Glitzer und Scroll-Balken.

### Geändert
- Der Hintergrund hat mehr und schnellere Lichtflecken, eine sich drehende Aurora und wechselt langsam durch alle Farben.
- Inhalte tauchen von unten auf, zuerst unscharf und kleiner, Karten nacheinander.
- „Termin vereinbaren“ hat einen wandernden Teal-Cyan-Verlauf, Knöpfe wachsen und leuchten beim Darüberfahren.
- Das Glas ist stärker verwischt und farbsatter.
- FAQ-Einträge rutschen beim Darüberfahren zur Seite, das Plus dreht sich mit Federung zum Kreuz und wird Teal.
- Der Farbschema-Knopf dreht sich beim Darüberfahren.
- Bei „Bewegung reduzieren“ im System bleiben alle Animationen aus.

## 24.10.2026 – V2: Neues Design im Liquid-Glass-Stil (Branch V2)

### Neu
- Hinter der ganzen Seite liegen weiche, langsam treibende Lichtflecken in Teal, Blau und Orange. Bei „Bewegung reduzieren“ im System stehen sie still.
- Kopfleiste, Karten, FAQ, Portrait, Kontaktdaten, Karte und das Kontakt-Menü sind durchscheinende Glasflächen mit Unschärfe, hellem Rand und Lichtkante oben.
- Die Kopfleiste schwebt als abgerundete Glas-Pille mit Abstand zum Rand. Das Handy-Menü klappt als eigene Glaskarte darunter auf.
- Die Zeile über dem Namen im Startbereich steht in einer kleinen Glas-Pille.
- Die gleichen Lichtflecken liegen auch hinter dem Impressum und der Seite „Made by Sebastian“.

### Geändert
- Alle Knöpfe sind Pillen. „Termin vereinbaren“ hat einen Glanz von oben und einen leichten Schein in der Praxisfarbe, „Mehr erfahren“ ist aus Glas.
- Die Bereiche wechseln nicht mehr zwischen zwei Hintergründen, alles liegt auf demselben Glas-Hintergrund.
- Ecken sind runder. Der Rundungs-Regler im Website-Editor wirkt weiter, die Glasflächen rechnen von ihm aus.
- Navigationspunkte bekommen beim Darüberfahren und im aktiven Bereich eine Glas-Pille statt einer Unterstreichung.
- Karten heben sich beim Darüberfahren leicht an.
- Texte, Farben (Teal #17b6a4), Bausteine und Website-Editor bleiben gleich.

### Entfernt
- Die Unterstreichungs-Animation der Navigation.
- Der kleine Pfeil am Kontakt-Menü.

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
