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
| Kampf-HUD | `surface/b03-v1.webp`, `frame/edge-thin-horizontal-v1.webp`, `control/d09-v1.webp` | HUD-Fenster, Kontroll-Dock, Zonen-Tabs und Statuskanten |
| Spielweite Panels | `frame/edge-thin-horizontal-v1.webp` | wiederverwendbare obere/untere Fensterkanten auf flexiblen HTML-Karten |
| Primär-/Sekundärbuttons | `control/d08-v1.webp`, `control/d09-v1.webp` | lesbare Button-Skins ohne festen Rastertext |
| Statuschips und Ränge | `info/e05-v1.webp` | kompakte Werte-, Meta- und Rangplaketten |
| Fortschrittsleisten | `control/d13-v1.webp` | Rahmen für HP, Beute-, Missions- und Forschungsfortschritt; Füllung bleibt live CSS |
| Ressourcen | `economy/f01-v1.webp`, `f02-v1.webp`, `f03-v1.webp`, `f06-v1.webp` | Gold, Ether-Kerne, Fragmente und Eier als textfreie Laufzeit-Icons |
| Hauptnavigation | `system/g01-v1.webp` bis `g10-v1.webp` | sichtbare System-Icons in den Spielbereichen |
| Überschriften | `frame/divider-compact-v1.webp` | textfreie Resonanz-Trennlinie |

Die Zuordnung erfolgt in `apps/web/src/styles-ui-kit-runtime.css`; die
Ressourcen-Icons werden in `apps/web/src/main.ts` zentral ausgegeben. Es gibt
keine festen UI-Texte in den generierten Bildern. Große, dynamische Karten
verwenden bewusst keine vollflächig gestreckte Rasterfläche, weil deren
interner Rahmen sonst über variable HTML-Inhalte laufen würde. Die Rasterkunst
liegt nur an stabilen Komponentenrändern; Inhalte und Füllstände bleiben live.

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
