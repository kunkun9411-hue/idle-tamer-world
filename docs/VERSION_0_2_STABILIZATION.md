# Version 0.2 – Stabilisierung vor dem Account-Backend

Stand: 21. Juli 2026

Version 0.2 ist ein eingeschobener Qualitätscheckpoint. Sie erhöht den offiziellen Roadmap-Zähler nicht: Block 1 bis 3 bleiben abgeschlossen, danach folgt weiterhin Block 4 mit Accounts, Sessions und Bootstrap.

## Behobener P0-Fehler

Die Kampfszene hat zuvor ihren vollständigen DOM-Baum regelmäßig neu aufgebaut. Ein Button konnte dadurch zwischen Drücken und Loslassen ersetzt werden. Die sichtbaren Folgen waren ein Eindruck ständiger Seitenneuladung und Klicks, die erst beim zweiten Versuch reagierten.

Version 0.2 aktualisiert Lebenspunkte, Schadensfeedback, Kampfstatus, Speicherwerte, Inkubationszeit und Expeditionszeit gezielt. Navigation, Kampfsteuerung und offene Panels bleiben dabei bestehen. Ereignisse werden einmal am stabilen App-Container verarbeitet; kurze Aktionssperren verhindern versehentliche Doppelbuchungen. Hinweise verschwinden ohne einen vollständigen Neuaufbau der Szene.

Ein neuer Account wechselt nach seiner Starterwahl direkt in den Kampf. Nur ein bereits bestehender Account erhält beim Login den Offline-Bericht.

## Spielbarer Weg bis Zone 10

Der Zonenvertrag umfasst nun zehn logisch verkettete Zonen mit je zehn Stages. Der Boss jeder Zone schaltet genau die nächste Zone frei. Erst die permanent erreichte Zone 10 zusammen mit mindestens 100 Run-Siegen erlaubt Prestige.

Die Zonen 4 bis 10 sind spielbare Foundation-Platzhalter. Sie verwenden vorerst die drei vorhandenen Zonenhintergründe sowie bereits vorhandene Encounter-Assets erneut. Namen, Reihenfolge, Werte und Rollenboni sind editierbare Inhaltsdaten; neue Weltbilder und die endgültige Gegnerverteilung folgen als Content-Arbeit. Dieser Platzhalterstatus ist absichtlich sichtbar dokumentiert und kein endgültiges Weltdesign.

## Verbindliche Monsterentscheidung

Das Sammlungsziel sind **40 Rookie-Linien**:

- die zehn bereits sammelbaren Rookie-Linien bleiben erhalten;
- die 30 derzeit als normale Gegner geführten Designs werden zusätzlich zu sammelbaren Rookie-Linien ausgebaut;
- sie ersetzen die vorhandenen zehn nicht;
- die fünf Bosse bleiben eigenständige Boss-Encounter.

Der aktuelle Quellcode trennt die 30 Designs noch technisch als Encounter, damit Version 0.2 stabil bleibt. Vor ihrer Migration benötigen sie jeweils Sammlungseintrag, Grundwerte, Rolle, Ei- und Fragmentvertrag sowie mindestens eine Evolution. Bis dahin dürfen sie in den Platzhalterzonen als Kampfinhalt wiederverwendet werden, gelten aber nicht als endgültiger Gegnerpool.

Die zehn ursprünglichen Linien bleiben die anfängliche Starterauswahl. Die zusätzlichen 30 Linien werden über Eier und Weltfortschritt sammelbar, sofern diese Verteilung bei der späteren Content-Abnahme nicht ausdrücklich geändert wird.

## Lokale QA-Werkzeuge

Die QA-Leiste wird nur in einem lokalen Vite-Entwicklungsbuild mit bewusst gesetztem Schalter eingeblendet:

```powershell
$env:VITE_ENABLE_QA='true'
pnpm dev:web
```

Verfügbare Presets: nächste Zone, Zone 10, Ressourcen, kampffähiges Monster und Prestige-Zustand. Der Code prüft zusätzlich `import.meta.env.DEV`; ein Produktionsbuild zeigt die Leiste auch bei versehentlich gesetzter Umgebungsvariable nicht an.

## Abnahmeschutz

- Inhaltsvertrag: zehn lineare Zonen und gültige Referenzen
- echter Übergangstest: Zone 1 bis Zone 10 über alle Boss-Gates
- Prestigetest: Zone 10 und 100 Run-Siege bleiben gemeinsame Pflicht
- DOM-Stabilitätstest: Kampfsteuerung bleibt während des Autokampfs dasselbe Element
- Erstklicktest: ein Klick öffnet das gewählte Kampfpanel
- frischer Account: kein bedeutungsloser Offline-Bericht nach der Starterwahl
- Produktionsbuild: keine QA-Leiste

## Danach

Nach der Abnahme von Version 0.2 beginnt Block 4, Schritt 1. Die Content-Migration von 10 auf 40 Rookie-Linien wird vor dem serverautoritativen Besitz- und Eiermodell verbindlich geplant, damit SQL-Schema, IDs und API-Verträge nicht zweimal umgebaut werden.
