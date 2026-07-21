# Block 7 – Gilden- und Sozialabnahme

Stand: 22. Juli 2026

## Ergebnis

Gilden sind keine lokale Vorschau mehr. Mitgliedschaft, Rollen, persönliche DNA, Gilden-DNA, Gene, Aufgaben, Boss, Expedition, Abstimmungen, Freundschaften, Blockierungen, Meldungen und Chat liegen in PostgreSQL und laufen über Sozialvertrag 1.

## Spielerregeln

- Eine Gilde besitzt 2 bis 100 Plätze; die Alpha startet mit 30.
- Rollen: Leitung, Offizier, Mitglied.
- Nur die Leitung ändert Beitrittspolitik, Rollen und Leitung.
- Leitung und Offiziere laden ein, entfernen zulässige Mitglieder, starten Expeditionen und investieren direkt in Gene.
- Jedes Mitglied kann eine 24-stündige DNA-Abstimmung starten und abstimmen.
- Eine Abstimmung gilt nur bei echter Mehrheit aller aktuellen Mitglieder als angenommen.
- Austritt und Entfernung erzeugen 24 Stunden Wechselsperre.
- Einladungen laufen nach sieben Tagen ab und umgehen weder Limit noch Wechselsperre.

## Gemeinsamer Loop

1. Kämpfe, Schlupf und persönliche Expeditionen erhöhen skalierte Tagesziele.
2. Ein fertiges Ziel zahlt einmal Gilden-DNA und eine kleine persönliche Anerkennung.
3. Mitglieder spenden persönliche DNA; jede Buchung landet im append-only Gilden-Ledger.
4. Leitung/Offiziere oder eine angenommene Abstimmung verbessern ein Gen.
5. Jedes Mitglied greift den Wochenboss mit eigenem 30-Sekunden-Cooldown an.
6. Eine gemeinsame Fünf-Minuten-Expedition pro Tag zahlt einmal direkt ins Ledger.

## Gilden-DNA und Power-Grenze

Chromosom 01 hat sechs Gene. Seine Maximalboni bleiben bewusst klein:

| Gen | Maximum |
| --- | ---: |
| Gold | +2,5 % |
| Gildenboss-Schaden | +5 % |
| Fragmentfortschritt | +2 % |
| Expedition | +2,8 % |
| Forschung | +1,2 % |
| Brutzeitverkürzung | 1,5 % |

Ziel- und Bosswerte wachsen mit der Quadratwurzel der Mitgliederzahl. Eine 30er-Gilde erhält dadurch keinen zehnfachen linearen Vorteil gegenüber drei Mitgliedern. Spätere Chromosomen sollen Komfort und Spezialisierung statt unbegrenzter Kampfkraft liefern.

## Sozial- und Moderationsregeln

- Freundschaftsanfragen sind anhand des exakten Tamer-Namens möglich.
- Blockieren entfernt eine Freundschaft, verhindert neue Kontakte und blendet Chatnachrichten aus.
- Chat ist auf 280 Zeichen begrenzt, rate-limited und filtert Links sowie Flooding.
- Spieler- und konkrete Nachrichtenmeldungen erzeugen keine automatische Strafe.
- Moderatoren sehen eine getrennte Warteschlange und können verwarnen, 24 Stunden stummschalten, eine gemeldete Nachricht entfernen, einen Account sperren oder die Meldung verwerfen.
- Jede Entscheidung landet unveränderlich in `moderation_actions`; Wirtschaft und Gilden-Ledger bleiben davon getrennt sichtbar.

## Technische Prüfnachweise

Sieben echte PostgreSQL-18-Integrationsfälle decken ab:

- Erstellen, idempotentes Replay, Beitritt, Leitungsübergabe und Wechselsperre
- parallele DNA-Ausgaben mit genau einer erfolgreichen Buchung
- Einladungen, Mehrheitsabstimmung und Rollenverbote
- genau einmalige Tagesziel- und Expeditionsclaims
- parallele Bossangriffe verschiedener Mitglieder und Cooldown
- Chatfilter, Freundschaft, Blockierung und Meldung
- interne Rollen, Content-Audit, Moderationswarnung und Stummschaltung

Zusätzliche Unit-Tests prüfen Eingabevalidierung, Social-Revision, Client-CSRF, Größenvergleich und maximale Genboni.

## Endpunkte

- `GET /api/v1/guild`
- `POST /api/v1/guild/commands`
- `GET /api/v1/internal/moderation/reports`
- `POST /api/v1/internal/moderation/reports/:reportId/actions`
- `GET /api/v1/internal/guilds/:guildId/ledger`

Alle Spieleränderungen sind revisioniert und idempotent. Alle internen Änderungen sind zusätzlich rollen-, Origin-, CSRF- und Rate-Limit-geschützt.

