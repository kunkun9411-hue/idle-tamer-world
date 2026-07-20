# Backend lokal ausführen

## Einmalig

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:seed
```

`db:up` startet PostgreSQL 18 auf `127.0.0.1:54329`. Das Compose-Volume hält lokale Daten über Neustarts; `db:down` entfernt nur Container und Netzwerk, nicht automatisch das Volume.

Das Volume hängt bewusst an `/var/lib/postgresql`. Das offizielle PostgreSQL-Image verwendet seit Version 18 das versionsbezogene Datenverzeichnis `/var/lib/postgresql/18/docker`; der ältere Mount `/var/lib/postgresql/data` würde nicht mehr zum aktuellen Imagevertrag passen.

## Entwickeln

```powershell
pnpm dev          # Web 5173 und API 3001 gemeinsam
pnpm dev:web      # nur Browser-Spiel
pnpm dev:api      # nur Fastify
```

Schnelle Diagnose:

```text
GET http://127.0.0.1:3001/health/live
GET http://127.0.0.1:3001/health/ready
GET http://127.0.0.1:3001/api/v1/meta
```

`live` bedeutet nur, dass der Prozess antwortet. Erst `ready` bestätigt zusätzlich eine erreichbare Datenbank. `meta` veröffentlicht API-Protokoll, Content-Release und aktive Feature-Flags, aber keine Secrets.

## Prüfen

```powershell
pnpm check
$env:TEST_DATABASE_URL = "postgres://idle_tamer:idle_tamer_local@127.0.0.1:54329/idle_tamer_test"
$env:DATABASE_URL = $env:TEST_DATABASE_URL
pnpm db:migrate
pnpm test:integration
pnpm test:e2e
```

Die Integration prüft gegen PostgreSQL selbst: negative Bestände, parallele Wiederholung derselben `commandId`, monotone Revision, genau eine Ledgerbuchung und vollständigen Rollback. Ohne `TEST_DATABASE_URL` werden nur diese vier SQL-Tests bewusst übersprungen; Unit-, API-, Client-, Build-, Roadmap- und Assetprüfungen laufen trotzdem.

## Warum zwei Datenbanken?

`idle_tamer` ist dein lokaler Entwicklungsstand. `idle_tamer_test` darf bei Tests geleert werden. Diese Trennung verhindert, dass ein Testlauf deine manuell aufgebaute Sammlung zerstört.
