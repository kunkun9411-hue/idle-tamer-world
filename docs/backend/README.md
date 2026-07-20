# Backend-Fundament – Einstieg

Dieser Ordner ist die verbindliche technische Quelle für Block 3. Planung und erster ausführbarer Unterbau sind jetzt getrennt nachvollziehbar:

1. [`STACK_AND_WORKSPACE.md`](STACK_AND_WORKSPACE.md) – Welche Werkzeuge verwenden wir und wo liegt welcher Code?
2. [`SCHEMA_REVIEW.md`](SCHEMA_REVIEW.md) – Welche SQL-Tabellen, Schlüssel, Constraints, Indizes und Transaktionsregeln gelten?
3. [`OPERATIONS_PLAN.md`](OPERATIONS_PLAN.md) – Wie unterscheiden sich Entwicklungs-, Test- und Produktionsumgebung und wie funktionieren Backup, Restore und Rollback?
4. [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md) – Wie werden PostgreSQL, Migration, Seed, API und echte Integrationstests gestartet?

## Verbindlicher Kurzstand

- Node.js 24 LTS und pnpm 11
- TypeScript als gemeinsame Sprache
- Fastify 5 für HTTP und strukturierte Logs
- Zod 4 für Laufzeitvalidierung an Prozessgrenzen
- PostgreSQL 18 als einzige autoritative Spieldatenbank
- `pg` als bewusst kleine, SQL-nahe Datenbankschicht
- `node-pg-migrate` für versionierte Migrationen
- Vitest für Regeln und PostgreSQL-Integrationstests
- keine ORM, kein Redis und kein separater Worker im ersten Fundament

`docs/API_CONTRACT_V8.md` bleibt der freigegebene Clientvertrag. `docs/DATABASE_BLUEPRINT.md` beschreibt die Domänen; `SCHEMA_REVIEW.md` normiert daraus die tatsächlich zu bauenden Namen und Constraints.

## Stand von Block 3, Schritt 2

- [x] pnpm-Workspace mit Web, API, Contracts, Content, Game-Core, Config und Datenbank
- [x] Fastify-Prozess mit Request-ID, Secret-Redaction, Fehlervertrag und getrennten Healthchecks
- [x] PostgreSQL-18-Compose, erste Migration und reproduzierbarer Entwicklungs-Seed
- [x] atomarer Kommandohelfer für Revision, Idempotenz, Bestand und append-only Ledger
- [x] Content-Release und standardmäßig geschlossene Feature-Flags an der API-Grenze
- [x] echte PostgreSQL-18-Integrationstests in der GitHub-Qualitätsschranke
- [x] Migration Down/Up, Custom-Format-Dump und Restore in eine neue Datenbank geprüft
- [x] restaurierte Datenbank mit Healthcheck, Revision, Goldbestand und Ledgerbuchung geprüft
- [x] echter JSON-Logger redigiert Auth, Cookie, Token, Passwort und E-Mail
- [ ] lokaler PostgreSQL-Lauf auf diesem Windows-Rechner; derzeit fehlen Docker und `psql`

## Ursprüngliches Planungs-Gate

Der Bauschritt darf beginnen, sobald keine der folgenden Entscheidungen erneut geöffnet werden muss:

- [x] Workspace-Grenzen und Abhängigkeitsrichtung
- [x] Runtime, HTTP-Framework, Validierung, SQL-Treiber und Migrationstechnik
- [x] kanonische Tabellennamen, Geld- und Zeittypen
- [x] Revisions-, Idempotenz-, Lock- und Ledgermuster
- [x] Umgebungen und Secret-Grenzen
- [x] Backup-, Restore-, Rollback- und Migrationsstrategie

Versionsupdates innerhalb derselben Major-Version werden durch Lockfile und CI geprüft. Ein Wechsel der Grundtechnologie benötigt eine neue Architekturentscheidung statt einer stillen Paketänderung.
