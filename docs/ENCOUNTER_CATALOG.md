# Gegner-, Boss- und Zonenrollen-Katalog

## Warum Gegner getrennt von sammelbaren Monstern sind

Die zehn Rookie-Linien sind die sammelbaren Account-Monster. Die 30 normalen Gegner und fünf Bosse bilden einen unabhängigen Encounter-Katalog. Dadurch können sie beliebig über Zonen, Events und Jahre verteilt werden, ohne automatisch 35 zusätzliche Zuchtlinien, Evolutionen und Fragmentinventare zu erzwingen.

Jeder Gegner besitzt ein `eggMonsterId`. Wenn ein Ei droppt, verweist es auf eine der zehn sammelbaren Rookie-Linien. Die sichtbare Wildform und das mögliche Ei müssen also nicht identisch sein.

Technische Quelle: `src/game/encounters.ts`

## Verteilung

| Zone | Normale Gegner | Rotierende Bosse |
| --- | --- | --- |
| Violetter Saum | Flickerimp, Rootkin, Zapplet, Rainskip, Gloamite, Emberling, Pebblit, Currentail, Halopeep, Frostnip | Kronwurzel-Koloss, Pyroklast-Seraph |
| Glasgärten | Glasscarab, Vinecoil, Prismole, Staticress, Bloomcap, Mistray, Cindervex, Quartzling, Sunmidge, Mirehorn | Spiegelschlund-Hydra, Sturm-Leviathan |
| Obsidian-Fjord | Obsidrake, Riftling, Cryobat, Ashmaw, Nullshell, Stormelk, Duskweaver, Glacifin, Eclipsprout, Deepflare | Nihil-Wächter |

Bei mehreren Bossen rotiert der Boss mit jedem Zonenabschluss. Der Saum zeigt also beim ersten Abschluss den Kronwurzel-Koloss und beim zweiten den Pyroklast-Seraph.

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

- zehn Rookie-Starter: vollständig als HD-Runtime-Sprites
- 30 normale Gegner: vollständig als HD-Runtime-Sprites
- fünf Bosse: vollständig als HD-Runtime-Sprites
- alle Dateien: PNG, RGBA, transparent, exakt 200×200
- Runtime: `public/assets/monsters`, `public/assets/enemies`, `public/assets/bosses`
- Chroma- und Alpha-Master: `art-source/generated/hd-v2`
- Validierung: `python scripts/validate_assets.py`

Die Generierung nutzte die bestehenden Sprites als Stilreferenz und pro Kreatur einen getrennten Imagegen-Aufruf. Chroma-Key-Quellen wurden lokal freigestellt, auf eine 200×200-Sicherheitsfläche gesetzt und auf transparente Ecken geprüft.
