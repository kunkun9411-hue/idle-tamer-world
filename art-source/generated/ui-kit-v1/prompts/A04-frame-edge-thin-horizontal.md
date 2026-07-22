# A04 – dünne horizontale Rahmenkante

## Zweck

Leichte streckbare Kontur für Karten, Tooltips und sekundäre Fenster. Sie ist bewusst deutlich schlanker und ruhiger als die strukturelle A02-Kante.

## ImageGen-Prompt

```text
Use case: stylized-concept
Asset type: exactly one reusable modular thin horizontal game UI frame edge for Idle Tamer World
References: preserve the approved Silver-Ether graphite, brushed cool-silver and restrained violet material language. Reference 1 is the thick A02 rail; this new A04 rail must be visibly lighter and no more than about 45 percent of its visual thickness. Reference 2 confirms the general polish only.
Primary request: create one very slim straight horizontal border rail for compact cards, tooltips and secondary panels. It must read as a refined thin border, not a heavy structural beam.
Geometry: perfectly straight parallel top and bottom outer boundaries; identical flat perpendicular left and right cuts; neutral overlap zones; calm uniform middle that can be stretched or repeated; exactly one isolated horizontal component; no corner and no unique center feature.
Subject: a narrow dark graphite core, one fine brushed-silver bevel along the outer edge, one hairline subdued violet ether inlay or violet reflection, minimal layering and no gemstone.
Style/medium: premium polished HD browser-game UI asset, crisp stylized realism, modern restrained sci-fi fantasy, orthographic front view, not pixel art
Composition: centered, occupies about 84 percent of canvas width and only 8 to 11 percent of canvas height, generous empty padding, no perspective, no shadow
Backdrop: perfectly uniform solid #00ff00 chroma-key background for local removal
Constraints: do not use green inside the rail; no text, letters, numbers, typography, pseudo-text, icons, logos, watermark or franchise imagery; both end cuts identical; no center notch, medallion, widening, protrusion or silhouette change
Avoid: thick beam, full frame, L-shape, vertical rail, multiple assets, contact sheet, large purple glow, gemstone, gold, medieval filigree, spikes, curves, perspective, pixel art
```

## Quellen und Verarbeitung

- Chromaquelle: `../chroma/frame-edge-thin-horizontal-silver-ether-v1-chroma.png`
- transparenter Master: `../transparent/frame-edge-thin-horizontal-silver-ether-v1-master.png`
- Runtime: `apps/web/public/assets/ui/kit/frame/edge-thin-horizontal-v1.webp`
- Chroma-Key: automatisch erkannte Randfarbe `#06f804`
- transparente Pixel: `1.495.843 / 1.573.352`
- teilweise transparente Pixel: `4.059`
- Runtimevertrag: `1024×64`, WebP, RGBA, drehbar, Anschlüsse links und rechts

## Abnahme

- [x] genau ein isoliertes horizontales Element
- [x] klar dünner als A02
- [x] gerade Außenkontur und identische Enden
- [x] keine einzigartige Mittelverzierung
- [x] keine Schrift oder Pseudoschrift
- [x] klare Alpha-Kante ohne grünen Hintergrund
- [x] Runtime, Manifest, Katalog und Viewporttests
- [x] automatischer Dickenvertrag gegenüber A02
