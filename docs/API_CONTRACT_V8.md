# API-Vertrag 8 – Client-Freigabe

- Status: **für Block 3 freigegeben**
- Protokoll: **8**
- Contentvertrag: **1 / `foundation-1.0.0`**
- Balancevertrag: **1 / `low-numbers-1.0.0`**
- Fehlervertrag: **1**
- Stand: **20. Juli 2026**

Dieses Dokument friert die Grenze zwischen dem abgenommenen Browser-Client und dem kommenden PostgreSQL-Backend ein. Die ausführbaren TypeScript-Typen in `src/game/api-contract.ts` bleiben die technische Quelle.

## Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| `GET` | `/api/game/state` | Session, Feature-Flags, Offline-Zusammenfassung und autoritativen Zustand laden |
| `POST` | `/api/game/commands` | genau eine typisierte Spielerabsicht transaktional ausführen |

Beide Antworten tragen Protokoll-, Content- und Balanceversion, `revision`, `serverTime` und den vollständigen autoritativen `GameState`. Authentifizierung läuft später ausschließlich über ein sicheres HTTP-only Session-Cookie.

## Kommando-Umschlag

Jeder Schreibzugriff enthält:

- `commandId` als Idempotenzschlüssel,
- `clientInstanceId` zur Diagnose paralleler Browser,
- `expectedRevision` gegen verlorene Updates,
- `issuedAt` als Client-Metadatum, niemals als autoritative Spielzeit,
- `command` als typisierte Absicht ohne resultierende Bestände.

Der Client darf beispielsweise `monster.level_up` mit einer Monster-ID senden. Er darf niemals den gewünschten neuen Level-, Gold-, Fragment- oder Prestige-Wert mitsenden.

## Freigegebene Absichten

Protokoll 8 deckt Starterwahl, Kampfspeicher-Claim, Front und Support, Run-Level, Training, Hyperlevel, Evolution, Gem-Ausrüstung, Zonenwahl, Brut, Forschung, Story- und Auftragsclaims, Zeit-Expeditionen, Herstellung, Einstellungen, Einführung, Systempost, Profilkosmetik und `prestige.start` ab.

Neue Absichten werden nur durch eine neue Protokollversion ergänzt. Bestehende Namen oder Bedeutungen werden innerhalb von Version 8 nicht still verändert.

## Autoritative Regeln

1. Der Server prüft Besitz, Kosten, Zeit, Freischaltungen, Slotform und Revision.
2. Kommando, Ledgerbuchung, Idempotenzschlüssel und Zustandsänderung laufen in einer Datenbanktransaktion.
3. Ein wiederholtes `commandId` liefert dasselbe Ergebnis und zahlt keine Belohnung doppelt aus.
4. Eine falsche `expectedRevision` liefert `CONFLICT` samt aktueller Revision.
5. Prestige prüft Zone 10 und mindestens 100 Run-Siege serverseitig und wendet die vollständige Resetmatrix atomar an.
6. Offline-Ertrag verwendet Serverzeit, Speichergrenze und die in der Antwort genannte Balanceversion.

## Fehlervertrag

`ApiProblem` verwendet ausschließlich `UNAUTHENTICATED`, `CONFLICT`, `VALIDATION`, `RATE_LIMITED`, `UNAVAILABLE` oder `UNKNOWN`. Spielertexte dürfen übersetzt werden; Code, Fehlervertragsversion und optionale `correlationId` bleiben stabil.

## Abnahme

- [x] Client sendet nur Absichten.
- [x] HTTP-Transport validiert Protokoll-, Content- und Balanceversion.
- [x] Idempotenz und Revisionskonflikt besitzen stabile Felder.
- [x] Prestige-, Offline- und Besitzänderungen sind als atomare Servertransaktionen festgelegt.
- [x] Lokaler und späterer HTTP-Service verwenden denselben Kommandovertrag.

Änderungen nach dieser Freigabe starten mit einem eigenen Migrationshinweis und einer bewusst erhöhten Vertragsversion.
