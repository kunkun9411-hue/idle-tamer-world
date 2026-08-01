# Roadmap B · Finale Live-Abnahme

**Datum:** 30. Juli 2026  
**Live-SHA:** `5820733c5dab4dfc8e35d411574e2b8491aafd15`  
**Ergebnis:** **B.03 und B.08 abgenommen**

## Abnahmeumfang

Die finale Prüfung erfolgte als echte Spielerprüfung gegen den live
bereitgestellten Stand. Neben Desktop und Tablet wurde das Spiel in einer
echten mobilen Dev-Session bedient. Geprüft wurden der zusammenhängende
Spielweg, die Lesbarkeit und Bedienbarkeit der Kampfszene sowie alle für B.03
und B.08 relevanten Schnellzugriffe und Modalfenster.

Die verbindlichen Referenz-Viewports waren:

| Gerät | Viewport |
| --- | ---: |
| Desktop | 1280 × 720 |
| Tablet | 1024 × 768 |
| Mobile | 390 × 844 |

## Sicht- und Bedienprüfung

| Bereich | Abnahmebeleg | Ergebnis |
| --- | --- | --- |
| Spielerkarte | Desktop und Tablet jeweils **286 × 66 px**, Mobile **286 × 58 px** | lesbar, vollständig im Viewport und als zusammenhängende Accountkarte erkennbar |
| Kampfbühne Desktop | Monsterdarstellung **307 / 379 px** | beide Kampfteilnehmer sichtbar und auf der Bühne verankert |
| Kampfbühne Tablet | Monsterdarstellung **300 / 370 px** | beide Kampfteilnehmer sichtbar, keine Überdeckung durch HUD oder Navigation |
| Mobile Kampfdock | **378 × 56 px** | vollständig bedienbar und innerhalb des 390-px-Viewports |
| Mobile Bereiche-Fenster | **378 × 253 px** | vollständig sichtbar, alle Ziele erreichbar |
| Kampfinventar | Itemdetails per Tastaturfokus und echtem Touch erreichbar | Touch-Tooltip öffnet, wechselt und schließt kontrolliert |
| Brutstation | primärer Brut-CTA **220 × 44 px** | klar lesbar und als Touchziel ausreichend groß |
| Layout | alle drei Referenz-Viewports | keine horizontale Überbreite und kein abgeschnittener Pflichtinhalt |
| Browserlauf | vollständiger Live-Spielweg | **0** Konsolenwarnungen, **0** Konsolenfehler |

Die Prüfung wurde aus Sicht eines Spielers durchgeführt: Sichtbarkeit,
Lesbarkeit, verständliche Zustände, eindeutige Hauptaktionen und sichere
Touchziele waren Abnahmekriterien, nicht nur das Vorhandensein der DOM-Elemente.

## Automatisierte Abschlussbelege

- `pnpm check` vollständig grün:
  - **67** Web-Tests,
  - **24** API-Tests,
  - **11** Datenbank-Unit-Tests,
  - **6** Game-Core-Tests,
  - alle vorgesehenen Builds,
  - **271** geprüfte Asset-Manifest-Einträge.
- Gesamte E2E-Matrix mit vier Workern:
  - **66 bestanden**,
  - **2 übersprungen**.
- Isolierte Boss-/Skalierungsprüfung: **6/6 bestanden**.
- Finale Capture-Matrix: **3/3 bestanden** für Desktop, Tablet und Mobile.

## Abgrenzung der Backend-Evidenz

Die folgenden Backend-Belege stammen aus der Prüfung **vor** dem finalen
UI-only-Commit. Der finale Commit verändert diese Backendpfade nicht:

- Datenbank-Integrationen: **28/28 bestanden**;
- Live-Authentifizierung: **1/1 bestanden**;
- Live-Gilde: **1/1 bestanden**.

Diese Werte belegen weiterhin den unveränderten serverautoritativen Unterbau.
Sie werden nicht als nach dem finalen UI-SHA erneut ausgeführte Backendtests
dargestellt.

## QA-Bereinigung

Nach der Live-Prüfung wurde der synthetische Testzustand bereinigt:

- **3** synthetische Konten anonymisiert;
- **1** QA-Gilde entfernt;
- aktive QA-Namens- oder Kennzeichnungsmuster: **0**.

Es wurden keine realen Spielerkonten oder produktiven Gilden für die Abnahme
verwendet oder verändert.

## Entscheidung

Die offenen Abnahmen **B.03.3**, **B.03.4**, **B.08.3** und **B.08.4** sind mit
diesem Lauf geschlossen. B.03 Kampfszene/HUD und B.08 Gesamtpolish/Übergabe
sind damit vollständig geprüft und abgenommen.

Diese Datei ist die verbindliche Abschlussquelle für Roadmap B. Frühere
Zwischenstände und Audits bleiben als historische Evidenz erhalten, werden
aber durch diese finale Live-Abnahme hinsichtlich des Status ersetzt.
