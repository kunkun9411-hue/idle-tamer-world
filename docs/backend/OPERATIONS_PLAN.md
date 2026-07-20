# Umgebungs- und Wiederherstellungsplan

## Umgebungen

| Umgebung | Datenbank | Zweck | Datenregel |
|---|---|---|---|
| Lokal | PostgreSQL 18 in Compose oder gleichwertige lokale 18.x-Instanz | Entwicklung und manuelle Prüfung | nur Seed-/Testdaten |
| Test | neue isolierte Datenbank pro CI-Job | Migrationen, Integration und Parallelität | bei jedem Lauf neu aufgebaut |
| Dev-Server | PostgreSQL 18 in Docker auf einem getrennten Ubuntu-Host | echte Deploy-, Neustart- und Betriebsabnahme | nur synthetische Seed-/Testdaten |
| Staging | eigene verwaltete PostgreSQL-Instanz | produktionsnahe Migration und geschlossene Tests | synthetisch, keine kopierten Passwörter |
| Produktion | verwaltetes PostgreSQL 18 mit PITR | echte Accounts und Besitz | geringste Rechte, verschlüsselte Backups |

Auf dem aktuellen Windows-Rechner sind Node 24 vorhanden, Docker und `psql` jedoch nicht installiert. Die reale Abnahme läuft deshalb auf dem getrennten Ubuntu-Entwicklungsserver; PostgreSQL bleibt dort an Loopback gebunden und ist bei Bedarf über einen SSH-Tunnel erreichbar. CI und Dev-Server verwenden dieselben Migrationen und PostgreSQL 18. Details stehen in [`DEV_SERVER.md`](DEV_SERVER.md).

## Konfigurationsvertrag

Nur `.env.example` wird versioniert. Echte `.env`-Dateien, Dumps, Session-Token und Provider-Zugänge bleiben ignoriert.

| Variable | Bedeutung |
|---|---|
| `NODE_ENV` | `development`, `test` oder `production` |
| `HOST`, `PORT` | Bind-Adresse und Port |
| `DATABASE_URL` | Anwendungsrolle, nie Superuser |
| `LOG_LEVEL` | strukturierte Logstufe |
| `FEATURE_GUILDS`, `FEATURE_GUILD_DNA`, `FEATURE_LIVE_EVENTS`, `FEATURE_PVP` | neue Onlinebereiche standardmäßig geschlossen |

Getrennte Migrationsrolle, Browserursprung, Proxyvertrauen und Session-Secrets kommen mit Block 4 hinzu, bevor Accounts von außen erreichbar werden. Sie werden nicht als scheinbar fertige Variablen vorweggenommen.

Content-, Balance-, API- und Fehlervertragsversionen stammen aus versioniertem Code und dürfen nicht per Umgebungsvariable auseinanderlaufen.

## Rechte

- `idle_tamer_owner`: besitzt Schemaobjekte, wird nicht von der API verwendet.
- `idle_tamer_migrator`: darf Migrationen ausführen, aber keine Anwendungssessions bedienen.
- `idle_tamer_app`: nur notwendige `SELECT`, `INSERT`, `UPDATE`, Funktions- und Sequenzrechte; kein DDL.
- `idle_tamer_readonly`: Diagnose und Support, keine Besitzänderung.
- Ledger-Tabellen verweigern der App-Rolle `UPDATE` und `DELETE`.

## Logging und Datenschutz

Jeder Request erhält eine `requestId`, jedes Kommando zusätzlich `commandId`, `playerId`, Protokollversion, Dauer und Ergebniscode. Nie geloggt werden Passwort, Session-Cookie, vollständiger Token, `DATABASE_URL`, Pepper, E-Mail im Klartext oder vollständige Request-/Response-Zustände.

Fastify/Pino redigiert die bekannten Secret-Pfade technisch. Fehlerantworten enthalten eine `correlationId`, aber keinen Stacktrace. Staging und Produktion verwenden JSON-Logs; lokal ist eine lesbare Darstellung erlaubt.

## Migration und Rollback

1. Migration in leerer und aus dem letzten Release aufgebauter Testdatenbank prüfen.
2. Backup beziehungsweise Snapshot vor produktiver DDL erstellen.
3. additive **Expand**-Änderung ausrollen: neue nullable Spalte/Tabelle/Index.
4. kompatiblen Server ausrollen und Daten gegebenenfalls in kleinen Batches füllen.
5. erst in einem späteren Release **Contract** ausführen: alte Spalte, Route oder Constraint entfernen.

Vorwärtskorrekturen werden bevorzugt. Ein `down` wird nur produktiv verwendet, wenn er getestet und nachweislich verlustfrei ist. Destruktive Migrationen benötigen eine separate Freigabe, einen Restorepunkt und eine dokumentierte Datenübernahme.

## Backup und Restore

### Entwicklungs- und Testphase

- Schema ist vollständig aus Migrationen reproduzierbar.
- vor riskanten lokalen Datenänderungen: `pg_dump -Fc` in einen ignorierten Backupordner.
- Restore immer zuerst in eine neue leere Datenbank, niemals ungeprüft über die Quelle.

### Staging

- täglicher Custom-Format-Dump
- sieben tägliche und vier wöchentliche Stände
- monatlicher automatisierter Restore in eine leere Datenbank
- anschließend Migrationstatus, Healthcheck und Ledger-/Bestandsstichprobe prüfen

### Produktion

- verwaltete Point-in-Time-Recovery mit kontinuierlichem WAL-Archiv
- täglicher verschlüsselter `pg_dump -Fc` in getrenntem Speicher
- Aufbewahrung: 14 tägliche, 8 wöchentliche und 12 monatliche Stände
- quartalsweise vollständige Restore-Übung
- Alpha-Ziel: RPO 24 Stunden, RTO 4 Stunden
- Beta-Ziel: RPO 15 Minuten, RTO 1 Stunde
- Launch-Ziel: RPO 5 Minuten, RTO 30 Minuten

`pg_dump` liefert einen konsistenten Export bei laufender Datenbank; für reguläre Produktionssicherung ersetzt er dennoch nicht PITR und WAL-Archivierung.

## Restore-Abnahme

Ein Restore gilt erst als erfolgreich, wenn:

1. eine neue Datenbank ohne vorhandene Objekte aufgebaut wurde,
2. `pg_restore` ohne unbehandelte Warnung beendet wurde,
3. der Migrationsstand exakt dem Release entspricht,
4. API-Healthcheck und ein Read-only-Bootstrap funktionieren,
5. Tabellen-, Spieler- und Ledgerzahlen plausibel sind,
6. mindestens eine bekannte Kommandokette und ihr Ledger nachvollzogen wurden,
7. das Ergebnis samt Dauer und Backup-ID dokumentiert wurde.

## Offizielle Grundlage

- PostgreSQL-Support und Major-Upgrades: https://www.postgresql.org/support/versioning/
- `pg_dump` und Custom-Format: https://www.postgresql.org/docs/18/app-pgdump.html
- SQL-Dump und Restore: https://www.postgresql.org/docs/18/backup-dump.html
