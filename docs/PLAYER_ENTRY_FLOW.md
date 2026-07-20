# Spieler-Einstieg und Hauptszene

Dieses Dokument ist die verbindliche UX-Reihenfolge für Idle Tamer. Sie verhindert, dass der Hauptkampf später wieder zu einer kleinen Dashboard-Karte schrumpft.

Der reproduzierbare 24-Schritte-Abnahmeablauf für Login, Kampf, Brut, Entwicklung, Prestige, Reload und Fehlerfälle steht in `GAMEPLAY_FOUNDATION_SPEC.md`.

## Verbindlicher Ablauf

1. **Login**
   - Der Spieler landet immer zuerst auf einer fokussierten Einloggseite.
   - Im lokalen Prototyp ist ein Demo-Zugang vorausgefüllt.
   - Beim Online-Umbau wird nur der Submit-Handler gegen die Account-API getauscht; das Formular und der folgende Ablauf bleiben bestehen.
2. **Offline-Bericht**
   - Nach erfolgreichem Login wird die vergangene Offline-Zeit genannt.
   - Der Bericht zeigt ausschließlich aus dem Save berechnete Werte: Gold, Materialien und belegte Speicherplätze.
   - Zusätzlich wird der gesamte aktuell abholbare Kampfspeicher angezeigt.
   - Der Spieler kann alles sofort einsammeln oder ohne Einsammeln in den Kampf gehen.
3. **Hauptkampfszene**
   - Der automatische 1-gegen-1-Kampf füllt den Bildschirm und ist die eigentliche Hauptansicht.
   - Es gibt kein äußeres Dashboard um den Kampf.
   - Zonenwahl, Ressourcen, Profil und Bereichsnavigation liegen als ruhiger Rahmen direkt über der Kampfwelt.
   - Kampfspeicher, Duo-Bonus, Storyziel, Prestige, Frontwechsel und Kampflog sind im Standardzustand geschlossen. Eine kompakte Rand-Leiste öffnet immer nur genau ein Overlay.
   - Der Fokusmodus blendet auch den Rahmen aus und lässt nur Monster, Lebensleisten und den Rückkehrknopf sichtbar.
4. **Unterbereiche**
   - Monster, Brutstation, Inventar, Forschung, Gilde und Profil sind Unterseiten.
   - Jeder Unterbereich führt über „Kampf“ wieder in die Hauptszene zurück.

## Neue Accounts

Besitzt ein Account noch kein Monster, öffnet sich nach dem Login zuerst die Starterwahl. Nach der Wahl folgt derselbe Offline-Bericht und anschließend die Hauptkampfszene. So bleibt die Reihenfolge für bestehende und neue Accounts nachvollziehbar.

## Backend-Schnittstellen

Die spätere Online-Version benötigt für diesen Ablauf drei getrennte Antworten:

- `POST /api/auth/login` erstellt später die Cookie-Session und liefert die Account-Identität.
- `GET /api/game/state` ist bereits im Client vorbereitet und liefert Spielstand, Session, Feature-Flags und die serverberechnete Offline-Zusammenfassung.
- `POST /api/game/commands` bestätigt `cache.claim` wie alle Spielaktionen mit Command-ID und erwarteter Revision idempotent auf dem Server.

Die UI darf Offline-Belohnungen anzeigen, aber im Onlinebetrieb niemals selbst erzeugen. Kampfzeit, Speicherkapazität, Drops und Inventartransfer werden dann ausschließlich serverseitig berechnet.

## Gestaltungsregel

Neue Funktionen dürfen die Hauptszene nicht wieder verkleinern. Ein neues Kernsystem erhält entweder:

- einen kleinen HUD-Einstieg innerhalb der Kampfszene,
- einen Dialog über der Szene oder
- eine eigene Unterseite.

Die Monster und der Gegner bleiben stets die visuell größten interaktiven Elemente der Hauptansicht.

Sekundäre Informationen dürfen nicht gleichzeitig dauerhaft sichtbar sein. Neue Kampf-HUD-Funktionen werden als zusätzlicher Rand-Button ergänzt und teilen sich den bestehenden Overlay-Platz.
