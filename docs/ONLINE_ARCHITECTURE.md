# Backend- und Online-Architektur

PostgreSQL ist die verbindliche Zieldatenbank. Die vollständige Reihenfolge bis zum Launch steht in `PRODUCT_ROADMAP.md`, das Domänenmodell in `DATABASE_BLUEPRINT.md` und der normierte Bauvertrag in `backend/SCHEMA_REVIEW.md`; die bereits lokal fertiggestellten Systeme stehen in `PRE_BACKEND_ROADMAP.md`.

## Autoritative Grenze

Der Browser sendet nur Absichten. Er darf niemals einen neuen Gold-, Fragment-, Hyperlevel-, Gem- oder Gilden-DNA-Stand festlegen. Die API prüft Besitz, Kosten, Zeit und Berechtigungen und antwortet mit einem neuen autoritativen Zustand.

`apps/web/src/game/game-service.ts` bildet diese Grenze für den lokalen Prototyp ab. `packages/contracts/src/api-contract.ts` definiert Bootstrap, Sitzungsdaten, Feature-Flags und idempotente Kommandos mit `commandId` und `expectedRevision`. `apps/web/src/game/api-client.ts` enthält bereits den transportneutralen, Cookie-basierten HTTP-Client. Aktiv geschaltet wird er erst, wenn ein echter Spielkommando-Endpunkt existiert; die UI behauptet bis dahin ausdrücklich nur „lokal gesichert“.

## Zielbild

```text
Browser-Frontend
      │ HTTPS + Session-Cookie
      ▼
API-Server ───────── Hintergrund-Jobs
      │                      │
      ├──── PostgreSQL ──────┤
      └──── Event-/Auditlog ─┘
```

Für Browser-Accounts sind sichere HTTP-only Session-Cookies sinnvoller als selbst verwaltete Tokens im `localStorage`.

## Erste Tabellen

| Tabelle | Wichtige Inhalte |
|---|---|
| `users`, `user_credentials`, `user_sessions` | Loginidentität, Passwort-Hash, Session-Hash und Sperrstatus |
| `player_profiles` | Anzeigename, Account-Rang, Prestige, Gesamtsiege, Avatar, Rahmen und Revision |
| `player_runs` | Gold, Run-Siege, aktive Zone, Front-Monster, Support-Monster, Kampfspeicherbelegung, letzter autoritativer Tick |
| `player_zone_progress` | freigeschaltete Zone, aktuelle Stage, Abschlüsse |
| `monster_instances` | Besitzer, Art, normales Level, Hyperlevel, Evolution, Generation |
| `monster_fragments` | Spieler, Monsterart, Fragmentanzahl |
| `wallet_balances` | Spieler, Währungs-ID und exakter nichtnegativer Bestand |
| `gem_balances` | Spieler, Gem-Definition und ungebundene Anzahl |
| `monster_gem_slots` | Monsterinstanz, Slotform, ausgerüstete Gem-Definition |
| `egg_balances` | Spieler, Monsterart und Anzahl |
| `item_balances` | Spieler, Material-ID und gesicherte Anzahl |
| `pending_reward_batches` | serverseitig erzeugte, noch nicht eingesammelte Gold-, Ei-, Material- und Gem-Beute |
| `incubation_jobs` | Eiart, Start, Ende, Status, Ergebnis |
| `cosmetic_entitlements` | freigeschaltete Avatar- und Rahmen-IDs samt Quelle |
| `research_levels` | Spieler, Forschungszweig, Stufe |
| `reward_claims` | einmalige Story-/Eventbelohnungen |
| `guilds` | Name, Eigentümer, Stufe, DNA-Version |
| `guild_members` | Spieler, Rolle, Beitritt, Beitrag |
| `guild_dna_nodes` | Chromosom, Gen, Stufe und Investition |
| `guild_ledger` | unveränderbares Ressourcen- und Berechtigungsprotokoll |
| `economy_ledger` | append-only Vorher-/Nachherbuchungen jeder Bestandsänderung |
| `game_commands` | Idempotenz, Revision, Request-Hash und gespeichertes Ergebnis |

Monsterdefinitionen, Evolutionslinien, Encounter, Bossrotationen, Zonenprotokolle und Balancing bleiben zunächst versioniert im Servercode. Die Datenbank speichert Instanzen und Fortschritt, keine willkürlich vom Client gelieferten Basiswerte.

## API-Kommandos der ersten Migration

- `GET /api/game/state`
- `POST /api/game/commands` mit typisiertem Kommando-Umschlag

Alle schreibenden Requests laufen in einer Datenbanktransaktion. `expectedRevision` verhindert verlorene parallele Updates; die eindeutige `commandId` verhindert doppelte Zahlungen bei Netzwerk-Retries. Der Server antwortet immer mit der neuen Revision und einem vollständigen autoritativen Spielzustand.

Der bestehende Kommandokatalog in API-Protokoll 8 deckt bereits Starterwahl, Einsammeln, Leveln, Training, Evolution, Zonenwahl, Inkubation, Brutbeschleunigung, Hyperlevel, Gem-Ausrüstung, Ziel-Claims, Zeit-Expeditionen, Herstellung, Systempost, Einstellungen, Forschung, Prestige sowie Avatar- und Rahmenwechsel ab. Bootstrap und Kommandoantwort tragen zusätzlich eine eigene Balance-Vertragsversion und die Release-ID `low-numbers-1.0.0`. Für den echten Server werden dieselben Namen verwendet; nur `LocalGameService` wird durch den HTTP-Transport ersetzt.

`monster.hyper_up`, `monster.evolve`, `monster.gem_equip`, `monster.gem_unequip` und `prestige.start` müssen jeweils Kosten, Besitz, Slotform und aktuelle Revision in derselben Datenbanktransaktion prüfen. Der Client übermittelt niemals resultierende Werte oder einen selbst berechneten Prestige-Ertrag.

## Zonen und Live-Content

Zonen, Gegnerpools und Story-Knoten werden später nicht direkt in Produktion editiert. Der Ablauf aus versioniertem Entwurf, automatischer Prüfung, Vorschau, Freigabe und atomarer Aktivierung ist in `docs/CONTENT_PIPELINE.md` festgelegt.

## Offline-Fortschritt

Der Server speichert Zeitstempel statt sekündlicher Datenbankupdates. Beim nächsten Request berechnet er die vergangene Zeit bis zu einer Obergrenze, wendet die damals gültige Balancing-Version an und schreibt Ergebnis plus neuen Zeitstempel atomar zurück.

## Reihenfolge

1. PostgreSQL, Migrationen, Account und Session-Cookie.
2. `GET /api/game/state`, Offline-Zusammenfassung und serverseitige Save-Version.
3. Starterwahl, Zonenfortschritt, Kampfspeicher, Inventar und Level-Up auf Kommandos umziehen.
4. Eierdrops, Pity, Inkubation, Fragmente, Evolution, Hyperlevel und Gem-Drops serverautoritativ machen.
5. Gem-Ausrüstung, Prestige, Offline-Berechnung und kosmetische Freischaltungen umziehen.
6. Erst danach PvP, Gilden, Chat, Handel und Gilden-DNA aktivieren.
