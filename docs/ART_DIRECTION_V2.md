# Art Direction V2 – vom Interface zur Ether-Welt

## Ziel

Optik V2 soll nicht nur sauber aussehen, sondern das Spiel greifbar machen. Monster stehen deshalb auf einem sichtbaren Boden in einer konkreten Zone. Verwaltung bleibt vorhanden, ordnet sich aber der Kampfbühne, dem aktiven Monster und der nächsten sinnvollen Aktion unter.

Die stabile V1-Komponentenbasis bleibt in `src/styles.css`. Alle bewussten V2-Entscheidungen und Overrides liegen getrennt in `src/styles-v2.css`. Dadurch kann die neue Richtung schnell verändert werden, ohne alte Layoutregeln oder Spiellogik zu zerlegen.

## Fünf verbindliche Prinzipien

1. **Erst Welt, dann Werte.** Zone, Monster und aktueller Kampf sind der erste Blickfang.
2. **Silber trägt, Violett reagiert.** Silber und Graphit bilden Oberflächen; Violett markiert aktive Ether-Energie, nicht jede Fläche.
3. **Weniger Kästen, stärkere Ebenen.** Große Bildflächen, Kommandoleisten und wenige erhöhte Karten ersetzen viele gleichwertige Panels.
4. **Bewegung erklärt Zustand.** Partikel zeigen aktive Welten, Trefferzahlen zeigen Schaden, Pulse zeigen abholbare Beute und die DNA bewegt sich als lebendes System.
5. **Monster berühren den Boden.** Kontaktschatten, Plattformlicht und auf die Szene abgestimmte Größen verhindern den Eindruck freigestellter Sticker.

## Zonenwelten

| Zone | Farbidentität | Runtime | unveränderter Master |
| --- | --- | --- | --- |
| Violetter Saum | Graphit, Silber, Amethyst, Gewitterviolett | `public/assets/zones/violet-rim-v2.webp` | `art-source/generated/zone-backgrounds-v2/violet-rim-v2-master.png` |
| Glasgärten | Perlsilber, Rauch-Türkis, Cyan, Lavendel | `public/assets/zones/glass-gardens-v2.webp` | `art-source/generated/zone-backgrounds-v2/glass-gardens-v2-master.png` |
| Obsidian-Fjord | Schwarzglas, Gunmetal, Nachtblau, kaltes Cyan | `public/assets/zones/obsidian-fjord-v2.webp` | `art-source/generated/zone-backgrounds-v2/obsidian-fjord-v2-master.png` |

Die Runtime-Hintergründe sind 1600×900 WebP. `python scripts/prepare_zone_backgrounds.py` erzeugt sie reproduzierbar aus den PNG-Mastern. CSS-Vignetten und Overlays gehören zur UI und dürfen nicht in die Masterbilder eingebacken werden.

## ImageGen-Promptset

Alle drei Bilder wurden mit dem eingebauten ImageGen-Workflow als neue `stylized-concept`-Assets erzeugt. Gemeinsame Basis:

```text
Use case: stylized-concept
Asset type: wide game battle environment background for a modern browser monster idle game
Subject: environment only, no characters, no monsters
Style/medium: polished HD stylized game environment, painterly 3D concept-art finish, crisp readable shapes, modern premium mobile-game quality, original visual language, absolutely not pixel art
Composition/framing: cinematic 16:9 landscape, eye-level slightly low camera, foreground ground plane fills the lower third, open readable combat space on lower left and lower right, calm negative space around the center, strong depth layers, safe for UI overlays
Constraints: no creatures, people, silhouettes, UI, text, logos, franchise imagery, watermark or frame; keep both foreground combat positions unobstructed; readable midtones; restrained bloom; no pixel art; no cartoon outlines
```

Zonenspezifische Szenen:

```text
Violetter Saum: mysterious floating ruin frontier where damaged silver technology has been overtaken by subtle ether energy; broad ancient silver-stone platform; broken floating monoliths; deep violet storm clouds; luminous ether rift; graphite, cool silver, slate and restrained amethyst.

Glasgärten: elegant alien garden grown from transparent memory crystal and polished silver ruins; translucent crystal terrace; arching glass plants and faceted trees; pale energy waterfall; cool silver, pearl, smoky teal, cyan and lavender.

Obsidian-Fjord: frozen black-glass coast at the edge of a broken ether world; obsidian ice shelf; fractured cliffs and silver wreckage; spectral water; colossal cracked moonlike ether gate; gunmetal, deep navy, cold cyan and restrained violet.
```

## UI-Hierarchie

### Kampf

- Story und Zonenwahl bilden zwei kompakte Kommandoleisten.
- Die Kampfbühne besitzt die stärkste Fläche und den höchsten Kontrast.
- Lebensleisten sitzen direkt beim zugehörigen Monster.
- Kampfspeicher und Expeditions-Duo bilden eine sekundäre rechte Schiene.
- Rollenprotokolle bleiben sichtbar, stehen aber nicht mehr vor dem Kampf.

### Sammlung und Nebensysteme

- Seitenüberschriften sind große orientierende Flächen statt weiterer kleiner Karten.
- Monsterkarten verwenden ihre Elementfarbe nur als Licht und Kante.
- Brutstation, Forschung, Profil und Gilden-DNA teilen Material, Radien, Schatten und Abstände.
- Technische Hinweise bleiben für den Prototyp erhalten, werden jedoch visuell zurückgestuft.

## Bewegung und Feedback

- Monster: ruhige Idle-Schwebe, kurze Trefferreaktion.
- Schaden: Zahl steigt am getroffenen Ziel auf und verschwindet.
- Sieg/Regeneration: kurze zentrale Zustandskarte.
- Beute: der volle Kampfspeicher pulsiert langsam; der Primärbutton besitzt einen Lichtlauf.
- Welt: dezente, langsame Partikel statt dauerndem Bildschirmrauschen.
- Gilden-DNA: versetzte Helixsegmente pulsieren und bewegen sich gegeneinander.

`prefers-reduced-motion` aus der Basisdatei bleibt verbindlich und reduziert sämtliche Animationen für entsprechende Systemeinstellungen.

## Schnell anpassen

- Gesamtfarben und Oberflächen: Variablen am Anfang von `src/styles-v2.css`
- Kampfhöhe: `.battle-card` und `.battle-stage`
- Monstergröße im Kampf: `.fighter .monster-avatar`
- Abdunklung pro Zone: `.battle-stage::before` und `.battle-stage--glass-gardens::before`
- Mobile Kampfgröße: Media Query `max-width: 620px`
- neue Zonenbilder: Klassen `battle-stage--<zone-id>` und `zone-select--<zone-id>` ergänzen

Zur gemeinsamen Sichtprüfung dienen:

- `/dev/asset-gallery.html` – Kreaturen und Zonenwelten
- `/dev/mobile-preview.html` – echte 390×844-Spielbreite
