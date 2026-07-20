# Wirtschaft und Balance – Grundversion

## Zweck

Diese Tabelle ist die verbindliche Übersicht aller aktuellen Quellen und Senken. Die Zahlen sind ein erster spielbarer Balance-Pass, keine endgültige Live-Economy. Vor dem Onlinegang werden sie mit Telemetrie und serverseitigen Simulationen erneut geprüft.

| Bestand | Hauptquellen | Hauptsenken | Prestige |
| --- | --- | --- | --- |
| Run-Gold | Kämpfe, Offline-Speicher, Ziele, Zeit-Expeditionen, Systempost | normale Monsterlevel, Etherwerkstatt | wird auf 0 gesetzt |
| Prestige-Kerne | Prestige, einmalige Erfolge | permanente Forschung | bleibt |
| Art-Fragmente | Duplikat-Schlupf derselben Monsterart | Hyperlevel und Evolution derselben Art | bleibt |
| Trainingsdaten | Kampf, Offline-Speicher, Ziele, Expeditionen, Herstellung | ein normales Monsterlevel | bleibt als Item; erzeugtes Level wird zurückgesetzt |
| Evolutionskerne | Zonenbosse, Wochenziel, Expedition, Herstellung | drei pro erster Evolution | bleibt |
| Brutladungen | Kampf, Ziele, Expeditionen, Herstellung | 15 Sekunden Brutbeschleunigung | bleibt |
| Etherstaub | Kampf, Offline-Speicher, Ziele, Expeditionen, Systempost | feste Herstellrezepte | bleibt |
| Gems | normale seltene Drops, garantierter Bossdrop, Erfolge | kein Verbrauch; Belegung eines Form-Slots | bleibt |

## Feste Herstellrezepte

| Ergebnis | Kosten |
| --- | --- |
| 1 Trainingsdatum | 3 Etherstaub + 40 Gold |
| 1 Brutladung | 5 Etherstaub + 90 Gold |
| 1 Evolutionskern | 20 Etherstaub + 500 Gold |

Es gibt keinen Zufall, keine Fehlschlagchance und keinen frei kombinierbaren Input. Dadurch sind Kosten, Ausgabe und Ledger-Eintrag eindeutig.

## Zeit-Expeditionen

- zwei parallele Slots
- sechs Aufträge von 2 bis 90 Minuten
- Front, Support und bereits entsandte Monster sind ausgeschlossen
- Rolle, Element und vorhandene Evolution erhöhen den bei Start gespeicherten Gold- und Materialmultiplikator um jeweils 15 Prozent
- Ende und Belohnung entstehen aus festen Zeitstempeln; ein Auftrag wird beim Claim entfernt

## Automatische Sicherheitsprüfungen

- alle Katalog-IDs sind eindeutig
- jede Dauer, Ausgabe und jeder Preis ist positiv
- Kosten werden vor der Buchung vollständig geprüft
- wiederholte Ziel-, Systempost- und Expeditions-Claims zahlen nicht erneut aus
- das Offline-Zeitfenster wird direkt beim Laden gespeichert und kann durch schnellen Reload nicht erneut belohnt werden
- drei simulierte Prestige-Runs erhalten Gesamtsiege, Prestigezahl und permanente Kerne, ohne negative Bestände

## Spätere SQL-Regel

Jede wertverändernde Aktion wird eine einzige PostgreSQL-Transaktion. Sie sperrt die betroffenen Bestände, prüft Revision und `command_id`, bucht Quelle und Senke, schreibt den unveränderlichen Economy-Ledger und veröffentlicht erst dann den neuen Zustand. Der Browser sendet nur die gewünschte Aktion, niemals das berechnete Ergebnis.
