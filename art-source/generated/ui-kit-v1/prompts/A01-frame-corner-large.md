# A01 – große universelle Rahmenecke

## Zweck

Drehbares Eckmodul für große Fenster und Dialoge. Die rechten und unteren Anschlussstutzen enden gerade und werden von separaten Kantenmodulen überlappt.

## ImageGen-Prompt

```text
Use case: stylized-concept
Asset type: single reusable modular game UI frame component for Idle Tamer World
Input images: Image 1 is the approved Silver-Ether style anchor; match only its material language, bevel discipline, restrained violet energy, and polish while creating a new modular part
Primary request: create exactly one large top-left L-shaped window frame corner module with a clean horizontal connection stub extending right and a clean vertical connection stub extending downward; both stubs must end in straight flat perpendicular cuts so separate edge modules can overlap and connect seamlessly
Subject: layered dark graphite structural plate, brushed cool-silver outer armor, one restrained faceted amethyst ether crystal near the corner, one narrow violet luminous inlay; calm inner edge and slightly stronger outer silhouette
Style/medium: premium polished HD browser game UI asset, crisp stylized realism, modern restrained sci-fi fantasy, orthographic front view, not pixel art
Composition/framing: one isolated component only, centered, top-left corner orientation, generous empty padding, no full window, no opposite corners, no duplicate parts, no perspective, no cast shadow
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal
Constraints: background must be one uniform #00ff00 with no shadow, gradient, texture, reflection, floor plane or lighting variation; crisp separated silhouette; do not use #00ff00 in the component; connection stubs must remain visually neutral and tileable; no text, no letters, no numbers, no typography, no pseudo-text, no icons, no logos, no watermark, no franchise imagery
Avoid: full frame, multiple assets, contact sheet, pixel art, cartoon outline, gold, medieval filigree, excessive glow, spikes, asymmetry that prevents 90-degree rotation
```

## Quellen und Verarbeitung

- Chromaquelle: `../chroma/frame-corner-large-silver-ether-v1-chroma.png`
- transparenter Master: `../transparent/frame-corner-large-silver-ether-v1-master.png`
- Runtime: `apps/web/public/assets/ui/kit/frame/corner-large-v1.webp`
- Chroma-Key: automatisch erkannte Randfarbe `#04f806`
- transparente Pixel: `1.152.116 / 1.572.516`
- teilweise transparente Pixel: `4.289`
- Runtimevertrag: `512×512`, WebP, RGBA, drehbar, Anschlüsse rechts und unten

## Abnahme

- [x] genau ein isoliertes Element
- [x] keine Schrift oder Pseudoschrift
- [x] rechtwinklige frontale Darstellung
- [x] klare Alpha-Kante ohne grünen Hintergrund
- [x] gerader horizontaler und vertikaler Anschluss
- [x] visueller Browsercheck im UI-Katalog
- [x] Manifest, Prüfsumme, Größen- und Ladetest
