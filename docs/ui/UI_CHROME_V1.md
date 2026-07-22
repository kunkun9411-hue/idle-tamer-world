# Silver Ether UI Chrome V1

Stand: **22. Juli 2026**  
Erzeugung: **eingebautes ImageGen**  
Status: **vier freigestellte Runtime-Assets integriert**

## Zweck

Der erste UI-Chrome-Satz beweist den verbindlichen Roadmap-B-Workflow: ImageGen erzeugt die sichtbare HD-Identität, der Chroma-Prozess entfernt den Hintergrund, `prepare_ui_chrome.py` baut feste Runtime-Varianten und HTML/CSS legt jeden Text und Zustand darüber.

## Assets

| Asset | Runtime | Einsatz |
| --- | --- | --- |
| Panelrahmen | `assets/ui/chrome/panel-frame-v1.webp` · 1024×1024 | Dialoge, besondere Karten und Fokusflächen |
| Aktionsrahmen | `assets/ui/chrome/primary-button-frame-v1.webp` · 1024×384 | hervorgehobene Aktionen mit echtem HTML-Text |
| Avatarrahmen | `assets/ui/chrome/avatar-frame-v1.webp` · 512×512 | runde Profilbilder als getrennte Ebene |
| Ether-Trenner | `assets/ui/chrome/ether-divider-v1.webp` · 1024×256 | Szenen- und Abschnittstrennung |

Unveränderte Chromaquellen liegen unter `art-source/generated/ui-chrome-v1/chroma`; freigestellte HD-Master unter `art-source/generated/ui-chrome-v1/transparent`.

## Gemeinsamer Promptvertrag

```text
Use case: stylized-concept
Asset type: reusable game UI asset for a modern HD browser monster idle game
Style/medium: premium polished HD game UI asset, crisp stylized realism, modern restrained sci-fi fantasy, not pixel art
Color and material: dark graphite structure, brushed cool-silver metal, restrained amethyst ether light in narrow inlays
Composition/framing: one centered asset, orthographic straight-on view, symmetrical, generous padding, no perspective
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal
Constraints: background is one uniform #00ff00 color with no shadow, gradient, texture, reflection, floor plane or lighting variation; crisp separated silhouette; do not use #00ff00 in the subject; no cast shadow; no contact shadow; no text, no letters, no numbers, no typography, no pseudo-text, no logos, no watermark, no franchise imagery
Avoid: pixel art, cartoon outlines, ornate medieval filigree, gold, excessive glow, asymmetry
```

## Assetspezifische Prompts

### Panelrahmen

```text
Primary request: one large square interface panel border with a completely empty center
Subject: front-facing symmetrical frame, dark graphite inner structure, brushed cool-silver metal edges and corner plates, restrained amethyst ether light running through a few narrow inlays
Composition: single square frame with balanced corners, wide unobstructed center and no icons
```

### Aktionsrahmen

```text
Primary request: one wide horizontal empty button shell for the Silver Ether interface
Subject: rectangular button frame with clipped corners, dark graphite inner plate, brushed cool-silver edge, restrained amethyst seam and small diamond energy accents at both short ends
Composition: approximately 3.5:1, broad empty middle for live HTML text
```

### Avatarrahmen

```text
Primary request: one empty round profile portrait frame in the Silver Ether interface style
Subject: layered graphite and brushed-silver circular ring with restrained violet ether crystal accents at four balanced points
Constraints: center remains empty; no face, person or creature
```

### Ether-Trenner

```text
Primary request: one slender Silver Ether section divider with a nonverbal central resonance symbol
Subject: thin symmetrical silver and graphite line ornament, small faceted violet ether diamond at center, subtle segmented technological details and pointed fading ends
Composition: approximately 5:1 and horizontally centered
```

## Reproduzierbarer Build

```powershell
python scripts\prepare_ui_chrome.py
python scripts\build_asset_manifest.py
python scripts\validate_assets.py
```

Der UI-Katalog unter `/dev/ui-catalog.html` zeigt alle vier Dateien mit darüberliegendem echtem Text. Ein Asset mit Pseudoschrift, unruhigem Key-Rand oder nichttransparenten Ecken wird nicht freigegeben.
