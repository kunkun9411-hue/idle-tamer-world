# Morgen direkt anpassen

Diese Übersicht ist der schnellste Einstieg. Die Inhaltsdateien sind absichtlich vom UI- und Kampfcode getrennt.

## Monster ändern

Datei: `src/game/content.ts`

Jeder Eintrag enthält Rookie-Name, Art, Element, Rolle, Basis-HP, Basisangriff, Akzentfarbe, Beschreibung, Spritepfad und die erste Evolution. `MONSTERS` muss zehn eindeutige IDs behalten. Ein Name darf geändert werden, eine veröffentlichte ID später besser nicht – sie wird in Spielständen und der Datenbank gespeichert.

Wichtige Felder:

- `id`: technische, dauerhaft stabile Kennung
- `name`, `species`, `role`, `description`: sichtbarer Inhalt
- `baseHp`, `baseAttack`: Rookie-Basiswerte
- `accent`, `glyph`: Fallback-Darstellung ohne fertiges Asset
- `sprite`, `nativeFacing`: optionales 200×200-Runtime-Asset
- `evolution`: Name, Rolle, Werte und später eigener Spritepfad der Evolution

## Balancing, Drops und Brutzeit ändern

Datei: `src/game/catalog.ts`, Objekt `BALANCE`

- `cache`: Speichergröße, Forschungsausbau und Offline-Grenzen
- `evolution`: benötigtes Level, Anzahl Evolutionskerne und Art-Fragmente
- `hatch`: Fragmentertrag und Basis-Brutzeit
- `drops`: Ei-, Material- und Pity-Chancen
- `drops.gemChance`: Gem-Chance normaler Siege; Bosse garantieren derzeit einen Gem

Wahrscheinlichkeiten sind Dezimalwerte: `0.12` bedeutet 12 Prozent.

## Gems ändern

Datei: `src/game/catalog.ts`, Konstanten `GEM_SHAPES`, `GEM_COLORS`, `GEM_RARITIES` und `GEMS`

Die Form bestimmt den Wertetyp, die Seltenheit die Stärke und die Farbe ist für spätere Sets vorbereitet. Technische IDs werden aus diesen drei Dimensionen erzeugt. Die Bilder liegen unter `public/assets/gems`; neue Farbvarianten werden reproduzierbar mit `python scripts/build_gem_assets.py` gebaut. Details und Prompt: `docs/GEM_SYSTEM.md`.

## Items ändern

Datei: `src/game/catalog.ts`, Array `ITEMS`

Name, Icon, Seltenheit, Beschreibung und Quelle sind reine Katalogdaten. Neue Item-IDs brauchen zusätzlich einen Eintrag im Typ `ItemId` in `src/game/types.ts` und einen Startwert in `emptyInventory()`.

## Zonen ändern

Datei: `src/game/catalog.ts`, Array `ZONES`

- `stages`: Kämpfe pro Durchlauf
- `levelOffset`: Grundschwierigkeit
- `enemyPool`: wiederholte normale Gegner
- `bossPool`: rotierende Gegner der letzten Stage
- `unlockAfterZoneId`: Vorgängerzone
- `accent`, `backgroundKey`: visuelle Anbindung
- `synergies`: zwei Rollen plus echte Kampf-, Gold-, Ei- oder Materialboni

Gegner- und Boss-IDs kommen aus `src/game/encounters.ts`, nicht aus `MONSTERS`. Jeder Encounter besitzt `eggMonsterId`, wodurch die Wildform festlegt, welche sammelbare Rookie-Linie als Ei droppen kann. Die fünf stabilen Rollen sind `attacker`, `defender`, `support`, `controller` und `scout`. Die aktuelle UI zeigt drei Zonen, kann aus demselben Array aber weitere Karten erzeugen.

## Avatare und Rahmen ändern

Datei: `src/game/catalog.ts`, Arrays `AVATARS` und `FRAMES`

Avatar und Rahmen sind getrennte IDs im Save (`profile.avatarId`, `profile.frameId`). Die aktuellen Freischaltregeln liegen in `src/game/game-service.ts` in `isAvatarUnlocked()` und `isFrameUnlocked()`. Im Backend werden diese Regeln später zu serverseitigen Entitlements.

## Story und Forschung ändern

Datei: `src/game/progression.ts`

Hier liegen Story-Meilensteine, Belohnungen, Kapiteltexte und die vier Forschungszweige. Die Kostenformel liegt in `src/game/rules.ts`.

## Was möglichst nicht direkt geändert wird

- `src/main.ts`: Darstellung, Navigation und Browser-Kampfablauf
- `src/game/game-service.ts`: autoritative Spielaktionen und Resetlogik
- `src/game/storage.ts`: Save-Migration
- `src/game/api-contract.ts`: zukünftiger Vertrag zwischen Browser und Backend

Wenn sich nur Inhalt oder Balance ändert, sollte keine dieser Dateien nötig sein.

## Sicherer Änderungsablauf

1. Nur den gewünschten Katalogeintrag ändern.
2. `pnpm test` ausführen.
3. `pnpm build` ausführen.
4. Browser neu laden und einmal Desktop sowie Mobil prüfen.
5. Technische IDs nicht nachträglich umbenennen, sobald Spielstände oder Accounts verteilt wurden.
