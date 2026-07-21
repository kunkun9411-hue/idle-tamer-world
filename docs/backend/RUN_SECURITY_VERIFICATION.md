# Block 5 – Run- und Wirtschaftsprüfung

- Stand: 21. Juli 2026
- Ergebnis: Schritte 1 bis 3 erfüllt; Spielerabnahme in Schritt 4 offen
- Umgebungen: lokale Verträge, isolierte PostgreSQL-18-Datenbank und echte Dev-Domain

## Nachgewiesene Schutzgrenzen

| Fall | Nachweis |
| --- | --- |
| Clientzeit | `issuedAt` wird nur auf gültiges Format geprüft. Kämpfe entstehen ausschließlich aus PostgreSQL-Zustand und Serverzeit. |
| Manipulierte Belohnung | Zusätzliche Felder wie Gold, Siege oder Gegnerwerte werden am API-Rand verworfen und ändern das Ergebnis nicht. |
| Offline-Nachholung | Selbst 24 Stunden Rückstand füllen höchstens 90 Speicherplätze. Wiederholtes Lesen erzeugt bei vollem Speicher keine weiteren Belohnungen. |
| Doppelclaim | Zwei identische parallele Claims liefern Original und Replay, aber nur eine Ledgerbuchung. |
| Revisionsrennen | Von zwei verschiedenen Kommandos auf derselben Revision kann nur eines erfolgreich sein. |
| Rollback | Leerer Zweitclaim, falsches Monster und gesperrte Zone hinterlassen weder Teilbuchung noch halbes Kommando. |
| Negative Bestände | SQL-Constraints und die bedingte Ledgerbuchung verhindern einen Goldbestand unter null. |
| Große Zahlen | Ein 60-stelliger Goldbestand bleibt in `numeric(78,0)`, Ledger und JSON-String bitgenau erhalten. |
| Langlauf | Ein vollständiger autoritativer Run schaltet nach 90 serverberechneten Siegen die Prestige-Grenze Zone 10 frei. |
| HTTP-Schutz | Session, Produktions-Origin, JSON, CSRF und Rate-Limit greifen vor der Run-Transaktion. |

## Testbilanz

- 84 lokale Unit-, Vertrags- und Browsertests in `pnpm check:all`
- 22 Fälle auf einer frisch migrierten PostgreSQL-18-Datenbank
  - 4 Fundament- und Ledgerfälle
  - 7 Auth-Store-Fälle
  - 6 Run-Store-Fälle
  - 5 vollständige Auth-/Run-HTTP-Fälle
- Migration `000003` vorwärts, rückwärts und erneut vorwärts geprüft
- zwölf reguläre Chromium-Abläufe für Kernloop, Desktop, Tablet, Mobil und Tastatur
- ein zusätzlicher Live-Lauf über Caddy, HTTPS, Fastify und PostgreSQL mit zwei isolierten Browserkontexten

## Live-Ablauf

Der Live-Test verwendet einen kurzlebigen, verifizierten QA-Account aus der privaten Alpha-Outbox:

1. Browser A meldet sich an und wählt Pyrook.
2. Die Einführung wird beendet und Pyrook über die sichtbare Monsteransicht auf Run-Level 2 erhöht.
3. `GET /api/v1/run` bestätigt das Level serverseitig.
4. Browser B meldet sich mit einer eigenen Session an und sieht denselben Starter und dasselbe Run-Level.
5. Browser A widerruft die andere Session; Browser B fällt auf Login zurück.
6. Löschvormerkung, erneute Anmeldung, Abbruch und Logout funktionieren weiterhin mit dem neuen Wirtschaftsstand.

Der Test deckte zwei Test-Race-Conditions auf: Die Monsteransicht musste nach dem neuen Tutorial explizit geöffnet werden, und nach einem Reload musste der Login auf den abgeschlossenen Bootstrap warten, bevor Formularfelder gefüllt werden. Beide Abläufe sind jetzt über sichtbare, spielernahe Zustände synchronisiert.

Nach dem grünen Lauf wurden QA-Account, Run, Reward-Batches, Ledgerzeilen, Kommandos und private Mailboxeinträge entfernt. Die isolierte Testdatenbank wurde ebenfalls gelöscht.

## Offene Spielerabnahme

Schritt 4 ist absichtlich nicht automatisch abgehakt. Dort werden Lesbarkeit und Gefühl des echten Hauptkampfs, Kampfspeicher, Revisionskonflikt und Supportsicht gemeinsam aus Spielersicht bewertet. Die technische Grundlage für diese Abnahme ist live.
