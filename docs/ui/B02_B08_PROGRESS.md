# Roadmap B · B.02–B.08 Arbeitsstand

Stand: **30. Juli 2026, Roadmap B bei 28/32 – B.03 und B.08 offen**

Dieses Dokument trennt nachweisbare Vorarbeit von einer formalen Abnahme. Kein
Block wird dadurch vorzeitig freigegeben. B.01 ist nach B.01.4 visuell
abgenommen; B.02 sowie B.04–B.07 sind ebenfalls abgeschlossen. B.03 wurde nach
der visuellen Spielersicht wieder geöffnet. Deshalb bleiben auch die
Gesamtprüfung und Abnahme in B.08 offen.

Statusautorität ist
`apps/web/public/roadmap/roadmap-status.json`; die dazugehörige schriftliche
Fortschrittstabelle steht in `docs/ROADMAP_B_DESIGN_UI.md`. Bei einem
Widerspruch gelten diese beiden Quellen und nicht ältere Nachweise in diesem
Dokument. Roadmap C ist bis zur synchronen Abnahme von B.03 und B.08 gesperrt.

## Nachweisbare Vorarbeit

| Block | Bereits nachweisbar | Noch offen für die formale Abnahme |
| --- | --- | --- |
| B.02 Navigation | `navigation-ia.spec.ts` prüft Ziele als Kampfpanel sowie Monster und Inventar als gegenseitig ausschließende Kampf-Schnellfenster. Jeder Inventar-Einstieg öffnet jetzt dasselbe 64-Slot-Fenster in der Kampfszene; die frühere Inventar-Unterseite ist entfernt und Herstellung liegt unter Forschung. Expeditionen, Brut, Forschung und Gilde bleiben eigene Szenen; Profil und die Rückkehr zum Kampf sind ebenfalls geprüft. Auf 390 px entfällt der im Kampf redundante globale Kampf-Eintrag; fünf primäre Kampfaktionen und sechs sekundäre Bereichsziele bleiben beschriftet und mindestens 44 px hoch. | geschlossen: B.02.4 intern abgenommen und als Fertig im öffentlichen Status markiert |
| B.03 Kampfszene/HUD | B03-Vertrag, Fokus-/Zwei-Monster-QA-Fixture, Core-Loop, Responsive-Checks und aktuelle Desktop-/Tablet-/Mobile-Captures prüfen Monsterposition, kompakte Nameplates, die hierarchisierten Bedienleisten sowie Front/Support/Zonenbonus. Die am 29. Juli gefundene mobile Eingabeblockade ist behoben und regressionsgesichert. Die Spieleridentität ist als gemeinsame Avatar-/Name-/Rang-/Währungskarte statt loser HUD-Chips umgesetzt. | **offen:** vollständige Live-Spielerprüfung des zusammenhängenden Spiels und danach formale B.03.3/B.03.4-Abnahme |
| B.04 Sammlung/Entwicklung | `state-matrix.spec.ts` deckt leere Brut-/Habitat-Zustände und die gesperrte Prestige-Bestätigung ab; Core-Loop deckt Ei, Fragment, Hyperlevel, Evolution und Gem aus. | geschlossen: B.04 intern abgenommen und als Fertig im öffentlichen Status markiert |
| B.05 Profil/Identität | `profile-guild-surfaces.spec.ts` und der Live-Gilden-Capture prüfen getrennte Avatar-/Rahmen-Auswahl, Fallbacks und die Identität im Mitglieder-/Freundesbereich; H01–H12 sind im UI-Kit verfügbar. | geschlossen: Ranglistenlogik bleibt bewusst Roadmap C |
| B.06 Gilde/Soziales | Vertrag, servergespeister Gildenhub, Feature-Flag-Aus-Zustand, 4/4 Foundation, 7/7 Auth, 8/8 Run, 7/7 Guild-Integration sowie `live-guild.spec.ts` und Capture sind grün. | geschlossen: QA-Account und Testgilde nach dem Lauf entfernt |
| B.07 Responsive/A11y | Layout-Audit, Responsive-, Keyboard-, Kontrast-, Reduced-Motion- und `b07-b08-acceptance.spec.ts`-Läufe sind grün; drei Viewports und 2×-Typografiestress sind dokumentiert. Der frühere Befund „keine P0/P1-Layoutschuld“ ist eine technische Baseline, kein Ersatz für die aktuelle Gesamtprüfung. | geschlossen: echte Geräte-Smokes gehören zu Roadmap D |
| B.08 Gesamtpolish | 136 textfreie Rasterelemente, 10 CSS-/Rotationsableitungen, Zustandsmatrix, Asset-Budget, bereinigte Capture-Sätze ohne Altdateien, spielerbezogene Texte, Live-Gilden-Capture, Mikrofeedback und Produktionsbuild liefern technische Vorarbeit. QA-01 bis QA-05 aus der Spielerprüfung sind technisch geschlossen. | **offen:** B.08.3 wartet auf die vollständige Live-Spielerprüfung und B.03-Abnahme; B.08.4 und die Übergabe an C bleiben gesperrt |

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
Rotationsableitungen und 271 IDs im Gesamtmanifest (15,33 MB). Texte, Zahlen und
Zustände bleiben HTML/CSS; die Rastergrafiken sind textfrei. Das aktuelle
16-MB-Foundation-Budget schließt hochauflösende Source-/Runtime-Flächen ein;
eine spätere Runtime-Kompression wird separat bewertet.

## Historischer Nachtlauf-Nachweis für B.08

Der Nachtlauf belegt technische Vorarbeit, aber **keine aktuelle B.08-Abnahme**:

- die komplette G30–G36-/H09–H12-Serienliste inklusive Master, Chroma-Quelle,
  Runtime-WebP, Manifest, Katalogkarte und Assetprüfung;
- 60/60 Unit-/Vertragstests, 31 lokale E2E-Tests (zwei optionale Live-Tests
  werden ohne Umgebungsvariablen übersprungen), drei Layout-Audit- und drei
  Capture-Läufe sowie ein erfolgreicher Produktionsbuild;
- damals keine offene Layout-Schuld in der UI-Audit-Allowlist und kein
  Überschreiten des damaligen 8,5-MB-Runtime-Budgets;
- dokumentierte Nachweise für Navigation, Kampfszene, Sammlung, Profil, Gilde,
  Responsive/A11y und den damaligen Gesamtpolish-Stand.

Der aktive Gildenpfad wurde auf der Dev-Domain mit einem ephemeren Konto
bestätigt und anschließend bereinigt. Dieser Nachweis bleibt gültig, ersetzt
aber nicht die wieder geöffnete visuelle Prüfung von B.03 oder die erneute
Gesamtprüfung von B.08.

Der aktuelle Stand ist **28/32**:

- offen: B.03.3 und B.03.4;
- davon abhängig offen: B.08.3 und B.08.4;
- keine Übergabe an Roadmap C.

QA-03 und QA-05 sind technisch behoben; ebenso sind QA-01, QA-02 und die
Dokumentationsabweichung QA-04 geschlossen. Erst wenn die vollständige
Live-Spielerprüfung keine erhebliche neue Bedien- oder Kampfszenen-Schuld zeigt,
B.03 abgenommen und B.08 anschließend erneut geprüft wurde, dürfen
`apps/web/public/roadmap/roadmap-status.json` und
`docs/ROADMAP_B_DESIGN_UI.md` gemeinsam auf 32/32 gesetzt werden. Neue
Ranglistenlogik, größere Wettbewerbssysteme und Content gehören danach in
Roadmap C.
