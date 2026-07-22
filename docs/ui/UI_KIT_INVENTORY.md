# Silver-Ether-UI-Kit – verbindliches Inventar

Stand: **22. Juli 2026**  
Arbeitsweise: **seriell, genau ein freigegebenes Element vor Beginn des nächsten Elements**

Dieses Inventar ist die feste Produktionsreihenfolge für den modularen UI-Baukasten. Es ist absichtlich größer als der erste spielbare Bedarf: Neue Fenster sollen später aus vorhandenen Teilen gebaut werden können, ohne ihren Stil neu zu erfinden. Rasterassets bleiben textfrei; Beschriftung, Werte und Zustände entstehen in HTML/CSS.

## Statuslegende

- `freigegeben`: Master, Runtime, Manifest, Katalog und Tests sind vollständig.
- `in Arbeit`: genau dieses Element durchläuft aktuell das Qualitätsgate.
- `geplant`: darf erst beginnen, wenn das vorherige Element freigegeben ist.
- `abgeleitet`: wird reproduzierbar aus einem freigegebenen Master erzeugt, nicht erneut generiert.

## A – Rahmengeometrie

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| A01 | große universelle Rahmenecke | ImageGen + Alpha | freigegeben |
| A02 | dicke horizontale Rahmenkante | ImageGen + Alpha | geplant |
| A03 | dicke vertikale Rahmenkante | aus A02 abgeleitet | geplant |
| A04 | dünne horizontale Rahmenkante | ImageGen + Alpha | geplant |
| A05 | dünne vertikale Rahmenkante | aus A04 abgeleitet | geplant |
| A06 | kompakte Kartenrahmenecke | ImageGen + Alpha | geplant |
| A07 | minimale Tooltip-Rahmenecke | ImageGen + Alpha | geplant |
| A08 | horizontaler gerader Verbinder | ImageGen + Alpha | geplant |
| A09 | vertikaler gerader Verbinder | aus A08 abgeleitet | geplant |
| A10 | horizontaler verzierter Verbinder | ImageGen + Alpha | geplant |
| A11 | vertikaler verzierter Verbinder | aus A10 abgeleitet | geplant |
| A12 | horizontale Endkappe | ImageGen + Alpha | geplant |
| A13 | vertikale Endkappe | aus A12 abgeleitet | geplant |
| A14 | T-Verbindung für verschachtelte Flächen | ImageGen + Alpha | geplant |
| A15 | Fokus-Eckaufsatz | ImageGen + Alpha | geplant |
| A16 | Warnungs-Eckaufsatz | ImageGen + Alpha | geplant |

## B – Flächen und Material

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| B01 | ruhige Fensterfläche | ImageGen, nahtlos | geplant |
| B02 | erhöhte Kartenfläche | ImageGen, 9-Slice | geplant |
| B03 | kompakte Kartenfläche | ImageGen, 9-Slice | geplant |
| B04 | Tooltipfläche | ImageGen, 9-Slice | geplant |
| B05 | Eingabefläche | ImageGen, 9-Slice | geplant |
| B06 | Dropdownfläche | ImageGen, 9-Slice | geplant |
| B07 | Modalabdunklung | CSS + Textur | geplant |
| B08 | gesperrte Flächenauflage | ImageGen + CSS | geplant |
| B09 | Hover-Lichtauflage | ImageGen + Alpha | geplant |
| B10 | Auswahl-Lichtauflage | ImageGen + Alpha | geplant |
| B11 | Fehler-Lichtauflage | ImageGen + Alpha | geplant |
| B12 | Erfolg-Lichtauflage | ImageGen + Alpha | geplant |
| B13 | subtile Glasrauschtextur | ImageGen, nahtlos | geplant |
| B14 | tiefe Graphittextur | ImageGen, nahtlos | geplant |

## C – Leisten, Trenner und Ornamente

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| C01 | große Kopfleistenschale | ImageGen + Alpha | geplant |
| C02 | kompakte Kopfleistenschale | ImageGen + Alpha | geplant |
| C03 | Fußleistenschale | ImageGen + Alpha | geplant |
| C04 | dünner Ether-Trenner | ImageGen + Alpha | geplant |
| C05 | dicker Ether-Trenner | ImageGen + Alpha | geplant |
| C06 | kurzer symmetrischer Trenner | ImageGen + Alpha | geplant |
| C07 | aktiver Tab-Unterstrich | ImageGen + Alpha | geplant |
| C08 | aktiver Seitenmarker | ImageGen + Alpha | geplant |
| C09 | zentraler Fokusdiamant | ImageGen + Alpha | geplant |
| C10 | kleine Eckniete | ImageGen + Alpha | geplant |
| C11 | Kristallfassung klein | ImageGen + Alpha | geplant |
| C12 | Kristallfassung groß | ImageGen + Alpha | geplant |
| C13 | passive Etherlinie | ImageGen + Alpha | geplant |
| C14 | aktive Etherlinie | ImageGen + Alpha | geplant |
| C15 | Warnungsleiste | ImageGen + Alpha | geplant |
| C16 | Erfolgsleiste | ImageGen + Alpha | geplant |

## D – Aktionen und Steuerung

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| D01 | primärer Buttonrahmen | ImageGen, 9-Slice | geplant |
| D02 | sekundärer Buttonrahmen | ImageGen, 9-Slice | geplant |
| D03 | Ghost-Buttonrahmen | ImageGen, 9-Slice | geplant |
| D04 | kompakter Buttonrahmen | ImageGen, 9-Slice | geplant |
| D05 | Gefahren-Buttonrahmen | ImageGen, 9-Slice | geplant |
| D06 | Icon-Buttonfassung rund | ImageGen + Alpha | geplant |
| D07 | Icon-Buttonfassung eckig | ImageGen + Alpha | geplant |
| D08 | Tabrahmen Standard | ImageGen, 9-Slice | geplant |
| D09 | Tabrahmen aktiv | ImageGen, 9-Slice | geplant |
| D10 | Segmentsteuerung außen | ImageGen, 9-Slice | geplant |
| D11 | Toggle-Schiene | ImageGen, 9-Slice | geplant |
| D12 | Toggle-Knopf | ImageGen + Alpha | geplant |
| D13 | Slider-Schiene | ImageGen, 9-Slice | geplant |
| D14 | Slider-Griff | ImageGen + Alpha | geplant |
| D15 | Checkboxfassung | ImageGen + Alpha | geplant |
| D16 | Radiobuttonfassung | ImageGen + Alpha | geplant |

Interaktionszustände wie Hover, Fokus, gedrückt und deaktiviert werden bevorzugt durch CSS-Licht, Farbe und Bewegung auf diesen Grundformen erzeugt. Ein neues Rasterasset entsteht nur, wenn sich die Silhouette ändert.

## E – Information, Werte und Fortschritt

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| E01 | Ressourcen-Chiprahmen | ImageGen, 9-Slice | geplant |
| E02 | Wertplakette | ImageGen, 9-Slice | geplant |
| E03 | Kostenplakette | ImageGen, 9-Slice | geplant |
| E04 | Kapazitätsplakette | ImageGen, 9-Slice | geplant |
| E05 | Statusbadge neutral | ImageGen, 9-Slice | geplant |
| E06 | Statusbadge aktiv | CSS-Variante von E05 | geplant |
| E07 | Statusbadge Warnung | CSS-Variante von E05 | geplant |
| E08 | Statusbadge Fehler | CSS-Variante von E05 | geplant |
| E09 | horizontale Fortschrittsfassung | ImageGen, 9-Slice | geplant |
| E10 | kompakte Fortschrittsfassung | ImageGen, 9-Slice | geplant |
| E11 | runde Fortschrittsfassung | ImageGen + Alpha | geplant |
| E12 | Fortschrittsfüllung neutral | CSS + Textur | geplant |
| E13 | Fortschrittsfüllung Ether | CSS + Textur | geplant |
| E14 | Tooltip-Pfeil oben | ImageGen + Alpha | geplant |
| E15 | Tooltip-Pfeil unten | aus E14 abgeleitet | geplant |
| E16 | Tooltip-Pfeil links | aus E14 abgeleitet | geplant |
| E17 | Tooltip-Pfeil rechts | aus E14 abgeleitet | geplant |
| E18 | Benachrichtigungspunkt | ImageGen + CSS | geplant |

## F – Ökonomie- und Itemicons

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| F01 | Goldmünze | ImageGen + Alpha | geplant |
| F02 | Ether-Premiumkristall | ImageGen + Alpha | geplant |
| F03 | Monsterfragment | ImageGen + Alpha | geplant |
| F04 | Forschungsmaterial | ImageGen + Alpha | geplant |
| F05 | DNA-/Genressource | ImageGen + Alpha | geplant |
| F06 | Monsterei | vorhandene Assetfamilie + Fassung | geplant |
| F07 | Dreieck-Gem-Symbol | vorhandene Assetfamilie + Fassung | geplant |
| F08 | Quadrat-Gem-Symbol | vorhandene Assetfamilie + Fassung | geplant |
| F09 | Raute-Gem-Symbol | vorhandene Assetfamilie + Fassung | geplant |
| F10 | Hyperlevel-Fragment | ImageGen + Alpha | geplant |
| F11 | Evolutionskern | ImageGen + Alpha | geplant |
| F12 | Expeditionsmarke | ImageGen + Alpha | geplant |
| F13 | Gilden-Essenz | ImageGen + Alpha | geplant |
| F14 | Kampfmaterial | ImageGen + Alpha | geplant |
| F15 | Offline-Speicher | ImageGen + Alpha | geplant |
| F16 | Schlüssel-/Freischaltressource | ImageGen + Alpha | geplant |

## G – System- und Navigationsicons

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| G01 | Start/Kampf | ImageGen + Alpha | geplant |
| G02 | Weltkarte | ImageGen + Alpha | geplant |
| G03 | Monster/Habitat | ImageGen + Alpha | geplant |
| G04 | Brutstation | ImageGen + Alpha | geplant |
| G05 | Inventar | ImageGen + Alpha | geplant |
| G06 | Forschung | ImageGen + Alpha | geplant |
| G07 | Expedition | ImageGen + Alpha | geplant |
| G08 | Auftrag/Quest | ImageGen + Alpha | geplant |
| G09 | Prestige | ImageGen + Alpha | geplant |
| G10 | Gilde | ImageGen + Alpha | geplant |
| G11 | Gilden-DNA | ImageGen + Alpha | geplant |
| G12 | Freunde | ImageGen + Alpha | geplant |
| G13 | Chat | ImageGen + Alpha | geplant |
| G14 | Rangliste | ImageGen + Alpha | geplant |
| G15 | Profil | ImageGen + Alpha | geplant |
| G16 | Post | ImageGen + Alpha | geplant |
| G17 | Einstellungen | ImageGen + Alpha | geplant |
| G18 | Audio an | ImageGen + Alpha | geplant |
| G19 | Audio aus | aus G18 abgeleitet | geplant |
| G20 | Hilfe | ImageGen + Alpha | geplant |
| G21 | Information | ImageGen + Alpha | geplant |
| G22 | Warnung | ImageGen + Alpha | geplant |
| G23 | Erfolg/Haken | ImageGen + Alpha | geplant |
| G24 | Fehler | ImageGen + Alpha | geplant |
| G25 | Schließen | ImageGen + Alpha | geplant |
| G26 | Zurück | ImageGen + Alpha | geplant |
| G27 | Vorwärts | aus G26 abgeleitet | geplant |
| G28 | Hinzufügen | ImageGen + Alpha | geplant |
| G29 | Entfernen | ImageGen + Alpha | geplant |
| G30 | Sperre | ImageGen + Alpha | geplant |
| G31 | Filter | ImageGen + Alpha | geplant |
| G32 | Sortieren | ImageGen + Alpha | geplant |
| G33 | Suche | ImageGen + Alpha | geplant |
| G34 | Aktualisieren | ImageGen + Alpha | geplant |
| G35 | Menü | ImageGen + Alpha | geplant |
| G36 | Mehr/Optionen | ImageGen + Alpha | geplant |

## H – Identität und soziale Fassung

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| H01 | neutraler runder Avatarrahmen | ImageGen + Alpha | geplant |
| H02 | gewöhnlicher Avatarrahmen | ImageGen + Alpha | geplant |
| H03 | seltener Avatarrahmen | ImageGen + Alpha | geplant |
| H04 | epischer Avatarrahmen | ImageGen + Alpha | geplant |
| H05 | Gildenleiter-Aufsatz | ImageGen + Alpha | geplant |
| H06 | Offiziers-Aufsatz | ImageGen + Alpha | geplant |
| H07 | Online-Statusfassung | ImageGen + CSS | geplant |
| H08 | Rollenplakette Angriff | ImageGen + Alpha | geplant |
| H09 | Rollenplakette Verteidigung | ImageGen + Alpha | geplant |
| H10 | Rollenplakette Support | ImageGen + Alpha | geplant |
| H11 | Rangfassung klein | ImageGen + Alpha | geplant |
| H12 | Rangfassung groß | ImageGen + Alpha | geplant |

## Produktionszähler

- Grundelemente insgesamt: **144**
- Davon freigegeben: **1**
- Davon noch geplant: **143**
- Nächstes zulässiges Element: **A02 – dicke horizontale Rahmenkante**

Das Inventar kann später erweitert werden. Neue IDs werden jedoch nur ergänzt, wenn eine neue fachliche Form nicht durch Kombination, Rotation, 9-Slice, CSS-Zustand oder Ableitung abgedeckt werden kann.
