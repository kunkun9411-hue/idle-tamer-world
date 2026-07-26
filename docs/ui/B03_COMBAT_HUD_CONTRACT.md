# B.03 · Kampfszene und HUD

Stand: **26. Juli 2026 · Planen/Bauen/Prüfen abgeschlossen, visuelle interne Abnahme vorbereitet**

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
