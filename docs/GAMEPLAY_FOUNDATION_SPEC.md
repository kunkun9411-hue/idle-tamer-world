# Gameplay-Grundregelspezifikation

- Status: **Verbindlicher Plan für Block 2**
- Version: **Foundation 1.0**
- Balance-Ergänzung: **low-numbers-1.0.0**
- Stand: **20. Juli 2026**

## Zweck

Dieses Dokument friert den Solo-Kern von Idle Tamer ein, bevor PostgreSQL und Serverautorität gebaut werden. Tabellen und API-Kommandos sollen nicht später wegen ungeklärter Spielregeln neu entworfen werden müssen.

„Eingefroren“ bedeutet:

- Resetgrenzen, Ressourcenarten und Besitzmodelle ändern sich ab jetzt nur bewusst und dokumentiert.
- Zahlen dürfen vor dem öffentlichen Launch über Content-Versionen nachjustiert werden.
- Eine Zahlenänderung darf keine neue Besitzart oder andere Datenbankstruktur benötigen.
- Die Werte in diesem Dokument sind das Ziel für die Online-Alpha. Abweichende schnelle Testwerte im aktuellen Prototyp stehen in der Delta-Tabelle.

## Spielerlebnis-Ziele

### Erste Stunde

| Zeitpunkt | Erwartetes Erlebnis |
| --- | --- |
| Minute 0–3 | Login, Starterwahl, erster automatischer Kampf und erste Levelentscheidung |
| Minute 3–8 | erster Zonenboss, erste neue Zone, garantierter Gem und erster Evolutionskern |
| Minute 5–12 | erstes Ei in der Brut, erstes zusätzliches Monster und Supportplatz verständlich |
| Minute 10–20 | Kampfspeicher bewusst einsammeln, Tagesziele und erste Zeit-Expedition nutzen |
| Minute 15–30 | Rollen- oder Zonenbonus gezielt aktivieren und mehrere Monster leveln |
| Minute 30–45 | vorhandene Zonen meistern, Teamrollen vergleichen und permanenten Fortschritt vorbereiten |
| Minute 45–60 | Brut, Hyperlevel, Evolution, Gems und Forschung als langfristige Ziele verstehen |

Prestige ist kein früher Klickloop. Es wird erst nach Zone 10 und 100 Run-Siegen verfügbar. Version 0.2 besitzt einen realen, linearen Pfad über zehn Zonen; die Zonen 4 bis 10 verwenden bis zur Content-Abnahme vorläufig vorhandene Gegner- und Weltassets erneut.

### Erster Tag

Ein normal aktiver Spieler mit mehreren Rückkehr-Sessions soll ungefähr Folgendes erreichen können:

- Fortschritt in Richtung Zone 10; die reale Zeit bis zum ersten Prestige wird mit den neuen Zonen 4–10 weiter kalibriert,
- drei bis sechs entdeckte Monsterlinien,
- die ersten drei Zonen mindestens einmal betreten,
- ein bis drei Hyperlevel auf bevorzugten Monstern,
- mindestens eine vollständige Gem-Ausrüstung,
- die erste Evolution als erreichbares Tagesziel, nicht als garantierter Loginbonus,
- mehrere abgeschlossene Kurz- und Mittel-Expeditionen,
- vier bis sieben permanente Forschungsstufen insgesamt.

### Erste Woche

Zielkorridor für einen regelmäßig wiederkehrenden Spieler:

- mehrere Prestige-Runs nach der Zone-10-Freischaltung; der Wochenkorridor wird mit den Zonen 4–10 kalibriert,
- sieben bis zehn entdeckte Monsterlinien,
- zwei bis fünf entwickelte Monster,
- mehrere spezialisierte Front-/Support-Duos,
- acht bis zwölf Forschungsstufen insgesamt,
- alle vorhandenen Storyknoten bis 500 Gesamtsiege,
- erste bewusste Spezialisierung auf Angriff, Überleben, Extraktion oder Brut.

Diese Korridore sind keine garantierten Belohnungen. Sie sind Messpunkte für Simulation und spätere Telemetrie.

## Verbindliche Kernwerte

### Run und Prestige

| Regel | Foundation-1.0-Wert | Begründung |
| --- | --- | --- |
| Startgold | 100 | erlaubt zwei direkte frühe Levelkäufe |
| normales Level | Kosten `24 + aktuelles Level × 16` | verständliche lineare erste Kurve |
| Level 1 → 5 | insgesamt 256 Gold | frühe sichtbare Verbesserung |
| Level 1 → 10 | insgesamt 936 Gold | innerhalb des ersten Runs erreichbar |
| Level 1 → 20 | insgesamt 3.496 Gold | Evolution braucht bewusste Investition |
| Prestige-Freigabe | höchste Zone mindestens 10 und 100 Run-Siege | verhindert das Farmen sehr kurzer Prestige-Runs |
| Prestige-Kerne | `1 + floor((Run-Siege - 100) / 100)` | längere Runs bleiben eine echte Wahl |
| Forschungspreis | `1 + floor(aktuelles Level / 2)` Kerne | frühe Spezialisierung, später steigende Bindung |
| Kampfspeicher | 90 Plätze + 12 je Extraktionsstufe | mindestens ein bewusster Claim pro erstem Run |

Eine reale Zielzeit für den ersten Prestige wird erst festgelegt, wenn die Zonen 4 bis 10 spielbar sind. Die Zone-10- und 100-Siege-Grenzen selbst sind verbindlich und werden nicht für einen schnelleren Testlauf abgeschwächt.

### Gold und Materialien pro Sieg

| Quelle | Wert |
| --- | --- |
| Grundgold | `9 + Gegnerlevel × 4` |
| Extraktionsforschung | +10 % Gold je Stufe |
| Zonen-Goldbonus | je nach aktivem Duo +10 % oder +12 % |
| Prestige-Goldbonus | +0,1 % je Prestige auf wiederholbare Quellen |
| Trainingsdaten | 55 % Grundchance |
| Etherstaub | 18 % Grundchance |
| Brutladung | 4 % Grundchance |
| Zonen-Materialbonus | je nach Duo bis +12 Prozentpunkte |
| Prestige-Dropbonus | +0,001 Prozentpunkte je Prestige |

Trainingsdaten ersetzen genau einen normalen Levelkauf. Materialien bleiben über Prestige erhalten, das dadurch erzeugte normale Level nicht.

### Eier, Brut und Fragmente

| Regel | Foundation-1.0-Wert |
| --- | --- |
| Ei-Grundchance | 12 % je Sieg |
| Pity-Anstieg | +1,5 Prozentpunkte je Fehlschlag |
| garantierter Drop | spätestens beim achten Versuch |
| statistischer Erwartungswert | ungefähr ein Ei je 4,91 Siege |
| Grundbrutzeit | 5 Minuten |
| Brutforschung | −10 % je Stufe, maximal fünf Stufen |
| minimale Brutzeit | 2 Minuten |
| eine Brutladung | −60 Sekunden, niemals unter „jetzt“ |
| Erstschlupf | neue Monsterlinie |
| Duplikatschlupf | 10 Fragmente derselben Art |

Nur das Brüten erzeugt ein Monster oder Fragmente. Ein Eifund allein verändert die Sammlung nicht.

### Hyperlevel und Evolution

| Regel | Wert |
| --- | --- |
| Hyperlevelkosten | `10 + aktuelles Hyperlevel × 10` Art-Fragmente |
| Hyperlevel-Angriff | +7 % je Stufe |
| Hyperlevel-Leben | +8 % je Stufe |
| Evolutionslevel | normales Level 20 |
| Evolutionskosten | 3 Evolutionskerne + 30 Art-Fragmente |
| Evolutionskerne | einer je Zonenboss, weitere aus Zielen, Expedition und Herstellung |

Die erste Duplikatbrut erlaubt Hyperlevel 1. Drei Duplikatbruten liefern alternativ die 30 Fragmente für eine Evolution. Diese Entscheidung ist beabsichtigt.

### Gems

| Regel | Wert |
| --- | --- |
| normaler Gemdrop | 4 % bei Nichtbossen |
| Bossdrop | ein Gem garantiert |
| Boss-Seltenheit | 65 % gewöhnlich, 30 % selten, 5 % mythisch |
| gewöhnliche Potenz | 4 % |
| seltene Potenz | 8 % |
| mythische Potenz | 14 % |
| Dreieck | nur Angriff |
| Quadrat | nur Leben |
| Raute | je 70 % der Seltenheitspotenz auf Angriff und Leben |

Identische Gems derselben Definition bleiben stapelbar. Zufällige Einzelwerte werden vorerst nicht eingeführt.

### Offline-Fortschritt

| Regel | Foundation-1.0-Wert |
| --- | --- |
| harte Offline-Grenze | 8 Stunden |
| ein Offline-Bündel | alle 5 Minuten |
| Grundspeicher | 90 Bündel = 7,5 Stunden |
| Extraktionsstufe 1 | 102 Bündel, deckt die Acht-Stunden-Grenze ab |
| Gold je Bündel | 12 × Extraktionsmultiplikator |
| Prestige-Goldbonus | +0,1 % je Prestige |
| Trainingsdaten | eines je drei Bündel |
| Etherstaub | einer je acht Bündel |
| ohne Starter | kein Offline-Ertrag |

Der Speicher ist eine Kapazitätsgrenze, die Acht-Stunden-Regel eine Zeitgrenze. Es gilt immer die zuerst erreichte Grenze. Das verbrauchte Zeitfenster wird sofort gespeichert.

### Zeit-Expeditionen und Herstellung

- Zwei parallele Expeditionsslots bleiben der Grundwert.
- Expeditionsdauern bleiben 2, 5, 12, 20, 45 und 90 Minuten.
- Rolle, Element und Evolution erhöhen den gespeicherten Belohnungsmultiplikator jeweils um 15 %.
- Herstellung bleibt garantiert und besitzt keine Fehlschlagchance.
- Rezepte bleiben 3 Staub + 40 Gold für Trainingsdaten, 5 Staub + 90 Gold für Brutladung und 20 Staub + 500 Gold für Evolutionskern.

## In Schritt 2 umgesetzte Foundation-Deltas

Die folgenden alten Testwerte wurden in Schritt 2 durch Foundation 1.0 ersetzt. Die reale Zeitmessung bis zum ersten Prestige ist bewusst vertagt, bis die Zonen 4 bis 10 spielbar sind.

| Bereich | Alter Prototypwert | Foundation 1.0 | Stand |
| --- | --- | --- | --- |
| Grundbrutzeit | 45 Sekunden | 5 Minuten | aktiv |
| minimale Brutzeit | 18 Sekunden | 2 Minuten | aktiv |
| Brutladung | −15 Sekunden | −60 Sekunden | aktiv |
| Offline-Bündel | alle 45 Sekunden | alle 5 Minuten | aktiv |
| Grundspeicher offline | nach 67,5 Minuten voll | nach 7,5 Stunden voll | aktiv |
| erster Prestige | nach 100 Siegen | erst nach Zone 10 und 100 Siegen | Zugang aktiv, Zeitmessung nach Zonen 4–10 |

Diese Deltas sind seit Block 2, Schritt 2 im Client aktiv. Sie verändern keine Besitzart und kein geplantes SQL-Schema; es sind reine versionierte Balancewerte.

## Vollständige Prestige-Resetmatrix

Die spätere Serveraktion `prestige.start` führt diese Matrix in einer einzigen Datenbanktransaktion aus.

| Zustand | Bei Prestige | Begründung |
| --- | --- | --- |
| Run-Gold | auf 0 | temporäre Run-Währung |
| Run-Siege | auf 0 | neuer Zeitlinienlauf |
| normale Monsterlevel | alle auf 1 | temporäre Trainingsleistung |
| aktuelle Zone | zurück auf Violetten Saum | neuer Lauf startet am Anfang |
| Zonenfreischaltungen | nur Violetter Saum | temporärer Run-Fortschritt |
| Stage und Zonenabschlüsse | auf Startwerte | temporärer Run-Fortschritt |
| nicht eingesammeltes Gold | verfällt | klare Prestige-Entscheidung |
| nicht eingesammelte Eier | vor Reset sichern | permanenter Besitz |
| nicht eingesammelte Materialien | vor Reset sichern | permanenter Besitz |
| nicht eingesammelte Gems | vor Reset sichern | permanenter Besitz |
| Kampfspeicherbelegung | auf 0 | Speicher wurde aufgelöst |
| Prestige-Kerne | Belohnung addieren | permanente Forschung |
| Prestigezahl | um 1 erhöhen | permanenter Accountwert |
| höchste jemals erreichte Zone | behalten | permanenter Nachweis für die Zone-10-Freigabe |
| Prestige-Grundwertbonus | +0,2 % je Prestige | kleine dauerhafte Verstärkung |
| Prestige-Goldbonus | +0,1 % je Prestige | minimale Beschleunigung wiederholbarer Quellen |
| Prestige-Dropbonus | +0,001 Prozentpunkte je Prestige | sehr kleine langfristige Verbesserung |
| Gegnerverstärkung | je 100 Prestige +2 % Leben und Angriff | begrenzte Gegenbewegung gegen Power-Creep |
| Gesamtsiege | behalten | Rang und Story |
| Monsterbesitz | behalten | Sammlung |
| aktive Front und Support | behalten | Komfort, sofern weiterhin gültig |
| Evolutionen | behalten | permanente Grundform |
| Hyperlevel | behalten | permanente Art-Investition |
| Art-Fragmente | behalten | permanente Währung |
| Eier im Inventar | behalten | permanenter Besitz |
| Materialien im Inventar | behalten | permanenter Besitz |
| Gems und Gem-Ausrüstung | behalten | permanentes Equipment |
| Forschung | behalten | permanente Accountkraft |
| Ei-Pity | behalten | Prestige darf Drop-Schutz nicht vernichten |
| laufende Brut | behalten | serverseitiger Zeitjob |
| laufende Expeditionen | behalten | serverseitige Zeitjobs |
| Zielzähler und Claims | behalten | Tages-/Wochenperiode bleibt maßgeblich |
| Story-Claims | behalten | einmalige Belohnungen |
| Avatare und Rahmen | behalten | Kosmetik |
| Einstellungen | behalten | Accountkomfort |
| Tutorial | behalten | keine Wiederholung nach Prestige |
| Systempost und Claims | behalten | keine Doppelbelohnung |

Schlägt ein Teil der Prestige-Transaktion fehl, wird nichts verändert.

## Verbindlicher E2E-Abnahmeablauf

Der Browser-E2E-Test aus Block 2, Schritt 2 bildet später mindestens diesen Ablauf ab:

1. Neuen lokalen Testaccount ohne Monster starten.
2. Loginformular absenden und Starterwahl sehen.
3. Pyrook wählen und Offline-Bericht öffnen.
4. Ohne fiktive Offline-Beute in die Hauptkampfszene wechseln.
5. Ersten Sieg automatisch erhalten.
6. Kampfspeicher öffnen und Beute einmal einsammeln.
7. Normales Level mit Gold erhöhen und korrekten Abzug prüfen.
8. Zone 1 bis zum Boss abschließen.
9. Boss-Gem und Evolutionskern einsammeln; Zone 2 ist freigeschaltet.
10. Ei-Inventar öffnen und Brut starten.
11. Während der Brut einen gesperrten zweiten Startversuch prüfen.
12. Brut mit Zeit oder Ladung abschließen und Erst- oder Duplikatergebnis prüfen.
13. Zweites Monster als Support einsetzen und sichtbaren Zonenbonus prüfen.
14. Eine Zeit-Expedition mit freiem Monster starten.
15. Tagesziel claimen und erneuten Claim ablehnen.
16. Gem in den passenden Formslot einsetzen und Grundwerte aktualisieren.
17. Genügend Testressourcen für Hyperlevel und Evolution bereitstellen.
18. Hyperlevel erhöhen, Evolution auslösen und permanente Werte prüfen.
19. Mit einem ausdrücklich vorbereiteten Zone-10-Fixture 100 Run-Siege erreichen und Prestige-Szene öffnen; Zone 9 muss gesperrt bleiben.
20. Prestige bestätigen und Resetmatrix vollständig vergleichen.
21. Prestige-Kern in Forschung investieren.
22. Seite neu laden und erhaltene permanente Werte erneut prüfen.
23. Veraltetes Kommando simulieren und sichtbaren Revisionskonflikt zeigen.
24. Save- oder Verbindungsfehler simulieren und verständlichen Wiederholungsweg zeigen.

Für den Test werden reproduzierbare Fixtures und beschleunigte Testzeiten verwendet. Die Produktionswerte selbst werden nicht verkürzt.

## Verpflichtende UI-Zustände

### Global

| Zustand | Darstellung | Erforderliche Aktion |
| --- | --- | --- |
| lädt | ruhiger Skeleton- oder Statuszustand | keine doppelte Eingabe möglich |
| bereit | normale Szene | passende Primäraktion verfügbar |
| gespeichert | kurzes Mint-Signal | keine Bestätigungsschleife |
| Fehler | Ursache in Klartext | sichere Wiederholung oder Rückkehr |
| offline | Verbindungshinweis | lokale Komfortnavigation bleibt möglich |
| Revisionskonflikt | neuerer Serverstand verfügbar | Zustand neu laden, Aktion nicht doppeln |
| Session abgelaufen | Fortschritt bleibt serverseitig | zurück zum Login |
| Wartung | Status und späterer Versuch | keine schreibenden Aktionen |

### Szenen

| Szene | Mindestens abzudeckende Zustände |
| --- | --- |
| Login | leer, ungültig, lädt, falsche Daten, gesperrt, Session vorhanden |
| Offline-Bericht | keine Abwesenheit, Beute vorhanden, Speicher voll, bereits geclaimt |
| Kampf | kein Starter, kämpft, Sieg, Regeneration, Speicher voll, Zone gesperrt |
| Kampfspeicher | leer, teilweise gefüllt, voll, Claim läuft, Claim bestätigt |
| Monster | nur Starter, mehrere Monster, Front aktiv, Support aktiv, auf Expedition, Maximalwert |
| Brut | kein Ei, Ei wählbar, läuft, beschleunigbar, bereit, Erstfund, Duplikat |
| Gems | leer, falsche Form, ausgerüstet, ersetzt, keine freie Menge, maximale Seltenheit |
| Evolution | Anforderungen fehlen, einzelne Anforderung erfüllt, bereit, bereits entwickelt |
| Hyperlevel | Fragmente fehlen, bereit, erfolgreich, Maximalgrenze falls später eingeführt |
| Prestige | gesperrt, bereit, Bestätigung, Animation, Transaktion läuft, abgeschlossen, Fehler |
| Forschung | keine Kerne, kaufbar, gekauft, Maximalstufe |
| Ziele | kein Fortschritt, läuft, claimbar, geclaimt, neue Periode |
| Expeditionen | Slot frei, Monster ungültig, läuft, fertig, claimbar, bereits geclaimt |
| Werkstatt | Zutaten fehlen, herstellbar, Transaktion läuft, hergestellt |
| Profil/Post | leer, ungelesen, Belohnung bereit, geclaimt, Kosmetik gesperrt/aktiv |

## Backend-relevante Festlegungen

- Der Client sendet Aktionen, keine berechneten Belohnungen oder Bestände.
- Große Ganzzahlen werden als Strings transportiert und in PostgreSQL als `numeric` gespeichert.
- Jede schreibende Aktion besitzt `commandId` und `expectedRevision`.
- Zeitjobs speichern Start, Ende, Status und verwendete Content-Version.
- Drop-, Kosten- und Dauerwerte kommen aus einer versionierten Content-Konfiguration.
- Balanceantworten tragen `balanceContractVersion` und `balanceReleaseId`; der aktive Release ist `low-numbers-1.0.0`.
- Ein Reward-Batch wird serverseitig erzeugt und genau einmal geclaimt.
- Prestige, Brutabschluss, Expedition-Claim und Equipmentwechsel sind atomare Transaktionen.

## Abnahme Block 2, Schritt 1

- [x] Stunde 1, Tag 1 und Woche 1 besitzen messbare Zielkorridore.
- [x] Kosten, Drops, Pity, Brut, Fragmente und Prestige sind festgelegt.
- [x] Resetgrenzen stehen in einer vollständigen Matrix.
- [x] der komplette Spielerablauf ist als E2E-Abnahmefall beschrieben.
- [x] Lade-, Fehler-, Konflikt-, Leer-, Voll- und Maximalzustände sind erfasst.
- [x] bekannte Unterschiede zwischen Prototyp und Zielbalance sind ausdrücklich dokumentiert.

Damit ist die Planung abgeschlossen und die Foundation-Deltas sind umgesetzt. Die breiten Geräte-, Barrierearmuts-, Parallelitäts- und CI-Prüfungen folgen in Block 2, Schritt 3.
