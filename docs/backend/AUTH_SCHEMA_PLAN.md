# PostgreSQL-Plan für Accounts und Sessions

Zielmigration: `000002_accounts_and_sessions`

Die Migration ist additiv gegenüber `000001_foundation`. Sie verändert keine Wirtschaftsbestände und legt keine Tabellen aus Block 5 oder 6 vorzeitig an.

## Erweiterung `users`

```text
status                  text not null
email_original          text null
email_normalized        text null unique
email_verified_at       timestamptz null
locked_at               timestamptz null
deletion_requested_at   timestamptz null
delete_after            timestamptz null
deleted_at              timestamptz null
```

Statusconstraint: `pending_verification`, `active`, `locked`, `deletion_pending`, `deleted`.

Der Spaltenstandard wechselt von `active` auf `pending_verification`. Registrierung setzt den Status trotzdem immer explizit; der vorhandene Block-3-Seed bleibt durch den Backfill aktiv.

Zusätzliche Checks:

- `active` verlangt `email_verified_at IS NOT NULL`.
- `deletion_pending` verlangt `deletion_requested_at` und `delete_after`.
- `deleted` verlangt `deleted_at` und nullifizierte E-Mailfelder.
- alle anderen Zustände verlangen E-Mailfelder.
- `delete_after > deletion_requested_at`.

Die bestehende Migration wird nicht verändert; `000002` ersetzt den alten Statusconstraint und hebt `NOT NULL` auf den E-Mailfeldern nur für die spätere Anonymisierung auf.

## Erweiterung `player_profiles`

```text
starter_definition_id        text null
starter_chosen_at            timestamptz null
display_name_changed_at      timestamptz null
local_storage_namespace      uuid not null default uuidv7()
```

Checks:

- Starter-ID und Wahlzeit sind entweder beide null oder beide gesetzt.
- `local_storage_namespace` ist eindeutig.
- Starterwahl erhöht dieselbe Profilrevision wie andere Accountkommandos.

Die 30 künftigen Sammellinien werden hier nicht als Startoption freigeschaltet. Zulässige Startdefinitionen kommen aus dem versionierten Contentrelease und umfassen zunächst die zehn ursprünglichen Linien.

## `user_credentials`

| Spalte | Typ | Regel |
| --- | --- | --- |
| `user_id` | uuid | PK, FK auf `users`, Cascade bei physischer Testbereinigung |
| `password_hash` | text | PHC-Argon2id, nie loggen |
| `hash_version` | smallint | mindestens 1 |
| `password_changed_at` | timestamptz | Pflicht |
| `created_at`, `updated_at` | timestamptz | UTC |

Der Salt ist Bestandteil des PHC-Strings. Rohpasswort, separater Salt und Recoveryantworten werden nicht gespeichert.

## `user_sessions`

| Spalte | Typ | Regel |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK, Pflicht |
| `token_hash` | bytea | eindeutig, exakt 32 Byte |
| `csrf_hash` | bytea | exakt 32 Byte |
| `client_instance_id` | uuid | Diagnose paralleler Browser |
| `device_name` | text | 1 bis 80 Zeichen |
| `user_agent_summary` | text | maximal 160 Zeichen, kein voller Rohwert |
| `remember_me` | boolean | Pflicht |
| `created_at`, `last_seen_at` | timestamptz | Pflicht |
| `idle_expires_at` | timestamptz | nach `created_at` |
| `absolute_expires_at` | timestamptz | nach `idle_expires_at` beim Erstellen |
| `reauthenticated_at` | timestamptz | Pflicht |
| `revoked_at` | timestamptz | null solange aktiv |
| `revoke_reason` | text | definierter Enum-Check |
| `rotated_from_session_id` | uuid | optionaler Self-FK |

Pflichtindizes:

- eindeutig auf `token_hash`
- `(user_id, revoked_at, absolute_expires_at DESC)`
- `(user_id, last_seen_at DESC)` partiell für `revoked_at IS NULL`

Tokenrotation erzeugt eine neue Sessionzeile und widerruft die alte in derselben Transaktion. So bleibt der Sicherheitsverlauf nachvollziehbar.

## `account_tokens`

Verifikation und Recovery verwenden dieselbe technische Tabelle, aber getrennte fachliche Typen.

| Spalte | Typ | Regel |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK |
| `kind` | text | `verify_email`, `reset_password`, `cancel_deletion` |
| `token_hash` | bytea | eindeutig, exakt 32 Byte |
| `created_at`, `expires_at` | timestamptz | Ablauf nach Erstellung |
| `consumed_at` | timestamptz | höchstens einmal |
| `superseded_at` | timestamptz | älteren Token entwerten |

Partieller Index `(user_id, kind, expires_at)` für offene Token. Pro Nutzer und Typ darf fachlich nur der neueste unverbrauchte Token gültig sein; die Transaktion setzt frühere auf `superseded_at`.

## `user_roles`

```text
user_id    uuid FK users
role       text check in (player, support, moderator, admin)
granted_at timestamptz
granted_by uuid null FK users
primary key (user_id, role)
```

Jeder neue Account erhält ausschließlich `player`. Support-, Moderator- und Adminrollen entstehen nicht über öffentliche Endpunkte.

## `policy_acceptances`

```text
user_id       uuid FK users
policy_kind   text check in (terms, privacy)
version       text
accepted_at   timestamptz
source        text check in (registration, update, migration)
primary key (user_id, policy_kind, version)
```

IP-Adresse und vollständiger User-Agent werden aus Gründen der Datenminimierung nicht in der Zustimmungstabelle gespeichert.

## `player_name_history`

```text
id                       uuid PK
player_id                uuid FK player_profiles
display_name             text
display_name_normalized  text
valid_from               timestamptz
valid_until              timestamptz null
reserved_until           timestamptz
```

Die Historie ist ein Auditverlauf und erzwingt selbst keine zeitabhängige Eindeutigkeit. PostgreSQL-Indexprädikate dürfen nicht von `now()` abhängen; die 90-Tage-Frist wird deshalb nicht über einen scheinbar dynamischen Partial-Index modelliert.

## `player_name_reservations`

```text
display_name_normalized  text primary key
player_id                uuid FK player_profiles
reserved_until           timestamptz
updated_at               timestamptz
```

Die Anwendung erzeugt den Normalwert deterministisch und versucht die Reservierung in derselben Transaktion wie Profilanlage oder Namenswechsel. Eine abgelaufene Reservierung darf dabei atomar übernommen werden; eine noch aktive Reservierung erzeugt `DISPLAY_NAME_TAKEN`. Der Primärschlüssel entscheidet auch zwei parallele Registrierungen sicher. Der alte Name erhält beim Wechsel `reserved_until = changed_at + 90 days`, der aktuelle Name eine Reservierung bis `infinity`. Ein Cleanupjob darf nur abgelaufene, nicht aktuelle Reservierungen entfernen.

Der Build muss prüfen, ob der gewünschte Unicode-Normalisierungsalgorithmus vollständig in der Anwendung oder über eine getestete PostgreSQL-Funktion erfolgt. Die Anwendung und alle Backfills verwenden zwingend dieselbe Version.

## `cosmetic_entitlements`

```text
player_id       uuid FK player_profiles
cosmetic_kind   text check in (avatar, frame)
definition_id   text
source          text
unlocked_at     timestamptz
primary key (player_id, cosmetic_kind, definition_id)
```

Bei Profilanlage werden die beiden Standard-Entitlements atomar erzeugt. Avatar- oder Rahmenwechsel prüfen Contentdefinition, Entitlement und Profilrevision in derselben Transaktion. Statische Content-IDs erhalten keinen SQL-Fremdschlüssel, werden aber gegen den aktiven Contentrelease validiert.

## `auth_rate_limits`

```text
action          text
key_hash        bytea check length = 32
window_started  timestamptz
attempt_count   integer check >= 0
blocked_until   timestamptz null
updated_at      timestamptz
primary key (action, key_hash, window_started)
```

Der Zähler wird mit atomarem `INSERT ... ON CONFLICT ... DO UPDATE` erhöht. Abgelaufene Fenster werden nach 48 Stunden gelöscht. `key_hash` ist ein HMAC und kein schneller Klartext-Hash von E-Mail oder IP.

## `security_events`

| Spalte | Typ | Inhalt |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid null | bekannte Identität |
| `session_id` | uuid null | beteiligte Session |
| `event_type` | text | feste Ereignis-ID |
| `outcome` | text | `success`, `rejected`, `failed` |
| `network_hash` | bytea null | HMAC eines minimierten Netzwerkpräfixes |
| `metadata` | jsonb | allowlist-basiert, keine freien Requestdaten |
| `created_at` | timestamptz | UTC |

Index `(user_id, created_at DESC)` und `(event_type, created_at DESC)`. App-Rolle erhält kein `UPDATE` oder `DELETE`; ein separater Retentionjob darf alte Zeilen löschen.

## `account_export_jobs`

| Spalte | Typ | Regel |
| --- | --- | --- |
| `id` | uuid | PK |
| `user_id` | uuid | FK |
| `status` | text | `pending`, `ready`, `failed`, `expired` |
| `requested_at` | timestamptz | Pflicht |
| `ready_at`, `expires_at` | timestamptz | statusabhängig |
| `storage_key` | text | null bis fertig; nie öffentliche URL |
| `content_sha256` | bytea | exakt 32 Byte wenn fertig |
| `failure_code` | text | minimiert |

Pro Nutzer darf nur ein nicht abgelaufener `pending`- oder `ready`-Job existieren. Exportdateien liegen nicht in PostgreSQL.

## Löschtransaktion und Löschjob

### Vormerkung

1. Userzeile und Profil `FOR UPDATE` sperren.
2. frische Reauthentifizierung prüfen.
3. Status auf `deletion_pending`, Zeitpunkte setzen.
4. alle Sessions widerrufen.
5. Security Event und idempotentes Kommandoresultat schreiben.

### Endgültige Anonymisierung

1. Job über stabile User-ID idempotent sperren.
2. Credentials, Sessions, Token, Policy-Zustimmungen und Exportobjekte löschen.
3. lokale und spätere Spielbesitzdaten gemäß ihrer FK-Regeln löschen.
4. Profilname durch nicht rückführbare Löschkennung ersetzen; Avatar und Rahmen zurücksetzen.
5. E-Mailfelder nullifizieren, Status `deleted`, `deleted_at` setzen.
6. Ledgerbezug nur über anonymisierte technische Profil-ID erhalten, soweit notwendig.
7. Abschlussereignis ohne frühere Identifikatoren schreiben.

Ein abgebrochener oder wiederholter Job darf keinen halb anonymisierten Zustand erzeugen. Für spätere Gilden-, Handels- und Zahlungsdaten wird vor ihrer Einführung eine eigene Retentionmatrix ergänzt.

## Transaktionsgrenzen

- Registrierung: User, Credential, Profil, Namensreservierung, Rollen, Policies und Verifikationstoken gemeinsam
- Verifikation: Tokenverbrauch und Statuswechsel gemeinsam
- Login: Sessionerstellung und Security Event gemeinsam; Passwortprüfung erfolgt davor
- Tokenrotation: neue Session und Widerruf der alten gemeinsam
- Starterwahl: Profilrevision, Starterfelder, `game_commands` und Antwortsnapshot gemeinsam
- Löschvormerkung: Status und Sessionwiderrufe gemeinsam

Wirtschaftsledger wird für reine Authereignisse nicht verwendet. `game_commands` bleibt für idempotente Accountkommandos zuständig; Authversuche erhalten keine Spielerrevision.

## Migrationstests

- Upgrade von `000001` auf `000002` mit bestehendem Seed
- Down/Up nur, solange noch keine echten Accountdaten existieren; danach Vorwärtskorrektur
- Status- und Zeitconstraints absichtlich verletzen
- parallele Registrierung derselben E-Mail und desselben Anzeigenamens; nur eine aktive Namensreservierung gewinnt
- Tokenhash und Sessionhash eindeutig und exakt 32 Byte
- zwei parallele Starterwahlen zahlen/erzeugen exakt eine Wahl
- elfte Session widerruft deterministisch die älteste zulässige Session
- Löschvormerkung widerruft alle Sessions atomar
- Anonymisierungsjob ist wiederholbar und hinterlässt keine E-Mail, Credentials oder Token
- App-Rolle kann Security Events und Ledger nicht verändern

## Reihenfolge innerhalb der Migration

1. neue nullable Spalten und neue Tabellen anlegen
2. bestehende synthetische `active`-User mit `email_verified_at = created_at` markieren
3. vorhandene Profile in `user_roles`, `player_name_history`, `player_name_reservations` und Standard-Entitlements übernehmen
4. Seed-Policy-Zustimmungen mit Quelle `migration` ergänzen
5. neue Status-, Zeit- und Paar-Constraints validieren
6. alte Statusconstraint entfernen und durch den neuen Zustandscheck ersetzen
7. Pflichtindizes und Unique-Constraints anlegen
8. Dev-Seed außerhalb der Migration um ein reproduzierbares Argon2id-Testcredential ergänzen

Dadurch bleibt der vorhandene Block-3-Seed während des Upgrades gültig. Produktionsmigrationen erzeugen niemals ein bekanntes Standardpasswort.
