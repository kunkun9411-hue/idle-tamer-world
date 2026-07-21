# Block 4 – Sicherheits- und Zwei-Browser-Prüfung

- Stand: 21. Juli 2026
- Geprüfter Implementierungscommit: `86020a2`
- Ergebnis: Schritt 3 erfüllt, Schritt 4 aktiv
- Umgebung: isolierte PostgreSQL-18-Testdatenbank plus `https://idle-tamer-world.de`

## Nachgewiesene Schutzgrenzen

| Bereich | Nachweis |
| --- | --- |
| Login-Missbrauch | Progressive Verzögerung von 250 bis 1500 ms zählt nur Fehlversuche; der elfte Request derselben Identitäts-/Netzwerkkombination liefert 429 mit `Retry-After`. |
| Reset-Token | Die ersten fünf falschen Prüfungen bleiben einheitlich; die sechste wird mit 429 blockiert. Roh-Token und interne Zähler erscheinen nicht in der Antwort. |
| API-Limits | Authentifizierte Sessions werden bei Request 121 pro Minute und Accountkommandos bei Request 31 pro Minute abgewiesen. |
| Enumeration | Passwort-Vergessen antwortet für vorhandene und unbekannte Adressen mit demselben 202-Vertrag. |
| Session-Fixation | Reauthentifizierung erzeugt Cookie, Session-ID und CSRF neu; altes Cookie und alter CSRF-Token funktionieren danach nicht mehr. |
| Ablauf und Sperre | Abgelaufene Sessions werden als `expired` widerrufen; ein gesperrter Account kann keine neue Session erhalten. |
| Passwortreset | Ein erfolgreicher Reset verbraucht den Token genau einmal und widerruft alle vorherigen Sessions. |
| Parallelität | PostgreSQL zählt parallele Limitversuche atomar; doppelte E-Mail oder doppelter Tamer-Name hinterlassen keinen halben Account. |
| Cookie und Browsergrenze | `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, kein `Domain`; fremde Origin, fehlendes JSON und falscher CSRF werden abgewiesen. |
| Produktionskonfiguration | Produktion startet nicht mit HTTP-Origin oder dem lokalen Standard-HMAC-Secret. |

## Zwei echte Browserkontexte

Der Live-Test legt einen verifizierten synthetischen Account über die private Dev-Mailoutbox an und öffnet zwei voneinander isolierte Chromium-Kontexte:

1. Browser A meldet sich an und wählt Pyrook.
2. Browser B meldet sich separat an.
3. Beide Browser erhalten dieselbe Benutzer-ID, Profil-ID, Revision, Starterwahl und denselben lokalen Account-Namespace, aber unterschiedliche Session-IDs.
4. Browser A sieht beide Gerätesitzungen und widerruft alle anderen.
5. Browser B fällt beim Reload auf den Login zurück; Browser A bleibt im Kampf.
6. Der synthetische QA-Account wird anschließend vollständig aus der Dev-Datenbank entfernt.

Der Ablauf liegt als opt-in Test in `apps/web/e2e/live-auth.spec.ts`. Er läuft nur mit explizit gesetzter Live-Domain und kurzlebigen QA-Zugangsdaten; normale CI-Läufe überspringen ihn, statt feste Zugangsdaten im Repository zu speichern.

## Gefundener und behobener Fehler

Der erste Live-Lauf erreichte den Server trotz funktionierender API nicht. Ursache war die Speicherung des nativen Browser-`fetch` als Klassenfeld und der spätere Methodenaufruf mit `AccountClient` als falschem Empfänger. Chromium brach vor dem Netzwerkrequest ab, während die Node-Testdoubles grün blieben.

Der Client kapselt `fetch` nun in einer empfängerlosen Funktion. Ein eigener Regressionstest prüft diese Aufrufsemantik; der anschließende Live-Lauf mit zwei Browsern ist grün.

## Testbilanz

- 73 Unit- und Vertragstests
- 10 Datenbank- und Auth-Store-Fälle auf einem frisch migrierten PostgreSQL 18
- 4 vollständige Auth-HTTP-Lebenszyklen auf derselben isolierten Datenbank
- 12 reguläre Chromium-Abläufe für Desktop, Tablet, Mobil, Tastatur und Kernloop
- 1 zusätzlicher Zwei-Browser-Livetest über Caddy, HTTPS, Fastify und PostgreSQL

Temporäre Testdatenbank, Docker-Testimage, Arbeitskopie und Live-QA-Account wurden nach der Prüfung entfernt.

## Offenes Abnahmegate

Schritt 4 prüft den gesamten Accountfluss noch einmal aus Spielersicht, gibt ihn frei und klärt eine minimale schreibgeschützte Supportsicht. Der serverautoritative Run und die Wirtschaft beginnen weiterhin erst in Block 5.
