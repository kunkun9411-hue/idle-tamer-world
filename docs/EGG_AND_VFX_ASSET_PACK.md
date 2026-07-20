# Eier-, Material- und Effektpaket V1

Dieses Paket ergänzt die Optik V2 um die ersten vollständig spielrelevanten Gegenstände. Alle Motive sind eigenständige Idle-Tamer-World-Designs und kopieren keine Figuren, Eier oder Symbole bestehender Monster-Franchises.

## Runtime-Inhalt

| Gruppe | Umfang | Runtime |
| --- | ---: | --- |
| artspezifische Eier | 10 | `apps/web/public/assets/eggs/<monster-id>.png` |
| unbekanntes Drop-Ei | 1 | `apps/web/public/assets/eggs/mystery.png` |
| Kernmaterialien | 5 | `apps/web/public/assets/items/*.png` |
| Ether-Inkubator | 1 | `apps/web/public/assets/incubator/incubator-frame-v1.png` |
| Brut- und Prestige-Effekte | 4 | `apps/web/public/assets/effects/{hatch,prestige}/*.png` |

Eier und Gegenstände sind transparente 200×200-RGBA-Dateien. Inkubator, Ritualring und Lichtimpulse verwenden 512×512. Der einzelne Ether-Splitter bleibt 200×200 und wird in der Prestige-Szene mehrfach mit unterschiedlichen Größen, Winkeln und Flugbahnen geklont.

## Ei-Designs

Alle Eier behalten dieselbe klare Grundform. Die Monsterlinie wird ausschließlich über bemalte Punkte, Streifen, Sterne und ein kleines Kernmotiv lesbar.

| Ei | Palette und Muster |
| --- | --- |
| Pyrook | Elfenbein, Korallrot, orange Flammenstreifen, fünf Bernsteindiamanten |
| Mossbit | Elfenbein, Moosgrün, Rindenstreifen, Minzblätter und Spiralmarke |
| Voltfin | Marineblau, Eiscyan, gelber Blitzstreifen und runde Cyanpunkte |
| Tideram | Perlmutt, blaue Wellenstreifen, türkise Blasen und Gezeitenhorn-Motiv |
| Nyxlet | Anthrazitviolett, Lavendelbahnen, Silbersterne und violetter Kern |
| Bramblet | Warmes Beige, Blattranken, Limettenherzen und weiche Dornmarken |
| Glimmite | Perlmutt, Mintfacetten, Hexagonpunkte und prismatischer Kern |
| Riftjaw | Dunkle Pflaume, Graphitbänder, Magenta-Risslinien und Dreieckskern |
| Frostel | Schneeweiß, Saphir-Froststreifen und Schneeflockenkern |
| Lumipup | Cremegold, Aurorastreifen, Honigpunkte und Sonnenkern |
| Mystery | Perlsilber, ein violettes Band, Graphitlinie, Punkte und vierzackige Sterne |

## Animationsaufbau

### Brut

```text
Ebene 3: ether-hatch-burst-v1.png   screen blend, einmalig skalieren und ausblenden
Ebene 2: <monster-id>.png            ruhiges Schweben oder Schütteln
Ebene 1: incubator-frame-v1.png      statisch, subtile CSS-Beleuchtung
```

### Prestige

```text
Ebene 5: ether-release-burst-v1.png  kurzer additiver Abschlussimpuls
Ebene 4: ether-shard-v1.png × 6      individuelle Flugrichtung und Rotation
Ebene 3: ether-crystal-v2.png        vorhandene Dreh- und Ladeanimation
Ebene 2: ritual-ring-v1.png × 2      gegenläufige Rotation
Ebene 1: prestige-sanctum-v2.webp    reagierender Szenenhintergrund
```

Die bestehende 1,65-Sekunden-Sequenz bleibt maßgeblich. `prefers-reduced-motion` und die interne Einstellung für reduzierte Bewegung stoppen die Dauerschleifen.

## Reproduzierbares Promptset

Alle Bilder wurden mit dem eingebauten Imagegen-Workflow erzeugt. Für freizustellende Motive galt diese gemeinsame Basis:

```text
Use case: stylized-concept
Asset type: isolated HD 2D game asset for Idle Tamer World
Style/medium: premium modern cel-shaded game art, crisp confident outline, soft painterly gradients, restrained silver-violet browser-RPG finish, readable at small UI sizes, original visual language, not pixel art
Composition/framing: exactly one centered subject, fully visible, generous padding, no cropped edges
Scene/backdrop: perfectly flat solid chroma-key background, uniform edge-to-edge with no floor, shadow, gradient, texture or reflection
Constraints: no text, letters, numbers, logo, watermark, scenery or extra objects; no copyrighted character or franchise resemblance
```

Ei-Promptzusatz:

```text
One simple upright oval eggshell with a pearl or warm-ivory base. Keep the shell intact and recognizable. Paint the assigned broad stripes, small dots or stars, and one lineage core motif directly on the shell. No face, limbs, nest, pedestal, crack or creature emerging.
```

Die konkreten Farben und Muster stehen in der Ei-Tabelle. Grünfreie Motive wurden auf `#00ff00`, grüne Motive auf `#ff00ff` erzeugt.

Material-Promptzusätze:

```text
training-data: three translucent cyan data wafers with silver beveled edges, pulse line and muted-violet clasp.
evolution-core: pearl shell plates partially enclosing a faceted mint-lavender seed prism with three silver ribs.
incubator-charge: short fantasy energy cell, silver cage, amber center, violet locking fins and three charge segments.
ether-dust: sealed dark-glass vial with silver cap, filled with layered violet-lavender crystalline powder.
prestige-core: black-violet faceted sphere held by three broken silver orbit bands and a vertical lavender seam.
```

Effekt-Promptzusätze:

```text
incubator-frame: empty circular open-frame cradle, silver base, graphite-violet arms, broken lavender ring and three amber charge cells; large unobstructed center.
ether-shard: one diagonal dark-violet glass splinter with silver facet edges and a lavender inner seam.
ritual-ring: perfectly front-facing thin circular ring of silver arcs, violet energy and original geometric ticks; large empty center.
prestige-burst: centered violet-white radial pulse, lavender shockwave and eight restrained rays on pure black for screen blend.
hatch-burst: centered pearl-amber release light, cyan ripple, six upward rays and tiny lavender sparks on pure black for screen blend.
```

Die unveränderten Chroma-/Schwarzquellen und freigestellten Master liegen getrennt unter `art-source/generated`. Runtime-Exports entstehen über `scripts/prepare_sprite.py`; `scripts/build_asset_manifest.py` schreibt anschließend Pfade, Maße und SHA-256-Prüfsummen neu.
