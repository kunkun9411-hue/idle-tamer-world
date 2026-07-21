# Gegner-, Boss- und Zonenrollen-Katalog

## Aktueller technischer Zwischenstand

Die zehn ursprünglichen Rookie-Linien sind bereits sammelbare Account-Monster. Die 30 normalen Gegner liegen momentan in einem getrennten Encounter-Katalog, werden aber **nicht** als dauerhaft unabhängiger Reservepool behandelt. Die verbindliche Zielstruktur ergänzt diese 30 Designs zu den vorhandenen zehn Linien: insgesamt 40 sammelbare Rookie-Linien. Die fünf Bosse bleiben eigenständige Encounter.

Bis die zusätzlichen Linien Grundwerte, Rollen, Evolutionen, Eier und Fragmentverträge besitzen, verweist `eggMonsterId` technisch noch auf eine der ersten zehn Linien. Das ist eine Übergangslösung von Version 0.2, nicht die endgültige Sammlungslogik.

Technische Quelle: `packages/content/src/encounters.ts`

## Vorläufige Verteilung

| Zone | Normale Gegner | Rotierende Bosse |
| --- | --- | --- |
| Violetter Saum | Flickerimp, Rootkin, Zapplet, Rainskip, Gloamite, Emberling, Pebblit, Currentail, Halopeep, Frostnip | Kronwurzel-Koloss, Pyroklast-Seraph |
| Glasgärten | Glasscarab, Vinecoil, Prismole, Staticress, Bloomcap, Mistray, Cindervex, Quartzling, Sunmidge, Mirehorn | Spiegelschlund-Hydra, Sturm-Leviathan |
| Obsidian-Fjord | Obsidrake, Riftling, Cryobat, Ashmaw, Nullshell, Stormelk, Duskweaver, Glacifin, Eclipsprout, Deepflare | Nihil-Wächter |

Bei mehreren Bossen rotiert der Boss mit jedem Zonenabschluss. Der Saum zeigt also beim ersten Abschluss den Kronwurzel-Koloss und beim zweiten den Pyroklast-Seraph.

Die Zonen 4 bis 10 verwenden diese Assets in Version 0.2 vorübergehend erneut. Bei der 40-Linien-Migration wird entschieden, welche Wild- oder Virusgegner an ihre Stelle treten.

## Expeditions-Duo

Der sichtbare Kampf bleibt übersichtlich 1 gegen 1. Der Spieler stellt aber zwei Account-Monster zusammen:

- **Front:** kämpft sichtbar, verwendet Run-Level, Angriff, Leben, Hyperlevel und ausgerüstete Gems.
- **Support:** erscheint im Duo-Feld und aktiviert gemeinsam mit der Front ein passendes Zonenprotokoll.

So bleibt die ursprüngliche Kampflesbarkeit erhalten, während mehrere Rollen und Monster einen langfristigen Nutzen bekommen.

## Die fünf normalisierten Rollen

| Rolle | Typische Linien |
| --- | --- |
| Angriff | Pyrook, Riftjaw |
| Verteidigung | Mossbit, Tideram |
| Support | Bramblet, Lumipup |
| Kontrolle | Nyxlet, Frostel |
| Späher | Voltfin, Glimmite |

Die sichtbaren Rollenbezeichnungen dürfen konkreter sein. Für Bonusregeln verwendet der Server nur diese fünf stabilen technischen Rollen.

## Aktuelle Zonenprotokolle

| Zone | Kombination | Effekt |
| --- | --- | --- |
| Violetter Saum | Angriff + Support | +18 % Angriff, +10 % Gold |
| Violetter Saum | Verteidigung + Support | +22 % Leben, +4 Prozentpunkte Ei-Chance |
| Glasgärten | Späher + Kontrolle | +8 Prozentpunkte Ei-Chance, +12 Prozentpunkte Materialchance |
| Glasgärten | Angriff + Verteidigung | +12 % Angriff, +18 % Leben |
| Obsidian-Fjord | Angriff + Späher | +24 % Angriff, +10 Prozentpunkte Materialchance |
| Obsidian-Fjord | Verteidigung + Kontrolle | +30 % Leben, +12 % Gold |

Die Kombination ist reihenfolgeunabhängig. Angriff in der Front plus Support im zweiten Platz funktioniert genauso wie Support in der Front plus Angriff im zweiten Platz.

## Assetstatus

- zehn ursprüngliche Rookie-Linien: vollständig als HD-Runtime-Sprites
- 30 künftige zusätzliche Rookie-Linien: HD-Sprites liegen derzeit im Enemy-Assetpfad und werden später migriert
- fünf Bosse: vollständig als HD-Runtime-Sprites
- alle Dateien: PNG, RGBA, transparent, exakt 200×200
- Runtime: `apps/web/public/assets/monsters`, `apps/web/public/assets/enemies`, `apps/web/public/assets/bosses`
- Chroma- und Alpha-Master: `art-source/generated/hd-v2`
- Validierung: `python scripts/validate_assets.py`

Die Generierung nutzte die bestehenden Sprites als Stilreferenz und pro Kreatur einen getrennten Imagegen-Aufruf. Chroma-Key-Quellen wurden lokal freigestellt, auf eine 200×200-Sicherheitsfläche gesetzt und auf transparente Ecken geprüft.
