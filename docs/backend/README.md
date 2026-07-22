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
11. [`AUTH_ACCEPTANCE.md`](AUTH_ACCEPTANCE.md) – Wie wurde Block 4 live abgenommen und welche Grenze gilt für den internen Entwicklungsbetrieb?
12. [`BLOCK5_RUN_PLAN.md`](BLOCK5_RUN_PLAN.md) – Welche Serverzeit-, Kampf-, Reward- und Autoritätsregeln gelten für Block 5?
13. [`RUN_API_CONTRACT.md`](RUN_API_CONTRACT.md) – Welche Run-Endpunkte und Transaktionskommandos definiert Vertrag 1?
14. [`RUN_IMPLEMENTATION.md`](RUN_IMPLEMENTATION.md) – Wie sind Run, PostgreSQL, API und Client umgesetzt und live ausgerollt?
15. [`RUN_SECURITY_VERIFICATION.md`](RUN_SECURITY_VERIFICATION.md) – Welche Doppelclaim-, Großzahl-, Manipulations- und Live-Fälle sind bewiesen?
16. [`BLOCK6_SOLO_ONLINE_ACCEPTANCE.md`](BLOCK6_SOLO_ONLINE_ACCEPTANCE.md) – Welche Solo-Systeme sind serverautoritativ und wie wurde ihr Erhalt geprüft?
17. [`BLOCK7_GUILD_SOCIAL_ACCEPTANCE.md`](BLOCK7_GUILD_SOCIAL_ACCEPTANCE.md) – Welche Gilden-, DNA-, Sozial- und Moderationsregeln sind gebaut und geprüft?

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

Block 4 verwendet Auth-Vertrag 1. Run-Vertrag 2 umfasst inzwischen den vollständigen Solozustand aus Block 5 und 6. Sozialvertrag 1 ergänzt die serverautoritativen Gilden- und Freundesfunktionen aus Block 7. Der Spielvertrag 8 bleibt die fachliche Grundlage des sichtbaren Clients.

## Abgenommener Stand von Block 5 bis 7

- [x] additive Migration `000003_authoritative_run` und Backfill vorhandener Starterprofile
- [x] deterministische Kampfabrechnung aus Serverzeit und servereigenem Zustand
- [x] 90-Plätze-Kampfspeicher mit genau einem offenen Reward-Batch
- [x] Goldclaim und Run-Level als atomare, idempotente Ledgerkommandos
- [x] Zonenfreischaltung und Zonenwahl mit eigener Run-Revision
- [x] Browser synchronisiert Run-Snapshots und sperrt lokale Online-Goldquellen
- [x] PostgreSQL-, Manipulations-, Parallel- und Zweitbrowserprüfung grün
- [x] vollständige Sammlung, Zeitjobs, Forschung und Prestige über Run-Vertrag 2
- [x] Gilden, DNA, Aufgaben, Expedition, Wochenboss, Freunde und Chat über Sozialvertrag 1
- [x] interne Content- und Moderationswerkzeuge mit Rollen-, CSRF- und Auditgrenze

Block 5, 6 und 7 sind auf der Dev-Domain aktiv. Block A.08 schließt das Systemfundament ab und übergibt an Roadmap B. PvP, Handel und Live-Ops werden nicht vor Roadmap C gebaut.

## Gebauter Stand von Block 4

- [x] additive Migration `000002_accounts_and_sessions` mit Account-Lifecycle, Rollen, Sessions, Tokens, Limits und Security Events
- [x] Argon2id-Passphrasen, 256-Bit-Session-/CSRF-Token und sichere Cookieattribute
- [x] Registrierung, E-Mailbestätigung, Login, Logout, Recovery und Gerätewiderruf
- [x] ehrlicher Account-Bootstrap, Profilkosmetik und idempotente Starterwahl
- [x] Exportanforderung, siebentägige Löschfrist und stündlicher Retentionjob
- [x] Browser-Accountclient mit strikt getrennten lokalen Save-Namespaces

Block 4 ist für den internen Entwicklungsbetrieb vollständig abgenommen. Missbrauchsmatrix, PostgreSQL-Lebenszyklen, Zweitbrowser sowie Proxy-, Cookie-, Origin- und CSRF-Grenzen sind nachgewiesen. Ein echter Entwicklerlogin und ein vollständiger synthetischer Live-Ablauf bestätigen Starterpersistenz, Widerruf, Löschabbruch und Logout. Die Supportsicht ist serverintern, maskiert und technisch nur lesend. Externer Transaktionsmailversand und veröffentlichte Pflichttexte bleiben Gates vor der Alpha-Freigabe nach Roadmap D.

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
