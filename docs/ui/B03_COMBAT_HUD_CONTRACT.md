# B.03 · Kampfszene und HUD

Stand: **30. Juli 2026 · vollständig geprüft und abgenommen**

## Vertrag

Die Kampfszene ist die primäre Arbeitsfläche. Die zwei aktiven Monster bleiben
als sichtbares Duell im Mittelpunkt; Gold, Speicher, Duo, Aufträge und der
Kampflog liegen als einklappbare HUD-Flächen darüber und dürfen die Bühne nicht
verkleinern. Die häufigsten Aktionen liegen in der Szene beziehungsweise im
Kampf-Dock.

| Priorität | Sichtbar ohne Öffnen | Einklappbar |
| --- | --- | --- |
| 1 | Spieler- und Gegner-Monster, HP, VS/AUTO, Zone/Stage | – |
| 2 | Kampf-Dock, Fokusmodus, aktive Front | Speicher, Duo, Aufträge |
| 3 | aktuelles Signal und Kurzstatus | Kampflog, Expeditionen, Detailwerte |

## Implementierte Belege

- `apps/web/src/main.ts` rendert `combat-scene`, genau zwei Fighter-Flächen,
  `combat-control-dock` und die fünf optionalen Panels.
- `styles-game-first.css` hält die Bühne bei Desktop, Tablet und 390 px stabil;
  Fokusmodus blendet Nebenflächen aus und lässt nur die Fokusaktion sichtbar.
- `apps/web/e2e/b03-combat-hud.spec.ts` prüft Bühne, Zwei-Monster-Duo,
  einklappbare Panels und Fokusmodus.
- `artifacts/ui-captures/desktop/04-combat.png`,
  `desktop/05-combat-missions.png` und die drei Mobile-Captures dienen als
  visuelle Referenz. Die Bilder enthalten nur HTML/CSS-Texte; Bildassets sind
  textfrei.

## Abnahmekriterien

- keine horizontale Überbreite auf 1280×720, 1024×768 oder 390×844;
- zwei Monster und der VS-Mittelpunkt bleiben sichtbar;
- ein geöffneter Bereich verdeckt die Bühne nicht dauerhaft;
- Fokusmodus blendet Neben-HUD aus, ohne den Kampfzustand zu verändern;
- der Weg zu Frontwahl, Duo, Speicher und Aufträgen bleibt höchstens einen
  Klick vom Kampf entfernt.

## Finale Abnahme vom 30. Juli 2026

Die Kriterien wurden am Live-SHA
`5820733c5dab4dfc8e35d411574e2b8491aafd15` in den Viewports 1280×720,
1024×768 und 390×844 geprüft. Die mobile Prüfung erfolgte in einer echten
Dev-Session, nicht nur als statischer Screenshot.

- Spielerkarte: 286×66 px auf Desktop und Tablet, 286×58 px auf Mobile;
- Monsterdarstellung: 307/379 px auf Desktop und 300/370 px auf Tablet;
- mobiles Kampfdock: 378×56 px;
- mobiles Bereiche-Fenster: 378×253 px;
- Kampfinventar: Itemdetails über Tastatur und echten Touch erreichbar;
- Brut-CTA: 220×44 px;
- keine horizontale Überbreite;
- Browserkonsole: 0 Warnungen und 0 Fehler.

Die automatisierte Abschlussmatrix ist grün: `pnpm check` mit 67 Web-, 24 API-,
11 Datenbank-Unit- und 6 Core-Tests, allen Builds und 271 geprüften Assets;
außerdem 66 bestandene und 2 übersprungene E2E-Tests mit vier Workern, die
isolierte Bossprüfung mit 6/6 sowie die Capture-Matrix mit 3/3.

Die ältere Backend-Evidenz 28/28 Datenbank-Integrationen, Live Auth 1/1 und
Live Gilde 1/1 wurde vor dem finalen UI-only-Commit erhoben. Die betreffenden
Backendpfade blieben durch den finalen Commit unverändert.

**Abnahmeentscheidung:** B.03.3 und B.03.4 sind geschlossen. B.03 ist
vollständig abgenommen. Der vollständige Abschlussbericht steht in
[`ROADMAP_B_LIVE_ACCEPTANCE_2026-07-30.md`](./ROADMAP_B_LIVE_ACCEPTANCE_2026-07-30.md).
