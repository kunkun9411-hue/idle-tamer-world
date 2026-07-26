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

Die verbindliche ID- und Produktionsreihenfolge steht in [`UI_KIT_INVENTORY.md`](UI_KIT_INVENTORY.md). Sie umfasst aktuell 146 Grundelemente und kann kontrolliert erweitert werden, wenn Kombination, Rotation, 9-Slice oder CSS-Zustände eine neue fachliche Form nicht abdecken.

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
| A03 | Dicke vertikale Rahmenkante | verlustfreie 90°-Ableitung von A02 | `assets/ui/kit/frame/edge-thick-vertical-v1.webp` | freigegeben |
| A04 | Dünne horizontale Rahmenkante | `art-source/generated/ui-kit-v1/transparent/frame-edge-thin-horizontal-silver-ether-v1-master.png` | `assets/ui/kit/frame/edge-thin-horizontal-v1.webp` | freigegeben |
| A05 | Dünne vertikale Rahmenkante | verlustfreie 90°-Ableitung von A04 | `assets/ui/kit/frame/edge-thin-vertical-v1.webp` | freigegeben |
| A06 | Kompakte Kartenrahmenecke | `art-source/generated/ui-kit-v1/transparent/frame-corner-compact-silver-ether-v1-master.png` | `assets/ui/kit/frame/corner-compact-v1.webp` | freigegeben |
| A07 | Minimale Tooltip-Rahmenecke | `art-source/generated/ui-kit-v1/transparent/frame-corner-tooltip-silver-ether-v1-master.png` | `assets/ui/kit/frame/corner-tooltip-v1.webp` | freigegeben |

A01 bis A03 besitzen im UI-Katalog zusätzlich eine sichtbare Verbindungsprobe. Sie zeigt einen vollständigen skalierbaren Fensterrahmen aus vier gedrehten Ecken, zwei horizontalen Kanten und zwei abgeleiteten vertikalen Kanten.

A04 bis A06 bilden die leichte Kartenfamilie und besitzen eine eigene sichtbare Verbindungsprobe. Ihre horizontale und vertikale Kante wird nach dem 9-Slice-Prinzip nur in Längsrichtung gestreckt; die Randstärke bleibt identisch. Der technische Vertrag von A04 erzwingt außerdem eine sichtbare Höhe von höchstens 45 Prozent der A02-Höhe und mindestens 90 Prozent nutzbare Breite.

A07 reduziert dieselbe Familie zur Tooltip-Hierarchie. Die Katalogprobe kombiniert A04, A05 und vier A07-Ecken mit echtem HTML-Inhalt; Rolle, Effekttext und Zahlen sind nicht in den Rasterbildern eingebrannt.
## B.01.2 - Produktionsbatch freigegeben (2026-07-25)

Der Bausatz ist jetzt über die ursprünglichen sieben Proof-Elemente hinaus erweitert: A08-A18 bilden die verbindbare Rahmenfamilie; B01-B14 liefern Innenflächen, Zustandslicht und Materialtexturen; C01-C16, D01-D16 und E01-E05, E09-E11, E14 und E18 liefern Leisten, Aktionen und Wertfassungen; E06-E08, E12-E13 und E15-E17 sind als CSS-/Rotationsableitungen im Katalog abgenommen; F01-F16 liefern textfreie Ressourcen-, Ei- und Gem-Icons; G01-G36 liefern textfreie System- und Navigationsicons inklusive G11 Gilden-DNA, G16 Post, G18 Audio an, G21 Information, G22 Warnung, G23 Erfolg, G24 Fehler, G25 Schließen, G26 Zurück, G28 Hinzufügen, G29 Entfernen, G30 Sperre, G31 Filter, G32 Sortieren, G33 Suche, G34 Aktualisieren, G35 Menü und G36 Mehr/Optionen; G19 Audio aus und G27 Vorwärts sind als CSS-Zustände/Ableitung abgenommen; H01-H12 liefern getrennte Avatar-, Rollen- und Ranglayer. Alle 136 Raster-Runtime-Dateien werden aus `scripts/prepare_ui_kit.py` erzeugt, im Manifest geprüft und in der Katalogseite montiert. Beschriftungen, Zahlen und Zustände bleiben dynamisches HTML/CSS. Die serielle UI-Liste ist abgeschlossen; B.01.4 bleibt die visuelle Abnahme.
