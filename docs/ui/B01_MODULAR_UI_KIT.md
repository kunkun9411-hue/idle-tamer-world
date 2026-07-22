# B.01 – Modularer Silver-Ether-UI-Baukasten

Stand: **22. Juli 2026**  
Status: **verbindlicher Umfang von B.01.2 – Bauen**

## Ziel

Alle folgenden Oberflächen der Roadmap B werden aus einem gemeinsamen textfreien Baukasten zusammengesetzt. ImageGen liefert polierte HD-Materialien und Ornamente; HTML/CSS bestimmt Abmessung, Inhalt, Zustand und Responsive-Verhalten. Neue Szenen benötigen dadurch keine neue Stilfindung.

## Produktionspakete

| Paket | Inhalt | Runtimeziel |
| --- | --- | --- |
| A – Rahmen | Ecken, dünne/dicke Kanten, Verbinder, Endkappen | skalierbare Fenster, Karten und Dialoge |
| B – Flächen | Fenster-, Karten-, Tooltip-, Eingabe- und Sperrfläche | ruhige wiederholbare Hintergründe |
| C – Leisten | Kopf/Fuß, Trenner, Marker, Ornamente | Hierarchie und aktive Zustände |
| D – Aktionen | primär, sekundär, kompakt, gefährlich | Buttons und Kontextaktionen |
| E – Information | Ressource, Wert, Fortschritt, Badge, Tooltip | Zahlen, Kosten und Status |
| F – Ökonomie | Gold, Premiumwährung, Fragment, Material, Ei, Gem | Ressourcenanzeigen |
| G – System | Einstellungen, Audio, Hilfe, Post, Inventar, Forschung, Gilde, Profil | Navigation und Hilfsfunktionen |
| H – Identität | Avatar-, Rang- und Rollenfassung | Profil und Sozialflächen |

## Regeln

- keine Texte, Buchstaben, Zahlen, Logos oder KI-Pseudoschrift in Rasterassets;
- orthografische Frontalansicht ohne Perspektive;
- Graphit, gebürstetes kühles Silber und sparsame violette Ether-Inlays;
- klare Silhouette und ruhige Mitte für echtes HTML;
- keine Pixeloptik, kein Gold als Grundmaterial und keine mittelalterliche Vollornamentik;
- freigestellte Master bleiben erhalten; Runtimevarianten werden reproduzierbar gebaut;
- jede Runtime-Datei erhält ID, Rolle, Maße, Alpha, Prüfsumme und dokumentierte Kombinationsregeln.

## Abnahme

Der Baukasten ist vollständig, wenn UI-Katalog und echte Referenzflächen mindestens ein großes Fenster, eine kompakte Karte, einen Tooltip, eine Aktionsgruppe, eine Ressourcenzeile und eine Systemnavigation ausschließlich aus den gemeinsamen Bauteilen zeigen. Desktop, Tablet und Mobil müssen ohne neu gerenderte Texte oder szenenspezifische Vollrahmen funktionieren.

## Serielles Qualitätsgate

Jedes Element durchläuft dieselbe Reihenfolge: Referenzrolle festlegen → einzeln generieren → Chromaquelle sichern → Alpha entfernen → Kanten visuell prüfen → feste Runtimevariante bauen → Manifest aktualisieren → im UI-Katalog rendern → automatisiert laden und vermessen. Erst danach beginnt das nächste Element.

Die verbindliche ID- und Produktionsreihenfolge steht in [`UI_KIT_INVENTORY.md`](UI_KIT_INVENTORY.md). Sie beginnt mit 144 Grundelementen und kann kontrolliert erweitert werden, wenn Kombination, Rotation, 9-Slice oder CSS-Zustände eine neue fachliche Form nicht abdecken.

## Strukturreferenzen

Die visuelle Identität wird nicht kopiert. Für die Bauweise wurden nur wiederkehrende Produktionsprinzipien geprüft:

- modulare Ecken, Kanten und Verbinder statt ausschließlich fertiger Vollfenster;
- 9-Slice-fähige ruhige Mittelflächen und separat steuerbare Zustände;
- gemeinsam gestaltete Fenster, Popups, Ressourcenleisten und Icons;
- eine sichtbare Katalogseite als verbindliche Übergabe zwischen Kunst und Code.

Strukturelle Referenzen: [Fab – Modular Borders and Frames](https://www.fab.com/listings/2a52a212-0d81-4492-b495-c595882ecb2f), [Synty – Interface Modern Menus](https://syntystore.com/products/interface-modern-menus), [LayerLab – GUI Mono Round](https://layerlab.io/products/gui-mono-round) und [AnnoMotion – UI Kit](https://annomotion.studio/ai/ui-kit).

## Fertige Elemente

| ID | Element | Quelle | Runtime | Status |
| --- | --- | --- | --- | --- |
| A01 | Große universelle Rahmenecke | `art-source/generated/ui-kit-v1/transparent/frame-corner-large-silver-ether-v1-master.png` | `assets/ui/kit/frame/corner-large-v1.webp` | freigegeben |
| A02 | Dicke horizontale Rahmenkante | `art-source/generated/ui-kit-v1/transparent/frame-edge-thick-horizontal-silver-ether-v1-master.png` | `assets/ui/kit/frame/edge-thick-horizontal-v1.webp` | freigegeben |

A01 und A02 besitzen im UI-Katalog zusätzlich eine sichtbare Verbindungsprobe. Sie zeigt einen streckbaren Fensterkopf aus zwei gespiegelten Eckmodulen und einer überlappenden horizontalen Kante.
