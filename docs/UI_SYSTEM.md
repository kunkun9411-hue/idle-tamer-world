# UI-System: Silver Ether

Dieses Dokument ist die verbindliche Komponentenbasis für Login, Spiel und spätere Account-Seiten. Die darüberliegende Inszenierung, Zonenwelten und Game-Feel-Regeln von Optik V2 stehen in `ART_DIRECTION_V2.md`; die feste Einstiegsreihenfolge steht in `PLAYER_ENTRY_FLOW.md`. Neue Oberflächen sollen diese Ebenen erweitern, nicht pro Feature einen eigenen Stil erfinden.

Die verpflichtenden Lade-, Fehler-, Konflikt-, Leer-, Voll- und Maximalzustände pro Szene stehen in `GAMEPLAY_FOUNDATION_SPEC.md` und gehören zur Abnahme jeder neuen Oberfläche.

## Charakter

Idle Tamer wirkt ruhig, hochwertig und technisch, aber nicht wie ein überladenes Sci-Fi-Terminal. Die Monster liefern Farbe und Persönlichkeit; die Benutzeroberfläche bleibt überwiegend neutral.

- Hintergrund: fast schwarzes Graphit mit sehr feinem Raster und weichen Ether-Lichtern.
- Primärmaterial: dunkles Glas, gebürstetes Silber und dünne helle Konturen.
- Akzent: kontrolliertes Violett für Auswahl, Fortschritt und permanente Systeme.
- Erfolg: entsättigtes Mint. Warnung: warmes Sandgold. Fehler: zurückhaltendes Rosé.
- Keine grünen Neonflächen, Pixelrahmen, massiven Farbverläufe oder dauerhaft pulsierenden Bedienelemente.

## Kern-Tokens

| Rolle | Wert | Verwendung |
|---|---|---|
| Hintergrund | `#08080c` | Seite und Spielwelt |
| Fläche | `#15151d` | Karten, Dialoge, Navigation |
| Primärtext | `#f4f3f8` | Überschriften und wichtige Werte |
| Sekundärtext | `#898791` | Erklärungen und Metadaten |
| Linie | `rgba(222,219,232,.11)` | ruhige Trennung |
| Violett | `#a88bff` | aktive Auswahl und permanente Progression |
| Silberviolett | `#c8b8ff` | helle Akzente und Fokus |
| Erfolg | `#73dfba` | gespeichert, abgeschlossen, online |

Die Basistokens stehen am Anfang von `apps/web/src/styles.css`; V2-Oberflächen, Licht und Bewegungswerte stehen am Anfang von `apps/web/src/styles-v2.css`.

## Komponenten-Inventar

Bereits im Vertical Slice vorhanden:

1. Wortmarke und App-Signet
2. Login-Formular, In-Scene-Spielnavigation und Unterseiten-Navigation
3. primärer, sekundärer, Ghost- und Outline-Button
4. Ressourcen-, Rang-, Profil-, Status- und Mengen-Chips
5. Standardkarte, aktive Karte und gesperrte Vorschau
6. Lebens-, Missions-, Forschungs-, Fragment- und Brutfortschritt
7. Monsterdarstellung mit Plattform, Schatten, Blickrichtung und Trefferzustand
8. Kampfkonsole, Beutespeicher und aktive Verbindung
9. leere Zustände für Sammlung und Ei-Inventar
10. sammelbarer Offline-Bericht, Erfolgsbanner und temporärer Toast
11. eigenständige Prestige-Szene mit HD-Ether-Heiligtum, Kristall, Reset-Ledger und räumlicher Aktivierungsanimation
12. Forschungs-, Monster-, Ei-, Zonen- und Gilden-DNA-Karten
13. einklappbares Kampf-HUD, Fokusmodus, Mobile-Bottom-Navigation und technische Fußzeile der Unterseiten
14. Gem-Arbeitsbereich mit drei festen Form-Slots, Inventarchips und direkt sichtbaren Grundwertboni
15. Auftragszentrale mit Periodenübersicht, Fortschrittskarten und eindeutigen Claim-Zuständen
16. Zeit-Expeditionsbrett mit zwei aktiven Slots, Live-Countdown und Monster-Match-Bonus
17. Etherwerkstatt, Systempost, kontextuelle Einführung und gespeicherte Komfort-Einstellungen

## Layoutregeln

- Die Hauptkampfszene füllt den verfügbaren Bildschirm. Die 1540-Pixel-Grenze gilt nur für Unterseiten.
- Desktop priorisiert den sichtbaren Kampf; Sekundäraktionen liegen als Glas-HUD direkt über der Zone.
- Große Kampf-HUD-Karten sind standardmäßig geschlossen. Die Rand-Leiste öffnet Mission, Beute, Duo, Front oder Kampflog einzeln; mehrere offene Karten gleichzeitig sind nicht erlaubt.
- Unter 900 Pixeln wird die Navigation zur festen unteren Leiste.
- Unter 620 Pixeln stehen Karten, Aktionen und Statistiken einspaltig.
- Klickziele sind mindestens 40 Pixel hoch. Fokuszustände sind immer sichtbar.
- `prefers-reduced-motion` deaktiviert längere Animationen nahezu vollständig.
- Die Prestige-Szene bleibt bei 1280×720 vollständig sichtbar; auf Mobilgeräten wird ihre Ritualachse vor das Reset-Ledger gestapelt.

## Neue Seiten

Eine neue Spielseite beginnt mit `page-heading`, danach folgen Karten im bestehenden Raster. Ein neues dauerhaftes System verwendet Violett; temporäre Run-Systeme bleiben silbern. Monsterfarben dürfen Karten nur als schmale Linie, weiches Licht oder kleine Statusmarke beeinflussen.
