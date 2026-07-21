# Run-API-Vertrag 1

Basis: `/api/v1`

## `GET /run`

Benötigt eine aktive HTTP-only-Session. Der Aufruf rechnet fällige Kämpfe anhand der Serverzeit ab und liefert:

```json
{
  "runContractVersion": 1,
  "snapshot": {
    "revision": 4,
    "serverTime": "2026-07-21T20:00:00.000Z",
    "contentReleaseId": "foundation-1.0.0",
    "balanceReleaseId": "low-numbers-1.0.0",
    "gold": "140",
    "pendingGold": "39",
    "cacheSlotsUsed": 3,
    "cacheCapacity": 90,
    "activeMonster": { "definitionId": "pyrook", "level": 2 },
    "currentZoneId": "violet-rim",
    "unlockedZoneIds": ["violet-rim"],
    "highestZoneNumber": 1,
    "zoneProgress": { "violet-rim": { "stage": 4, "clears": "0" } },
    "runVictories": "3",
    "totalVictories": "3",
    "progressionStatus": "fighting",
    "nextCombatAt": "2026-07-21T20:00:07.000Z"
  },
  "settlement": { "victoriesAdded": 3, "goldAdded": "39" }
}
```

## `POST /run/commands`

Benötigt Session, exakten Produktions-Origin, JSON und den zuletzt ausgegebenen CSRF-Token.

```json
{
  "commandId": "UUID",
  "clientInstanceId": "UUID",
  "expectedRevision": 4,
  "issuedAt": "2026-07-21T20:00:00.000Z",
  "command": { "type": "cache.claim" }
}
```

Aktive Kommandos:

```json
{ "type": "cache.claim" }
{ "type": "monster.level_up", "definitionId": "pyrook" }
{ "type": "zone.select", "zoneId": "glass-gardens" }
```

Die Antwort enthält `accepted: true`, `replayed`, den vollständigen neuen Snapshot und ein rein beschreibendes Ereignis. Der Client berechnet aus dem Ereignis keine Bestände.

## Konflikte und Manipulation

- stale Revision: HTTP 409, `code=CONFLICT`, `latestRevision`
- zu wenig Gold oder leerer Speicher: HTTP 409/400, `code=VALIDATION`
- gesperrte Zone oder falsches Monster: HTTP 400, `code=VALIDATION`
- fehlende Session: HTTP 401
- falscher Origin oder CSRF: HTTP 403
- unbekanntes Kommando: HTTP 400

Zusätzliche Felder wie `gold`, `reward`, `victories`, `enemyLevel` oder Clientzeit werden verworfen. Kein Endpunkt akzeptiert einen Zielkontostand.
