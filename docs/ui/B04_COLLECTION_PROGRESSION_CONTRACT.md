# B.04 · Sammlung und Entwicklung

Stand: **26. Juli 2026 · Planen/Bauen/Prüfen abgeschlossen, visuelle interne Abnahme vorbereitet**

## Fortschrittsebenen

| Ebene | Ressource/Aktion | Verhalten bei Prestige |
| --- | --- | --- |
| Run | Gold und normales Monster-Level | wird zurückgesetzt |
| Permanenter Tamer-Fortschritt | Evolution und Hyperlevel | bleibt erhalten |
| Ausrüstung | Dreieck-, Quadrat- und Raute-Gems | bleibt im Monster-Slot |
| Brutkreislauf | Ei → Inkubation → erster Starter oder Fragmente | Besitz/Fragmente bleiben erhalten |
| Account-Forschung | Ether-Kerne | bleibt erhalten |

Die Oberfläche benennt jede Ebene am Ort der Aktion. Der Spieler muss nicht
zwischen „Run“ und „permanent“ raten: Habitat zeigt die getrennten Werte,
Brutstation zeigt den Kreislauf, Inventar zeigt Besitz und Forschung markiert
Account-Fortschritt. Prestige führt nur über die eigene Szene und verlangt Zone
10; die Bestätigung trennt explizit Reset und Erhalt.

## Implementierte Belege

- `apps/web/src/main.ts` und `styles-progression-v3.css` führen Habitat,
  Inkubation, Inventar, Forschung und Prestige als getrennte Ansichten.
- `apps/web/e2e/core-loop.spec.ts` prüft Offline-Einsammeln, Ei, Fragmente,
  Hyperlevel, Evolution, Gem-Slot und Prestige-Reset/Erhalt.
- `apps/web/e2e/state-matrix.spec.ts` prüft leere Brut-/Habitat-Zustände und
  die gesperrte Prestige-Bestätigung vor Zone 10.
- Referenz-Captures: `desktop/08-habitat.png`, `09-incubation.png`,
  `10-inventory.png`, `11-research.png` und `14-prestige.png`.

## Abnahmekriterien

- Run- und permanenter Fortschritt sind in jeder relevanten Ansicht beschriftet;
- leere Sammlung, gesperrtes Prestige und freie Brutstation sind verständliche
  Zustände, keine leeren Rahmen;
- Gem-Slots zeigen Besitz und Ausrüstung dauerhaft;
- Prestige bleibt vor Zone 10 deaktiviert und setzt Hyperlevel/Evolution/Gems
  nicht zurück;
- Texte, Zahlen und Kosten bleiben HTML/CSS und werden nicht in Assets gerastert.
