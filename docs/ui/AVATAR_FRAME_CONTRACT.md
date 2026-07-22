# Avatar- und Rahmenvertrag

Status: **verbindliche Übergabe für Roadmap B.05**

## Ziel

Ein Tamer-Profil kombiniert genau ein rundes Avatarbild mit genau einem separat wechselbaren Rahmen. Beide bleiben eigenständige Katalog- und Besitzobjekte. Ein Rahmen darf niemals fest in ein Avatarbild gerendert werden.

## Bestehender Datenvertrag

Das Spielerprofil speichert bereits:

```ts
type ProfileCosmetics = {
  avatarId: string;
  frameId: string;
};
```

- PostgreSQL speichert ausschließlich die beiden stabilen IDs.
- Der Server prüft Katalogexistenz, Freischaltung und Accountbesitz.
- Änderungen laufen über `profile.avatar` beziehungsweise `profile.frame` und die bestehende Accountrevision.
- Gildenmitglieder und Freunde transportieren dieselben zwei IDs.
- Darstellung, Bildpfad, Name und Farben kommen aus dem versionierten Contentkatalog, nicht aus der Profiltabelle.

## Runtime- und Quellenformat

| Asset | HD-Master | Runtime | Transparenz | Safe Area |
| --- | --- | --- | --- | --- |
| Avatar | 1024×1024 PNG | 512×512 WebP oder PNG | optional | Gesicht und Silhouette innerhalb des mittleren 80-%-Kreises |
| Rahmen | 1024×1024 PNG | 512×512 PNG | verpflichtend | innere 72 % bleiben durchsichtig und verdecken kein Gesicht |

Verbindliche Runtime-Pfade:

```text
/assets/avatars/<avatar-id>.webp
/assets/frames/<frame-id>.png
```

Der aktuelle Buchstaben-Glyph und die beiden Katalogfarben bleiben als Fallback erhalten, bis ein Bild vollständig geladen ist oder falls ein Asset zurückgerollt werden muss.

## Katalogfelder für B.05

```ts
type AvatarCatalogEntry = {
  id: string;
  name: string;
  image: string;
  alt: string;
  fallbackGlyph: string;
  fallbackColors: [string, string];
  unlockRuleId: string;
};

type FrameCatalogEntry = {
  id: string;
  name: string;
  image: string;
  fallbackColors: [string, string];
  unlockRuleId: string;
};
```

`unlockRuleId` ist eine stabile Regel-ID und kein frei formulierter UI-Text. Der Server entscheidet, ob die Regel erfüllt ist; der Client zeigt nur den lokalisierten Grund an.

## Darstellungsgrößen

| Einsatz | Avatargröße | Rahmen |
| --- | --- | --- |
| Kampf- und Topbar-Chip | 36–44 px | vereinfachte Kontur zulässig |
| Listen, Chat und Freunde | 44–56 px | vollständiger statischer Rahmen |
| Profilkopf | 128–176 px | vollständiger Rahmen und weicher Effekt |
| Auswahlkarte | mindestens 96 px | Avatar und Rahmen getrennt auswählbar |

Die Kombination muss bei 200 % Browserzoom, hoher Kontrasteinstellung und reduziertem Bewegungsmodus erkennbar bleiben. Seltenheit darf nicht nur über Farbe vermittelt werden.

## Zustände

- geladenes Bild,
- Glyph-Fallback während des Ladens,
- aktiv ausgewählt,
- freigeschaltet, aber nicht aktiv,
- gesperrt mit verständlicher Bedingung,
- neu erhalten,
- Assetfehler mit Fallback,
- serverseitig abgelehnte Auswahl ohne Verlust der bisherigen Kombination.

## Grenzen für Roadmap B

- keine frei hochladbaren Benutzerbilder,
- keine Echtgeldkäufe,
- keine animierten Rahmen als Pflicht für B.05,
- keine Änderung der Profil- oder Gildenbesitzlogik,
- keine Zusammenführung von Avatar- und Rahmen-ID.

Animierte Premium- oder Eventrahmen können später als Roadmap-C-Inhalt ergänzt werden. Der statische PNG-Fallback bleibt auch dann verpflichtend.

## Abnahme B.05

1. Avatar und Rahmen lassen sich unabhängig auswählen.
2. Reload, zweiter Browser, Gildenliste und Freundesliste zeigen dieselbe Kombination.
3. Gesperrte Einträge können nicht durch manipulierte Clientbefehle aktiviert werden.
4. Fehlende Bilder fallen ohne Layoutsprung auf Glyph und Farben zurück.
5. Alle Kombinationen passen in 44, 96 und 176 Pixel große Kreise.
6. Profilkopf und Auswahl stehen im ersten sinnvollen Viewportbereich – nicht unter Systempost und Nebeneinstellungen.
