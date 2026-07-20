# Asset-Pipeline – HD und PixelLab

## Verbindliches Runtime-Format

- PNG mit Alpha
- exakt 200×200 Pixel
- Monster vollständig im Bild
- neutrale Seitenansicht und klare Silhouette
- getrennt lesbare Gliedmaßen für spätere Animation
- Anime-/Cel-Shading-HD-Optik, keine Pixelkunst

Imagegen erzeugt zunächst einen hochauflösenden Chroma-Master. Der installierte Freistellungsprozess entfernt den Key. `scripts/prepare_sprite.py` trimmt nur die transparente Fläche, erhält acht Pixel Sicherheitsabstand und exportiert deterministisch auf einer 200×200-Leinwand.

Die aktuelle HD-v2-Serie umfasst zehn Rookie-Starter, 30 Normalgegner und fünf Bosse. Optik V2 ergänzt drei 1600×900-Zonenwelten. Neun neutrale Gem-Master liefern außerdem 45 transparente Equipment-Varianten. Das offizielle transparente Idle-Tamer-World-Logo ist ein eigener Branding-Asset. `python scripts/validate_assets.py` prüft Anzahl, Format, Größe und Prüfsummen aller 94 Runtime-Bilder.

## Ordner

- `art-source/generated/hd-v1/*_chroma.png` – unveränderte Generierung
- `art-source/generated/hd-v1/*_master.png` – freigestellter HD-Master
- `art-source/generated/hd-v2` – Chroma- und Alpha-Master der vollständigen neuen Serie
- `public/assets/monsters/*.png` – freigegebener 200×200-Runtime-Export
- `public/assets/enemies/*.png` – 30 freigegebene Normalgegner
- `public/assets/bosses/*.png` – fünf freigegebene Zonenbosse
- `art-source/generated/zone-backgrounds-v2` – unveränderte ImageGen-PNG-Master der drei Welten
- `public/assets/zones/*-v2.webp` – optimierte 1600×900-Runtime-Hintergründe
- `art-source/generated/gems/masters` – neun unveränderte Imagegen-Chroma-Master
- `art-source/generated/gems/transparent` – neun neutrale freigestellte Gem-Master
- `public/assets/gems/<rarity>/*.png` – 45 freigegebene transparente 200×200-Gems
- `public/assets/branding/idle-tamer-world-logo.png` – offizielles transparentes 1024×1024-Markenlogo
- `public/assets/asset-manifest.json` – versionierter Pfad-, Maß-, Format- und SHA-256-Vertrag aller Runtime-Bilder
- `art-source/archive/pixel-v1` – verworfener Pixel-Stiltest

## PixelLab später

Die aktuellen 200×200-Dateien sind die Identitäts- und Idle-Anker für die spätere PixelLab-API. Animationen werden nicht jetzt durch uneinheitliche KI-Einzelbilder vorgetäuscht. Wenn der API-Schritt beginnt, speichern wir pro Monster:

- unveränderten Idle-Anker
- Prompt und Modell-/API-Version
- Animationsname und Framezahl
- Richtung
- feste Leinwand 200×200 pro Frame
- Export- und Prüfsumme

Erste Animationen: Idle, Treffer, Angriff, Sieg und K. o. Pro Iteration wird nur eine Animation und ein Monster freigegeben, bevor Credits für ganze Evolutionslinien eingesetzt werden.

Der vollständige Job-, Frame-, Anker- und Abnahmevertrag steht in `PIXELLAB_ANIMATION_CONTRACT.md`. `python scripts/build_asset_manifest.py` aktualisiert nach einem freigegebenen Export das deterministische Runtime-Manifest.

Zonenhintergründe laufen getrennt von der 200×200-PixelLab-Spritepipeline. `python scripts/prepare_zone_backgrounds.py` erzeugt ihre WebP-Runtime-Dateien reproduzierbar aus den PNG-Mastern; Promptset und Art Direction stehen in `docs/ART_DIRECTION_V2.md`.

Gems laufen ebenfalls getrennt von Monsteranimationen. `python scripts/build_gem_assets.py` erzeugt aus neun freigestellten Mastern alle fünf Farbvarianten pro Form und Seltenheit. Regeln und der reproduzierbare Prompt stehen in `docs/GEM_SYSTEM.md`.
