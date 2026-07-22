# A.08 – Gesamtprüfung des Systemfundaments

Stand: 22. Juli 2026

## Ergebnis

Roadmap A, Block 8, Schritt 3 ist bestanden. Das technische Fundament wurde lokal, gegen PostgreSQL 18 und auf der echten Entwicklungsdomain erneut geprüft. Die Prüfung hat keine verlorenen Bestände, Doppelbuchungen, Versionsabweichungen oder verbleibenden QA-Daten festgestellt.

Die Alpha bleibt ausdrücklich geschlossen. Nach der formalen Abnahme von A.08 beginnt Roadmap B ausschließlich mit Design, Interface und Lesbarkeit.

## Automatische Gesamtregression

- `pnpm check:all` grün
- 60 Web-, 24 API-, 9 Datenbank- und 6 Game-Core-Tests grün
- 16 reguläre Chromium-Abläufe grün; der separate Live-Account-Test bleibt ohne kurzlebige Zugangsdaten bewusst übersprungen
- Produktionsbuild für Web, API, Datenbank und gemeinsame Pakete grün
- 117 Runtime-Assets samt IDs, Maßen, Größen und SHA-256-Prüfsummen gültig
- Roadmapvertrag mit 8 Blöcken und 32 Gates gültig

Zusätzlich liefen 26 echte PostgreSQL-18-Integrationsfälle in der isolierten Datenbank `idle_tamer_test`:

- 4 Transaktions-, Constraint-, Idempotenz- und Rollbackfälle
- 7 Account-, Session- und Löschfälle
- 8 Run-, Offline-, Sammlung-, Gem-, Evolution- und Prestigefälle
- 7 Gilden-, DNA-, Boss-, Expeditions-, Chat- und Moderationsfälle

Die Testdatenbankschranke akzeptiert ausschließlich Datenbanknamen mit `_test` oder `_ci`.

## Live-Smoke auf der Entwicklungsdomain

Ein neuer synthetischer QA-Account durchlief im Browser:

1. Registrierung und Bestätigung über die private Entwicklungs-Mailbox;
2. Login und einmalige Starterwahl;
3. automatischen Kampf und serverbestätigtes Run-Level;
4. Sammlung und dauerhaft gespeicherte Gem-Ausrüstung;
5. Gildengründung, DNA-Spende und append-only Gilden-Ledger;
6. Wochenboss, gemeinsame Expedition und moderierten Gildenchat;
7. Reload mit erneutem serverseitigem Zustand.

Danach wurden Account, Gilde, Ledger-, Kampf-, Chat- und Mailboxdaten in einer gezielten Transaktion entfernt. Die Kontrollzählung ergab wieder exakt zwei vorher vorhandene Accounts, null A.08-QA-Accounts und null A.08-QA-Gilden.

## Backup, Restore und Neustart

- täglicher systemd-Backup-Timer: aktiviert und aktiv
- manueller Dump `idle-tamer-20260722T041002Z.sql.gz`: erfolgreich und gzip-validiert
- Restore in eine neue Datenbank: erfolgreich
- fünf Migrationen im Restore vorhanden
- Healthcheck, Revision, Beispielbestand und Ledgerbuchung im Restore konsistent
- temporäre Restore-Datenbank anschließend entfernt
- produktiver Migrationslauf: `No migrations to run`
- vollständiger Dev-Server-Neustart: erfolgreich
- Docker, PostgreSQL, API, Web, Proxy und Backup-Timer kamen automatisch zurück
- `/api/v1/meta`: HTTP 200; anonymer Bootstrap: erwartetes HTTP 401
- Spiel, Roadmap und UI-Katalog: HTTP 200

Der wiederholbare Restore-Befehl steht in `infra/scripts/verify-server-backup.sh` und verweigert die Quelldatenbank als Ziel.

## Vertrags- und Autoritätsabgleich

Aktiver Vertrag:

- Anwendung `0.2.0`
- Save-Schema 9
- API-Protokoll 8
- Run-Vertrag 2
- Content `foundation-1.0.0`
- Balance `low-numbers-1.0.0`
- fünf aktive Migrationen bis `000005_guilds_and_social`

Der Browser sendet im Onlinebetrieb ausschließlich Kommandos samt erwarteter Revision. Vollständige Snapshots aus PostgreSQL ersetzen lokale Vermutungen; `localStorage` bleibt nur Account-Namespace und UI-Cache. Roadmap B darf Navigation, Darstellung und Feedback ändern, aber keine Gold-, Besitz-, Zeit-, Prestige- oder Gildenlogik übernehmen.

Während des Abgleichs wurden zwei veraltete Entwicklungsbeschriftungen bereinigt: Die funktionierende Sammlung verweist nicht mehr auf „Block 6“, und die Gildenansicht nicht mehr auf „Block 7“. Die Serverdokumentation nennt nun Migration `000005` und 57 öffentliche Tabellen.

## Bewusst offen für Roadmap B

- P0: mobile Kollision zwischen Kampfnavigation und Kampfsteuerung
- P1: Accountbereich auf breiten Unterseiten kann überlaufen

Beide Punkte sind im codebasierten UI-Katalog, Layout-Audit und Übergabedokument derselben B-Zuständigkeit zugeordnet. Es sind bekannte Oberflächenschulden, keine verdeckten Systemfehler.
