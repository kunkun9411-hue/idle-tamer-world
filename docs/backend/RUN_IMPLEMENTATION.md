# Block 5 – Umsetzung von Run und Wirtschaft

- Stand: 21. Juli 2026
- Run-Vertrag: 1
- Migration: `000003_authoritative_run`
- Live-Umgebung: `https://idle-tamer-world.de`

## Gebauter Umfang

Block 5 macht den sichtbaren Hauptkampf bis zur Sammlung dauerhafter Inhalte serverautoritativ. PostgreSQL speichert Run-Revision, aktives Monster, normales Run-Level, Zone, Stage, Zonenfreischaltungen, Siege, Kampfspeicher und Gold. Die Kampfdarstellung im Browser bleibt animiert, erzeugt aber keine Belohnung mehr selbst.

Die neue Schicht besteht aus:

- `packages/game-core/src/authoritative-run.ts` für die deterministische Kampfbewertung,
- `packages/database/src/run-store.ts` für Sperren, Abrechnung, Idempotenz und Ledger,
- `apps/api/src/run` für die geschützte HTTP-Grenze,
- `packages/contracts/src/run-contract.ts` für Run-Vertrag 1,
- `apps/web/src/account/client.ts` und `apps/web/src/main.ts` für Synchronisierung und sichtbare Bedienung.

## Datenbank und Transaktionen

Migration `000003_authoritative_run` ergänzt vier Tabellen:

| Tabelle | Aufgabe |
| --- | --- |
| `player_runs` | Run-Revision, aktives Monster, Zone, Siege, Status und nächster Kampfzeitpunkt |
| `player_run_levels` | normale, später bei Prestige rücksetzbare Level |
| `player_zone_progress` | Stage und Zonenabschlüsse |
| `pending_reward_batches` | ein offener, genau einmal claimbarer Kampfspeicher |

Gold bleibt in `wallet_balances`; jede Bewegung wird in `economy_ledger` gebucht. `game_commands` stellt Idempotenz her. Ein Run-Kommando sperrt den Spieler-Run, rechnet zuerst bis zur Serverzeit ab, prüft die erwartete Run-Revision und schreibt Zustand, Kommando und Ledger in derselben Transaktion.

Bestehende Profile mit Starter erhalten beim Migrieren automatisch einen Run. Ein Goldbestand wird nur dann mit 100 angelegt, wenn noch kein Gold-Datensatz existiert. Vorhandene Bestände werden nicht überschrieben.

## Clientverhalten

Nach Login und Starterwahl lädt der Browser `GET /api/v1/run` und synchronisiert danach regelmäßig. Folgende Aktionen verwenden den Server:

- Kampfspeicher einsammeln,
- aktives Monster mit Gold leveln,
- eine freigeschaltete Zone auswählen.

Gold, Level, Stage, Siege, Speicherbelegung und Zonenfreischaltungen werden aus dem Antwortsnapshot übernommen. Die lokale Kampfanimation ist nur eine Ansicht dieses Zustands. Ein manipuliertes `localStorage` wird nicht importiert.

Systeme aus Block 6, die Online-Gold oder dauerhaften Besitz verändern würden, sind für einen Online-Account sichtbar gesperrt. Dazu gehören derzeit lokale Missionsbelohnungen, Expeditionserträge, Herstellung, Brut, Gems, Forschung und Prestige. So gibt es keine zweite, heimliche Wirtschaftsquelle.

Der Run-Snapshot überschreibt ausschließlich Run-Werte. Hyperlevel, Evolution und Gem-Slots des lokalen Sammlungsarchivs werden nicht gelöscht. Für die Kampfdarstellung entsteht stattdessen eine unverändernde Rookie-Kopie ohne lokale Dauerboni, damit die Animation der Serverberechnung entspricht. Ein Regressionstest repariert außerdem Foundation-Gems, die durch den früheren zu breiten Snapshot-Merge aus Slot und Inventar verschwunden waren.

## Deployment

Vor der Migration wurde auf dem Entwicklungsserver der Dump `idle-tamer-20260721T212419Z.sql.gz` erzeugt. Danach wurde `000003_authoritative_run` angewendet und nur API sowie Web wurden neu gebaut. Der Live-Stand meldet `runContractVersion: 1`; API, Web und PostgreSQL sind gesund.

Die Datenbank besitzt nun 23 öffentliche Tabellen. Bei der Stichprobe hatte jedes vorhandene Profil mit Starter genau einen autoritativen Run. Synthetische QA-Accounts und ihre privaten Outbox-Einträge wurden nach der Prüfung entfernt.

## Bewusste Grenze

Der Server kennt in Block 5 genau ein aktives Run-Monster. Support-Monster, Besitz, Eier, Fragmente, Hyperlevel, Evolutionen, Gems, Zeitjobs und Prestige werden zusammen in Block 6 migriert. Diese Trennung verhindert, dass halbe Besitz- oder Teamdaten zur Wirtschaftsautorität erklärt werden.
