# Prestige-Szene V2 – Ether-Heiligtum

Die Prestige-Szene ist ein eigenständiger Ritualraum und kein normales Untermenü. Sie zeigt klar, was der Run verliert, was permanent bleibt und warum Prestige erst ab Zone 10 verfügbar ist.

## Runtime-Aufbau

- `public/assets/prestige/prestige-sanctum-v2.webp` – optimierter 1600×900-RGB-Hintergrund
- `public/assets/prestige/ether-crystal-v2.png` – transparenter 512×768-RGBA-Kristall
- `src/styles-progression-v3.css` – Siegel, Orbits, Splitter, Energiestrahl, Plattform und Aktivierungssequenz
- `scripts/prepare_prestige_assets.py` – reproduzierbarer Export aus den unveränderten Mastern

Die Szene bleibt auf Desktop vollständig im ersten 1280×720-Bildschirm. Auf 390×844 wird sie einspaltig und ohne horizontales Überlaufen fortgesetzt. `prefers-reduced-motion` sowie die interne Einstellung für reduzierte Bewegung stoppen die langen Schleifen.

## Animation

Im Ruhezustand schwebt der Kristall langsam, während sich Siegel und Orbitpartikel mit unterschiedlichen Geschwindigkeiten bewegen. Beim Bestätigen läuft eine feste 1,65-Sekunden-Sequenz:

1. Siegel und Orbits beschleunigen.
2. Der Kristall dreht sich räumlich um seine Hochachse und lädt sich auf.
3. Splitter lösen sich, der Energiestrahl öffnet sich und der Raum reagiert.
4. Ein kurzer heller Impuls löst die Zeitlinie auf.
5. Erst danach wird das Prestige-Kommando ausgeführt und der neue Zustand angezeigt.

## Verwendete Imagegen-Prompts

### Heiligtum

```text
Use case: stylized-concept
Asset type: full-screen 16:9 browser game environment background for the dedicated Prestige scene of "Idle Tamer World"
Primary request: create a premium dark ether sanctum where a permanent time-reset ritual takes place, matching a modern restrained silver-and-violet fantasy UI
Scene/backdrop: vast symmetrical circular chamber suspended in a black cosmic void, layered obsidian floor rings, elegant brushed-silver arches and thin floating metallic fragments, subtle distant ruins, controlled violet ether currents and tiny particles
Composition/framing: cinematic straight-on wide composition, strong centered perspective, circular ritual platform in the lower center, generous clean negative space exactly in the center for a separately animated crystal, quieter outer thirds for UI text and ledgers, readable depth at desktop and mobile crops
Style/medium: polished HD game key art, refined anime-inspired fantasy environment with realistic materials and restrained cel-shaded clarity, contemporary high-end browser RPG, crisp shapes, not pixel art
Lighting/mood: solemn ascension ritual, low-key charcoal lighting, cool silver rim light, subtle violet and lavender glow, small mint highlights only, deep contrast while keeping UI-readable shadow detail
Color palette: near-black #07070c, graphite, gunmetal silver, pale silver, muted violet #8f72dc, bright lavender #cbb8ff
Materials/textures: brushed metal, dark glass, polished obsidian, fine energy filaments, no grunge overload
Constraints: background environment only; leave the exact center empty enough for a large foreground crystal; no character, no monster, no crystal, no text, no letters, no numbers, no logo, no interface panels, no watermark
Avoid: generic mobile-game gold ornament, bright rainbow neon, blue sci-fi spaceship, crowded props, baked-in buttons, pixel art, cartoon clouds
```

### Ether-Kristall

```text
Use case: stylized-concept
Asset type: separate foreground game asset for an animated Prestige ritual in a modern browser RPG
Primary request: one iconic vertical Ether crystal, an elegant faceted dimensional shard that visually stores permanent monster energy
Subject: a single large symmetrical elongated crystal, sharp diamond-like top and tapered lower point, layered translucent violet core inside a dark glass outer shell, thin polished silver facet edges, one subtle bright lavender energy seam through the center
Style/medium: polished HD game asset, refined anime-inspired fantasy rendering with realistic glass and metal materials, crisp silhouette, premium contemporary RPG, not pixel art
Composition/framing: object perfectly centered, upright, fully visible, generous padding on every side, no cropped tips, no pedestal, no environment
Lighting/mood: internal violet luminescence, cool silver rim light, controlled highlights suitable for CSS glow effects
Color palette: black-violet glass, gunmetal silver, muted violet #8f72dc, lavender #cbb8ff, tiny white core
Background: perfectly flat solid #00ff00 chroma-key background for removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation
Constraints: only one crystal; keep crisp separated edges; do not use #00ff00 anywhere in the crystal; no cast shadow, no contact shadow, no reflection, no smoke, no particles, no text, no letters, no numbers, no logo, no watermark
Avoid: clusters of crystals, gems, weapons, rainbow colors, gold ornament, scenery, UI frame, blurry bloom covering the silhouette
```

Die unveränderten Quellen liegen unter `art-source/generated/prestige-v2`. Neue Varianten werden dort abgelegt und erst nach dem Runtime-Export in den Assetvertrag aufgenommen.
