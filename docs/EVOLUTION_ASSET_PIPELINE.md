# Evolutions-Asset-Pipeline v1

Diese Pipeline hält die visuellen Formen vom Runtime-Datenmodell getrennt, bis die
Monsterdaten auf mehrere Entwicklungsstufen erweitert werden. Alle freigegebenen
Sprites sind HD-Cel-Shading, textfrei und als 200×200-RGBA-Idle-Anker für PixelLab
vorbereitet.

## Runtime-Vertrag

```text
apps/web/public/assets/monsters/evolutions/<starter-id>/<starter-id>_<form-slug>_idle_right.png
```

- exakt 200×200 Pixel, RGBA, transparente Ecken
- mindestens 8 Pixel Sicherheitsabstand; die Ultimate-Form darf die Fläche fast
  vollständig nutzen, damit sie im Kampf deutlich größer wirkt
- eine Form pro Datei, Seitenansicht nach rechts, keine Beschriftung, kein Rahmen,
  kein Boden, kein Schatten und kein Wasserzeichen
- spätere Animationen bleiben PixelLab-Jobs und erhalten denselben Form-Slug

Die aktuellen Verträge kennen technisch nur `rookie` und `evolved`. Deshalb werden
die neuen Formen zunächst als eigenständige, versionierte Assets abgelegt. Eine
spätere Datenmigration kann daraus `stage1`, `stage2` und `ultimate` machen, ohne
die Runtime-Idle-Dateien umzubenennen.

## Starter-Linien und geplante Form-Slugs

| Starter | erste Form (bestehend) | zweite Form (Planname) | Ultimate (Planname) |
| --- | --- | --- | --- |
| Pyrook | `solaraptor` | `solflare` | `aetherion` |
| Mossbit | `groveguard` | `rootwarden` | `verdant-titan` |
| Voltfin | `stormray` | `thunderwing` | `tempest-leviathan` |
| Tideram | `abysshorn` | `tidalord` | `abyssal-colossus` |
| Nyxlet | `noctyra` | `umbrafang` | `eclipse-seraph` |
| Bramblet | `thornwarden` | `briar-warden` | `worldroot-guardian` |
| Glimmite | `prismantis` | `spectrumantis` | `prismatic-archon` |
| Riftjaw | `voidmaw` | `riftreaver` | `null-devourer` |
| Frostel | `cryolupus` | `glacieron` | `cryosphere-alpha` |
| Lumipup | `auralion` | `auroracrest` | `lumen-constellation` |

Die Namen sind Design-Arbeitsnamen und werden vor der Content-Migration noch auf
Lore, Übersetzungen und Namenskonflikte geprüft.

## Prototyp-Status (freigegeben)

Die erste zusammenhängende Dreiform-Pipeline liegt bereits im Repository:

```text
art-source/generated/evolutions-v1/pyrook/
  pyrook_solaraptor_idle_right_chroma.png
  pyrook_solaraptor_idle_right_master.png
  pyrook_solflare_idle_right_chroma.png
  pyrook_solflare_idle_right_master.png
  pyrook_aetherion_idle_right_chroma.png
  pyrook_aetherion_idle_right_master.png

apps/web/public/assets/monsters/evolutions/pyrook/
  pyrook_solaraptor_idle_right.png
  pyrook_solflare_idle_right.png
  pyrook_aetherion_idle_right.png
```

Die drei Runtime-Exports sind jeweils 200×200 RGBA; ihre Ecken sind vollständig
transparent. `Aetherion` nutzt die verfügbare Silhouette fast vollständig und ist
damit für die gewünschte Endgame-Skalierung im Kampf vorbereitet.

Zusätzlich sind vier erste Evolutionsanker für das Starter-Roster freigegeben:

```text
apps/web/public/assets/monsters/evolutions/mossbit/mossbit_groveguard_idle_right.png
apps/web/public/assets/monsters/evolutions/voltfin/voltfin_stormray_idle_right.png
apps/web/public/assets/monsters/evolutions/tideram/tideram_abysshorn_idle_right.png
```

Zu jedem dieser drei Anker liegt die unveränderte Chroma-Quelle und der
freigestellte Master unter `art-source/generated/evolutions-v1/<starter-id>/`.
Weitere Linien werden erst nach demselben Chroma→Master→200×200-Abnahmelauf
ergänzt; es werden keine isolierten Großmaster ohne Runtime-Export eingecheckt.

## Prompt-Basis

Alle drei Pyrook-Generierungen nutzen denselben Kern:

> Original creature design for a modern browser monster-collecting idle RPG,
> premium HD 2D cel-shaded game art, clean anti-aliased linework, soft painterly
> gradients, polished modern browser/mobile RPG rendering, one creature only,
> neutral idle three-quarter side pose facing right, full body centered, safe
> padding, no pixel art, no text, no logo, no frame, no scenery, no floor, no
> cast shadow, no reflection, no watermark, no franchise resemblance. Generate
> on a perfectly flat #00ff00 chroma-key background for local alpha extraction.

Der Form-spezifische Zusatz bewahrt jeweils die Pyrook-Palette (Koralle, Creme,
Holzkohle, Bernstein) und steigert Körpervolumen, Flügelbreite, Kern und Schweif
von `solaraptor` über `solflare` bis `aetherion`.

## Abnahme vor Content-Migration

1. Chroma-Quelle mit `remove_chroma_key.py` freistellen.
2. Mit `scripts/prepare_sprite.py --size 200 --padding 8` exportieren.
3. Alpha-Ecken und Bounding-Box prüfen (`validate_assets.py`).
4. Erst danach Formpfade in `MonsterDefinition`/`getMonsterForm` aufnehmen.
5. Für jede Form separat PixelLab-Idle/Angriff/Treffer/Sieg/K.-o.-Jobs anlegen.
