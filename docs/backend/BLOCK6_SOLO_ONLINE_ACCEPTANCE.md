# Block 6 – Solo-Online-Abnahme

Stand: 22. Juli 2026

## Ergebnis

Die komplette allein spielbare Alpha verwendet für wertrelevanten Zustand PostgreSQL. Der Browser sendet nur Absichten und ersetzt seine sichtbare Sammlung nach jeder Antwort durch den autoritativen Snapshot. `localStorage` enthält für Online-Accounts nur Komfortzustand, Browserinstanz und ein getrenntes Cache-Namespace.

## Autoritative Systeme

- Monsterinstanzen, aktive Front und Support
- Run-Level, Gold, Zonen, Kampfspeicher und Offline-Abrechnung
- Eier, Ei-Pity, Brutzeit, Erstfund und Duplikat-Fragmente
- Hyperlevel, Evolutionen, Gems und Forschung
- Tages-/Wochenziele, Meilensteine, Story- und Systempost-Claims
- zwei Zeit-Expeditionsslots und Herstellung
- Prestige ab Zone 10 und 100 Run-Siegen mit vollständiger Erhalteliste
- Avatar, Rahmen und Komforteinstellungen

Run-Vertrag 2 liefert den gesamten Sammlungszustand. Zeit wird ausschließlich aus Serverzeit berechnet. Kommando-ID plus Request-Hash liefern Idempotenz; die Run-Revision verhindert konkurrierende Änderungen aus mehreren Tabs.

## Prestige-Erhalt

Zurückgesetzt werden Run-Gold, normale Level, aktuelle Zone/Stage und Run-Siege. Erhalten bleiben Monsterbesitz, Hyperlevel, Evolutionen, Gems, Eier, Fragmente, Inventar, Forschung, Prestige-Kerne, laufende Zeitjobs, Claims und höchste erreichte Zone.

## Betrieb und interne Werkzeuge

- Nur-Lese-Supportbericht: `pnpm support:account -- --email …`
- interne Contentübersicht: `GET /api/v1/internal/content`
- nur Admin: `POST /api/v1/internal/content/preview|activate|rollback`
- jede Vorschau, Aktivierung und Rücksetzung landet in `content_release_audit`
- Releasezeilen sind unveränderliche Versionen; Aktivierung setzt nur den aktiven Zeiger um

Interne HTTP-Werkzeuge benötigen eine aktive Session, die passende SQL-Rolle, Same-Origin, CSRF bei Änderungen und ein eigenes Rate-Limit. Sie besitzen keine UI in der Spieleroberfläche.

## Prüfnachweise

Die isolierte PostgreSQL-18-Suite prüft:

- parallele identische und unterschiedliche Kommandos
- sehr große `numeric(78,0)`-Werte ohne JavaScript-Rundung
- Zone-10-/100-Siege-Prestigegrenze
- Erst- und Duplikatschlupf genau einmal
- Erhalt von Hyperlevel, Evolution und Gems nach Prestige
- doppelte Claims, Brut und Expeditionsmonster
- Content-Vorschau, Aktivierung, Rollback und Audit

Integrationstests akzeptieren ausschließlich Datenbanknamen mit `_test` oder `_ci`. Die Produktionsdatenbank wird von der Testschranke technisch abgewiesen.

## Wiederherstellung

Vor der Block-6-Migration wurde ein PostgreSQL-Dump erstellt und die Wiederherstellung praktisch ausgeführt. Als ein früher Testlauf versehentlich die Produktionsdatenbank erreichte, wurde die API gestoppt, der unmittelbar vorher erzeugte Dump restauriert und beide vorhandenen Accounts nachgezählt. Anschließend wurde die harte `_test`-/`_ci`-Sperre ergänzt. Der Vorfall und die Schutzmaßnahme werden bewusst nicht verschwiegen.

