# Block 4 – Accountabnahme der geschlossenen Alpha

- Stand: 21. Juli 2026
- Implementierungscommit: `02c5d4c`
- Ergebnis: Block 4 abgenommen, Block 5 planungsbereit
- Freigabeumfang: geschlossene Alpha auf dem Entwicklungsserver

## Abnahmeergebnis

| Kriterium | Live-Nachweis |
| --- | --- |
| Neuer Account | Registrierung antwortet 202, die private Alpha-Mailbox enthält genau den Verifikationslink und die Bestätigung antwortet 204. |
| Echter Spieler | Ein realer Testeraccount wurde bestätigt, erfolgreich eingeloggt und erreichte Profil sowie Starterzustand. Personenbezogene Einzelwerte werden nicht in diesem Dokument festgehalten. |
| Starterpersistenz | Browser A wählt den Starter; Browser B erhält dieselbe Benutzer-ID, Profil-ID, Revision, Starterwahl und denselben Account-Namespace. |
| Sitzungswiderruf | Browser A widerruft alle anderen Sitzungen. Browser B fällt auf den Login zurück, während A aktiv bleibt. |
| Löschabbruch | Der QA-Account wird zur Löschung vorgemerkt, eingeschränkt erneut angemeldet und über die sichtbare Abbruchaktion wieder aktiviert. |
| Logout | Der abschließende Logout widerruft die aktuelle Sitzung und führt nach dem Reload zuverlässig zum Login. |
| Support | Die serverinterne Supportabfrage erkennt Accountstatus, Profil, Starter und Sitzungen, kann aber keine Werte schreiben. |
| Aufräumen | Synthetischer QA-Account und zugehöriger Mailboxeintrag wurden nach dem Lauf vollständig entfernt. |

## Nur-Lese-Supportsicht

`packages/database/src/support-account-report.ts` ist die einzige Supportabfrage dieses Blocks. Sie besitzt folgende Grenzen:

- nur serverintern, kein öffentlicher API-Endpunkt;
- exakte Suche nach E-Mail oder Benutzer-ID statt unscharfer Spielersuche;
- `BEGIN TRANSACTION READ ONLY` und zusätzlich `default_transaction_read_only=on` im CLI-Prozess;
- Fünf-Sekunden-Abbruchgrenze;
- maskierte E-Mail;
- keine Passwort-, Token-, Cookie-, CSRF-, Netzwerk- oder vollständigen User-Agent-Werte;
- keine Änderungs-, Widerrufs-, Freischalt- oder Wirtschaftsaktion.

Der operative Aufruf steht in `DEV_SERVER.md`. Damit kann Support einen gemeldeten Zustand nachvollziehen, aber nicht heimlich Gold, Starter, Rollen oder Sitzungen verändern.

## Testbilanz

- 76 lokale Unit- und Vertragstests;
- 11 Datenbank- und Auth-Store-Fälle auf einer frisch migrierten isolierten PostgreSQL-18-Datenbank;
- 4 vollständige Auth-HTTP-Lebenszyklen auf derselben isolierten Datenbank;
- 12 reguläre Chromium-Abläufe;
- 1 erweiterter Live-Ablauf mit zwei getrennten Chromium-Kontexten über Caddy, HTTPS, Fastify und PostgreSQL.

Die kurzlebige Testdatenbank, der synthetische Account und sein Mailboxeintrag wurden nach der Prüfung entfernt. Der Entwicklungsserver und das Git-Repository blieben sauber.

## Bewusste Alpha-Grenze

Die Dev-Domain versendet noch keine externe E-Mail. Verifikation und Passwortreset landen in einer privaten, serverinternen Alpha-Mailbox. Die Registrierungsoberfläche weist jetzt ausdrücklich darauf hin, dass das Testteam den Zugang in dieser Phase bestätigt.

Das ist für eine kleine geschlossene Alpha freigegeben, aber nicht für eine öffentliche Beta. Vor einer öffentlichen Einladung werden ein Transaktionsmail-Anbieter, SPF, DKIM, DMARC, Bounce-/Complaint-Behandlung und eine Zustellbarkeitsprüfung verpflichtend.

## Freigabeentscheidung

Block 4 erfüllt sein Gate: Identität, Sitzungen, Profil und Starter funktionieren online und geräteübergreifend. Block 5 darf deshalb mit dem serverautoritativen Run- und Wirtschaftsmodell beginnen. Der Client beschreibt weiterhin ehrlich, dass Run, Gold, Drops, Inventar, Brut und Dauerfortschritt noch lokal sind.
