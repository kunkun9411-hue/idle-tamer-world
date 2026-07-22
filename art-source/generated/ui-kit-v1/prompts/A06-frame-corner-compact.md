# A06 – kompakte Kartenrahmenecke

## Zweck

Drehbare leichte Ecke für Karten, Tooltips und sekundäre Fenster. Zusammen mit A04 und A05 bildet sie die kompakte Alternative zur schweren A01–A03-Fensterschale.

## ImageGen-Prompt

```text
Use case: stylized-concept
Asset type: exactly one reusable compact top-left L-shaped card-frame corner for Idle Tamer World
References: Reference 1 is the approved A04 thin rail and defines the exact light visual thickness, fine silver bevel and subdued violet hairline. Reference 2 is the approved large A01 corner and defines only the Silver-Ether material language and front-facing polish. The new corner must be far smaller, calmer and less ornate than A01.
Primary request: create one compact top-left L-shaped corner module for cards, tooltips and secondary panels. Its right arm and lower arm must match the thin A04/A05 rail thickness and end in clean flat perpendicular overlap cuts.
Subject: slim dark graphite corner core, narrow brushed cool-silver outer bevel, restrained hairline violet ether inlay following the bend, optionally one very small flush violet facet at the exact corner but no large crystal, no bulky armor.
Geometry: orthographic front view; crisp 90-degree inner angle; compact square footprint; horizontal arm extends right and vertical arm extends down; both arms remain slim, straight and visually identical in thickness; asymmetry only from top-left orientation; suitable for mirroring and rotation.
Composition: exactly one isolated component centered, occupying about 40 percent of canvas width and height with generous empty padding; no full frame, no opposite corner, no duplicate, no perspective, no shadow.
Backdrop: perfectly uniform solid #00ff00 chroma-key background for local removal.
Constraints: no green inside the component; no text, letters, numbers, typography, pseudo-text, icons, logos, watermark or franchise imagery; flat neutral connection ends; no unique protrusion that blocks overlap.
Avoid: heavy large window corner, thick beams, oversized gemstone, gold, medieval filigree, spikes, wings, curves, perspective, pixel art, contact sheet, multiple assets, excessive glow.
```

## Quellen und Verarbeitung

- Chromaquelle: `../chroma/frame-corner-compact-silver-ether-v1-chroma.png`
- transparenter Master: `../transparent/frame-corner-compact-silver-ether-v1-master.png`
- Runtime: `apps/web/public/assets/ui/kit/frame/corner-compact-v1.webp`
- Chroma-Key: automatisch erkannte Randfarbe `#05f807`
- transparente Pixel: `1.477.092 / 1.572.516`
- teilweise transparente Pixel: `2.984`
- Runtimevertrag: `256×256`, WebP, RGBA, drehbar, Anschlüsse rechts und unten

## Abnahme

- [x] kompakte leichte Silhouette
- [x] flache Anschlussenden
- [x] keine Schrift oder Pseudoschrift
- [x] klare Alpha-Kante ohne grünen Hintergrund
- [x] Runtime, Manifest und Katalog
- [x] kompakte Kartenmontage mit A04 und A05
- [x] automatisierter Lade-, Maß- und Responsive-Test
