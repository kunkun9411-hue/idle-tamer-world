# Pre-Backend-Roadmap

Status: **abgeschlossen**. Die anschließenden Backend-, Online- und Launch-Phasen stehen in `PRODUCT_ROADMAP.md`.

## Ziel

Vor dem ersten echten Server soll Idle Tamer lokal wie ein vollständiges kleines Spiel funktionieren. Jede Aktion läuft bereits über dieselbe Service-Grenze, die später statt `localStorage` eine HTTP-API anspricht. Erst wenn Spielregeln, Kosten, Resetgrenzen und UI-Flows feststehen, wird die Serverautorität umgesetzt.

„Pre-Backend fertig“ bedeutet nicht, dass Gilde, PvP oder Handel lokal vorgetäuscht werden. Es bedeutet, dass alle allein spielbaren Kernsysteme vorhanden, testbar und wirtschaftlich miteinander verbunden sind.

## Bereits fertig

| System | Aktueller Stand |
| --- | --- |
| Einstieg | Login-Vorschau, Offline-Bericht, Starterwahl und direkter Kampfstart |
| Hauptkampf | automatisches 1-gegen-1, Normaltempo, zehn logische Zonen, 30 vorläufige Normalgegner-Designs, fünf Bosse |
| Teamwahl | Front, Support und zonenspezifische Rollenboni |
| Run-Fortschritt | Gold, normale Level, Stages und Kampfspeicher |
| Sammlung | zehn implementierte Rookie-Linien, artspezifische Eier und Erstfreischaltung; bestätigtes Ziel 40 Linien |
| Brut | Zeitjob, Beschleunigung, Duplikate und Art-Fragmente |
| Dauerhafte Monsterkraft | Hyperlevel, Evolution und Gem-Ausrüstung |
| Equipment | 45 Gems, drei Slots, Drops, Inventar und Grundwertboni |
| Prestige | eigene Ether-Kristall-Szene, klare Resetgrenzen und permanente Kerne |
| Account-Fortschritt | Forschung, Rang, Story-Meilensteine, Avatare und Rahmen |
| Aufträge | drei Tagesziele, drei Wochenziele, vier Erfolge, Perioden-IDs und Einmal-Claims |
| Zeit-Expeditionen | zwei Slots, sechs Missionen, Monsterbindung, Match-Boni und Zeitstempel |
| Herstellung | drei garantierte Etherstaub-Rezepte mit festen Quellen und Senken |
| Komfort | Vier-Schritt-Tutorial, Systempost, Audio, Effekte, Bewegung und Zahlenformat |
| Technik | Save v9, Migrationen, Offline-Replay-Schutz, API-Protokoll 8, eigener Balance-Vertrag und 44 Regel-/Vertragstests |

## Noch vor dem Backend

### Block A – Aufträge und Ziele (fertig)

- tägliche Aufträge aus vorhandenen Aktionen: Siege, Sammeln, Brut, Level, Boss
- wöchentliche Ziele mit längerer Progression
- permanente Erfolge und einmalige Belohnungen
- Claim-Zustand und eindeutige Perioden-ID, damit später kein Doppelclaim möglich ist
- sichtbare kompakte Auftragszentrale außerhalb der Kampfszene

Abgenommen: Alle Aufträge entstehen aus typisierten Aktivitätszählern. Tages- und Wochenwechsel setzen nur ihre Baseline neu; permanente Erfolge bleiben erhalten. Tests prüfen Fortschritt, Periodenwechsel, Migration und Einmal-Claim. Das API-Kommando übermittelt zusätzlich die Perioden-ID, damit der spätere Server veraltete Claims ablehnen kann.

### Block B – Zeit-Expeditionen (fertig)

- separate Monster für zeitlich begrenzte Missionen entsenden
- Rollen-, Element- oder Evolutionsanforderungen
- feste Dauer, Erfolgswert und Vorschau der möglichen Belohnung
- Monster bleibt im Besitz, ist währenddessen aber für andere Expeditionen gebunden
- zunächst zwei Slots; Forschung oder spätere Gildenboni dürfen erweitern

Abgenommen: Zwei Slots verwalten sechs Aufträge. Front, Support und bereits entsandte Monster sind ausgeschlossen. Der Belohnungsmultiplikator wird beim Start gespeichert; Claim entfernt den Zeitjob atomar und kann nicht wiederholt werden.

### Block C – Materialkreislauf (fertig)

- Etherstaub erhält einen echten Verbrauchszweck
- Herstellung oder Verbesserung klar definierter Verbrauchsgegenstände
- keine freie Zufalls-Crafting-Schleife ohne Kostenobergrenze
- Quellen und Senken jeder Währung werden in einer Wirtschaftstabelle dokumentiert
- Gem-Farben bleiben zunächst Spezialisierung, nicht zusätzliche lineare Seltenheitsstufen

Abgenommen: Etherstaub wird in drei festen, garantierten Rezepten verbraucht. Alle vier Materialien besitzen eine echte Verwendung. Quellen, Senken und SQL-Regeln stehen in `ECONOMY_BALANCE.md`.

### Block D – Spielerführung und Komfort (fertig)

- kurzes kontextuelles Tutorial statt langer Textwand
- Einstellungen für Ton, Effekte, reduzierte Bewegung und Zahlenformat
- Postfach-/Hinweiszentrale für Systembelohnungen; noch keine echten Spielermails
- vollständige Leer-, Fehler-, Lade- und Maximalzustände
- mobile Prüfung aller neuen Seiten

Abgenommen: Neue Accounts erhalten vier kurze kontextuelle Kampfschritte. Das Profil enthält lokale Systempost und wirksame Einstellungen für UI-Töne, Trefferfeedback, reduzierte Bewegung und kompaktes oder vollständiges Zahlenformat. Desktop und 390×844-Vorschau sind Teil des Browser-Smokes.

### Block E – Balance und Release-Sicherheit (fertig)

- Simulationsläufe für erste Stunde, ersten Tag und mehrere Prestige-Runs
- Quellen-/Senkenbericht für Gold, Fragmente, Kerne, Gems und Materialien
- keine negative Währung und keine doppelte Belohnung bei wiederholter Aktion
- Save-Migrationstest für jede neue Schema-Version
- vollständiger Browser-Smoke für den tatsächlichen Spielerablauf

Abgenommen: Katalog- und Wirtschaftsinvarianten, ein 24-Stunden-Offlinefall mit Acht-Stunden-Grenze, der 500-Siege-Bogen und drei vollständige Prestige-Runs laufen automatisiert. Wiederholte Claims, unzureichende Kosten und schneller Offline-Reload zahlen nicht doppelt aus.

## Erst in der Backend-Phase

Diese Systeme benötigen echte Spieler, zentrale Zeit oder gemeinsame Autorität und werden nicht lokal gefälscht:

- Registrierung, Login, Sessionverwaltung und Accountwiederherstellung
- serverautoritärer Kampf, Offline-Ertrag und Belohnungsberechnung
- Gilden, Mitglieder, Rollen, Gilden-DNA und Gildenbosse
- PvP, Ranglisten und Match-Historie
- Handel, Marktplatz und Spielertransaktionen
- Chat, Freundesliste, Post zwischen Spielern und Moderation
- Live-Events, Saisons, globale Ziele und Admin-Werkzeuge

## Verbindliche Reihenfolge

1. ~~Aufträge und Erfolge~~ – fertig
2. ~~Zeit-Expeditionen~~ – fertig
3. ~~Materialkreislauf~~ – fertig
4. ~~Tutorial, Einstellungen und Systempost~~ – fertig
5. ~~Balance-/Missbrauchssimulation und Pre-Backend-Abnahme~~ – fertig
6. PostgreSQL, Accounts und Serverautorität – nächster großer Meilenstein

Diese Reihenfolge verhindert, dass während der teuren Backend-Arbeit ständig Tabellen, Transaktionen und API-Kommandos wegen noch ungeklärter Spielregeln umgebaut werden müssen.
