# Zonen- und Live-Content-Pipeline

Dieses Dokument beschreibt die spätere Entwicklerstrecke. Der aktuelle Vertical Slice liest seine Zone noch aus lokalem Content-Code; ein Editor oder Backend ist bewusst nicht vorgetäuscht.

## Ziel

Eine Zone soll ohne Änderung der Kampf-UI gepflegt werden können. Content-Designer bearbeiten versionierte Zone-Definitionen. Ein Validierungsjob prüft Referenzen und Balance. Erst danach wird eine Content-Version veröffentlicht und vom Spielserver aktiviert.

```text
Entwurf im internen Content-Editor
        ↓
versioniertes Zone-Dokument
        ↓
Schema-, Referenz- und Balanceprüfung
        ↓
Vorschau-Umgebung mit Testaccount
        ↓
Freigabe und geplante Veröffentlichung
        ↓
unveränderliche Content-Version im Spielserver
```

## Zone-Definition

Eine Zone benötigt mindestens folgende Felder:

```json
{
  "id": "violet-rim",
  "contentVersion": 1,
  "name": "Violetter Saum",
  "chapter": 1,
  "unlock": { "type": "totalVictories", "value": 0 },
  "stages": 10,
  "backgroundKey": "zone.violet-rim.day",
  "musicKey": "music.violet-rim.explore",
  "enemyPool": [
    { "monsterId": "mossbit", "weight": 45, "minStage": 1 },
    { "monsterId": "voltfin", "weight": 30, "minStage": 3 },
    { "monsterId": "nyxlet", "weight": 25, "minStage": 6 }
  ],
  "eggPool": [
    { "monsterId": "mossbit", "weight": 60 },
    { "monsterId": "voltfin", "weight": 40 }
  ],
  "storyMilestones": [10, 25],
  "modifiers": [],
  "enabled": true
}
```

`backgroundKey` und `musicKey` sind Asset-Schlüssel, keine frei eingebbaren URLs. Monster-IDs müssen im serverseitigen Monsterkatalog existieren. Gewichte werden beim Import normalisiert.

## Pflege im internen Editor

Der spätere Content-Editor benötigt keine freie Datenbankoberfläche. Er bietet kontrollierte Eingaben:

- Stammdaten: Name, Beschreibung, Kapitel und Sichtbarkeit
- Freischaltung: Rang, Gesamtsiege, vorherige Zone oder Event
- Stage-Zahl und Skalierungskurve
- Gegnerpool mit Gewicht, Mindest- und Höchststage
- separater Ei- und Belohnungspool
- Story-Knoten und lokalisierte Texte
- Hintergrund-, Musik- und Effekt-Schlüssel aus dem Assetkatalog
- zeitlich begrenzte Modifikatoren
- Vorschau mit auswählbarem Testaccount

Jede Änderung erzeugt einen neuen Entwurf. Veröffentlichte Versionen werden nie überschrieben, damit laufende Kämpfe und Offline-Berechnungen reproduzierbar bleiben.

## Validierung vor Veröffentlichung

1. Jede referenzierte Monster-, Story- und Asset-ID existiert.
2. Kein Gegnerpool ist leer; Gewichte sind positiv.
3. Stage- und Belohnungskurven bleiben innerhalb definierter Balancegrenzen.
4. Eier verweisen nur auf freigegebene sammelbare Arten.
5. Deutsche und spätere englische Texte sind vollständig.
6. Die Zone wurde mit Start-, Durchschnitts- und Endgame-Testaccount simuliert.
7. Eine Rückfallversion ist benannt und technisch aktivierbar.

## Serverseitige Veröffentlichung

Der Server speichert `activeContentVersion` am Kampf beziehungsweise Offline-Zeitfenster. Dadurch kann ein späteres Balance-Update keine bereits verdienten Belohnungen rückwirkend verändern. Die Aktivierung erfolgt geplant, atomar und mit Audit-Eintrag. Ein Rollback schaltet lediglich eine frühere unveränderliche Version wieder aktiv.

## Rollen

| Rolle | Rechte |
|---|---|
| Content Designer | Entwürfe und Vorschauen |
| Balancing | Kurven, Pools und Simulationen |
| Lore/Localization | Story- und UI-Texte |
| Release Manager | Veröffentlichung und Rollback |
| Entwickler | Schema, neue Mechaniken und Editor-Komponenten |

Normale Gildenoffiziere oder Spieler erhalten niemals Zugriff auf diese Werkzeuge. Das System ist ein internes Dev-Produkt hinter Account-, Rollen- und Auditkontrolle.
