# Gem-System

## Zweck

Evolutionen bestimmen die Grundwerte einer Monsterform. Gems sind die erste Equipment-Schicht und verstärken genau diese Grundwerte. Run-Level und Hyperlevel werden erst danach multipliziert. Dadurch bleiben Gems bei Prestige vollständig erhalten und sind trotzdem leicht verständlich.

## Slots und Effekte

Jede Monsterinstanz besitzt genau drei Slots:

| Form | Primäre Wirkung |
| --- | --- |
| Dreieck | Angriff |
| Quadrat | Leben |
| Raute | Angriff und Leben |

Die fünf Farben Karmin, Azur, Jade, Violett und Bernstein sind bereits vollständig als Katalogdimension vorhanden. Aktuell ändern sie nicht die Stärke; sie sind die vorbereitete Ebene für spätere Element-Sets, Zonenregeln oder Crafting-Rezepte.

| Seltenheit | Dreieck / Quadrat | Raute |
| --- | ---: | ---: |
| Gewöhnlich | +4 % | +3 % auf beide Werte |
| Selten | +8 % | +6 % auf beide Werte |
| Mythisch | +14 % | +10 % auf beide Werte |

Das ergibt `3 Formen × 5 Farben × 3 Seltenheiten = 45` Definitionen. Ihre IDs werden ausschließlich in `packages/content/src/catalog.ts` erzeugt; Runtime-Bilder folgen demselben Schema: `/assets/gems/<rarity>/<shape>-<color>.png`.

## Beute und Ausrüstung

- Normale Siege besitzen derzeit eine vierprozentige Gem-Chance.
- Ein Zonenboss hinterlässt garantiert einen Gem.
- Boss-Gems können selten oder mythisch sein.
- Gems liegen zunächst im Kampfspeicher und werden erst beim Einsammeln ins Inventar übertragen.
- Beim Ausrüsten wird ein vorhandener Gem derselben Form automatisch zurück ins Inventar gelegt.
- Ausrüsten, Ablegen und Grundwertberechnung laufen heute über `LocalGameService`; im Onlinebetrieb werden dieselben Aktionen serverseitige Transaktionen.

## Reproduzierbare Asset-Pipeline

Neun neutrale Imagegen-Master bilden Form und Seltenheit ab. `scripts/build_gem_assets.py` färbt sie deterministisch in fünf Varianten, beschneidet sie und schreibt transparente 200×200-PNGs. Dadurch bleiben Silhouette und Kamerawinkel pro Seltenheit identisch.

Verwendeter Master-Prompt:

```text
Create one single isolated game inventory gem icon master for a modern high-definition fantasy monster idle RPG. SHAPE: [upright equilateral TRIANGLE | upright SQUARE | upright DIAMOND / RHOMBUS]. RARITY: [COMMON: simple clean faceting, no frame | RARE: refined dense faceting with a thin brushed-silver setting and one restrained violet-white inner highlight | MYTHIC: masterwork dense faceting in an angular platinum-silver crown setting with a small white-violet core]. MATERIAL: neutral colorless silver-white quartz crystal with dark graphite edge contrast, so it can be recolored later. CAMERA: centered orthographic-like front three-quarter icon view, symmetrical, entire object visible with generous padding. STYLE: premium contemporary mobile game UI asset, polished 3D cel-shaded illustration, crisp facets, restrained silver highlights, not pixel art, not photorealistic. BACKGROUND: perfectly flat solid chroma green #00FF00 covering the full canvas, absolutely no gradient, texture, shadow, reflection, mist, glow, particles, text, letters, watermark, border, or extra objects. The gem itself contains no green. Square 1:1 composition.
```

Quellen und Ergebnisse bleiben getrennt:

- `art-source/generated/gems/masters` – unveränderte Imagegen-Ausgaben
- `art-source/generated/gems/transparent` – freigestellte neutrale Master
- `apps/web/public/assets/gems` – 45 fertige Runtime-Assets
- `apps/web/dev/asset-gallery.html` – vollständige visuelle Kontrolle im Browser
