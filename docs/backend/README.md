# Backend-Fundament – Einstieg

Dieser Ordner ist die verbindliche technische Quelle für Block 3. Planung und erster ausführbarer Unterbau sind jetzt getrennt nachvollziehbar:

1. [`STACK_AND_WORKSPACE.md`](STACK_AND_WORKSPACE.md) – Welche Werkzeuge verwenden wir und wo liegt welcher Code?
2. [`SCHEMA_REVIEW.md`](SCHEMA_REVIEW.md) – Welche SQL-Tabellen, Schlüssel, Constraints, Indizes und Transaktionsregeln gelten?
3. [`OPERATIONS_PLAN.md`](OPERATIONS_PLAN.md) – Wie unterscheiden sich Entwicklungs-, Test- und Produktionsumgebung und wie funktionieren Backup, Restore und Rollback?
4. [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md) – Wie werden PostgreSQL, Migration, Seed, API und echte Integrationstests gestartet?
5. [`DEV_SERVER.md`](DEV_SERVER.md) – Wie ist der echte Entwicklungsserver aufgebaut, abgesichert und zu prüfen?
6. [`BLOCK4_AUTH_PLAN.md`](BLOCK4_AUTH_PLAN.md) – Welche Account-, Session-, Recovery-, Datenschutz- und Autoritätsregeln baut Block 4?
7. [`AUTH_API_CONTRACT.md`](AUTH_API_CONTRACT.md) – Welche Auth- und Account-Endpunkte, DTOs und Fehler sind verbindlich?
8. [`AUTH_SCHEMA_PLAN.md`](AUTH_SCHEMA_PLAN.md) – Welche Tabellen, Constraints, Indizes und Löschtransaktionen ergänzt Migration 000002?
9. [`AUTH_IMPLEMENTATION.md`](AUTH_IMPLEMENTATION.md) – Wo liegt die gebaute Auth-Funktion und wie wird sie betrieben?
10. [`AUTH_SECURITY_VERIFICATION.md`](AUTH_SECURITY_VERIFICATION.md) – Welche Missbrauchs-, PostgreSQL-, Cookie- und Zwei-Browser-Fälle sind nachgewiesen?

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

Block 4 verwendet daneben Auth-Vertrag 1. Er führt einen ehrlichen Account-Bootstrap ein, ohne den noch lokalen Run- und Sammlungszustand als serverautoritativ auszugeben. Der vollständige Spielvertrag 8 wird dadurch nicht still verändert.

## Gebauter Stand von Block 4

- [x] additive Migration `000002_accounts_and_sessions` mit Account-Lifecycle, Rollen, Sessions, Tokens, Limits und Security Events
- [x] Argon2id-Passphrasen, 256-Bit-Session-/CSRF-Token und sichere Cookieattribute
- [x] Registrierung, E-Mailbestätigung, Login, Logout, Recovery und Gerätewiderruf
- [x] ehrlicher Account-Bootstrap, Profilkosmetik und idempotente Starterwahl
- [x] Exportanforderung, siebentägige Löschfrist und stündlicher Retentionjob
- [x] Browser-Accountclient mit strikt getrennten lokalen Save-Namespaces

Block 4 befindet sich jetzt im Abnahmegate. Missbrauchsmatrix, PostgreSQL-Lebenszyklen, Zweitbrowser sowie Proxy-, Cookie-, Origin- und CSRF-Grenzen sind in Schritt 3 nachgewiesen. Schritt 4 spielt den freizugebenden Accountfluss noch einmal aus Spielersicht durch und klärt die minimale schreibgeschützte Supportsicht.

## Abgenommener Stand von Block 3

- [x] pnpm-Workspace mit Web, API, Contracts, Content, Game-Core, Config und Datenbank
- [x] Fastify-Prozess mit Request-ID, Secret-Redaction, Fehlervertrag und getrennten Healthchecks
- [x] PostgreSQL-18-Compose, erste Migration und reproduzierbarer Entwicklungs-Seed
- [x] atomarer Kommandohelfer für Revision, Idempotenz, Bestand und append-only Ledger
- [x] Content-Release und standardmäßig geschlossene Feature-Flags an der API-Grenze
- [x] echte PostgreSQL-18-Integrationstests in der GitHub-Qualitätsschranke
- [x] Migration Down/Up, Custom-Format-Dump und Restore in eine neue Datenbank geprüft
- [x] restaurierte Datenbank mit Healthcheck, Revision, Goldbestand und Ledgerbuchung geprüft
- [x] echter JSON-Logger redigiert Auth, Cookie, Token, Passwort und E-Mail
- [x] echter Ubuntu-Entwicklungsserver mit Docker Engine, PostgreSQL 18, Migration, Seed und Neustartprobe
- [x] PostgreSQL ausschließlich an Loopback gebunden; SSH nur per Schlüssel und täglicher Backup-Timer aktiv

## Ursprüngliches Planungs-Gate

Der Bauschritt darf beginnen, sobald keine der folgenden Entscheidungen erneut geöffnet werden muss:

- [x] Workspace-Grenzen und Abhängigkeitsrichtung
- [x] Runtime, HTTP-Framework, Validierung, SQL-Treiber und Migrationstechnik
- [x] kanonische Tabellennamen, Geld- und Zeittypen
- [x] Revisions-, Idempotenz-, Lock- und Ledgermuster
- [x] Umgebungen und Secret-Grenzen
- [x] Backup-, Restore-, Rollback- und Migrationsstrategie

Versionsupdates innerhalb derselben Major-Version werden durch Lockfile und CI geprüft. Ein Wechsel der Grundtechnologie benötigt eine neue Architekturentscheidung statt einer stillen Paketänderung.
