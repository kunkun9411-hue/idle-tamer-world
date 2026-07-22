# A05 – dünne vertikale Rahmenkante

## Zweck

Vertikale leichte Seitenkontur für Karten, Tooltips und sekundäre Fenster. Sie muss exakt dieselbe feine Materialstärke wie A04 behalten.

## Ableitung statt Neugenerierung

A05 wird in `scripts/prepare_ui_kit.py` reproduzierbar um 90 Grad aus dem freigegebenen transparenten A04-Master gedreht. Ein neuer ImageGen-Lauf würde keinen neuen fachlichen Wert liefern und könnte die feine Dicke verfälschen.

## Quellen und Verarbeitung

- Quellmaster: `../transparent/frame-edge-thin-horizontal-silver-ether-v1-master.png`
- abgeleitet von: `A04`
- Transformation: `rotate-90-from-A04`
- Runtime: `apps/web/public/assets/ui/kit/frame/edge-thin-vertical-v1.webp`
- Runtimevertrag: `64×1024`, WebP, RGBA, drehbar, Anschlüsse oben und unten

## Abnahme

- [x] deterministische 90°-Ableitung
- [x] identische Material- und Linienstärke zu A04
- [x] transparente Ecken und sichtbarer Inhalt
- [x] Manifest, Katalog, Maße und Viewports
