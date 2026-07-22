# B.01 – Verbindlicher Designsystem-Plan

Stand: **22. Juli 2026**  
Status: **Schritt 1 Planen abgenommen**  
Nächster Schritt: **B.01.2 – Bauen**

## Ziel

Roadmap B erhält eine einzige visuelle Grundlage für Login, Offline-Bericht, Kampf, Unterseiten, Dialoge und Entwicklungsflächen. Silver Ether bleibt modern, ruhig und hochwertig; Monster und Zonen liefern den stärkeren Farbanteil. Das Designsystem ordnet bestehende Regeln und ersetzt schrittweise Mikroschrift, Einzelfallwerte und doppelte Komponenten.

## Gemessener Ausgangsstand

Der Audit wurde im echten lokalen Client auf **1280×720**, **1024×768** und **390×844** durchgeführt.

- Die zwei CSS-Schichten `styles.css` und `styles-v2.css` enthalten **155 Schriftgrößen-Deklarationen zwischen 6 und 11 px**. Besonders häufig sind 6, 7, 8 und 9 px.
- Auf 390×844 beginnt die mobile Bereichsleiste bei `y=730`; das Kampfdock beginnt bereits bei `y=722`. Beide Bedienelemente belegen denselben Raum.
- Ein Namensschild fällt mobil bis auf 11 px, zugehörige Metadaten bis auf 6 px.
- Die Kampf-, Login- und Offline-Komposition besitzen bereits eine passende Silver-Ether-Grundrichtung. Das Problem ist primär Hierarchie, Lesbarkeit und Wiederverwendung – nicht fehlende Atmosphäre.
- Radien und Bewegungszeiten verwenden viele nahe Einzelfallwerte. Sie werden auf wenige benannte Skalen reduziert.

Die mobile Navigationskollision bleibt als P0 bei B.02/B.03. B.01 liefert dafür lesbare Tokens und robuste Komponenten, verändert aber noch nicht die Informationsarchitektur.

## Verbindliche visuelle Rollen

### Farbe

| Rolle | Bestehender Token | Regel |
| --- | --- | --- |
| Welt | `--bg`, `--bg-soft` | nahezu schwarzes Graphit; Zone darf dahinter sichtbar bleiben |
| Fläche | `--panel-solid`, `--panel-raised` | dunkles Glas, keine massiven Vollfarbflächen |
| Primärtext | `--silver` | Überschrift und zentrale Werte |
| Sekundärtext | `--silver-2`, `--muted` | Erklärung und Metadaten mit ausreichendem Kontrast |
| Auswahl | `--violet`, `--violet-bright` | aktive Auswahl und permanenter Fortschritt |
| Erfolg | `--success` | abgeschlossen, gespeichert, online |
| Warnung | `--warning` | Kosten, Konsequenz, fast voll |
| Fehler | `--danger` | Fehler und zerstörerische Aktion |

Monsterfarben dürfen UI-Flächen nur als schmale Kontur, kleines Statussignal oder weiches Licht beeinflussen. Sie ersetzen keine semantischen Statusfarben.

### Typografie

Neun Rollen werden maschinenlesbar in `ui-catalog-data.ts` geführt:

1. Hero: `clamp(48px, 6vw, 82px)`
2. Szenentitel: `clamp(32px, 4vw, 52px)`
3. Seitentitel: `28px`
4. Kartentitel: `18px`
5. Einleitung: `16px`
6. Fließtext: `14px`
7. Sekundärtext: `12px`
8. Label und Button: `12px`
9. Spielwert: `20px`, tabellarische Ziffern

**12 px ist die Untergrenze für bedeutungstragenden Text.** Kleinere rein dekorative Markierungen dürfen keine Information tragen und benötigen ein zugängliches Textäquivalent. Versalien und hohe Laufweite werden nicht gleichzeitig für längere Texte eingesetzt.

### Abstand, Radius, Bewegung und Ebene

| Skala | Werte |
| --- | --- |
| Abstand | `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px` |
| Radius | `6 · 8 · 12 · 16 · 24 px · rund` |
| Bewegung | `120 · 180 · 300 ms` mit einer gemeinsamen Ether-Easing-Kurve |
| Ebene | `0 Welt · 10 Inhalt · 20 Sticky · 30 Dock · 50 Popover · 70 Modal · 80 Toast · 90 Entwicklung` |

`prefers-reduced-motion` entfernt längere Bewegung, nicht die Information oder Rückmeldung.

## Komponentenfamilien

Jede sichtbare Funktion wird einer dieser zehn Familien zugeordnet:

1. Aktionen
2. Eingaben
3. Navigation
4. Flächen
5. Status und Feedback
6. Fortschritt
7. Karten und Auswahl
8. Ressourcen und Kosten
9. Überlagerungen und Bestätigung
10. Identität

Für jede Familie gelten mindestens Standard, Hover, Gedrückt, Fokus, Auswahl, Disabled, Laden, Fehler und Erfolg, sofern der Zustand fachlich möglich ist. Eine gesperrte Aktion nennt die Freischaltbedingung; eine laufende Aktion verhindert Doppelbedienung; eine erfolgreiche Aktion bestätigt die tatsächliche serverseitige Änderung.

## Textfreie Assetregel

Generierte UI-Assets enthalten keine fest eingebauten Texte, Zahlen, Buttonnamen, Kosten, Stufen oder KI-Pseudoschrift.

- ImageGen und PixelLab liefern Hintergründe, Rahmen, Ornamente, Icons, Material und Effekte.
- HTML/CSS rendert jeden Namen, Wert und Status darüber.
- Der Standard-Negativprompt lautet: `no text, no letters, no numbers, no typography, no watermark, no pseudo-text`.
- Branding-Logos sind die einzige ausdrückliche Ausnahme und dürfen nicht als wiederverwendbare UI-Komponente dienen.
- Ein Asset mit sichtbarer Pseudoschrift wird nicht freigegeben, sondern neu erzeugt.

Damit bleiben Lokalisierung, Schriftgröße, Zahlenformat, Responsive Design und spätere Balanceänderungen unabhängig vom Bild.

## Referenzansichten

| Ansicht | Zweck | Abnahmegröße |
| --- | --- | --- |
| Login | Typografie, Eingaben, primäre Aktion | 1280×720 und 390×844 |
| Offline-Bericht | Ressourcen, Werte, Kapazität, Entscheidung | 1280×720 und 390×844 |
| Hauptkampf | HUD, Nameplates, Dock und Kampffokus | alle drei Viewports |
| Habitat | Karten, Auswahl, Fortschritt und Kosten | 1024×768 und 390×844 |
| UI-Katalog | vollständige Token-, Komponenten- und Zustandsmatrix | alle drei Viewports |

Die drei verbindlichen Größen bleiben **1280×720**, **1024×768** und **390×844**. Zusätzliche Breiten dürfen geprüft werden, ersetzen diese Referenzen aber nicht.

## Baufolge für B.01.2

1. neue Tokenebene für Typografie, Abstand, Radius, Bewegung und Ebenen anlegen;
2. Button, Input, Panel, Chip, Ressource, Fortschritt, Toast und Modal als Kernprimitive migrieren;
3. UI-Katalog gegen die neuen Primitiven stellen und alte Werte sichtbar markieren;
4. Login und Offline-Bericht als erste echte Referenzflächen umstellen;
5. globale Status- und Fokuszustände vereinheitlichen;
6. erst danach szenenspezifische Migration an B.02 bis B.08 übergeben.

## Abnahme B.01.1

- [x] bestehende Silver-Ether-Werte und alle 16 UI-Flächen auditiert
- [x] Typografie- und Mindestgrößen beschlossen
- [x] Abstands-, Radius-, Bewegungs- und Ebenenskalen beschlossen
- [x] zehn Komponentenfamilien samt Zustandsvertrag festgelegt
- [x] textfreie Generierungsregel verbindlich aufgenommen
- [x] Avatar-, Rahmen- und PixelLab-Verträge übernommen
- [x] drei Referenz-Viewports und fünf Referenzansichten bestimmt
- [x] Dateigrenzen und Migrationsreihenfolge für B.01.2 festgelegt

**Gate erfüllt:** Die sichtbare Migration kann beginnen, ohne den Stil pro Szene neu zu erfinden oder Texte in generierte Bilder einzubrennen.
