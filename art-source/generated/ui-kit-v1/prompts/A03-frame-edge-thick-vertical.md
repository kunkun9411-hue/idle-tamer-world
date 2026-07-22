# A03 – dicke vertikale Rahmenkante

## Zweck

Vertikale Seitenkante für große Fenster und Dialoge. Sie muss exakt dieselbe Materialstärke, Etherlinie und Detaildichte wie A02 besitzen.

## Ableitung statt Neugenerierung

A03 verwendet keinen neuen ImageGen-Prompt. Die Runtime wird in `scripts/prepare_ui_kit.py` reproduzierbar um 90 Grad aus dem freigegebenen transparenten A02-Master gedreht. Dadurch entstehen weder neue Stilabweichungen noch unnötige Generierungskosten.

## Quellen und Verarbeitung

- Quellmaster: `../transparent/frame-edge-thick-horizontal-silver-ether-v1-master.png`
- abgeleitet von: `A02`
- Transformation: `rotate-90-from-A02`
- Runtime: `apps/web/public/assets/ui/kit/frame/edge-thick-vertical-v1.webp`
- Runtimevertrag: `192×1024`, WebP, RGBA, drehbar, Anschlüsse oben und unten

## Abnahme

- [x] verlustfreie deterministische Ableitung
- [x] identische Material- und Linienstärke zu A02
- [x] transparente Ecken und sichtbarer Inhalt
- [x] Manifest mit expliziter Ableitungsherkunft
- [x] sichtbare Vollrahmenprobe mit A01 und A02
- [x] automatisierter Lade-, Maß- und Responsive-Test
