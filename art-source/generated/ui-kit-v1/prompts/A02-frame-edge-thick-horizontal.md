# A02 – dicke horizontale Rahmenkante

## Zweck

Gerade, streckbare oder überlappend wiederholbare Kante für große Fenster und Dialoge. Beide Enden besitzen identische senkrechte Schnitte und neutrale Überlappungszonen.

## Erster Entwurf – verworfen

Der erste Entwurf traf Material und Farbe, besaß jedoch eine große einzigartige Einkerbung in der Mitte. Dadurch hätte er beim Strecken oder Wiederholen sichtbar verzerrt. Er wurde nicht in das Repository übernommen.

## Freigegebener Korrekturprompt

```text
Edit the first referenced horizontal rail into a truly modular seamless thick horizontal edge while preserving its excellent Silver-Ether materials and front-facing polish. Use the second reference only to keep compatibility with A01.

Required geometry correction: remove every large central notch, dip, peak, medallion, widening and silhouette interruption. The top outer boundary and bottom outer boundary must be perfectly straight parallel horizontal lines from the flat left cut to the flat right cut. The internal layered silver and graphite bands must also continue uniformly across the entire rail. Keep a single narrow continuous violet ether line. A tiny uniform repeating seam pattern is allowed, but there must be no unique center feature.

Output exactly one isolated long horizontal rail, centered, same approximate scale, both ends identical clean flat perpendicular cuts with neutral overlap zones. The component must be usable as a repeatable or horizontally stretched edge without revealing a center. Orthographic front view, no perspective, no shadow.

Keep the perfectly uniform solid #00ff00 chroma background. Do not place green in the rail. No text, letters, numbers, pseudo-text, icon, logo, watermark, corner, L-shape, vertical rail, full frame, duplicate asset, gemstone, gold, spikes or medieval ornament.
```

## Quellen und Verarbeitung

- Chromaquelle: `../chroma/frame-edge-thick-horizontal-silver-ether-v1-chroma.png`
- transparenter Master: `../transparent/frame-edge-thick-horizontal-silver-ether-v1-master.png`
- Runtime: `apps/web/public/assets/ui/kit/frame/edge-thick-horizontal-v1.webp`
- Chroma-Key: automatisch erkannte Randfarbe `#16ea19`
- transparente Pixel: `1.238.365 / 1.573.352`
- teilweise transparente Pixel: `4.835`
- Runtimevertrag: `1024×192`, WebP, RGBA, drehbar, Anschlüsse links und rechts

## Abnahme

- [x] genau ein isoliertes horizontales Element
- [x] keine Schrift oder Pseudoschrift
- [x] vollständig gerade Außenkontur
- [x] identische flache Anschlussenden
- [x] kein einzigartiges Mittelornament
- [x] klare Alpha-Kante ohne grünen Hintergrund
- [x] Runtime, Manifest und Katalog
- [x] sichtbare Verbindungsprobe mit A01
- [x] automatisierter Lade- und Maßtest
