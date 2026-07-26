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
| A02 | dicke horizontale Rahmenkante | ImageGen + Alpha | freigegeben |
| A03 | dicke vertikale Rahmenkante | aus A02 abgeleitet | freigegeben |
| A04 | dünne horizontale Rahmenkante | ImageGen + Alpha | freigegeben |
| A05 | dünne vertikale Rahmenkante | aus A04 abgeleitet | freigegeben |
| A06 | kompakte Kartenrahmenecke | ImageGen + Alpha | freigegeben |
| A07 | minimale Tooltip-Rahmenecke | ImageGen + Alpha | freigegeben |
| A08 | horizontaler gerader Verbinder | ImageGen + Alpha | freigegeben |
| A09 | vertikaler gerader Verbinder | aus A08 abgeleitet | abgeleitet |
| A10 | horizontaler verzierter Verbinder | ImageGen + Alpha | freigegeben |
| A11 | vertikaler verzierter Verbinder | aus A10 abgeleitet | abgeleitet |
| A12 | horizontale Endkappe | ImageGen + Alpha | freigegeben |
| A13 | vertikale Endkappe | aus A12 abgeleitet | abgeleitet |
| A14 | T-Verbindung für verschachtelte Flächen | ImageGen + Alpha | freigegeben |
| A15 | Fokus-Eckaufsatz | ImageGen + Alpha | freigegeben |
| A16 | Warnungs-Eckaufsatz | ImageGen + Alpha | freigegeben |
| A17 | kompakter Ether-Trenner | ImageGen + Alpha | freigegeben |
| A18 | kleine Ether-Niete | ImageGen + Alpha | freigegeben |

## B – Flächen und Material

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| B01 | ruhige Fensterfläche | ImageGen, nahtlos | freigegeben |
| B02 | erhöhte Kartenfläche | ImageGen, 9-Slice | freigegeben |
| B03 | kompakte Kartenfläche | ImageGen, 9-Slice | freigegeben |
| B04 | Tooltipfläche | ImageGen, 9-Slice | freigegeben |
| B05 | Eingabefläche | ImageGen, 9-Slice | freigegeben |
| B06 | Dropdownfläche | ImageGen, 9-Slice | freigegeben |
| B07 | gesperrte Flächenauflage | ImageGen + CSS | freigegeben |
| B08 | Hover-Lichtauflage | ImageGen + Alpha | freigegeben |
| B09 | Fokus-Lichtauflage | ImageGen + Alpha | freigegeben |
| B10 | Auswahl-Lichtauflage | ImageGen + Alpha | freigegeben |
| B11 | Fehler-Lichtauflage | ImageGen + Alpha | freigegeben |
| B12 | Erfolg-Lichtauflage | ImageGen + Alpha | freigegeben |
| B13 | subtile Glasrauschtextur | ImageGen, nahtlos | freigegeben |
| B14 | tiefe Graphittextur | ImageGen, nahtlos | freigegeben |

## C – Leisten, Trenner und Ornamente

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| C01 | große Kopfleistenschale | ImageGen + Alpha | freigegeben |
| C02 | kompakte Kopfleistenschale | ImageGen + Alpha | freigegeben |
| C03 | Fußleistenschale | ImageGen + Alpha | freigegeben |
| C04 | dünner Ether-Trenner | ImageGen + Alpha | freigegeben |
| C05 | dicker Ether-Trenner | ImageGen + Alpha | freigegeben |
| C06 | kurzer symmetrischer Trenner | ImageGen + Alpha | freigegeben |
| C07 | aktiver Tab-Unterstrich | ImageGen + Alpha | freigegeben |
| C08 | aktiver Seitenmarker | ImageGen + Alpha | freigegeben |
| C09 | zentraler Fokusdiamant | ImageGen + Alpha | freigegeben |
| C10 | kleine Eckniete | ImageGen + Alpha | freigegeben |
| C11 | Kristallfassung klein | ImageGen + Alpha | freigegeben |
| C12 | Kristallfassung groß | ImageGen + Alpha | freigegeben |
| C13 | passive Etherlinie | ImageGen + Alpha | freigegeben |
| C14 | aktive Etherlinie | ImageGen + Alpha | freigegeben |
| C15 | Warnungsleiste | ImageGen + Alpha | freigegeben |
| C16 | Erfolgsleiste | ImageGen + Alpha | freigegeben |

## D – Aktionen und Steuerung

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| D01 | primärer Buttonrahmen | ImageGen, 9-Slice | freigegeben |
| D02 | sekundärer Buttonrahmen | ImageGen, 9-Slice | freigegeben |
| D03 | Ghost-Buttonrahmen | ImageGen, 9-Slice | freigegeben |
| D04 | kompakter Buttonrahmen | ImageGen, 9-Slice | freigegeben |
| D05 | Gefahren-Buttonrahmen | ImageGen, 9-Slice | freigegeben |
| D06 | Icon-Buttonfassung rund | ImageGen + Alpha | freigegeben |
| D07 | Icon-Buttonfassung eckig | ImageGen + Alpha | freigegeben |
| D08 | Tabrahmen Standard | ImageGen, 9-Slice | freigegeben |
| D09 | Tabrahmen aktiv | ImageGen, 9-Slice | freigegeben |
| D10 | Segmentsteuerung außen | ImageGen, 9-Slice | freigegeben |
| D11 | Toggle-Schiene | ImageGen, 9-Slice | freigegeben |
| D12 | Toggle-Knopf | ImageGen + Alpha | freigegeben |
| D13 | Slider-Schiene | ImageGen, 9-Slice | freigegeben |
| D14 | Slider-Griff | ImageGen + Alpha | freigegeben |
| D15 | Checkboxfassung | ImageGen + Alpha | freigegeben |
| D16 | Radiobuttonfassung | ImageGen + Alpha | freigegeben |

Interaktionszustände wie Hover, Fokus, gedrückt und deaktiviert werden bevorzugt durch CSS-Licht, Farbe und Bewegung auf diesen Grundformen erzeugt. Ein neues Rasterasset entsteht nur, wenn sich die Silhouette ändert.

## E – Information, Werte und Fortschritt

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| E01 | Ressourcen-Chiprahmen | ImageGen, 9-Slice | freigegeben |
| E02 | Wertplakette | ImageGen, 9-Slice | freigegeben |
| E03 | Kostenplakette | ImageGen, 9-Slice | freigegeben |
| E04 | Kapazitätsplakette | ImageGen, 9-Slice | freigegeben |
| E05 | Statusbadge neutral | ImageGen, 9-Slice | freigegeben |
| E06 | Statusbadge aktiv | CSS-Variante von E05 | freigegeben |
| E07 | Statusbadge Warnung | CSS-Variante von E05 | freigegeben |
| E08 | Statusbadge Fehler | CSS-Variante von E05 | freigegeben |
| E09 | horizontale Fortschrittsfassung | ImageGen, 9-Slice | freigegeben |
| E10 | kompakte Fortschrittsfassung | ImageGen, 9-Slice | freigegeben |
| E11 | runde Fortschrittsfassung | ImageGen + Alpha | freigegeben |
| E12 | Fortschrittsfüllung neutral | CSS + Textur | freigegeben |
| E13 | Fortschrittsfüllung Ether | CSS + Textur | freigegeben |
| E14 | Tooltip-Pfeil oben | ImageGen + Alpha | freigegeben |
| E15 | Tooltip-Pfeil unten | aus E14 abgeleitet | freigegeben |
| E16 | Tooltip-Pfeil links | aus E14 abgeleitet | freigegeben |
| E17 | Tooltip-Pfeil rechts | aus E14 abgeleitet | freigegeben |
| E18 | Benachrichtigungspunkt | ImageGen + CSS | freigegeben |

## F – Ökonomie- und Itemicons

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| F01 | Goldmünze | ImageGen + Alpha | freigegeben |
| F02 | Ether-Premiumkristall | ImageGen + Alpha | freigegeben |
| F03 | Monsterfragment | ImageGen + Alpha | freigegeben |
| F04 | Forschungsmaterial | ImageGen + Alpha | freigegeben |
| F05 | DNA-/Genressource | ImageGen + Alpha | freigegeben |
| F06 | Monsterei | vorhandene Assetfamilie + Fassung | freigegeben |
| F07 | Dreieck-Gem-Symbol | vorhandene Assetfamilie + Fassung | freigegeben |
| F08 | Quadrat-Gem-Symbol | vorhandene Assetfamilie + Fassung | freigegeben |
| F09 | Raute-Gem-Symbol | vorhandene Assetfamilie + Fassung | freigegeben |
| F10 | Hyperlevel-Fragment | ImageGen + Alpha | freigegeben |
| F11 | Evolutionskern | ImageGen + Alpha | freigegeben |
| F12 | Expeditionsmarke | ImageGen + Alpha | freigegeben |
| F13 | Gilden-Essenz | ImageGen + Alpha | freigegeben |
| F14 | Kampfmaterial | ImageGen + Alpha | freigegeben |
| F15 | Offline-Speicher | ImageGen + Alpha | freigegeben |
| F16 | Schlüssel-/Freischaltressource | ImageGen + Alpha | freigegeben |

## G – System- und Navigationsicons

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| G01 | Start/Kampf | ImageGen + Alpha | freigegeben |
| G02 | Weltkarte | ImageGen + Alpha | freigegeben |
| G03 | Monster/Habitat | ImageGen + Alpha | freigegeben |
| G04 | Brutstation | ImageGen + Alpha | freigegeben |
| G05 | Inventar | ImageGen + Alpha | freigegeben |
| G06 | Forschung | ImageGen + Alpha | freigegeben |
| G07 | Expedition | ImageGen + Alpha | freigegeben |
| G08 | Auftrag/Quest | ImageGen + Alpha | freigegeben |
| G09 | Prestige | ImageGen + Alpha | freigegeben |
| G10 | Gilde | ImageGen + Alpha | freigegeben |
| G11 | Gilden-DNA | ImageGen + Alpha | freigegeben |
| G12 | Freunde | ImageGen + Alpha | freigegeben |
| G13 | Chat | ImageGen + Alpha | freigegeben |
| G14 | Rangliste | ImageGen + Alpha | freigegeben |
| G15 | Profil | ImageGen + Alpha | freigegeben |
| G16 | Post | ImageGen + Alpha | freigegeben |
| G17 | Einstellungen | ImageGen + Alpha | freigegeben |
| G18 | Audio an | ImageGen + Alpha | freigegeben |
| G19 | Audio aus | aus G18 abgeleitet | freigegeben |
| G20 | Hilfe | ImageGen + Alpha | freigegeben |
| G21 | Information | ImageGen + Alpha | freigegeben |
| G22 | Warnung | ImageGen + Alpha | freigegeben |
| G23 | Erfolg/Haken | ImageGen + Alpha | freigegeben |
| G24 | Fehler | ImageGen + Alpha | freigegeben |
| G25 | Schließen | ImageGen + Alpha | freigegeben |
| G26 | Zurück | ImageGen + Alpha | freigegeben |
| G27 | Vorwärts | aus G26 abgeleitet | freigegeben |
| G28 | Hinzufügen | ImageGen + Alpha | freigegeben |
| G29 | Entfernen | ImageGen + Alpha | freigegeben |
| G30 | Sperre | ImageGen + Alpha | freigegeben |
| G31 | Filter | ImageGen + Alpha | freigegeben |
| G32 | Sortieren | ImageGen + Alpha | freigegeben |
| G33 | Suche | ImageGen + Alpha | freigegeben |
| G34 | Aktualisieren | ImageGen + Alpha | freigegeben |
| G35 | Menü | ImageGen + Alpha | freigegeben |
| G36 | Mehr/Optionen | ImageGen + Alpha | freigegeben |

## H – Identität und soziale Fassung

| ID | Element | Medium | Status |
| --- | --- | --- | --- |
| H01 | neutraler runder Avatarrahmen | ImageGen + Alpha | freigegeben |
| H02 | gewöhnlicher Avatarrahmen | ImageGen + Alpha | freigegeben |
| H03 | seltener Avatarrahmen | ImageGen + Alpha | freigegeben |
| H04 | epischer Avatarrahmen | ImageGen + Alpha | freigegeben |
| H05 | Gildenleiter-Aufsatz | ImageGen + Alpha | freigegeben |
| H06 | Offiziers-Aufsatz | ImageGen + Alpha | freigegeben |
| H07 | Online-Statusfassung | ImageGen + CSS | freigegeben |
| H08 | Rollenplakette Angriff | ImageGen + Alpha | freigegeben |
| H09 | Rollenplakette Verteidigung | ImageGen + Alpha | freigegeben |
| H10 | Rollenplakette Support | ImageGen + Alpha | freigegeben |
| H11 | Rangfassung klein | ImageGen + Alpha | freigegeben |
| H12 | Rangfassung groß | ImageGen + Alpha | freigegeben |

## Produktionszähler

- Grundelemente insgesamt: **146**
- Davon freigegeben: **146** (136 Raster, 10 CSS-/Rotationsableitungen)
- Davon noch geplant: **0**
- Nächstes zulässiges Element: **serielle Liste abgeschlossen · B.01.4-Abnahme**

Das Inventar kann später erweitert werden. Neue IDs werden jedoch nur ergänzt, wenn eine neue fachliche Form nicht durch Kombination, Rotation, 9-Slice, CSS-Zustand oder Ableitung abgedeckt werden kann.
## Produktionsbatch 2026-07-25 - B.01.2

Der erste modulare Ausbau ist jetzt im Repository freigegeben und im UI-Katalog sichtbar.

- Rahmen A08-A18: Verbinder, Endkappen, T-Verbindung, Fokus-/Warnaufsatze, Trenner und Niete.
- Okonomie F01-F16: textfreie Ressourcen-, Ei- und Gem-Icons.
- System G01-G36: textfreie Navigation, Profil-, Sozial-, Gilden-, Audio-, Informations-, Warnungs-, Erfolgs-, Fehler-, Hilfe-, Sperr-, Filter-, Sortier-, Such-, Aktualisierungs-, Menü- und Options-Icons.

Damit sind **136 reale Runtime-Elemente** im Manifest `apps/web/public/assets/ui/kit/ui-kit-manifest.json` enthalten: 18 Rahmen, 14 Flächen, 42 Leisten-/Aktions-/Wertprimitive, 16 Ökonomie-Icons, 34 System-Icons und 12 Identitätsbausteine. Master liegen unter `art-source/generated/ui-kit-v1/transparent/`; Chroma-Quellen bleiben unter `art-source/generated/ui-kit-v1/chroma/` erhalten. Oberflächen, Beschriftungen und Zustände bleiben HTML/CSS.
