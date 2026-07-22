# A07 – minimale Tooltip-Rahmenecke

## Zweck

Kurze, ruhige Eckkappe für Tooltips, kompakte Hinweise und Mikropanels. Sie trägt die Silver-Ether-Identität, ohne kleine Inhalte mit einer Kartenfassung zu überladen.

## ImageGen-Prompt

```text
Use case: stylized-concept
Asset type: exactly one minimal top-left L-shaped tooltip-frame corner for Idle Tamer World
References: use A06 only to preserve the Silver-Ether corner geometry and use A04 to preserve the slim connection thickness. This A07 tooltip corner must be visibly simpler, shorter and quieter than A06.
Primary request: create a tiny minimal top-left 90-degree corner cap for tooltips, compact hints and micro-panels. It must connect to the thin A04/A05 rails but not dominate the content.
Subject: one slim brushed cool-silver outer bevel over a narrow dark graphite core, a very subtle violet light bend at the inner corner, no gemstone, no crystal socket, no bulky armor, no ornamental plate.
Geometry: perfectly front-facing orthographic L shape; short horizontal arm extending right and short vertical arm extending down; both arms straight, equal visual thickness and only about one third as long as A06 arms; flat perpendicular end cuts for overlap; clean square inner angle; suitable for mirroring and rotation.
Composition: exactly one isolated component centered, occupying about 24 percent of canvas width and height with very generous empty padding; no full frame, no other corners, no duplicates, no perspective, no shadow.
Backdrop: perfectly uniform solid #00ff00 chroma-key background for local removal.
Constraints: no green inside the asset; no text, letters, numbers, typography, pseudo-text, icons, logos, watermark or franchise imagery; no unique protrusions; crisp separated silhouette.
Avoid: long arms, card-sized corner, heavy beam, gemstone, faceted crystal, gold, medieval filigree, spikes, wings, curves, perspective, pixel art, contact sheet, multiple assets, excessive violet glow.
```

## Quellen und Verarbeitung

- Chromaquelle: `../chroma/frame-corner-tooltip-silver-ether-v1-chroma.png`
- transparenter Master: `../transparent/frame-corner-tooltip-silver-ether-v1-master.png`
- Runtime: `apps/web/public/assets/ui/kit/frame/corner-tooltip-v1.webp`
- Chroma-Key: automatisch erkannte Randfarbe `#05f805`
- transparente Pixel: `1.548.045 / 1.572.516`
- teilweise transparente Pixel: `1.234`
- Runtimevertrag: `192×192`, WebP, RGBA, drehbar, Anschlüsse rechts und unten

## Abnahme

- [x] deutlich kürzer und ruhiger als A06
- [x] keine Schmuckfassung oder Kristall
- [x] flache Anschlussenden
- [x] keine Schrift oder Pseudoschrift
- [x] klare Alpha-Kante
- [x] Runtime, Manifest und Katalog
- [x] Tooltip-Montage mit echtem HTML-Inhalt
- [x] automatisierter Lade-, Maß- und Responsive-Test
