# B.01.2 – Nächste serielle Qualitätsgates

Stand des Katalogs: **26. Juli 2026**
Aktualisierter Roadmap-Status: **30. Juli 2026 · Roadmap B 32/32 abgeschlossen und eingefroren · Roadmap C aktiv**
Status: **G26/G27/G28/G29/G30/G31/G32/G33/G34/G35/G36/H09/H10/H11/H12 freigegeben; B.01.4 abgenommen**

B.01.2 **Bauen**, B.01.3 **Prüfen** und B.01.4 **Abnehmen** sind abgeschlossen.
Der Designsystem-Freeze galt für B.02–B.08 und bleibt nach der vollständigen
Abnahme von Roadmap B als verbindliche UI-Basis für Roadmap C bestehen.

Dieses Dokument friert die nächste Produktionsreihenfolge des Silver-Ether-
Baukastens ein. Es beschreibt Rollen, Runtime-Namen, Ableitungen und
Abnahmekriterien, ohne bereits erzeugte Bilddateien vorzutäuschen. Ein Eintrag
darf erst in `ui-kit-manifest.json` und `ui-catalog-data.ts` als `FREIGEGEBEN`
erscheinen, wenn Master, Alpha-Prüfung, Runtime-Datei, Manifest, Katalogprobe
und automatisierter Asset-Check gemeinsam vorhanden sind.

## Audit des aktuellen Stands

Der letzte freigegebene Stand enthält 146 freigegebene Inventarelemente (136 Raster,
zehn CSS-/Rotationsableitungen):

- A01–A18 Rahmengeometrie;
- B01–B14 Flächen, Zustandslicht und Materialtexturen;
- C01–C16 Leisten, Ornamente und Zustandsleisten;
- D01–D16 Aktions- und Steuerungsrahmen;
- E01–E18 Ressourcen-, Wert-, Fortschritts- und Feedbackfassungen inklusive der
  acht CSS-/Rotationsableitungen;
- F01–F16 Ökonomie-/Itemicons;
- G01–G36 Systemicons inklusive G11 Gilden-DNA, G16 Post, G18/G19 Audiozuständen, G21 Information, G22 Warnung, G23 Erfolg, G24 Fehler, G25 Schließen, G26 Zurück, G28 Hinzufügen, G29 Entfernen, G30 Sperre, G31 Filter, G32 Sortieren, G33 Suche, G34 Aktualisieren, G35 Menü und G36 Mehr/Optionen; G27 Vorwärts ist als Ableitung registriert; H09 Verteidigungs-, H10 Support-, H11 kleine und H12 große Rangplakette vervollständigen die Identitätslayer;
- H01–H08 Identitätslayer.

Die aktuelle Inventartabelle hatte B09 fälschlich ein zweites Mal als
„Hover-Lichtauflage“ geführt, obwohl B08 diese Rolle bereits erfüllt. Das
Inventar ist korrigiert; B09 ist jetzt **Fokus-Lichtauflage**, B10 Auswahl,
B11 Fehler, B12 Erfolg, B13 Glasrausch und B14 Graphit. Alle sechs Runtime-
Dateien sind erzeugt, im Manifest verankert und im Katalog sichtbar.

## Gate B09–B14: Zustands- und Materialflächen

| ID | Fachliche Rolle | Runtime-Datei | Medium | Zielgröße | Ableitung | Katalogprobe |
| --- | --- | --- | --- | --- | --- | --- |
| B09 | Fokus-Lichtauflage für Tastaturfokus und Primärziel | `surface/b09-v1.webp` | ImageGen + Alpha | 768×384 | keine | Fokus auf Button, Input und Karte ohne Layoutsprung |
| B10 | Auswahl-Lichtauflage für dauerhaft selektierte Karte/Tab | `surface/b10-v1.webp` | ImageGen + Alpha | 768×384 | keine | Auswahl bleibt bei Maus, Tastatur und Touch sichtbar |
| B11 | Fehler-Lichtauflage für ungültige Eingabe und fehlgeschlagene Aktion | `surface/b11-v1.webp` | ImageGen + Alpha | 768×384 | keine | Fehlerfläche mit HTML-Text, ohne rote Vollfläche |
| B12 | Erfolg-Lichtauflage für bestätigte Änderung | `surface/b12-v1.webp` | ImageGen + Alpha | 768×384 | keine | Erfolg auf Karte und Toast/Bestätigung |
| B13 | subtile Glasrauschtextur für dunkle Ether-Flächen | `surface/b13-v1.webp` | ImageGen, nahtlos | 512×512 | keine | Wiederholung ohne sichtbare Kachelgrenze |
| B14 | tiefe Graphittextur für Modal-/Overlay-Tiefe | `surface/b14-v1.webp` | ImageGen, nahtlos | 512×512 | keine | Modal über Kampf und Offline-Bericht |

B09–B12 sind semantische Ebenen. Ihre Farbe, Intensität und Bewegung werden
über Tokens/CSS gesteuert; das Rastermaterial darf keine Wörter, Zahlen oder
Statuslabels enthalten. B13/B14 sind Materialflächen und dürfen höchstens eine
sehr subtile Helligkeitsvariation liefern. `prefers-reduced-motion` blendet
Animationen aus, nicht den Zustand.

### Abnahme B09–B14

1. B09 als Fokusprobe mit `:focus-visible` geprüft und freigegeben.
2. B10 gegen B09 auf eindeutige Semantik (Fokus ≠ Auswahl) geprüft.
3. B11 und B12 auf Kontrast, Farbenblindheit und Textfreiheit geprüft.
4. B13/B14 als Materialkacheln geprüft; der Validator erlaubt für diese beiden
   bewusst opake, wiederholbare Flächen.
5. E05–E18 ist vollständig abgenommen; G11 (Gilden-DNA) ist inzwischen freigegeben.

Die globale Inventarreihenfolge bleibt verbindlich: B09–B14, C09–C16 und
D05–D16 und E05–E18 sind abgenommen: sechs E-Rasterteile plus acht
deterministische CSS-/Rotationsableitungen sind im Katalog dokumentiert.

## Gate C09–C16: Leisten, Ornamente und Zustandsleisten

| ID | Fachliche Rolle | Runtime-Datei | Medium | Zielgröße | Ableitung | Katalogprobe |
| --- | --- | --- | --- | --- | --- | --- |
| C09 | zentraler Fokusdiamant für Titel-, Auswahl- und Prestigeachsen | `chrome/c09-v1.webp` | ImageGen + Alpha | 128×128 | keine | als Mittelpunkt von C04/C05 und als Fokusornament |
| C10 | kleine Eckniete für wiederholbare Kantenakzente | `chrome/c10-v1.webp` | ImageGen + Alpha | 64×64 | keine | vierfach an einer Karte und einzeln im Tooltip |
| C11 | kleine Ether-Kristallfassung | `chrome/c11-v1.webp` | ImageGen + Alpha | 128×128 | keine | Ressourcenchip und Tabmarker |
| C12 | große Ether-Kristallfassung | `chrome/c12-v1.webp` | ImageGen + Alpha | 192×192 | keine | Hero-Header und Prestige-/Gilden-DNA-Kopf |
| C13 | passive Etherlinie | `chrome/c13-v1.webp` | ImageGen + Alpha | 512×32 | keine | ruhige Trennerlinie ohne Interaktion |
| C14 | aktive Etherlinie | `chrome/c14-v1.webp` | ImageGen + Alpha | 512×48 | keine | aktive Auswahl, Fortschritt und Fokuszustand |
| C15 | Warnungsleiste | `chrome/c15-v1.webp` | ImageGen + Alpha | 768×96 | keine | Warnbanner mit echtem HTML-Text und Icon |
| C16 | Erfolgsleiste | `chrome/c16-v1.webp` | ImageGen + Alpha | 768×96 | keine | Erfolgsbanner nach serverseitiger Änderung |

C09–C14 bleiben textfrei und dürfen horizontal bzw. vertikal nur dort
gestreckt werden, wo die jeweilige Kante in der Katalogprobe ihre Materialhöhe
behält. C15/C16 sind keine Toasttexte: Sie liefern nur die visuelle Schale;
Label, Beschreibung und Schließen-Aktion bleiben HTML. Warnung und Erfolg
werden über semantische Tokens verstärkt, nicht durch eingebrannte Farben oder
Schrift.

Die Rollen überschneiden sich bewusst nicht mit dem Bestand: A18 bleibt die
größere, frei platzierbare Niete (128×128), C10 die kleinere Eckniete (64×64)
für dichte Kartenkanten. B11/B12 liefern die vollflächige Fehler-/Erfolgsebene;
C15/C16 liefern dagegen nur die schmale, strukturierende Leistenkante.

Die zugehörigen Master werden nach dem bestehenden Namensvertrag unter
`art-source/generated/ui-kit-v1/transparent/chrome-c09-silver-ether-v1-master.png`
mit demselben `chrome-c<ID>-silver-ether-v1-master.png`-Muster bis C16 geführt;
Chroma-Quellen liegen parallel unter
`art-source/generated/ui-kit-v1/chroma/`.

### Abnahme C09–C16

1. C09–C12 einzeln, gedreht und in einer zusammengesetzten Headerprobe laden.
2. C13/C14 auf identische sichtbare Randhöhe bei drei Breiten prüfen.
3. C15/C16 mit langen deutschen Texten, leerem Text und `prefers-reduced-motion`
   prüfen; keine Leiste darf den Inhalt abschneiden.
4. Katalog und Manifest müssen exakt acht neue `chrome`-Elemente ausweisen.
5. Erst nach C16 wird D05 gestartet.

## Gate D05–D16: Aktionen, Eingaben und Steuerung

| ID | Fachliche Rolle | Runtime-Datei | Medium | Zielgröße | Ableitung | Katalogprobe |
| --- | --- | --- | --- | --- | --- | --- |
| D05 | gefährlicher Buttonrahmen für zerstörerische Aktionen | `control/d05-v1.webp` | ImageGen, 9-Slice | 512×128 | keine | Bestätigung/Prestige-Reset mit Warnstatus |
| D06 | runde Icon-Buttonfassung | `control/d06-v1.webp` | ImageGen + Alpha | 128×128 | keine | Settings, Audio und Schließen mit Tooltip |
| D07 | eckige Icon-Buttonfassung | `control/d07-v1.webp` | ImageGen + Alpha | 128×128 | keine | Toolbar, Filter und Inventaraktionen |
| D08 | Tabrahmen Standard | `control/d08-v1.webp` | ImageGen, 9-Slice | 384×96 | keine | nicht ausgewählter Bereichstab |
| D09 | Tabrahmen aktiv | `control/d09-v1.webp` | ImageGen, 9-Slice | 384×96 | keine | aktiver Tab zusammen mit C07/C14 |
| D10 | äußerer Segmentsteuerungsrahmen | `control/d10-v1.webp` | ImageGen, 9-Slice | 512×112 | keine | Zwei-/Drei-Wege-Auswahl ohne Textasset |
| D11 | Toggle-Schiene | `control/d11-v1.webp` | ImageGen, 9-Slice | 192×80 | keine | Audio-/Auto-Toggle in an/aus |
| D12 | Toggle-Knopf | `control/d12-v1.webp` | ImageGen + Alpha | 64×64 | keine | D11 mit Tastaturfokus und Disabled |
| D13 | Slider-Schiene | `control/d13-v1.webp` | ImageGen, 9-Slice | 512×64 | keine | Lautstärke-/Helligkeitsregler |
| D14 | Slider-Griff | `control/d14-v1.webp` | ImageGen + Alpha | 72×72 | keine | D13 mit Tastatur- und Touchbedienung |
| D15 | Checkboxfassung | `control/d15-v1.webp` | ImageGen + Alpha | 64×64 | keine | ungeprüft, geprüft und deaktiviert |
| D16 | Radiobuttonfassung | `control/d16-v1.webp` | ImageGen + Alpha | 64×64 | keine | Starter-/Zonen-Auswahl mit exakt einer Auswahl |

D05, D08–D11 und D13 sind 9-Slice-Schalen; ihre Mittelteile dürfen nur in
Längsrichtung wachsen. D06/D07, D12, D14, D15 und D16 sind freigestellte
Silhouetten und bleiben quadratisch. Hover, Fokus, gedrückt, ausgewählt,
deaktiviert und Laden werden als CSS-Zustände auf diesen Grundformen
aufgebracht; zusätzliche Rasterzustände sind nur bei einer geänderten
Silhouette erlaubt.

Die Master folgen dem bestehenden `control-d05-silver-ether-v1-master.png`
mit demselben `control-d<ID>-silver-ether-v1-master.png`-Muster bis D16.
Runtime-IDs bleiben exakt D05–D16; keine
sprachabhängigen Dateinamen oder eingebrannten Labels sind zulässig.

### Abnahme D05–D16

1. D05 als gefährliche Aktion mit Bestätigungsdialog und Escape-Schließen
   zeigen; kein Klick darf eine autoritative Spieländerung vortäuschen.
2. D06/D07 in einer Toolbar mit langen zugänglichen Labels und Tooltips
   prüfen.
3. D08–D10 mit zwei bis fünf Segmenten auf 1280, 1024 und 390 Pixeln prüfen;
   die Schale darf nicht horizontal überlaufen.
4. D11/D12 sowie D13/D14 per Tastatur, Touchziel und reduziertem Bewegungsmodus
   prüfen.
5. D15/D16 mit echtem HTML-Label, Fokus-Ring und Fehlerstatus prüfen.
6. Katalog und Manifest weisen exakt zwölf neue `control`-Elemente aus; der
   aktuelle UI-Kit-Manifeststand umfasst 120 Rasterelemente (die
   vier separaten Chrome-Assets bleiben davon unberührt). E05–E18 sind jetzt
   abgenommen.

## Gate E05–E18: Information, Fortschritt und Feedback

| ID | Fachliche Rolle | Runtime-Datei | Medium | Zielgröße | Ableitung |
| --- | --- | --- | --- | --- | --- |
| E05 | neutrales Statusbadge | `info/e05-v1.webp` | ImageGen, 9-Slice | 256×64 | keine |
| E06 | aktives Statusbadge | CSS-Variante von E05 | CSS | – | E05 + aktiver Token |
| E07 | Warnungsbadge | CSS-Variante von E05 | CSS | – | E05 + Warn-Token |
| E08 | Fehlerbadge | CSS-Variante von E05 | CSS | – | E05 + Fehler-Token |
| E09 | große horizontale Fortschrittsfassung | `info/e09-v1.webp` | ImageGen, 9-Slice | 768×64 | keine |
| E10 | kompakte Fortschrittsfassung | `info/e10-v1.webp` | ImageGen, 9-Slice | 384×48 | keine |
| E11 | runde Fortschrittsfassung | `info/e11-v1.webp` | ImageGen + Alpha | 128×128 | keine |
| E12 | neutrale Fortschrittsfüllung | CSS/Material | CSS | – | E09/E10 + neutraler Token |
| E13 | Ether-Fortschrittsfüllung | CSS/Material | CSS | – | E09/E10 + Ether-Token |
| E14 | Tooltip-Pfeil oben | `info/e14-v1.webp` | ImageGen + Alpha | 96×64 | keine |
| E15 | Tooltip-Pfeil unten | `info/e15-v1.webp` | Ableitung | 96×64 | 180° von E14 |
| E16 | Tooltip-Pfeil links | `info/e16-v1.webp` | Ableitung | 64×96 | 90° von E14 |
| E17 | Tooltip-Pfeil rechts | `info/e17-v1.webp` | Ableitung | 64×96 | 270° von E14 |
| E18 | Benachrichtigungspunkt | `info/e18-v1.webp` | ImageGen + CSS | 64×64 | keine |

Für E06–E08 und E12–E13 entstehen keine separaten Rasterdateien. Die
Katalogeinträge werden als CSS-Ableitungen von E05 bzw. E09/E10 geführt. E15–E17
werden reproduzierbar aus E14 gebaut; keine zweite ImageGen-Quelle ist zulässig.

## Runtime-/Manifest-Vertrag

Für jede neue Rasterdatei gelten dieselben Felder wie für den bestehenden
Manifestvertrag:

`id`, `family`, `name`, `path`, `source`, `width`, `height`, `alpha`, `bytes`,
`sha256`, `status`, `derivation`.

Die Runtime-Ordner sind `apps/web/public/assets/ui/kit/chrome/` für C09–C16,
`apps/web/public/assets/ui/kit/control/` für D05–D16 und
`apps/web/public/assets/ui/kit/info/` für E05, E09–E11, E14 und E18. B09–B14
liegen unter `surface/` und sind freigegeben. CSS-/Rotationsableitungen besitzen
bewusst keine eigene Rasterdatei; der Katalog referenziert nur vorhandene
Master und erzeugt keine kaputten `<img>`-Pfade.

B13/B14 sind als dokumentierte Materialflächen freigegeben. Sie bleiben RGBA-
Runtime-Dateien, dürfen aber als einzige Kit-IDs opake Ecken besitzen, weil sie
als nahtlose Kacheln hinter HTML wiederholt werden. Diese Ausnahme ist im
Asset-Validator explizit auf B13/B14 begrenzt.

## Abnahme je Element

Ein Element wird nur dann von `geplant` auf `freigegeben` gesetzt, wenn:

- ein textfreier HD-Master und die Chroma-/Quellvariante versioniert sind;
- Alpha, transparente Ecken, Größe und Dateibudget automatisiert geprüft
  sind;
- der Runtime-Pfad und SHA-256 im UI-Kit-Manifest übereinstimmen;
- eine sichtbare Katalogprobe mindestens Standard, Fokus/Auswahl und den
  passenden Fehler-/Erfolgspfad zeigt;
- Desktop (1280×720), Tablet (1024×768) und Mobile (390×844) ohne Überlauf
  laden;
- `pnpm test`, `pnpm ui:audit` und der Asset-Validator grün sind;
- die zugehörige Dokumentation und der öffentliche Roadmap-Status denselben
  Stand ausweisen.

G11, G16, G18, G21, G22, G23, G24, G25, G26, G28, G29, G30, G31, G32, G33, G34, G35 und G36 sind als Systemicons freigegeben; G19 und G27 sind als
CSS-Ableitungen aus G18/G26 im Katalog und Asset-Check verankert. Die serielle
Asset-Liste ist mit H12 abgeschlossen. Die visuelle B.01.4-Freeze-/
Abnahmeentscheidung ist dokumentiert; B.02 bis B.04 sind intern abgenommen,
B.05 wartet auf Online-Identitätsprüfung und B.06 ist der aktuelle Prüfblock.

## Offene Gate-Liste nach G26/G27/G28/G29/G30/G31/G32/G33/G34/G35/G36/H09/H10/H11/H12

### B.01-Abnahmeprotokoll · 26. Juli 2026

Die Freigabe von G26/G27/G28/G29/G30/G31/G32/G33/G34/G35/G36/H09/H10/H11/H12
schließt die serielle Asset-Liste. B.01 ist als Roadmap-Block abgenommen.
Schritt 3 (Prüfen) ist mit Katalog, Spielflächen, drei Referenz-Viewports,
Zuständen, Kontrast, Tastatur, reduzierter Bewegung, Tests und Dokumentation
nachgewiesen. Schritt 4 (Abnehmen) wurde nach visueller Sichtprüfung der
Desktop-, Tablet- und Mobile-Captures eingefroren.

- [x] **B.01.3 – Prüfen:** Produktionssatz in Katalog und Spielflächen auf
  1280×720, 1024×768 und 390×844 mit Standard-, Fokus-/Auswahl-, Fehler-,
  Erfolg-, Leer-, Sperr- und reduzierter Bewegung prüfen.
- [x] **B.01.4 – Abnehmen:** Token-/Komponentenregeln eingefroren, offene
  szenenspezifische Schulden B.02–B.08 zugeordnet und der öffentliche
  Roadmap-Status auf abgenommen gesetzt.

Geprüfte Sichtproben: `artifacts/ui-captures/desktop/04-combat.png`,
`artifacts/ui-captures/desktop/03-offline-report.png`,
`artifacts/ui-captures/desktop/13-profile.png`,
`artifacts/ui-captures/desktop/14-prestige.png`,
`artifacts/ui-captures/mobile/04-combat.png` und
`artifacts/ui-captures/mobile/03-offline-report.png`. Alle sechs Ansichten
zeigen den eingefrorenen Silver-Ether-Baukasten ohne sichtbaren Überlauf;
automatisierte E2E-, Layout-, Asset- und Build-Prüfungen waren zuvor grün.

### Serielle UI-Gates G30–G36 und H09–H12 · abgeschlossen

G26, die Ableitung G27, G28, G29, G30, G31, G32, G33, G34, G35, G36, H09, H10, H11 und H12 sind freigegeben. Die verbleibende Arbeit ist die
visuelle B.01.4-Freeze-/Produktentscheidung; für sie existiert kein weiterer
Runtime-Eintrag. Die globale Asset-Reihenfolge ist damit abgeschlossen. Ein
Element wird erst nach Master, Alpha-/Textfreiheitsprüfung,
Runtime-Datei (bei einer Rasterdatei), Manifest, Katalogprobe und Asset-/UI-
Checks auf `freigegeben` gesetzt.

| Gate | Rolle | Geplante Form | Status / Abhängigkeit |
| --- | --- | --- | --- |
| G23 | Erfolg/Haken | Systemicon, 256×256, `system/g23-v1.webp` | **freigegeben**; erstes Gate dieser Serie |
| G24 | Fehler | Systemicon, 256×256, `system/g24-v1.webp` | **freigegeben**; nach G23 |
| G25 | Schließen | Systemicon, 256×256, `system/g25-v1.webp` | **freigegeben**; nach G24 |
| G26 | Zurück | Systemicon, 256×256, `system/g26-v1.webp` | **freigegeben**; nach G25 |
| G27 | Vorwärts | deterministische Ableitung aus G26, kein eigenes Raster | **freigegeben**; CSS-Rotation 180° im Katalog |
| G28 | Hinzufügen | Systemicon, 256×256, `system/g28-v1.webp` | **freigegeben**; nach G27 |
| G29 | Entfernen | Systemicon, 256×256, `system/g29-v1.webp` | **freigegeben**; nach G28 |
| G30 | Sperre | Systemicon, 256×256, `system/g30-v1.webp` | **freigegeben**; nach G29 |
| G31 | Filter | Systemicon, 256×256, `system/g31-v1.webp` | **freigegeben**; nach G30 |
| G32 | Sortieren | Systemicon, 256×256, `system/g32-v1.webp` | **freigegeben**; nach G31 |
| G33 | Suche | Systemicon, 256×256, `system/g33-v1.webp` | **freigegeben**; nach G32 |
| G34 | Aktualisieren | Systemicon, 256×256, `system/g34-v1.webp` | **freigegeben**; nach G33 |
| G35 | Menü | Systemicon, 256×256, `system/g35-v1.webp` | **freigegeben**; nach G34 |
| G36 | Mehr/Optionen | Systemicon, 256×256, `system/g36-v1.webp` | **freigegeben**; nach G35 |
| H09 | Rollenplakette Verteidigung | Identitätslayer, 192×192, `identity/h09-v1.webp` | **freigegeben**; nach G36 |
| H10 | Rollenplakette Support | Identitätslayer, 192×192, `identity/h10-v1.webp` | **freigegeben**; nach H09 |
| H11 | Rangfassung klein | Identitätslayer, 192×192, `identity/h11-v1.webp` | **freigegeben**; nach H10 |
| H12 | Rangfassung groß | Identitätslayer, 192×192, `identity/h12-v1.webp` | **freigegeben**; letztes Gate dieser Liste |

Die serielle Inventarliste ist mit G30–G36 und H09–H12 vollständig produziert
und geprüft. Diese Freigaben schließen B.01.4 nicht automatisch ab; die visuelle
Produktentscheidung bleibt ein eigener Schritt.

### Roadmap-B-Blöcke nach B.01

Die folgende Tabelle ist der **historische technische Baseline-Nachweis** vom
26. Juli. Sie schloss B.01 als Designsystem-Freeze ab und dokumentiert den
damaligen Zwischenstand der nachfolgenden Blöcke. Die spätere formale
Live-Abnahme ist nicht aus dieser Tabelle abzuleiten. Der heutige verbindliche
Status steht in `apps/web/public/roadmap/roadmap-status.json`,
`docs/ROADMAP_B_DESIGN_UI.md` und der
[Roadmap-B-Live-Abnahme](ROADMAP_B_LIVE_ACCEPTANCE_2026-07-30.md):
Roadmap B ist bei 32/32 eingefroren.
Roadmap C ist aktiv.

| Block | Planen | Bauen | Prüfen | Abnehmen / eindeutiges Exit-Kriterium |
| --- | --- | --- | --- | --- |
| B.02 Navigation | Spielerwege und Hierarchie festgelegt | Hauptnavigation, Kontextaktionen und mobile Dock umgesetzt | `navigation-ia.spec.ts`, Responsive- und Layout-Audit grün | Kampf, Sammlung, Brut, Forschung, Gilde und Profil eindeutig erreichbar |
| B.03 Kampfszene/HUD | Kampfzentrum, HUD-Prioritäten und versteckbare Panels festgelegt | Bühne, Monster, Teamwahl, Gegnerstatus und Panel-Chrome umgesetzt | Fokus-/Zwei-Monster-E2E und Captures als technische Baseline grün | historischer Zwischenstand; später durch die Live-Spielerprüfung formal abgenommen |
| B.04 Sammlung/Entwicklung | Run-/Permanent-Ebenen und Reset-Grenzen festgelegt | Habitat, Brut, Inventar, Forschung, Gems und Prestige umgesetzt | State-Matrix, Core-Loop und Zone-10-Gate grün | Run-Fortschritt und permanente Entwicklung unterscheidbar |
| B.05 Profil/Identität | Avatar-, Rahmen-, Besitz- und Auswahl-Hierarchie festgelegt | Profilfläche, Layer und Identitätsornamente umgesetzt | Auswahl-, Fallback-, Responsive- und Live-Gilden-Nachweis grün | Dieselbe Identität bleibt in Profil, Gilde und Sozial-Leerzuständen konsistent; Ranglistenlogik startet in C |
| B.06 Gilde/Soziales | DNA, Rollen, Ziele, Boss, Expedition, Freunde, Chat, Moderation festgelegt | Servergespeister Hub und Feature-Flag-Aus-Zustand umgesetzt | 4/4, 7/7, 8/8, 7/7 Integrationen plus Live-Browser-Capture grün | Kooperation nachvollziehbar und moderierbar |
| B.07 Responsive/A11y | Viewports, Eingaben, Kontrast, Fokus, Zoom, Touch und Bewegung festgelegt | Responsive Raster, Tastaturführung und Motion-Fallbacks umgesetzt | Layout-Audit, Matrix, 2×-Typografiestress, Keyboard und Reduced Motion grün | historische Baseline; echte Geräte-Smokes folgen in Roadmap D |
| B.08 Polish/Übergabe | Budget, Szenenmatrix und C-Übergabekriterien festgelegt | Mikrofeedback, Übergänge, Restzustände und visuelle Schulden technisch bearbeitet | Gesamtregression, Captures, Live-Capture und Build als technische Baseline grün | historischer Zwischenstand; später formal abgenommen und an C übergeben |

Die vorherigen Layoutschulden – mobile Navigationskollision und Accountleisten-
Überlauf – sind durch das einreihige 7er-Dock und das kompakte Desktop-Raster
behoben. Das Layout-Audit führt aktuell keine Ausnahme-Allowlist mehr.
