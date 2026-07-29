# Roadmap B · Spielerprüfung im laufenden Browser

**Datum:** 27. Juli 2026  
**Umgebung:** `https://idle-tamer-world.de/` · Desktop-Viewport 1280×720  
**Account:** vorhandener Dev-Test-Account (keine Zugangsdaten im Bericht)  
**Prüfart:** echter Spielablauf mit Live-Server, danach DOM-/Screenshot-Abgleich und Browser-Logprüfung

## Ergebnis

Der Kern-Loop ist spielbar: Offline-Fortschritt kann abgeholt werden, der Kampf läuft weiter, die Nebenflächen lassen sich öffnen und schließen, Inventar-/Kategorien, Ei-Öffnung, Gem-Ausrüstung, Forschung, Missionen, Gilde und Fokusmodus sind erreichbar. Es wurden keine Browser-Warnungen oder -Fehler protokolliert.

Roadmap B blieb nach diesem Lauf korrekt offen. Die folgende Tabelle ist der
historische Befund vom 27. Juli und wird nicht nachträglich umgedeutet:

| ID | Priorität | Bereich | Reproduktion | Erwartet | Beobachtet | Nächste Maßnahme |
|---|---|---|---|---|---|---|
| QA-01 | P2 | Offline-Abholung | Mit Offline-Bericht und gefülltem Kampfspeicher `EINSAMMELN` klicken | Eindeutige Erfolgsbestätigung ohne Folgefehler | Bericht schließt und Speicher wird geleert; direkt danach erschien einmal `Run-Aktion abgelehnt – Der Kampfspeicher ist leer.` | Offline-Claim vom normalen Run-Aktionsdispatcher trennen; Erfolgsfeedback statt widersprüchlicher Fehlermeldung zeigen |
| QA-02 | P2 | Modal-Chrome | Monster-Schnellmenü und Inventar öffnen | Fußhinweis bleibt innerhalb der Safe-Area und ist lesbar | Der kleine Fußtext sitzt teilweise auf/unter der unteren Rahmenkante und ist praktisch nicht lesbar | Footer aus der Rahmenzone herauslösen, Mindestgröße/Abstand definieren, bei kleinen Viewports ausblenden oder als Tooltip anbieten |
| QA-03 | P2 | B.03-Testabdeckung | Duo-, Monster- und Missionswege mit dem vorhandenen Dev-Account prüfen | Zwei eigene Monster und ein Support-Slot für die Zwei-Monster-Bühne | Account besitzt nur eine Resonanz; Duo zeigt `SUPPORT FREI`, Expeditionen melden kein freies Monster | QA-Fixture mit mindestens zwei Monstern bzw. dem Starter-Roster bereitstellen, bevor B.03 visuell abgenommen wird |
| QA-04 | P2 | Roadmap-Dokumentation | Statusdatei und Übergabedokumente vergleichen | Eine eindeutige Quelle für den Abnahmestatus | `apps/web/public/roadmap/roadmap-status.json` und `docs/ROADMAP_B_DESIGN_UI.md` melden 28/32, B.03/B.08 offen; `docs/ui/HANDOFF.md` und `docs/ui/B02_B08_PROGRESS.md` behaupten dagegen, alle Gates seien geschlossen | Alte Übergabedokumente korrigieren oder klar als historisch markieren; Statusdatei als einzige Autorität verlinken |
| QA-05 | P3 | Truhen-Feedback | Im Inventar unter `SONSTIGES` die `Ether-Truhe` öffnen | Öffnen, Ergebnis und Verbrauch in einem sichtbaren Schritt bestätigen | Truhe wird verbraucht und das Inventar schließt; kein direktes Ergebnis-/Belohnungsfeedback sichtbar, Ergebnis erst nach erneutem Öffnen erkennbar | Kurzen Ergebnis-Toast oder eine kleine Beute-Animation nach dem Öffnen ergänzen |

## Folgeprüfung vom 29. Juli 2026

Die fünf konkreten Befunde sind technisch bearbeitet:

- **QA-01:** Offline-Abholung besitzt eigenes Erfolgsfeedback und erzeugt keinen
  widersprüchlichen Leer-Speicher-Fehler mehr.
- **QA-02:** Monster- und Inventar-Schnellfenster halten Kopf, Inhalt und
  Fußhinweis auf Desktop, Tablet und 390×844 innerhalb ihrer Safe-Area.
- **QA-03:** Ein isoliertes Zwei-Monster-QA-Fixture prüft Front, Support und den
  aktiven Zonenbonus in allen drei Referenz-Viewports.
- **QA-04:** Die Roadmap-Dokumente benennen den historischen Nachtlauf als
  Vorarbeit und führen weiterhin 28/32 mit B.03/B.08 offen.
- **QA-05:** Die Ether-Truhe bleibt im geöffneten Inventar nachvollziehbar:
  lokal werden Verbrauch und Belohnung gemeinsam bestätigt; online ist die
  Aktion ausdrücklich eine nicht buchende Vorschau.

Zusätzlich wurde bei der Folgeprüfung eine echte mobile Eingabeblockade
gefunden: Die Kampf-Schnellleiste spannte sich durch widersprüchliche
`top`-/`bottom`-Anker unsichtbar über die Bühne. Der Ankerfehler ist behoben und
ein Responsive-Test prüft jetzt, dass Schnellleiste und Monster einander nicht
überdecken und beide Monster sichtbar geladen sind.

## Durchgespielte Wege

1. **Rückkehr/Offline:** Offline-Bericht mit 8 Stunden Fortschritt, Gold/Materialien und 90/90 Speicher angezeigt; `EINSAMMELN` ausgeführt.
2. **Kampf:** Kampf läuft automatisch weiter; Nameplates, HP-Balken, Trefferzahl und Kampf-Dock sichtbar. Im aktuellen 1280×720-Capture stehen Frostel und Kronwurzel-Koloss auf den vorgesehenen Plattformen, ohne Überlappung mit dem Dock.
3. **Kampfspeicher:** `Beute` geöffnet; leerer Zustand zeigt 0/90 und `Keine Beute bereit.` kompakt im rechten Panel.
4. **Monster-Schnellmenü:** Modal geöffnet; Rolle, HP/ATK und `RUN-LEVEL +1` vorhanden. Der Schnellzugriff funktioniert, die Footer-Darstellung ist jedoch QA-02.
5. **Duo:** Panel geöffnet; Bonusregel wird erklärt, Support-Slot bleibt mangels zweitem Monster frei.
6. **Fokus:** `Fokus` blendet HUD/Nebenflächen aus; `HUD ein` stellt die Oberfläche wieder her.
7. **Inventar:** 64 Slots und vier Kategorien geprüft (`GEMS`, `VERBRAUCH`, `MATERIALIEN`, `SONSTIGES`), leere Kategorie korrekt als 0 angezeigt. Die Item-Labels enthalten Name, Seltenheit, Menge und Effekt als zugängliche Tooltip-Daten.
8. **Testtruhe:** `Ether-Truhe` geöffnet; Gegenstand wurde entfernt und der Inhalt blieb serverseitig konsistent.
9. **Brutstation:** Frostel-Duplikat geöffnet; Erfolgszustand meldete `10 Frostel-Fragmente wurden gutgeschrieben`, Inkubator wurde frei. Zwei weitere Eier waren zur Inkubation sichtbar.
10. **Gems:** Karmin-Dreieck angelegt (`+4% ATK`) und wieder abgelegt; Slot-/Inventarstatus aktualisierte sich korrekt.
11. **Forschung:** Vier Forschungszweige sichtbar und bei 0 Kernen korrekt deaktiviert.
12. **Missionen/Expeditionen:** Auftragsbrett mit 6 Missionen und Sperr-/Anforderungstexten sichtbar; ohne freies Monster kein Start möglich.
13. **Gilde:** Leerzustand, Gildengründung und Freundesanfrage erreichbar; keine Gilde angelegt und keine Nachricht gesendet.
14. **Prestige-Gate:** Im Ziele-Panel sichtbar als `PRESTIGE-ZUGANG · ZONE 1/10 – AB ZONE 10`; kein vorzeitiger Prestige-Button ausführbar.

## Technische Gegenprüfung

- Browser-Konsole: **0 Warnungen / 0 Fehler** während des kompletten Laufs.
- Web-Unit-Tests: **11 Testdateien, 60 Tests bestanden** (`pnpm --filter @idle-tamer/web test -- --run`).
- Nicht in diesem Lauf abgenommen: 390×844-Mobile, Tablet, Zwei-Monster-/Support-Kampf mit vollständigem Starter-Roster, Hover-Tooltip mit Mauszeiger und echte Gildenkommunikation (bewusst keine externen/sozialen Seiteneffekte erzeugt).

## Testkonto-Zustand nach der Prüfung

Die folgenden Aktionen waren Teil des Spieltests und haben den Dev-Account absichtlich verändert: Offline-Beute abgeholt, eine Testtruhe geöffnet, ein Frostel-Duplikat in 10 Fragmente umgewandelt sowie ein Gem angelegt und wieder abgelegt. Es wurden keine Zugangsdaten, Nachrichten oder Gilden erstellt.

## Abnahmeempfehlung

B.03 und B.08 noch nicht auf 32/32 setzen. QA-01 bis QA-05 sind technisch
geschlossen und automatisiert nachweisbar; offen bleibt die vollständige
Live-Spielerprüfung des zusammenhängenden Spiels nach dem Deployment. Erst wenn
diese Prüfung keine neue erhebliche Bedien- oder Lesbarkeitsschuld zeigt,
dürfen B.03.3/B.03.4 und anschließend B.08.3/B.08.4 gemeinsam abgenommen
werden. Bis dahin gibt es keine Übergabe an Roadmap C.
