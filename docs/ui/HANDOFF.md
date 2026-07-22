# Roadmap-A-UI-Übergabe

Status: **A.08.2 abgenommen – technisches Übergabepaket für Roadmap B**

## Schnellstart

```powershell
pnpm dev:web
```

Danach stehen bereit:

- Spiel: `http://127.0.0.1:5173/`
- UI-Katalog: `http://127.0.0.1:5173/dev/ui-catalog.html`
- feste Mobile-Vorschau: `http://127.0.0.1:5173/dev/mobile-preview.html`
- Asset-Galerie: `http://127.0.0.1:5173/dev/asset-gallery.html`
- öffentliche Roadmap: `http://127.0.0.1:5173/roadmap/`

## Automatische UI-Werkzeuge

```powershell
pnpm ui:audit
pnpm ui:capture
```

`ui:audit` prüft Desktop, Tablet und 390×844. Neue Überlagerungen oder Überläufe lassen den Test fehlschlagen. Die zwei bereits gemessenen Schulden sind in `ui-catalog-data.ts` ausdrücklich erlaubt, bis ihre zuständigen B-Blöcke sie entfernen.

`ui:capture` erzeugt für 1280×720, 1024×768 und 390×844 jeweils 14 Vergleichsbilder von Login, Starterwahl, Kampf, Kampf-HUD, Aufträgen, Expeditionen, Habitat, Brut, Inventar, Forschung, Gilde, Profil und Prestige. Die Bilder landen unter `artifacts/ui-captures/` und werden nicht eingecheckt.

## Verbindliche Quellen

| Frage | Quelle |
| --- | --- |
| Welche Flächen und Probleme existieren? | `SCENE_INVENTORY.md` |
| Welche Komponenten, Zustände und Viewports gelten? | `apps/web/src/dev/ui-catalog-data.ts` und `/dev/ui-catalog.html` |
| Welche Farben und Basiskomponenten gelten? | `../UI_SYSTEM.md` |
| Wie funktionieren Avatar und Rahmen? | `AVATAR_FRAME_CONTRACT.md` |
| Welche Assetmaße gelten? | `../ASSET_PIPELINE.md`, `../PIXELLAB_ANIMATION_CONTRACT.md` und UI-Katalog |
| Was darf UI niemals übernehmen? | `../API_CONTRACT_V8.md` und `../ONLINE_ARCHITECTURE.md` |
| In welcher Reihenfolge wird gestaltet? | `../ROADMAP_B_DESIGN_UI.md` |

## Aktuell erlaubte Layoutschulden

1. `mobile-combat-navigation-overlap` – P0, B.02/B.03.
2. `subpage-account-overflow` – P1, B.02/B.07.

Eine behobene Schuld muss aus Katalog, Dokument und Testallowlist gemeinsam entfernt werden. Eine neue Schuld darf nicht einfach ergänzt werden, um einen roten Test grün zu machen; sie benötigt Befund, zuständigen Block und Abnahmekriterium.

## Änderungsablauf in Roadmap B

1. betroffene Fläche und Zustand im Katalog bestimmen;
2. bestehende Server-, Content- und Assetverträge prüfen;
3. Änderung in Desktop und Mobile bauen;
4. `pnpm ui:audit` ausführen;
5. `pnpm ui:capture` erzeugen und Bilder vergleichen;
6. relevante E2E-, Kontrast- und Tastaturtests ausführen;
7. erst dann das jeweilige B-Gate abhaken.

## Unverrückbare Grenze

Roadmap B darf Navigation, Hierarchie, Darstellung und Feedback vollständig verändern. Gold, Besitz, Zeitjobs, Progression, Prestige, Gildenrechte und Transaktionen bleiben jedoch serverautoritativ. PvP, Handel, Saisons, Events und neuer Content bleiben Roadmap C.
