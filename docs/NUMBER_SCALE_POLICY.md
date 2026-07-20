# Zahlen- und Prestige-Policy

- Status: **verbindlich für den Backend-Vertrag**
- Balance-Release: **low-numbers-1.0.0**
- Stand: **20. Juli 2026**

## Ziel

Idle Tamer hält Zahlen so lange wie möglich klein und lesbar. Große Sprünge sind kein Ersatz für neue Mechaniken. Erst wenn die Wirtschaft tatsächlich den Bereich wissenschaftlicher Zahlen erreicht, wechselt die Darstellung in eine wissenschaftliche Schreibweise.

## Zahlenbereiche

| Bereich | Verbindliche Regel |
| --- | --- |
| erster Prestige-Zyklus | einzelne Preise und Belohnungen bleiben unter 10.000 |
| frühes Accountspiel | typische Einzelwerte bleiben unter 1.000.000 |
| lesbare Langzeitwerte | ausgeschriebene oder kompakte deutsche Anzeige bis einschließlich 999.999.999.999.999 |
| wissenschaftliches Endgame | ab `1e15` automatische Schreibweise wie `1,25e15` |

Vor `1e15` darf ein direkt aufeinanderfolgender wiederholbarer Upgradepreis höchstens auf das Zweifache steigen. Das ist eine harte Schutzgrenze; für normale frühe Kurven wird ein deutlich kleinerer Schritt angestrebt. Schwierigkeit entsteht zuerst durch neue Anforderungen, Teamwahl, Zonen und Ressourcen – nicht durch plötzlich angehängte Nullen.

JavaScript-Zahlen sind nur für den lokalen Prototyp autoritativ. Das Backend speichert große ganzzahlige Bestände als PostgreSQL `numeric` und überträgt sie als Strings, damit oberhalb der sicheren JavaScript-Ganzzahlgrenze keine Präzision verloren geht.

## Prestige-Freigabe

Prestige benötigt immer beide Bedingungen:

1. Der Account hat mindestens einmal **Zone 10** erreicht.
2. Der aktuelle Run besitzt mindestens **100 Siege**.

Die höchste jemals erreichte Zonennummer ist permanent. Ein Prestige setzt den aktuellen Zonenlauf zurück, aber niemals diesen Freischaltungsnachweis. Ein Spieler kann dadurch keine sehr kurzen frühen Runs zum schnellen Stapeln permanenter Boni verwenden.

Der aktuelle Prototyp enthält erst drei spielbare Zonen. Prestige ist im normalen Spiel daher absichtlich gesperrt, bis die Zonen 4 bis 10 als Inhalt ergänzt sind. Automatisierte Tests verwenden einen ausdrücklich vorbereiteten Zone-10-Zustand.

## Permanente Prestige-Wirkung

| Wirkung | je Prestige | bei Prestige 10 | bei Prestige 100 | bei Prestige 200 |
| --- | ---: | ---: | ---: | ---: |
| eigene Grundwerte | +0,2 % | +2 % | +20 % | +40 % |
| Gold aus wiederholbaren Quellen | +0,1 % | +1 % | +10 % | +20 % |
| zusätzliche Dropchance | +0,001 Prozentpunkte | +0,01 PP | +0,1 PP | +0,2 PP |
| Gegnerleben und -angriff | je 100 Prestige +2 % | +0 % | +2 % | +4 % |

Die Gegnerverstärkung ist stufenweise: Prestige 99 gibt noch keinen Gegnerbonus, Prestige 100 genau 2 %. Dadurch wird der Spieler durch Prestige weiterhin netto stärker, während extrem viele Prestige-Zyklen nicht vollständig ohne Gegenbewegung bleiben.

## Geltungsbereich

Der Goldbonus gilt für wiederholbare Kampfsiege, Offline-Gold und bei Start berechnete Zeit-Expeditionen. Einmalige Story-, Post- oder Systembelohnungen werden nicht rückwirkend vergrößert.

Der Dropbonus gilt für Trainingsdaten, Etherstaub, Brutladungen, Eier und normale zufällige Gems. Garantierte Bossdrops bleiben garantiert; Seltenheitsverteilungen ändern sich dadurch nicht. Der Bonus wird als absolute Chance in Prozentpunkten addiert und bei 100 % begrenzt.

Die Grundwertsteigerung wird auf Leben und Angriff der Monster angewendet. Hyperlevel, Evolutionen und Gems bleiben eigene permanente Schichten.

## Versionierung und Abnahme

- Zentraler Code: `src/game/catalog.ts`, `src/game/rules.ts` und `src/game/number-scale.ts`
- Save-Schema: v9 mit permanentem `highestZoneNumber`
- API-Protokoll: v8 mit `balanceContractVersion` und `balanceReleaseId`
- Jede Änderung dieser Werte benötigt eine neue Balance-Release-ID, aktualisierte Beispiele und automatisierte Grenztests.

