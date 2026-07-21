# Block 4 – gebaute Account- und Sessionbasis

- Stand: 21. Juli 2026
- Roadmap: Block 4, Schritt 3 geprüft; Schritt 4 aktiv
- Auth-Vertrag: 1
- Fehlervertrag: 2

## Was jetzt wirklich online ist

PostgreSQL ist die einzige Wahrheit für Benutzer-ID, E-Mailstatus, Accountstatus, Rollen, Profilname, Avatar, Rahmen, Sitzungen und die einmalige Starterwahl. Der übrige Spielstand bleibt bis Block 5 und 6 lokal. Jeder Account erhält dafür einen zufälligen `local_storage_namespace`; ein Browser darf keinen Gast- oder Fremdspielstand in diesen Namensraum übernehmen.

## Schnelle Codeübersicht

| Bereich | Ort |
| --- | --- |
| HTTP-Routen und Cookiegrenze | `apps/api/src/auth/routes.ts` |
| Regeln, Flows und Bootstrap | `apps/api/src/auth/service.ts` |
| Argon2id, Token und Normalisierung | `apps/api/src/auth/security.ts` |
| PostgreSQL-Transaktionen | `packages/database/src/auth-store.ts` |
| Retention und Anonymisierung | `packages/database/src/auth-maintenance.ts` |
| Schema | `packages/database/migrations/000002_accounts_and_sessions.js` |
| Browserclient | `apps/web/src/account/client.ts` |
| accountgebundene Saves | `apps/web/src/game/storage.ts` |
| öffentliche DTOs | `packages/contracts/src/auth-contract.ts` |

## Aktive HTTP-Oberfläche

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/verification/resend`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:sessionId`
- `POST /api/v1/auth/logout-others`
- `POST /api/v1/auth/reauthenticate`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `GET /api/v1/bootstrap`
- `POST /api/v1/account/commands`
- `POST /api/v1/account/export`
- `POST /api/v1/account/deletion`
- `POST /api/v1/account/deletion/cancel`

Alle mutierenden Routen verlangen die exakte konfigurierte Origin. Angemeldete Mutationen benötigen zusätzlich ein an die Sitzung gebundenes CSRF-Token. Das Session-Cookie heißt `__Host-idle_tamer_session` und wird mit `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` und ohne `Domain` gesetzt.

## Mail in der Entwicklungsphase

Der Dev-Server schreibt Verifikations- und Recovery-Nachrichten in ein privates Docker-Volume als JSONL-Outbox. Diese Datei ist weder über Caddy noch über die API erreichbar. Vor einer öffentlichen Testphase wird der Adapter durch einen Transaktionsmail-Anbieter ersetzt; API und Datenbanklogik bleiben dabei unverändert.

Der Entwicklungs-Seed besitzt einen synthetischen Testaccount. Seine Zugangsdaten dürfen nur für die Dev-Umgebung verwendet werden und gehören nie auf spätere Release-Server.

## Auf dem Entwicklungsserver nachgewiesen

Am 21. Juli 2026 wurden Migration und Seed nach einem frischen Datenbankbackup auf `idle-tamer-world.de` eingespielt. Die öffentliche Proxyroute liefert den Metavertrag, verweigert einen Bootstrap ohne Sitzung kontrolliert und akzeptiert mit dem synthetischen Entwicklungsaccount Login, Bootstrap und Logout. Der Bootstrap meldet die bewusste Autoritätsgrenze `account-online-game-local`; das gesetzte Sitzungscookie trägt `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` und eine begrenzte Lebensdauer. Nach dem Test blieb keine aktive Testsitzung zurück.

## Bereits bewiesene Bauinvarianten

- Account, Profil, Rollen, Policies, Kosmetik und Name entstehen atomar.
- Gleichzeitige Registrierung derselben E-Mail oder desselben Namens hat genau einen Gewinner.
- Passwörter werden als Argon2id-PHC-String gespeichert; Rohpasswörter und Roh-Token werden nicht persistiert.
- Pro Account bleiben höchstens zehn aktive Sitzungen.
- Starterwahl verwendet `commandId`, `clientInstanceId` und `expectedRevision` und ist idempotent.
- Die Löschung wird sieben Tage vorgemerkt, kann vorher abgebrochen werden und anonymisiert erst nach Fristablauf.
- Aufbewahrung bereinigt Rate-Limits, verbrauchte Token, widerrufene Sessions und Security Events nach ihren Fristen.

## Abgeschlossenes Prüfgate

Schritt 3 prüft progressive Fehlversuche, harte Rate-Limits, Tokenablauf, Sessionrotation, zweiten Browser, Einzel- und Gesamtwiderruf, Produktions-Cookies, Reverse Proxy sowie vollständige Registrierung über die Dev-Mailoutbox. Der Zwei-Browser-Livetest läuft gegen die echte Domain und entfernt seinen synthetischen QA-Account anschließend wieder. Die vollständige Matrix und der dabei entdeckte Browserfehler stehen in `AUTH_SECURITY_VERIFICATION.md`.

Als Nächstes wird der Accountfluss in Schritt 4 manuell abgenommen und die schreibgeschützte Supportsicht geklärt. Besitz- und Wirtschaftsaktionen bleiben weiterhin außerhalb dieses Blocks.
