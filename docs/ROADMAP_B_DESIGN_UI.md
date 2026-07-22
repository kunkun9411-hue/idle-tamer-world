# Roadmap B – Design, Interface und Lesbarkeit

- Stand: 22. Juli 2026
- Status: **aktiv**
- Aktiver Block: **B.01 – Inventar und Designsystem**
- Aktiver Schritt: **1 – Planen**
- Statusdaten: `apps/web/public/roadmap/roadmap-status.json`

Die gemessene Ausgangsbasis mit 16 Flächen, Zustandsmatrix und priorisiertem UX-Backlog steht in `ui/SCENE_INVENTORY.md`. Der eingefrorene technische Übergabevertrag und die offenen UX-Themen stehen in `ROADMAP_A_COMPLETION.md`. Beides ist verbindlicher Eingang für B.01.

## Ziel

Roadmap B macht aus dem technisch funktionierenden Systemfundament ein geschlossenes, modernes und verständliches Spiel. Sie verändert Darstellung, Navigation und Bedienung, aber keine serverautoritativen Wirtschaftsregeln. Neue große Spielsysteme gehören weiterhin in Roadmap C.

## Fortschritt

| Block | Ergebnis | 1 Planen | 2 Bauen | 3 Prüfen | 4 Abnehmen | Status |
| --- | --- | :---: | :---: | :---: | :---: | --- |
| B.01 | Inventar und verbindliches Designsystem | [ ] | [ ] | [ ] | [ ] | **Aktiv · Planen** |
| B.02 | Informationsarchitektur und Navigation | [ ] | [ ] | [ ] | [ ] | Später |
| B.03 | Kampfszene und HUD | [ ] | [ ] | [ ] | [ ] | Später |
| B.04 | Sammlung und Entwicklung | [ ] | [ ] | [ ] | [ ] | Später |
| B.05 | Profil, Avatare und Rahmen | [ ] | [ ] | [ ] | [ ] | Später |
| B.06 | Gilden- und Sozialoberfläche | [ ] | [ ] | [ ] | [ ] | Später |
| B.07 | Responsive Design und Zugänglichkeit | [ ] | [ ] | [ ] | [ ] | Später |
| B.08 | Gesamtpolish und Übergabe an C | [ ] | [ ] | [ ] | [ ] | Später |

Gesamtfortschritt: **0 von 32 Gates abgeschlossen (0 %)**. Roadmap A bleibt separat bei 32/32 eingefroren.

## Arbeitsmodell

Jeder Block durchläuft **Planen → Bauen → Prüfen → Abnehmen**. Ein Gate zählt nur, wenn Oberfläche, UI-Katalog, Referenz-Viewports, Tests, Dokumentation und öffentlicher Status denselben Stand zeigen.

## B.01 – Inventar und Designsystem

**Ergebnis:** Ein verbindliches Silver-Ether-Designsystem ersetzt Einzelfall-CSS als Arbeitsgrundlage. Alle folgenden B-Blöcke bauen auf denselben Tokens, Komponenten, Zuständen und Assetregeln auf.

### Schritt 1 – Planen 🔷

- [ ] bestehende Silver-Ether-Farben, Flächen, Linien, Schatten und Leuchteffekte gegen alle 16 UI-Flächen auditieren
- [ ] Typografieskala für Display, Seitentitel, UI-Text, Zahlen, Metadaten und mobile Mindestgrößen festlegen
- [ ] Abstands-, Raster-, Radius-, Ebenen- und Bewegungs-Tokens definieren
- [ ] Komponentenbestand inklusive Buttons, Karten, Tabs, Dialoge, Toasts, Tooltips, Inputs, Ressourcen und Fortschrittsanzeigen ordnen
- [ ] Zustände für Laden, Leer, Fehler, Sperre, Erfolg, Auswahl, Fokus und Deaktivierung pro Kernkomponente festlegen
- [ ] 512×512-Avatar-/Rahmenvertrag und 200×200-PixelLab-Animationsvertrag in das Designsystem übernehmen
- [ ] Referenzansichten und Abnahme-Viewports für Vorher-/Nachher-Vergleiche bestimmen
- [ ] B.01-Bauplan mit klaren Dateigrenzen und Migrationsreihenfolge freigeben

### Schritt 2 – Bauen ⬜

- Design-Tokens in einer zentralen, dokumentierten Quelle umsetzen;
- Kernkomponenten ohne Änderung der Spiellogik vereinheitlichen;
- UI-Katalog auf produktionsnahe Zustände und Komponentenvarianten erweitern;
- alte Einzelfallwerte schrittweise auf die neue Basis migrieren.

### Schritt 3 – Prüfen ⬜

- Komponenten in Desktop, Tablet und Mobile vergleichen;
- Kontrast, lange Texte, große Zahlen, Zoom, Tastaturfokus und reduzierte Bewegung prüfen;
- visuelle Regressionen über reproduzierbare Screenshots nachweisen;
- sicherstellen, dass Designänderungen keinen Wirtschafts- oder Besitzvertrag verändern.

### Schritt 4 – Abnehmen ⬜

- Designsystem im UI-Katalog und in echten Spielflächen gemeinsam abnehmen;
- Token- und Komponentenregeln dokumentieren und einfrieren;
- verbleibende szenenspezifische Schulden B.02 bis B.08 zuordnen;
- B.02 erst nach sauberer Abnahme aktivieren.

## B.02 bis B.08 – verbindliche Gate-Verträge

### B.02 – Navigation und Informationsarchitektur

- **Planen:** Spielerwege, Szenenhierarchie, Kontextaktionen und Desktop-/Mobilnavigation festlegen.
- **Bauen:** Hauptnavigation und einklappbare Nebenflächen als konsistentes System umsetzen.
- **Prüfen:** Kernwege, Rücksprünge, Fokus, lange Labels und die bekannte mobile Kollision testen.
- **Abnehmen:** Kampf, Sammlung, Brut, Forschung, Gilde und Profil sind eindeutig erreichbar.

### B.03 – Kampfszene und HUD

- **Planen:** Kampf als visuelles Zentrum, HUD-Prioritäten und versteckbare Nebeninformationen festlegen.
- **Bauen:** Bühne, Monsterpräsenz, Teamwahl, Gegnerstatus, Ressourcen und Panels neu ordnen.
- **Prüfen:** Überläufe, lange Zahlen, Bosse, Zustände und reale Desktop-/Mobilgrößen testen.
- **Abnehmen:** Die Hauptszene wirkt wie ein Spiel und nicht wie ein Dashboard aus gleichgewichteten Boxen.

### B.04 – Sammlung und Entwicklung

- **Planen:** Monster-, Ei-, Fragment-, Hyperlevel-, Evolutions-, Gem-, Forschungs- und Prestigepfade hierarchisieren.
- **Bauen:** zusammenhängende Ansichten und konsistente Kosten-, Besitz- und Reset-Signale umsetzen.
- **Prüfen:** Leer-, Lade-, Fehler-, Sperr-, Erfolgs- und Bestätigungszustände vollständig testen.
- **Abnehmen:** Run-Fortschritt und permanenter Fortschritt sind ohne externe Erklärung unterscheidbar.

### B.05 – Profil, Avatare und Rahmen

- **Planen:** runde Avatare, getrennte Rahmen, Katalog, Besitz, Auswahl und Profilhierarchie gestalten.
- **Bauen:** Profilfläche und 512×512-Runtime-Layer in allen relevanten Oberflächen integrieren.
- **Prüfen:** Masken, Kombinationen, Fallbacks, lange Namen, Besitz und Geräteansichten prüfen.
- **Abnehmen:** dieselbe Tamer-Identität funktioniert in Profil, Gilde, Freunde und späteren Ranglisten.

### B.06 – Gilden- und Sozialoberfläche

- **Planen:** DNA, Rollen, Rechte, Ziele, Boss, Expedition, Freunde, Chat und Moderation ordnen.
- **Bauen:** einen verständlichen Gildenhub und konsistentes Sozialfeedback umsetzen.
- **Prüfen:** Berechtigungen, Sperren, Meldungen, Leerzustände und lange Inhalte sichtbar prüfen.
- **Abnehmen:** Kooperation ist motivierend, nachvollziehbar und moderierbar dargestellt.

### B.07 – Responsive Design und Zugänglichkeit

- **Planen:** Viewports, Eingaben, Kontrast, Fokus, Zoom, Touchziele und Bewegung verbindlich definieren.
- **Bauen:** responsive Raster, Tastaturführung und Fallbacks für reduzierte Bewegung umsetzen.
- **Prüfen:** Layout-Audit, Browsermatrix, 200-%-Zoom, Tastatur und echte Touchgrößen testen.
- **Abnehmen:** alle Kernwege laufen auf 1280×720, 768×1024 und 390×844 ohne P0/P1-Layoutfehler.

### B.08 – Gesamtpolish und Übergabe

- **Planen:** finales Polish-Budget, Szenenmatrix und Übergabekriterien an C festlegen.
- **Bauen:** Mikrofeedback, Übergänge, Restzustände und verbleibende visuelle Schulden schließen.
- **Prüfen:** Gesamtregression, Screenshotvergleich und echte Gerätewege ausführen.
- **Abnehmen:** Roadmap B einfrieren und die geschlossene Oberfläche an Roadmap C übergeben.

## Verbindliche Leitplanken

- Silberne Akzente und leichte violette Elemente bleiben die visuelle Basis.
- Die Kampfszene bleibt die Hauptszene und darf nicht wieder zu einem kleinen Dashboard-Baustein werden.
- Häufige Aktionen liegen direkt in der jeweiligen Szene; seltene Details dürfen in Panels und Dialoge wandern.
- Schriftgröße, Kontrast und Informationsdichte werden an realen Viewports geprüft.
- Avatare und Rahmen sind getrennte, serverseitig gespeicherte Katalogeinträge.
- Monster- und Itemgrafiken bleiben HD; PixelLab-Animationen verwenden den 200×200-Vertrag.
- UI-Arbeit darf keine Gold-, Besitz-, Zeit- oder Gildenautorität zurück in den Browser verlagern.
- Roadmap B fügt keine großen Content- oder Wettbewerbssysteme hinzu.

## Abnahmeziel

Am Ende von Roadmap B besitzt jede relevante Funktion einen konsistenten Desktop- und Mobile-Zustand inklusive Laden, Leerzustand, Fehler, Sperre, Erfolg und Bestätigung. Die Oberfläche ist dann bereit, in Roadmap C mit umfangreicherem Content und neuen Features gefüllt zu werden.

## Direkt als Nächstes

Aktiv ist **B.01, Schritt 1 – Planen**. Zuerst wird der vorhandene Bestand gegen ein verbindliches Token-, Typografie-, Raster-, Komponenten- und Zustandsmodell geprüft. Erst nach dieser Entscheidung beginnt die sichtbare Migration der echten Spieloberfläche.
