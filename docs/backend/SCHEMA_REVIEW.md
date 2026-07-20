# PostgreSQL-Schema-Review

- Zielversion: **PostgreSQL 18**
- Vertragsbasis: **API-Protokoll 8**
- Content: **`foundation-1.0.0`**
- Balance: **`low-numbers-1.0.0`**

Dieses Review macht aus den bisherigen Konzepttabellen einen eindeutigen Bauvertrag. Die hier verwendeten Namen sind kanonisch; ältere Varianten wie `gem_inventory`, `pending_rewards` oder `idempotency_keys` werden nicht zusätzlich angelegt.

## Globale SQL-Regeln

- interne IDs: `uuid` mit `uuidv7()` für servererzeugte Hauptschlüssel
- Client-Kommandos: `command_id uuid`, zusammen mit `player_id` eindeutig
- Zeit: ausschließlich `timestamptz`, Datenbank und Verbindung auf UTC
- Revision und Zähler: `bigint` mit nichtnegativem `CHECK`
- kleine Stufen und Mengen: `integer` mit fachlichem Maximal-`CHECK`
- Währungen: `numeric(78,0)`, API-Ausgabe als Dezimalstring
- Definitionen: stabile `text`-ID plus gespeicherte Content-/Balance-Release-ID
- JSONB nur für eingefrorene Antwort-, Reward- oder Audit-Snapshots; nicht als Ersatz für normale Besitzspalten
- jede Besitzbeziehung besitzt einen Fremdschlüssel und eine eindeutige fachliche Kombination

## Kanonischer Tabellenkatalog

| Domäne | Tabellen |
|---|---|
| Identität | `users`, `user_credentials`, `user_sessions`, `player_profiles` |
| Run und Sammlung | `player_runs`, `player_zone_progress`, `monster_instances`, `monster_fragments`, `egg_balances`, `incubation_jobs` |
| Fortschritt | `research_levels`, `quest_periods`, `quest_progress`, `timed_expeditions`, `player_settings`, `player_messages`, `cosmetic_entitlements` |
| Wirtschaft | `wallet_balances`, `item_balances`, `gem_balances`, `monster_gem_slots`, `pending_reward_batches`, `economy_ledger`, `game_commands` |
| Später online | `guilds`, `guild_members`, `guild_dna_nodes`, `guild_ledger`, `pvp_snapshots`, `pvp_matches`, `trade_orders`, `moderation_events` |

Block 3 baut nur Identitätshüllen, Profilrevision, Kommandolog, Ledger und die für den ersten Beispieltransfer nötigen Bestände. Gilden-, PvP-, Handels- und Moderationstabellen bleiben bis zu ihrem Roadmap-Block reine Verträge.

## Schlüssel und Constraints der ersten Migrationen

### Identität und Profil

- `users.email_normalized` ist eindeutig; Originalschreibweise bleibt getrennt.
- `user_credentials.user_id` ist Primär- und Fremdschlüssel, Passwort-Hash nie im Log.
- `user_sessions.token_hash` ist eindeutig; `expires_at > created_at`; widerrufene Sessions bleiben auditierbar.
- `player_profiles.user_id` ist eindeutig und besitzt `revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0)`.
- normalisierte Anzeigenamen sind eindeutig, Länge und erlaubte Zeichen werden zusätzlich an der API validiert.

### Besitz

- Balancetabellen verwenden `(player_id, definition_id)` als Primärschlüssel.
- jeder Bestand besitzt `CHECK (amount >= 0)`.
- `monster_instances` besitzt genau einen Eigentümer und fachliche Checks für Level, Hyperlevel, Evolution und Generation.
- `monster_gem_slots` verwendet `(monster_id, slot_shape)` als Primärschlüssel; Slotform ist auf `triangle`, `square`, `diamond` begrenzt.
- ein Gem kann nur dann als Menge gespeichert werden, solange alle Exemplare derselben Definition identisch sind.

### Kommandos und Ledger

- `game_commands` besitzt `UNIQUE (player_id, command_id)`.
- gespeichert werden `request_hash`, Kommandoart, erwartete und resultierende Revision, Status, Fehlercode und ein minimierter Antwortsnapshot.
- ein wiederholtes Kommando mit gleichem Schlüssel und anderem `request_hash` ist `VALIDATION`, nicht ein neuer Versuch.
- `economy_ledger` besitzt Betrag, Vorher-/Nachherbestand, Definition, Grund, Kommando und Zeit.
- `economy_ledger` wird der API-Rolle für `UPDATE` und `DELETE` entzogen; Korrekturen sind neue Gegenbuchungen.

## Pflichtindizes

| Tabelle | Index |
|---|---|
| `user_sessions` | eindeutig auf `token_hash`; `(user_id, expires_at)` für aktive Sessions |
| `player_profiles` | eindeutig auf normalisiertem Anzeigenamen |
| `game_commands` | eindeutig `(player_id, command_id)`; zusätzlich `(player_id, created_at DESC)` |
| `economy_ledger` | `(player_id, created_at DESC, id)` und `(player_id, command_id)` |
| `monster_instances` | `(player_id, definition_id)` und partiell für aktive Front-/Supportzuordnung |
| `pending_reward_batches` | `(player_id, status, created_at)` und partiell auf offene Batches |
| `incubation_jobs` | `(player_id, status, finishes_at)` |
| `timed_expeditions` | `(player_id, status, finishes_at)` |
| `quest_progress` | `(player_id, period_id, objective_id)` eindeutig |

Indizes werden erst nach einem realen Abfrageplan erweitert. Jede neue Produktionstabelle braucht mindestens den Primärschlüssel-, Fremdschlüssel- und tatsächlichen Zugriffspfad; wahllose Indizes verlangsamen Idle-Schreiblast.

## Ein autoritatives Kommando

Transaktionen verwenden `READ COMMITTED` plus explizite Zeilensperre auf `player_profiles`. Das ist einfacher nachvollziehbar als globales `SERIALIZABLE` und serialisiert genau die Kommandos eines Spielers.

1. Pool-Client ausleihen und `BEGIN`.
2. vorhandenes `(player_id, command_id)` prüfen.
3. Profilzeile `SELECT ... FOR UPDATE` laden.
4. `expected_revision` vergleichen.
5. Besitz und Voraussetzungen laden.
6. Bestände mit `UPDATE ... WHERE amount >= cost RETURNING ...` ändern.
7. Domänenänderung, Ledger und Kommandolog schreiben.
8. Profilrevision exakt einmal erhöhen.
9. vollständigen autoritativen Zustand erzeugen und `COMMIT`.
10. Bei jedem Fehler `ROLLBACK`; Pool-Client im `finally` freigeben.

Die feste Lock-Reihenfolge lautet Profil → Bestände alphabetisch nach Schlüssel → Monster/Job → Ledger → Kommandoresultat. Dadurch werden Deadlocks bei späteren zusammengesetzten Aktionen reduziert.

## Prestige

`prestige.start` sperrt dieselbe Profilzeile und prüft Zone 10 sowie 100 Run-Siege in SQL/Serverlogik erneut. Run-Gold, normale Level und Zonenlauf werden zusammen zurückgesetzt; Hyperlevel, Evolution, Gems, Fragmente, Entdeckungen und Prestigezähler bleiben oder steigen gemäß Resetmatrix. Es gibt keinen Zwischenzustand und keinen vom Client gelieferten Prestige-Ertrag.

## Testpflicht pro Migration

- leere Datenbank bis zum aktuellen Stand migrieren
- jede Migration einmal zurück und wieder vor, sofern ihr Down-Schritt verlustfrei ist
- negative Bestände und ungültige Fremdschlüssel bewusst ablehnen
- doppeltes `command_id` unter Parallelität exakt einmal verbuchen
- falsche Revision ohne Teilbuchung ablehnen
- Ledger-Summe gegen Bestandsänderung prüfen
- Schema aus einem Backup in eine neue Datenbank wiederherstellen
