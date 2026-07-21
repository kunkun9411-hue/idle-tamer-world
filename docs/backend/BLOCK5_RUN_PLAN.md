# Block 5 – serverautoritärer Run und Wirtschaft

- Stand: 21. Juli 2026
- Ziel: Block 5, Schritte 1 bis 3
- Run-Vertrag: 1
- Migration: `000003_authoritative_run`

## Autoritätsgrenze

Der Browser stellt Kämpfe dar und sendet ausschließlich Absichten. Er darf niemals Siege, Gegnerwerte, vergangene Zeit, Dropchancen, Goldbeträge, Levelkosten oder neue Kontostände bestimmen.

| Bereich | Autorität ab Block 5 |
| --- | --- |
| Serverzeit und verstrichene Kampfzeit | Server |
| aktives Run-Monster und Run-Level | Server |
| aktuelle und freigeschaltete Zone | Server |
| Stage, Zonenabschlüsse und Siege | Server |
| Kampfspeicher und Gold | Server |
| Eier, Materialien, Gems und Monsterbesitz | noch lokal bis Block 6 |
| Hyperlevel, Evolution, Forschung und Prestige | noch lokal bis Block 6 |

Ein bestehender lokaler Run wird nicht in Gold oder Fortschritt umgewandelt. Der Client ist manipulierbar und deshalb keine belastbare Quelle. Für die Alpha startet der serverseitige Run nach der bereits autoritativen Starterwahl mit 100 Gold, Level 1 und Zone 1. Der lokale Save bleibt als Entwicklungsstand erhalten, besitzt aber keine Wirtschaftsautorität mehr.

## Servertick

`GET /api/v1/run` und jedes Run-Kommando führen zuerst eine deterministische Abrechnung bis zur aktuellen Serverzeit aus.

1. PostgreSQL sperrt den Run des Spielers.
2. Der Server liest Starter, Run-Level, Zone, Stage und den nächsten Kampfzeitpunkt.
3. Angriff, Leben, Gegner und Kampfdauer werden aus dem veröffentlichten Content- und Balance-Release berechnet.
4. Nur ein nach diesen Daten gewinnbarer und zeitlich fälliger Kampf erzeugt einen Sieg.
5. Siege werden höchstens bis zu den freien 90 Kampfspeicherplätzen nachgeholt.
6. Gold wird zu genau einem offenen Reward-Batch aggregiert.
7. Ein nicht gewinnbarer Boss setzt den Run auf `blocked`; ein voller Speicher auf `cache_full`.

Der Browser kann die Synchronisierung häufiger anfordern, aber dadurch keine zusätzliche Zeit erzeugen. Der Zeitstempel aus dem Clientkommando wird nur syntaktisch geprüft und nie als Rechengrundlage verwendet.

## Kleine Zahlen und große Zahlen

- Startgold: 100
- Levelkosten: `24 + Level × 16`
- Kampfgold: `9 + Gegnerlevel × 4`
- Levelobergrenze dieses Schemas: 1.000.000
- Gold und Siege: PostgreSQL `numeric(78,0)`
- Übertragung von Gold, Pending-Gold, Siegen und Clears: Dezimal-Strings

Damit bleiben die sichtbaren Werte lange klein. Gleichzeitig werden spätere wissenschaftliche Zahlen weder in JSON noch in JavaScript unbemerkt gerundet. Der aktuelle Browser akzeptiert nur Werte im sicheren Integerbereich; die spätere Scientific-Number-Oberfläche bekommt einen eigenen Zahlentyp.

## Kommandos

| Kommando | Client liefert | Server entscheidet |
| --- | --- | --- |
| `cache.claim` | nur die Absicht | offenen Batch, exakten Betrag, Ledgerbuchung |
| `monster.level_up` | Monsterdefinition | Berechtigung, Kosten, Bestand, neues Level |
| `zone.select` | Zonen-ID | Existenz und Freischaltung |

Alle Kommandos tragen zufällige Kommando-ID, Browserinstanz und erwartete Run-Revision. Eine identische Wiederholung liefert denselben Snapshot. Dieselbe ID mit anderem Inhalt wird abgelehnt. Zwei unterschiedliche Kommandos auf derselben Revision können nicht beide gewinnen.

## SQL-Modell

- `player_runs`: Run-Revision, Starter, Zone, Siege, Status und nächster Kampftermin
- `player_run_levels`: normale, bei Prestige später rücksetzbare Monsterlevel
- `player_zone_progress`: Stage und Abschlüsse je Zone
- `pending_reward_batches`: ein offener, exakt einmal claimbarer Kampf-Batch
- `wallet_balances`: exakter Goldbestand
- `game_commands`: Idempotenz und Antwortsnapshot
- `economy_ledger`: unveränderliche Goldbewegungen

## Schritt-3-Prüfmatrix

- Zeit aus Browserpayload kann keine Siege erzeugen.
- Belohnungs- oder Goldfelder aus Browserpayload werden verworfen.
- 24 Stunden Rückstand erzeugen höchstens 90 Speicherplätze.
- voller Speicher erzeugt bei wiederholter Synchronisierung keine Revisionen oder Belohnungen.
- identischer Parallelclaim erzeugt eine Ledgerzeile.
- zwei verschiedene Kommandos mit gleicher Revision: exakt eines gewinnt.
- zweiter Claim erzeugt keine Buchung.
- gesperrte Zone und falsches Monster rollen vollständig zurück.
- 50- bis 70-stellige Goldwerte bleiben in PostgreSQL und API exakt.
- fehlende Session, falscher Origin und falsches CSRF werden vor der Runlogik abgewiesen.

## Bewusste Grenze von Schritt 3

Block 5 macht Run, Kampfzeit, Gold, normale Run-Level, Zonen und Kampfbeute serverautoritativ. Eier, Gems, Hyperlevel, Evolution, Forschung, Zeitjobs und Prestige bleiben bis Block 6 deaktiviert, sobald sie serverseitiges Gold verändern würden. Das verhindert eine halbe Migration, bei der lokale Systeme heimlich wieder Gold erzeugen könnten.
