# Backend-Fundament – Einstieg

Dieser Ordner ist die verbindliche technische Planung für Block 3. Er beantwortet vor dem ersten Servercode drei getrennte Fragen:

1. [`STACK_AND_WORKSPACE.md`](STACK_AND_WORKSPACE.md) – Welche Werkzeuge verwenden wir und wo liegt welcher Code?
2. [`SCHEMA_REVIEW.md`](SCHEMA_REVIEW.md) – Welche SQL-Tabellen, Schlüssel, Constraints, Indizes und Transaktionsregeln gelten?
3. [`OPERATIONS_PLAN.md`](OPERATIONS_PLAN.md) – Wie unterscheiden sich Entwicklungs-, Test- und Produktionsumgebung und wie funktionieren Backup, Restore und Rollback?

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

## Gate für Block 3, Schritt 2

Der Bauschritt darf beginnen, sobald keine der folgenden Entscheidungen erneut geöffnet werden muss:

- [x] Workspace-Grenzen und Abhängigkeitsrichtung
- [x] Runtime, HTTP-Framework, Validierung, SQL-Treiber und Migrationstechnik
- [x] kanonische Tabellennamen, Geld- und Zeittypen
- [x] Revisions-, Idempotenz-, Lock- und Ledgermuster
- [x] Umgebungen und Secret-Grenzen
- [x] Backup-, Restore-, Rollback- und Migrationsstrategie

Versionsupdates innerhalb derselben Major-Version werden durch Lockfile und CI geprüft. Ein Wechsel der Grundtechnologie benötigt eine neue Architekturentscheidung statt einer stillen Paketänderung.
