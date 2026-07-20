# PixelLab-Animationsvertrag 1.0

Dieser Vertrag verbindet die vorhandenen HD-Idle-Anker mit der späteren PixelLab-API. Er ist provider-neutral: API-Schlüssel, Endpunkt und das konkrete PixelLab-Modell kommen erst in die Build-Umgebung, niemals in Browsercode oder Git.

## Unveränderliche Bildregeln

- genau ein Monster, vollständiger Körper, transparente Fläche
- Runtime-Leinwand pro Frame: exakt **200×200 RGBA-PNG**
- HD-Cel-Shading, saubere Anti-Aliasing-Kanten, ausdrücklich keine Pixelkunst
- Standardrichtung `right`; Spiegelung nach links erfolgt im Client
- Füße bzw. tiefster Bodenkontakt auf Grundlinie `y=178 ± 4`
- visueller Mittelpunkt `x=100 ± 12`; acht Pixel Sicherheitszone
- Palette, Proportionen, Kernsymbol und Silhouette bleiben gegenüber dem freigegebenen Idle-Anker gesperrt
- kein Schatten, Hintergrund, Text, UI, Logo oder Wasserzeichen

## Pflichtanimationen der ersten Freigabe

| Clip | Frames | Loop | Zweck |
| --- | ---: | --- | --- |
| `idle` | 8 | ja | ruhige Atmung, minimale Sekundärbewegung |
| `attack` | 8 | nein | Antizipation, Kontakt in Frame 5, Rückkehr |
| `hit` | 4 | nein | lesbarer Treffer ohne Positionssprung |
| `victory` | 8 | nein | kurze positive Reaktion, danach Idle |
| `ko` | 6 | nein | kontrolliertes Absinken, letzter Frame hält |

Die Browsergrundversion darf zunächst nur `idle` verwenden. Ein neuer Clip wird erst nach Sichtprüfung an einem Monster auf die restlichen Linien ausgerollt.

## Dateinamen und Ordner

```text
art-source/animation-jobs/<monster-id>/<job-id>/request.json
art-source/animation-jobs/<monster-id>/<job-id>/raw/frame-0001.png
apps/web/public/assets/animations/<monster-id>/<form>/<clip>/right/frame-0001.png
```

Beispiel: `apps/web/public/assets/animations/pyrook/rookie/attack/right/frame-0005.png`.

## Interner API-Auftrag

`request.json` ist der stabile Vertrag zwischen Content-Werkzeug und späterem PixelLab-Adapter:

```json
{
  "contractVersion": 1,
  "jobId": "pyrook-rookie-attack-r1",
  "contentReleaseId": "foundation-1.0.0",
  "monsterId": "pyrook",
  "form": "rookie",
  "clip": "attack",
  "facing": "right",
  "frameCount": 8,
  "canvas": { "width": 200, "height": 200, "format": "png", "alpha": true },
  "anchor": { "x": 100, "baselineY": 178 },
  "sourceAssetId": "monster.pyrook_rookie_idle_right",
  "sourceSha256": "<aus asset-manifest.json>",
  "identityPrompt": "<gesperrter Monster-Designblock>",
  "motionPrompt": "<nur Bewegung und Timing>",
  "provider": { "name": "pixellab", "model": "<später festlegen>", "apiVersion": "<später festlegen>" }
}
```

Der Adapter darf Provider-Felder ergänzen, aber keine Identitäts-, Canvas- oder Ankerfelder verändern. Zugangsdaten werden ausschließlich über Umgebungsvariablen eingelesen.

## Abnahme je Job

1. Quell-ID und SHA-256 stimmen mit `apps/web/public/assets/asset-manifest.json` überein.
2. Framezahl, RGBA, 200×200 und transparente Ecken werden automatisch geprüft.
3. Kein Frame wird beschnitten; Baseline und Mittelpunkt bleiben im Toleranzbereich.
4. Erster und letzter Loop-Frame erzeugen keinen sichtbaren Sprung.
5. Identität wird bei 100 %, 200 % und im echten Kampf geprüft.
6. Freigegebene Frames erhalten neue Manifest-Einträge; Raw-Ausgaben bleiben außerhalb der Runtime.

## Promptaufteilung

Der Identitätsblock kommt unverändert aus `docs/PIXELLAB_PROMPTS.md`. Der Bewegungsblock beschreibt nur Clip, Timing und physische Aktion. Beispiel:

```text
Create an 8-frame non-looping attack animation. Preserve the supplied creature identity, proportions, palette and chest core exactly. Frames 1-2 anticipation, frames 3-4 forward motion, frame 5 impact, frames 6-8 controlled return to the original idle anchor. No camera movement, no scale drift, no added effects or background.
```
