# Roadmap-A-UI-Übergabe

Status: **A.08.4 und Roadmap B.08.4 abgenommen – Übergabe an Roadmap C**

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

`ui:audit` prüft Desktop, Tablet und 390×844. Neue Überlagerungen oder Überläufe lassen den Test fehlschlagen. Die UI-Schulden-Allowlist ist leer; jeder neue Befund muss einem späteren Block zugeordnet werden.

`ui:capture` erzeugt für 1280×720, 1024×768 und 390×844 jeweils 14 Vergleichsbilder von Login, Starterwahl, Kampf, Kampf-HUD, Aufträgen, Expeditionen, Habitat, Brut, Inventar, Forschung, Gilde, Profil und Prestige. Die Bilder landen unter `artifacts/ui-captures/` und werden nicht eingecheckt.

## Verbindliche Quellen

| Frage | Quelle |
| --- | --- |
| Welche Flächen und Probleme existieren? | `SCENE_INVENTORY.md` |
| Welche Komponenten, Zustände und Viewports gelten? | `apps/web/src/dev/ui-catalog-data.ts` und `/dev/ui-catalog.html` |
| Welche Farben und Basiskomponenten gelten? | `../UI_SYSTEM.md` |
| Welche neuen Tokens und Komponenten werden zuerst gebaut? | `B01_DESIGN_SYSTEM_PLAN.md` |
| Welche seriellen UI-Elemente kommen als Nächstes? | `B01_NEXT_SERIAL_GATE.md` (G26/G27/G28/G29/G30/G31/G32/G33/G34/G35/G36/H09/H10/H11/H12 abgenommen; Serienliste abgeschlossen) |
| Wie weit sind B.02–B.08? | `B02_B08_PROGRESS.md` (alle 32 B-Gates abgenommen, C-Grenzen dokumentiert) |
| Wie funktionieren Avatar und Rahmen? | `AVATAR_FRAME_CONTRACT.md` |
| Welche Assetmaße gelten? | `../ASSET_PIPELINE.md`, `../PIXELLAB_ANIMATION_CONTRACT.md` und UI-Katalog |
| Was darf UI niemals übernehmen? | `../API_CONTRACT_V8.md` und `../ONLINE_ARCHITECTURE.md` |
| In welcher Reihenfolge wird gestaltet? | `../ROADMAP_B_DESIGN_UI.md` |

## Aktuell erlaubte Layoutschulden

Aktuell gibt es keine zugelassene Layoutschuld. Neue Einträge benötigen einen
reproduzierbaren Befund, einen zuständigen B-Block und ein Abnahmekriterium.

Eine behobene Schuld muss aus Katalog, Dokument und Testallowlist gemeinsam entfernt werden. Eine neue Schuld darf nicht einfach ergänzt werden, um einen roten Test grün zu machen; sie benötigt Befund, zuständigen Block und Abnahmekriterium.

## Änderungsablauf in Roadmap B

1. betroffene Fläche und Zustand im Katalog bestimmen;
2. bestehende Server-, Content- und Assetverträge prüfen;
3. Änderung in Desktop und Mobile bauen;
4. `pnpm ui:audit` ausführen;
5. `pnpm ui:capture` erzeugen und Bilder vergleichen;
6. relevante E2E-, Kontrast- und Tastaturtests ausführen;
7. erst dann das jeweilige B-Gate abhaken. Dieser Ablauf ist für Roadmap C und
   spätere UI-Erweiterungen wiederzuverwenden.

## Unverrückbare Grenze

Roadmap B darf Navigation, Hierarchie, Darstellung und Feedback vollständig verändern. Gold, Besitz, Zeitjobs, Progression, Prestige, Gildenrechte und Transaktionen bleiben jedoch serverautoritativ. PvP, Handel, Saisons, Events und neuer Content bleiben Roadmap C.
# UI-Baukasten-Batch 2026-07-22

Schritt 2 enthält jetzt den vollständigen visuellen Produktionssatz: 18 modulare Rahmenmodule, 14 Innenflächen, 42 Leisten-/Aktions-/Wertprimitive, 16 textfreie Ressourcen-/Item-Icons, 34 textfreie System-/Navigationsicons und 12 Identitätslayer. Die 136 Rasterelemente werden mit `scripts/prepare_ui_kit.py` erzeugt, über `apps/web/public/assets/ui/kit/ui-kit-manifest.json` ausgeliefert und im UI-Katalog (`/dev/ui-catalog.html#identity-kit`) als echte Karten dargestellt; zehn CSS-/Rotationsableitungen sind zusätzlich als `#info-variants` bzw. `#system-variants` sichtbar. Chroma-Quellen und HD-Master bleiben versioniert; Texte, Zahlen und Zustände werden ausschließlich als HTML/CSS gesetzt. G11 Gilden-DNA, G16 Post, G18 Audio an, G21 Information, G22 Warnung, G23 Erfolg, G24 Fehler, G25 Schließen, G26 Zurück, G28 Hinzufügen, G29 Entfernen, G30 Sperre, G31 Filter, G32 Sortieren, G33 Suche, G34 Aktualisieren, G35 Menü, G36 Mehr/Optionen, H09 Rollenplakette Verteidigung, H10 Rollenplakette Support, H11 Rangfassung klein und H12 Rangfassung groß sind abgenommen; G19 Audio aus und G27 Vorwärts sind als CSS-Zustände/Ableitung aus G18/G26 freigegeben, die serielle UI-Liste ist abgeschlossen.
