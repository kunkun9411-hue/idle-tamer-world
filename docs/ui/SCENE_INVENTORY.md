# UI- und Szeneninventar

Stand: 22. Juli 2026  
Status: **A.08.1 abgenommen – Ausgangsbasis für Roadmap B**

## Zweck

Dieses Dokument hält fest, welche sichtbaren Flächen bereits existieren, welche Zustände sie besitzen und welche UX-Schulden Roadmap B gezielt beheben muss. Es bewertet keine Spiellogik neu und verlagert keine serverautoritative Entscheidung in den Browser.

Geprüft wurden der aktuelle Quellstand, die vorhandenen Browsertests und der echte lokale Build auf **1280×720** sowie **390×844**. Die Live-Roadmap wurde zusätzlich auf Desktop und Mobile geprüft.

## Prioritäten

| Priorität | Bedeutung |
| --- | --- |
| **P0** | blockiert eine Kernaktion oder macht eine Navigation unzuverlässig; vor Abnahme des zugehörigen B-Blocks zwingend beheben |
| **P1** | deutliches Lesbarkeits-, Hierarchie- oder Responsive-Problem; im vorgesehenen B-Block beheben |
| **P2** | sichtbarer Polish- und Konsistenzpunkt; spätestens in B.08 abschließen |

## Vollständiges Flächeninventar

| ID | Fläche | Vorhandene Kernzustände | Roadmap-B-Ziel |
| --- | --- | --- | --- |
| **S01** | Login und Registrierung | Login, Registrierung, Verarbeitung, Auth-Meldung, lokale/Online-Kennung, Löschhinweis | B.02/B.07: klarer Account-Einstieg, Recovery und mobile Lesbarkeit |
| **S02** | Starterwahl | zehn Rookie-Karten, Evolution-Vorschau, Speichern, Schließen, leere Sammlung | B.04: bessere Vergleichbarkeit ohne Informationsüberladung |
| **S03** | Offline-Bericht | Zeit, Gold, Materialien, Speicherplätze, voller/leerer Claim, weiter ohne Claim | B.01/B.03: lesbare Werte und eindeutige Ressourcensymbole |
| **S04** | Hauptkampfszene | Normalgegner, Boss, Regeneration, Treffer, Zonenwechsel, gesperrte Zone, Fokusmodus | B.03: Kampf bleibt dominante Hauptszene |
| **S05** | Kampf-HUD | Ziele, Beute, Duo, Front, Kampflog, Tutorial, Prestigezugang | B.02/B.03: Navigation und HUD ohne Überlagerung oder Rätselraten |
| **S06** | Auftragszentrale | täglich, wöchentlich, Erfolge, unvollständig, bereit, geborgen | B.04: Fortschritt und Claim-Priorität auf einen Blick |
| **S07** | Zeit-Expeditionen | zwei Slots, frei, aktiv, bereit, Monsterwahl, Rollen-/Elementbonus | B.04: Auswahl, Bindung und Rückkehr verständlich gruppieren |
| **S08** | Monster-Habitat und Gems | Starter-Gate, Front, Support, Roster, Run-Level, Hyperlevel, Evolution, drei Gemformen, leer/belegt | B.04: Monster zuerst, Detailarbeit kontextuell statt als lange Wand |
| **S09** | Brutstation | leer, Eiauswahl, aktiv, beschleunigen, bereit, Erstschlupf, Duplikat/Fragmente | B.04: Ei → Schlupf → Fragment visuell als Kreislauf erzählen |
| **S10** | Inventar und Etherwerkstatt | vier Materialien, Mengen, Rezepte, bezahlbar/gesperrt, Gem-Verweis | B.04: Besitz, Quelle und Verwendung klar trennen |
| **S11** | Ether-Forschung | vier Forschungszweige, Kosten, Stufen, bezahlbar/maximal | B.04: permanente Wirkung stärker von Run-Upgrades unterscheiden |
| **S12** | Prestige-Heiligtum | Zone gesperrt, Kristallladung, bereit, Reset-Ledger, Aktivierungsanimation | B.04/B.08: Konsequenzen und Erhalt vor Bestätigung maximal eindeutig |
| **S13** | Tamer-Profil | Profilstatus, Systempost, Einstellungen, Accountaktionen, sechs Avatare, fünf Rahmen | B.05: echte Profilbilder und Rahmen ins Zentrum der Identität rücken |
| **S14** | Gilde und Soziales | Feature aus, keine Gilde, Erstellen/Beitreten, DNA, Boss, Aufgaben, Expedition, Abstimmung, Mitglieder, Chat, Freunde, Moderation | B.06: große Oberfläche in verständliche Teilbereiche gliedern |
| **S15** | Globale Systemzustände | `local`, `loading`, `online`, `offline`, `conflict`, `error`, Syncstatus, Toast, Dialogfokus | B.01/B.07: einheitliche Statussprache und vollständige Tastaturführung |
| **S16** | Entwicklungsflächen | lokales QA-Panel, feste Mobile-Vorschau, Asset-Galerie, öffentliche Roadmap | A.08.2/B.01: reproduzierbare Screenshots und Zustandskatalog statt Handarbeit |

## Gemessene UX-Schulden

| Prio | Befund | Beleg | Zuständig | Fertig, wenn … |
| --- | --- | --- | --- | --- |
| **P0** | Mobile Bereichsnavigation und Kampf-HUD überlagern sich. Sieben `.combat-rail`-Einträge umbrechen bei 390 px in eine zweite Reihe, während `.combat-control-dock` denselben Bereich belegt. Ein Klick auf „Monster“ kann dadurch „Beute“ öffnen. | 390×844: Bereichsbuttons bei `y=735`, Kampf-Dock gleichzeitig in derselben Zeile; nur „Gilde“ landet sichtbar in Reihe zwei | B.02/B.03 | alle sieben Spielbereiche und sechs Kampfkontrollen besitzen getrennte, klickbare 44-px-Ziele ohne Überschneidung |
| **P1** | Die Accountleiste überschreitet auf Unterseiten bei 1280 px den rechten Viewport um rund 8 px. | `.topbar__account` endet bei `x=1288` in einem 1280-px-Viewport | B.02/B.07 | 1280, 1024, 900, 620 und 390 px haben weder geometrischen noch scrollbar-auslösenden Überlauf |
| **P1** | Zahlreiche Meta- und Navigationsschriften liegen bei nur 5–8 px. Sie sind technisch vorhanden, aber auf Laptop und Mobile schwer lesbar. | Kampf-Dock, mobile Bereichsnavigation, Offline-Karten und technische Fußzeile | B.01/B.07 | kleinste reguläre Information erreicht den beschlossenen lesbaren Token und besteht Kontrast-/Zoomprüfung |
| **P1** | Im Offline-Bericht erscheinen Material- und Speicher-Symbole dunkel auf dunklem Grund. | sichtbarer 1280×720-Offline-Bericht | B.01 | jedes Ressourcensymbol bleibt in Normal-, Hover-, Disabled- und Kontrastzustand erkennbar |
| **P1** | Habitat und Profil beginnen mit sehr großen Introflächen. Auf 720 px sind Monsterkarten beziehungsweise Avatar-/Rahmenwahl zunächst unterhalb des sichtbaren Bereichs. | Habitat-Seitenhöhe 1863 px; Profil 1804 px | B.04/B.05 | primäre Aufgabe der Seite ist im ersten Viewport sichtbar oder direkt erreichbar |
| **P1** | Profilidentität besteht aktuell aus Buchstaben-Glyphen. Avatar und Rahmen sind getrennt gespeichert, wirken aber noch nicht wie sammelbare Profilbilder. | sechs Glyph-Avatare, fünf Rahmen; aktives Profil zeigt „W“ | B.05 | runde Bildavatare, Rahmenvorschau, Sperrgrund und aktive Kombination sind sofort erkennbar |
| **P1** | Passwort vergessen ist im Login sichtbar, aber deaktiviert, obwohl der Backend-Recoveryfluss existiert. | deaktivierter Button im Login; Recovery-Endpunkte und E-Mail-Fluss sind vorhanden | B.02 | Recovery ist vollständig bedienbar und besitzt Erfolg-, Rate-Limit- und Fehlerzustände |
| **P1** | Die Gildenansicht vereint DNA, Boss, Aufgaben, Expedition, Abstimmungen, Mitglieder, Chat, Freunde und Moderation in einer langen Oberfläche. | aktueller `guildView()`-Aufbau | B.06 | Übersicht und Teilbereiche besitzen klare Navigation, Priorität und eigene Leer-/Fehlerzustände |
| **P2** | Desktop-Seitenleiste im Kampf zeigt Bezeichnungen hauptsächlich bei Hover. | `.combat-rail` mit ausblendenden Labels | B.02/B.03 | Erstnutzer erkennen Kernziele ohne Hover oder Erinnerungswissen |
| **P2** | Viele Überschriften und Metadaten verwenden gleichzeitig Versalien, hohe Laufweite und sehr kleine Schrift. | alle Unterseiten und HUD-Karten | B.01/B.08 | Typografie besitzt höchstens drei klar getrennte Hierarchiestufen pro Kartenbereich |

## Zustandsabdeckung für die spätere Abnahme

Jede Roadmap-B-Fläche muss mindestens diese Zustände besitzen:

1. **Standard** – geladene Oberfläche mit echten Daten.
2. **Laden** – keine springende Struktur und keine doppelte Aktion.
3. **Leer** – erklärt Ursache und nächsten sinnvollen Schritt.
4. **Gesperrt/Disabled** – nennt Bedingung statt nur grau zu werden.
5. **Fehler/Offline** – bewahrt Eingaben und bietet eine konkrete Wiederholung.
6. **Konflikt** – verhindert, dass ein älterer Stand einen neueren überschreibt.
7. **Erfolg/Claim** – bestätigt sichtbar, was sich verändert hat.
8. **Maximal/Voll** – erklärt Kapazität, nächste Senke oder fehlenden Fortschrittsweg.
9. **Desktop und Mobile** – mindestens 1280×720, 1024×768 und 390×844.
10. **Tastatur und reduzierte Bewegung** – Fokus bleibt sichtbar; Information hängt nicht von Animation ab.

## Technische Verträge, die Roadmap B nicht brechen darf

- Die zehn Werte des `View`-Vertrags und die `data-view`-Navigation bleiben semantisch erhalten oder werden samt Tests bewusst migriert.
- Gold, Besitz, Zeitjobs, Progression, Prestige und Gildenaktionen bleiben serverautoritativ. UI-Zustände dürfen keine Ergebnisse vorab erfinden.
- API-Protokoll 8, Revisionen, Idempotency Keys und bestehende `data-testid`-Kernpfade bleiben bis zu einer ausdrücklich versionierten Migration stabil.
- Avatar-ID und Rahmen-ID bleiben getrennte Katalogwerte; ein neues Bild ersetzt nicht den Datenvertrag.
- Monster- und Itemdarstellungen bleiben HD. Animierbare Monster-Frames folgen weiterhin dem 200×200-PixelLab-Vertrag.
- `?ui-state=loading|online|offline|conflict|error` bleibt als reproduzierbarer Entwicklungszugang erhalten.
- Fokusfalle, Escape-Verhalten, `aria-modal`, Kontrastprüfung und `prefers-reduced-motion` bleiben Teil der automatischen Abnahme.

## Arbeitsreihenfolge für Roadmap B

1. **B.01:** Typografie, Tokens, Ressourcensymbole und Komponentenzustände vereinheitlichen.
2. **B.02:** P0-Navigationskollision beheben und Informationsarchitektur festziehen.
3. **B.03:** Kampf-HUD auf Desktop und Mobile neu staffeln, ohne den Kampffokus zu verlieren.
4. **B.04:** Habitat, Brut, Inventar, Forschung, Aufträge, Expeditionen und Prestige auf Kernaktionen reduzieren.
5. **B.05:** echte runde Avatarbilder und wechselbare Rahmen als sichtbare Tamer-Identität umsetzen.
6. **B.06:** Gilden-DNA und Sozialfunktionen in eine klare Bereichsstruktur zerlegen.
7. **B.07:** Viewport-, Zoom-, Kontrast-, Fokus- und Bewegungsabnahme automatisieren.
8. **B.08:** Animation, Feedback, Benennung und visuelle Konsistenz im Gesamtlauf abnehmen.

## Ergebnis A.08.1

Die Grenze ist klar: Roadmap A liefert funktionierende Systeme und stabile Verträge; Roadmap B übernimmt Darstellung, Navigation und Lesbarkeit. PvP, Handel, Saisons, Events und zusätzlicher Content bleiben Roadmap C. Die externe Alpha bleibt bis nach Roadmap D geschlossen.
