# Kernspiel: so wird Idle Tamer gespielt

## Die kurze Version

1. Einmalig einen von zehn Rookie-Startern wählen.
2. Eine Front und ein Support-Monster als Expeditions-Duo zusammenstellen. Sichtbar kämpft die Front automatisch und immer im Normaltempo 1 gegen 1.
3. Mit passenden Rollen das Zonenprotokoll aktivieren; jede Karte belohnt andere Duos.
4. Siege füllen den begrenzten Kampfspeicher mit Gold, Eiern, Materialien und gelegentlichen Gems; Zonenbosse garantieren einen Gem.
5. Beute einsammeln, bevor der Speicher voll ist. Kämpfe und Siege laufen danach weiter, normale Beute wird aber nicht mehr erzeugt.
6. In der Auftragszentrale Tages- und Wochenziele sowie permanente Erfolge abholen. Alle Ziele zählen bestehende Spielaktionen; es gibt keine separate Beschäftigungstaste.
7. Freie Monster in zwei Zeit-Expeditionsslots entsenden. Passende Rollen, Elemente und entwickelte Formen verbessern die feste Belohnung.
8. Etherstaub in der Werkstatt garantiert in Trainingsdaten, Brutladungen oder Evolutionskerne umwandeln.
9. Gold oder Trainingsdaten gezielt in die Monster investieren, deren Rollen in der nächsten Zone gebraucht werden.
10. Eier in der Brutstation öffnen: neue Art = neues Monster, bekannte Art = 10 Fragmente.
11. Fragmente in permanente Hyperlevel oder in die Evolution derselben Art investieren.
12. Einen Zonenboss auf Stage 10 besiegen, Evolutionskern erhalten und die nächste Zone öffnen.
13. Ein Rookie ab Level 20 mit drei Evolutionskernen und 30 Art-Fragmenten dauerhaft entwickeln; die neue Form bestimmt neue Grundwerte.
14. Drei Gem-Slots ausrüsten: Dreieck für Angriff, Quadrat für Leben, Raute für beides.
15. Erst Zone 10 erreichen, dann ab 100 Run-Siegen den Ether-Kristall in der Prestige-Szene aktivieren und Prestige-Kerne in Forschung investieren.

## Was offline passiert

Nach dem Laden wird höchstens acht Stunden nachproduziert. Alle fünf Minuten entsteht ein Beutebündel, solange im Kampfspeicher noch Platz ist. Offline-Beute enthält Gold, regelmäßig Trainingsdaten und seltener Etherstaub. Ohne gewählten Starter gibt es keinen Offline-Fortschritt. Das verbrauchte Zeitfenster wird sofort gespeichert, damit ein schneller Reload es nicht erneut auszahlt.

## Temporär und permanent

Die vollständige, backend-verbindliche Resetmatrix einschließlich Ei-Pity, laufender Brut, Expeditionen, Claims und Kampfspeicher steht in `GAMEPLAY_FOUNDATION_SPEC.md`. Die folgende Tabelle ist die kurze Spielerfassung.

| Wird bei Prestige zurückgesetzt | Bleibt erhalten |
| --- | --- |
| Run-Gold | Monsterbesitz |
| normale Monsterlevel | Rookie-Evolutionen |
| Run-Siege | Hyperlevel und Fragmente |
| Zonenfreischaltungen und aktuelle Stages | Eier und Inventarmaterialien |
| nicht eingesammeltes Gold | Gesamtsiege und Story-Meilensteine |
|  | Gems, Gem-Ausrüstung, Avatare, Rahmen und Forschung |
|  | höchste jemals erreichte Zone und permanente Prestige-Boni |

Nicht eingesammelte Eier und Materialien werden vor dem Prestige automatisch gesichert. Nicht eingesammeltes Gold verfällt bewusst.

Jedes Prestige gibt dauerhaft +0,2 % Grundwerte, +0,1 % Gold aus wiederholbaren Quellen und +0,001 Prozentpunkte Dropchance. Erst bei jedem 100. Prestige werden Gegner stufenweise um 2 % stärker.

## Aktueller Content-Umfang

- zehn Rookie-Linien mit je einer Evolution
- 30 normale Gegner und fünf rotierende Bosse
- drei Zonen mit je zehn Stages und einem Boss
- vier Materialien
- 45 Gems: drei Formen, fünf Farben, drei Seltenheiten
- sechs Avatare und fünf Rahmen
- ein Inkubator
- vier Forschungszweige
- zehn Story-Meilensteine bis 500 Gesamtsiege
- drei tägliche Ziele, drei wöchentliche Ziele und vier permanente Erfolge
- sechs Zeit-Expeditionen in zwei parallelen Slots
- drei feste Herstellrezepte und drei lokale Systemnachrichten

## Absichtliche Grenzen der Grundversion

- keine Angriffstasten und keine Geschwindigkeitsknöpfe
- kein Eltern-Paarungssystem; „Zucht“ ist hier Eierbrüten und Duplikatverwertung
- noch keine aktiven Skills, Statuswerte oder Elementkonter; Gem-Ausrüstung ist die erste passive Equipment-Schicht
- Gilde, PvP, Handel und Accountlogin bleiben serverseitige Folgephasen
