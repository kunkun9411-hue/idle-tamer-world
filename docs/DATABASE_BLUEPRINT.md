# PostgreSQL-Blueprint

## Verbindliche Entscheidung

Die Online-Version verwendet PostgreSQL als zentrale, autoritative SQL-Datenbank. Dynamischer Besitz und jeder wertverändernde Vorgang liegen dort: Accounts, Sessions, Monster, Währungen, Items, Gems, Eier, Fragmente, Zeitjobs, Aufträge, Prestige, Gilden und Transaktionen.

Statische Definitionen wie Basiswerte eines Monsters, Zonenpools oder Gem-Potenz bleiben versionierter Spielinhalt im Server-Repository. Die Datenbank speichert stabile Definition-IDs und die verwendete Content-Version. So sind Balanceänderungen prüfbar und Spieler können keine Basiswerte über Requests einschleusen.

## Technische Grundregeln

- Primärschlüssel sind UUIDs; sichtbare Spielernamen sind niemals technische Schlüssel.
- Zeit wird als `timestamptz` in UTC gespeichert.
- Idle-Währungen können sehr groß werden und liegen als `numeric` ohne Gleitkommafehler vor; die API transportiert große Ganzzahlen als Strings.
- Bestände besitzen `CHECK (amount >= 0)` und werden niemals nur im Browser berechnet.
- Schreibende Aktionen laufen vollständig in einer SQL-Transaktion.
- `command_id` plus Spieler-ID ist eindeutig und macht wiederholte Netzwerkrequests idempotent.
- Jede Spielstandänderung erhöht eine monotone Revision; veraltete Clients erhalten einen Konflikt statt still Daten zu überschreiben.
- Kritische Buchungen erzeugen zusätzlich einen unveränderlichen Ledger-Eintrag.

## Domänen und Tabellen

### Identität

| Tabelle | Verantwortung |
| --- | --- |
| `users` | Loginidentität, Status, Erstellzeit |
| `user_credentials` | Passwort-Hash oder später externe Provider |
| `user_sessions` | gehashte Session-ID, Ablauf, Widerruf, Gerätedaten |
| `player_profiles` | Anzeigename, Rang, Avatar, Rahmen, globale Revision |

### Spielstand

| Tabelle | Verantwortung |
| --- | --- |
| `player_runs` | Run-Gold, Siege, aktive Zone, aktuelle Stage, letzter Tick |
| `player_zone_progress` | Freischaltungen und Abschlüsse pro Zone |
| `monster_instances` | Besitzer, Definition-ID, Run-Level, Hyperlevel, Evolution, Generation |
| `monster_fragments` | Art-ID und Fragmentbestand |
| `egg_balances` | Art-ID und Anzahl gesicherter Eier |
| `incubation_jobs` | Ei, Start, Ende, Status und Ergebnis |
| `research_levels` | Forschungszweig und Stufe |
| `quest_periods` | tägliche oder wöchentliche Perioden-ID |
| `quest_progress` | Ziel, Fortschritt, Claim-Zeit |
| `timed_expeditions` | eingesetzte Monster, Dauer, Status und Belohnungssnapshot |
| `player_settings` | Audio, Effekte, reduzierte Bewegung und Zahlenformat |
| `player_messages` | Systemnachricht, Verfügbarkeit, Claim- und Lesezeit |

### Besitz und Wirtschaft

| Tabelle | Verantwortung |
| --- | --- |
| `wallet_balances` | aktueller Bestand pro Währungs-ID |
| `item_balances` | stapelbare Materialien und Verbrauchsitems |
| `gem_balances` | stapelbare Gems nach Definition-ID |
| `monster_gem_slots` | Monster, Slotform und eingesetzter Gem |
| `pending_reward_batches` | noch nicht eingesammelte serverseitige Beute |
| `economy_ledger` | append-only Änderung mit Vorher/Nachher, Grund und Kommando |
| `game_commands` | Idempotenz, erwartete Revision, Ergebnis und Fehlercode |

Wenn Gems später zufällige Einzelwerte, Erfahrung oder Bindung erhalten, werden sie von `gem_balances` in echte `item_instances` überführt. Solange zwei Gems derselben Definition identisch sind, ist ein Mengenbestand deutlich einfacher und effizienter.

### Gemeinsame Systeme

| Tabelle | Verantwortung |
| --- | --- |
| `guilds` | Gilde, Eigentümer, Stufe und DNA-Version |
| `guild_members` | Mitgliedschaft, Rolle und Beitrag |
| `guild_dna_nodes` | Gen, Stufe und investierte Ressourcen |
| `guild_ledger` | unveränderliche Spenden- und Ausgabenhistorie |
| `pvp_snapshots` | serverseitig eingefrorene Verteidigungsteams |
| `pvp_matches` | Gegner, Ergebnis, Version und Belohnung |
| `trade_orders` | Angebot, Preis, Status und Ablauf |
| `moderation_events` | Sperren, Meldungen und Admin-Aktionen |

## Beispiel einer atomaren Aktion

`monster.hyper_up` wird später so verarbeitet:

1. Session und Spieler laden.
2. `command_id` auf bereits vorhandenes Ergebnis prüfen.
3. Spielstandrevision sperren und mit `expected_revision` vergleichen.
4. Monsterbesitz und aktuellen Hyperlevel prüfen.
5. artspezifische Fragmentkosten berechnen.
6. Fragmentbestand mit einer bedingten SQL-Aktualisierung abbuchen.
7. Hyperlevel erhöhen.
8. Ledger und Kommandoergebnis schreiben.
9. Revision erhöhen und Transaktion committen.

Schlägt ein Schritt fehl, wird nichts davon gespeichert. Dieses Muster gilt ebenso für Käufe, Claims, Gem-Ausrüstung, Evolution, Prestige, Gildenspenden und Handel.

## Warum nicht jeden Inhalt direkt in SQL pflegen?

Accounts und Besitz gehören vollständig in SQL. Balance-Definitionen brauchen zusätzlich Versionskontrolle, Code-Review, automatisierte Tests und atomare Veröffentlichung. Später kann ein Content-Editor freigegebene Versionen in SQL publizieren; die Datenbank ersetzt aber nicht die versionierte Quelle. Der Ablauf steht in `CONTENT_PIPELINE.md`.
