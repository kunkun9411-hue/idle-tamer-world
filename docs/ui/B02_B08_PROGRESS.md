# Roadmap B · B.02–B.08 Arbeitsstand

Stand: **26. Juli 2026, Roadmap B.08-Abnahme**

Dieses Dokument trennt nachweisbare Vorarbeit von einer formalen Abnahme. Kein
Block wird dadurch vorzeitig freigegeben. B.01 ist nach B.01.4 visuell
abgenommen; B.05–B.08 sind nach Online-, Responsive- und Gesamtpolish-Nachweis
ebenfalls eingefroren und an Roadmap C übergeben.

## Nachweisbare Vorarbeit

| Block | Bereits nachweisbar | Noch offen für die formale Abnahme |
| --- | --- | --- |
| B.02 Navigation | `navigation-ia.spec.ts` erreicht Dispatch, Habitat, Brut, Inventar, Forschung, Gilde, Aufträge und Profil und kehrt jeweils zur Kampfszene zurück. Das mobile 7er-Dock bleibt bei 390/820 px einreihig; Desktop-/Tablet-/Mobile-E2E sind grün. | geschlossen: B.02.4 intern abgenommen und als Fertig im öffentlichen Status markiert |
| B.03 Kampfszene/HUD | B03-Vertrag, eigener Fokus-/Zwei-Monster-Test, Core-Loop, Responsive-Checks und Desktop-/Tablet-/Mobile-Captures sind grün; die Bühne bleibt die dominante Fläche. | geschlossen: B.03 intern abgenommen und als Fertig im öffentlichen Status markiert |
| B.04 Sammlung/Entwicklung | `state-matrix.spec.ts` deckt leere Brut-/Habitat-Zustände und die gesperrte Prestige-Bestätigung ab; Core-Loop deckt Ei, Fragment, Hyperlevel, Evolution und Gem aus. | geschlossen: B.04 intern abgenommen und als Fertig im öffentlichen Status markiert |
| B.05 Profil/Identität | `profile-guild-surfaces.spec.ts` und der Live-Gilden-Capture prüfen getrennte Avatar-/Rahmen-Auswahl, Fallbacks und die Identität im Mitglieder-/Freundesbereich; H01–H12 sind im UI-Kit verfügbar. | geschlossen: Ranglistenlogik bleibt bewusst Roadmap C |
| B.06 Gilde/Soziales | Vertrag, servergespeister Gildenhub, Feature-Flag-Aus-Zustand, 4/4 Foundation, 7/7 Auth, 8/8 Run, 7/7 Guild-Integration sowie `live-guild.spec.ts` und Capture sind grün. | geschlossen: QA-Account und Testgilde nach dem Lauf entfernt |
| B.07 Responsive/A11y | Layout-Audit, Responsive-, Keyboard-, Kontrast-, Reduced-Motion- und `b07-b08-acceptance.spec.ts`-Läufe sind grün; drei Viewports und 2×-Typografiestress sind dokumentiert. | geschlossen: echte Geräte-Smokes gehören zu Roadmap D |
| B.08 Gesamtpolish | 136 textfreie Rasterelemente, 10 CSS-/Rotationsableitungen, Zustandsmatrix, Asset-Budget, 14×3 Captures, Live-Gilden-Capture, Mikrofeedback und Produktionsbuild sind grün. | geschlossen: Oberfläche an Roadmap C übergeben |

## Reproduzierbare Prüfbefehle

```text
pnpm check:roadmap
python scripts/validate_assets.py
pnpm --filter @idle-tamer/web test
pnpm --filter @idle-tamer/web ui:audit
pnpm --filter @idle-tamer/web test:e2e
pnpm --filter @idle-tamer/web ui:capture
pnpm --filter @idle-tamer/web build
```

Der aktuelle Assetstand umfasst 136 Rasterelemente im UI-Kit, 10 CSS-/
Rotationsableitungen und 257 IDs im Gesamtmanifest (8.39 MB). Texte, Zahlen und Zustände
bleiben HTML/CSS; die Rastergrafiken sind textfrei.

## Nachtlauf-Übergabe für B.08

Technisch nachweisbar sind jetzt:

- die komplette G30–G36-/H09–H12-Serienliste inklusive Master, Chroma-Quelle,
  Runtime-WebP, Manifest, Katalogkarte und Assetprüfung;
- 60/60 Unit-/Vertragstests, 31 lokale E2E-Tests (zwei optionale Live-Tests
  werden ohne Umgebungsvariablen übersprungen), drei Layout-Audit- und drei
  Capture-Läufe sowie ein erfolgreicher Produktionsbuild;
- keine offene Layout-Schuld in der UI-Audit-Allowlist und kein Überschreiten des
  8.5-MB-Runtime-Budgets;
- dokumentierte Nachweise für Navigation, Kampfszene, Sammlung, Profil, Gilde,
  Responsive/A11y und Gesamtpolish.

B.01.4 bis B.08.4 sind nach den jeweiligen Reviews im öffentlichen Status
synchronisiert. Der aktive Gildenpfad wurde auf der Dev-Domain mit einem
ephemeren Konto bestätigt und anschließend bereinigt. Roadmap B ist damit
geschlossen; neue Ranglistenlogik, größere Wettbewerbssysteme und Content
gehören in Roadmap C.
