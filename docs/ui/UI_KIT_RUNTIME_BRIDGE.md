# UI-Baukasten · Runtime-Brücke

Stand: **26. Juli 2026**

Der textfreie UI-Baukasten aus Roadmap B wird jetzt schrittweise in die echten
Spielansichten eingesetzt. Diese Brücke ist bewusst klein gehalten: Die
Rasterelemente liefern Rahmen, Flächen und Chromakanten; Texte, Zahlen,
Zustände und Interaktionen bleiben HTML/CSS und damit responsiv.

## Bereits sichtbare Verbraucher

| Oberfläche | Kit-Verbrauch | Zweck |
| --- | --- | --- |
| Login / Offline-Bericht | bestehender Silver-Ether-Chrome | Account-Zugang und Offline-Bergung |
| Kampf-HUD | `surface/b03-v1.webp`, `chrome/c16-v1.webp` | einheitliche HUD-Fenster und Kontroll-Dock |
| Monster, Inventar, Brut, Forschung, Profil, Gilde | `surface/b01-v1.webp`, `surface/b02-v1.webp` | große Arbeitsflächen und Überschriften |
| Überschriften | `frame/divider-compact-v1.webp` | textfreie Resonanz-Trennlinie |

Die Zuordnung erfolgt in `apps/web/src/styles-ui-kit-runtime.css`. Es gibt
keine festen UI-Texte in den generierten Bildern.

## Abnahmekriterien für weitere Verbraucher

1. keine horizontale Überbreite auf 1280×720, 1024×768 und 390×844;
2. alle interaktiven Elemente bleiben im DOM und per Tastatur erreichbar;
3. Kit-Flächen dürfen keine serverautoritativen Werte oder Zustände enthalten;
4. `pnpm ui:audit`, der relevante E2E-Test und ein visueller Capture bleiben grün;
5. neue Kit-Nutzung wird hier mit Fläche und Assetfamilie ergänzt.

## Nächster Schritt

Die Brücke ist die technische Basis für Roadmap C. Neue Content- und
Feature-Flächen (Ranglisten, Events, Wettbewerbssysteme) verwenden dieselben
Komponenten, sobald ihre serverautoritativen Verträge feststehen.
