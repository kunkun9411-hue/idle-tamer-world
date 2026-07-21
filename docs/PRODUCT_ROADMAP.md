# Idle Tamer – Arbeitsroadmap

- Stand: 21. Juli 2026
- Aktiver Block: **Block 5 – Serverautoritärer Run und Wirtschaft**
- Aktiver Schritt: **Schritt 1 – Planen**
- Visuelle Statusseite: `/roadmap/`
- Statusdaten: `apps/web/public/roadmap/roadmap-status.json`

## Version-0.2-Stabilisierung

Vor Block 4 wurde ein Qualitätscheckpoint eingeschoben: Die Kampfszene lädt nicht mehr fortlaufend ihren vollständigen DOM neu, Erstklicks sind stabil, frische Accounts starten nach der Starterwahl direkt im Kampf und der reale Zonenpfad reicht nun bis Zone 10. Lokale QA-Presets beschleunigen die Abnahme, sind im Produktionsbuild aber deaktiviert. Der Roadmap-Zähler bleibt bewusst bei 12/32, weil kein Backend-Gate vorgezogen wurde. Details: `VERSION_0_2_STABILIZATION.md`.

Die bestätigte Content-Richtung umfasst 40 sammelbare Rookie-Linien: zehn vorhandene plus die 30 derzeitigen Normalgegner-Designs. Die fünf Bosse bleiben separat. Diese Migration wird vor dem serverautoritativen Besitz- und Eiermodell eingeplant.

Die acht Blöcke bilden nur den ersten Entwicklungszyklus der Version-0.2-/Alpha-Grundlage. Danach folgen weitere Zyklen für Beta, Gamma, Beta Release und schließlich Launch 1.0. Die angezeigten 50 % beziehen sich deshalb auf den aktuellen 32-Gate-Zyklus, nicht auf das gesamte Projekt bis 1.0. Details: `RELEASE_LIFECYCLE.md`.

## Arbeitsmodell: 8 Blöcke × 4 Schritte

Idle Tamer wird in acht aufeinander aufbauenden Hauptblöcken entwickelt. Jeder Block durchläuft immer dieselben vier Arbeitsgates:

1. **Planen** – Regeln, Daten, Oberfläche und Abnahmekriterien festlegen.
2. **Bauen** – den Block als vollständige, nutzbare Funktion implementieren.
3. **Prüfen** – automatisierte Tests, Missbrauchsfälle, Geräte und Migrationen prüfen.
4. **Abnehmen** – Ergebnis im echten Ablauf testen, dokumentieren, committen und freigeben.

Die vier Schritte sind keine gleich langen Zeitabschnitte. Sie sind Qualitätsgates. Ein Bauschritt kann deutlich größer sein als die Planung; abgehakt wird erst, wenn seine Definition of Done erfüllt ist.

```mermaid
flowchart LR
    A["1. Planen"] --> B["2. Bauen"]
    B --> C["3. Prüfen"]
    C --> D["4. Abnehmen"]
    D --> E["Nächster Hauptblock"]
```

## Fortschrittsübersicht

| Block | Ergebnis | 1 Planen | 2 Bauen | 3 Prüfen | 4 Abnehmen | Status |
| --- | --- | :---: | :---: | :---: | :---: | --- |
| 1 | Lokale spielbare Grundversion | [x] | [x] | [x] | [x] | **Fertig** |
| 2 | Backend-bereiter, abgenommener Client | [x] | [x] | [x] | [x] | **Fertig** |
| 3 | API- und PostgreSQL-Fundament | [x] | [x] | [x] | [x] | **Fertig** |
| 4 | Accounts, Sessions und Bootstrap | [x] | [x] | [x] | [x] | **Fertig** |
| 5 | Serverautoritärer Run und Wirtschaft | [ ] | [ ] | [ ] | [ ] | **Aktiv** |
| 6 | Sammlung, Dauerfortschritt und Zeitjobs online | [ ] | [ ] | [ ] | [ ] | Geplant |
| 7 | Gilden, Gilden-DNA und soziale Systeme | [ ] | [ ] | [ ] | [ ] | Geplant |
| 8 | PvP, Handel und Live-Ops-Grundlage | [ ] | [ ] | [ ] | [ ] | Geplant |

Gesamtfortschritt: **16 von 32 Schritten abgeschlossen (50 %)**.

## Verbindliche Arbeitsregeln

- Es ist immer nur ein Hauptblock aktiv.
- Innerhalb des aktiven Blocks wird Planen → Bauen → Prüfen → Abnehmen eingehalten.
- Unteraufgaben dürfen parallel bearbeitet werden, solange sie dasselbe aktive Gate unterstützen.
- Neue Ideen werden dem passenden späteren Block zugeordnet und unterbrechen den aktiven Block nicht.
- Kritische Bugs dürfen sofort behoben werden; neue Großfunktionen nicht.
- Ein Schritt wird nur abgehakt, wenn Code, Tests und Dokumentation denselben Stand beschreiben.
- Nach jeder Abnahme ist der Git-Arbeitsbaum sauber und der geprüfte Stand auf GitHub gesichert.
- Wenn ein Block zu groß wird, werden seine Unteraufgaben feiner geteilt; die acht Hauptblöcke bleiben stabil.

---

## Block 1 – Lokale spielbare Grundversion

**Ergebnis:** Ein verständliches, testbares Solo-Spiel mit vollständigem Kernloop und ohne vorgetäuschte Online-Funktionen.

### Schritt 1 – Planen ✅

- [x] Spielziel, Kernloop und Prestige-Grenzen festgelegt
- [x] zehn Starterlinien, 30 Gegner, fünf Bosse und drei Zonen geplant
- [x] Gold-, Ei-, Fragment-, Gem- und Forschungsökonomie beschrieben
- [x] Silber-Violett-UI und HD-200×200-Assetstil festgelegt

### Schritt 2 – Bauen ✅

- [x] Login-Vorschau, Offline-Bericht und Starterwahl
- [x] automatischer 1-gegen-1-Kampf, Teamwahl und Zonenboni
- [x] Run-Level, Kampfspeicher, Eier, Brut und Fragmentkreislauf
- [x] Hyperlevel, Evolution, Gems, Forschung und Prestige
- [x] Ziele, Erfolge, Expeditionen, Herstellung, Story und Systempost
- [x] Avatare, Rahmen, Einstellungen sowie Desktop- und Mobiloberfläche

### Schritt 3 – Prüfen ✅

- [x] 30 automatisierte Regel-, Wirtschafts-, API- und Migrationstests
- [x] Offline-Grenze, Reload-Schutz und Einmal-Claims geprüft
- [x] Produktionsbuild erfolgreich
- [x] zehn Monster, 30 Gegner, fünf Bosse, drei Zonen und 45 Gems validiert

### Schritt 4 – Abnehmen ✅

- [x] Pre-Backend-Abnahme dokumentiert
- [x] vollständiger Quellcode samt Runtime-Assets und HD-Mastern strukturiert
- [x] Git-Ausgangsstand ohne Secrets oder große Einzeldateien geprüft
- [x] geprüfte Grundversion auf GitHub gesichert

**Gate erfüllt:** Block 1 ist abgeschlossen und wird nur noch für Fehlerkorrekturen geöffnet.

---

## Block 2 – Backend-bereiter Client

**Ergebnis:** Die sichtbare Grundversion und ihre Regeln sind abgenommen. Der Browser kann später vom lokalen Service auf die HTTP-API wechseln, ohne dass die UI neu gebaut werden muss.

### Schritt 1 – Planen ✅

- [x] ersten Spielbogen für Stunde 1, Tag 1 und Woche 1 verbindlich festlegen
- [x] Kostenkurven für Run-Level, Hyperlevel, Evolution und Forschung abnehmen
- [x] Dropchancen, Pity, Brutzeiten, Fragmente und Prestige-Ertrag einfrieren
- [x] sämtliche Resetgrenzen in einer einzigen Regeltabelle zusammenführen
- [x] vollständigen Spielerablauf Login → Offline → Kampf → Brut → Prestige als Abnahmefall schreiben
- [x] Lade-, Fehler-, Konflikt-, Leer-, Voll- und Maximalzustände je Szene erfassen

**Definition of Done:** Es gibt keine ungeklärte Spielregel, die während des Backendbaus Tabellen oder API-Kommandos verändern würde.

Abgenommen in `GAMEPLAY_FOUNDATION_SPEC.md`: Zielkorridore, Foundation-1.0-Werte, Umsetzungsdeltas, vollständige Prestige-Matrix, 24-Schritte-E2E-Ablauf und UI-Zustandsinventar.

### Schritt 2 – Bauen ✅

- [x] Browser-E2E-Test für den vollständigen Spielerablauf eingebaut
- [x] gemeinsame asynchrone Intent-Schnittstelle für lokalen und HTTP-Spielservice festgezogen
- [x] Offline-Regel, Uhr und Speicherung von DOM, Browserzeit und `localStorage` entkoppelt
- [x] Content-, API-, Fehlercode- und Asset-Verträge eindeutig versioniert
- [x] einheitliche Verbindungs-, Lade- und Revisionskonflikt-UI umgesetzt
- [x] Asset-Manifest und PixelLab-Animationsvertrag für 200×200-Monster ergänzt

**Definition of Done erfüllt:** Foundation-1.0-Werte sind aktiv, 96 Runtime-Bilder besitzen eindeutige IDs und Prüfsummen, und der Browserpfad Login → Offline → Kampf → Brut → Fragmente → Hyperlevel → Evolution → Gem → Prestige läuft automatisiert durch.

### Schritt 3 – Prüfen ✅

- [x] vollständigen Ablauf auf Desktop, Tablet und 390×844 prüfen
- [x] Tastaturbedienung, Kontrast und reduzierte Bewegung testen
- [x] Vertragsprüfungen für lokalen und späteren HTTP-Service ausführen
- [x] Content-IDs, Asset-IDs, Abmessungen und Dateigrößen automatisiert validieren
- [x] Parallel-Tab-, Reload- und veraltete-Revision-Fälle simulieren
- [x] CI für Test, Build, Content und Assets aktivieren

**Definition of Done erfüllt:** Nach dem Version-0.2-Stabilisierungscheckpoint sind 48 Regel-, Content- und Service-Vertragstests sowie zwölf echte Chromium-Abläufe grün. Desktop, Tablet und 390×844 bleiben ohne horizontales Überlaufen bedienbar; Fokusfang, AA-Kontrast, Reduced Motion, Reload-Schutz, veraltete Revisionen, parallele Tabs, DOM-stabile Kampfsteuerung und die Zone-10-Prestigesperre sind automatisiert abgesichert. Die GitHub-CI prüft Tests, Build, Roadmap, alle Assetverträge und den sichtbaren Kernloop.

### Schritt 4 – Abnehmen ✅

- [x] manuellen ersten Spielbogen ohne Blocker abschließen
- [x] automatischen E2E-Kernloop erfolgreich ausführen
- [x] Balance- und Resetregeln als verbindlich markieren
- [x] Backend-API-Vertrag versionieren und freigeben
- [x] Dokumentation, Tests und GitHub-Stand synchronisieren

**Gate erfüllt:** Der erste Spielbogen wurde im echten Browser auf Desktop und 390×844 ohne Blocker abgenommen. `API_CONTRACT_V8.md` friert die Backendgrenze ein: Kein Spielkommando akzeptiert resultierende Bestände vom Client; die UI kennt ausschließlich Absichten und autoritative Antworten. Die vollständige Qualitätsschranke und der GitHub-Stand sind synchron.

---

## Block 3 – API- und PostgreSQL-Fundament

**Ergebnis:** Ein deploybares technisches Backend mit echter PostgreSQL-Datenbank, Migrationen, Logs und sicheren Transaktionsmustern.

### Schritt 1 – Planen ✅

- [x] Zielstruktur für `apps/web`, `apps/api` und gemeinsame Pakete festlegen
- [x] Node/TypeScript-API, PostgreSQL-Zugriff und Migrationstechnik auswählen
- [x] Tabellen, Schlüssel, Indizes, Revisionen und Ledger gegen den Blueprint prüfen
- [x] Entwicklungs-, Test- und Produktionsumgebungen definieren
- [x] Backup-, Wiederherstellungs- und Rollbackstrategie beschreiben

**Gate erfüllt:** `docs/backend` friert Node 24 LTS, Fastify 5, PostgreSQL 18, `pg`, `node-pg-migrate`, den inkrementellen Workspace-Umzug, kanonische SQL-Namen, Revisions-/Idempotenzmuster, Umgebungen sowie Backup und Restore ein. PostgreSQL bleibt die verbindliche Wahrheitsquelle; kritische Regeln existieren nicht nur in TypeScript.

### Schritt 2 – Bauen ✅

- [x] Workspace in Web-, API-, Vertrags-, Content- und Datenbankpakete gliedern
- [x] lokale PostgreSQL-Instanz und isolierte Testdatenbank bereitstellen
- [x] erste versionierte Migrationen und Seed-Daten erstellen
- [x] Healthcheck, strukturierte Logs, Request-ID und einheitliche Fehlerantworten
- [x] Transaktionshelfer für `commandId`, `expectedRevision` und Ledger einbauen
- [x] Content-Version und Feature-Flag-Grundlage speichern

**Gate erfüllt:** Fastify und PostgreSQL 18 sind als reproduzierbarer Workspace-Unterbau vorhanden. GitHub Actions hat Migration, echte SQL-Constraints, parallele Idempotenz, Revision, Ledger, Builds, Assets und Browserpfade erfolgreich ausgeführt.

### Schritt 3 – Prüfen ✅

- [x] Migration von leerer Datenbank bis aktuellem Schema testen
- [x] echte PostgreSQL-Integrationstests ausführen
- [x] negative Bestände per `CHECK` und bedingter Aktualisierung verhindern
- [x] parallele Kommandos, Rollback und wiederholte Requests testen
- [x] Backup in eine leere Datenbank zurückspielen
- [x] Logs und Fehler enthalten keine Passwörter, Cookies oder privaten Daten

**Gate erfüllt:** PostgreSQL 18 migriert in CI vorwärts, rückwärts und erneut vorwärts. Vier echte Integrationstests beweisen Constraints, parallele Idempotenz, Konflikte und vollständigen Rollback. Ein Custom-Format-Dump wird in eine neue Datenbank restauriert und dort durch Healthcheck, Beispielbuchung, Revision und Ledger geprüft. Der reale JSON-Logger redigiert Auth-Header, Cookies, Token, Passwörter und E-Mail-Felder.

### Schritt 4 – Abnehmen ✅

- [x] API und Datenbank reproduzierbar auf dem Entwicklungsserver starten
- [x] Testumgebung automatisch aufbauen und migrieren
- [x] Healthcheck, Seed, Transaktionsmuster und Ledger im echten Lauf prüfen
- [x] Architektur- und Betriebsdokumentation aktualisieren
- [x] geprüften Fundamentstand sichern

**Gate erfüllt:** Ubuntu 26.04 startet Docker Engine und PostgreSQL 18 nach einem echten Serverneustart automatisch. Migration, Seed, acht Fundamenttabellen, aktiver Content-Release, internes Datenbank-Binding, SSH-Schlüsselzugang, Firewall, täglicher Backup-Timer und ein lesbarer Initial-Dump wurden geprüft. CI beweist ergänzend Idempotenz, Revision, Ledger, Rollback und Restore. Der Server kann noch wenig Spielinhalt, aber jede vorhandene Schreibaktion ist bereits atomar, idempotent und beobachtbar.

---

## Block 4 – Accounts, Sessions und Bootstrap

**Ergebnis:** Ein Spieler kann einen echten Account erstellen, sich sicher anmelden und dasselbe serverautoritative Profil samt Starterwahl auf einem zweiten Browser laden. Die übrigen Spielbereiche werden erst in ihren eigenen Blöcken online autoritativ.

### Schritt 1 – Planen ✅

- [x] Registrierungs-, Login-, Logout- und Wiederherstellungsablauf festlegen
- [x] Sessiondauer, Geräteverwaltung und Widerruf definieren
- [x] Spielername, Avatar, Rahmen und Accountstatus modellieren
- [x] Bootstrap-DTO und Fehlerzustände festziehen
- [x] Datenschutz-, Export- und Löschanforderungen dokumentieren

**Gate erfüllt:** `backend/BLOCK4_AUTH_PLAN.md` legt Accountzustände, Argon2id, Cookie- und CSRF-Regeln, konkrete Sessionfristen, Gerätewiderruf, Enumeration- und Rate-Limit-Schutz, Recovery, Rollen, Profil, Starterwahl, Export und Löschung fest. `backend/AUTH_API_CONTRACT.md` definiert Auth-Vertrag 1 und `backend/AUTH_SCHEMA_PLAN.md` die additive Migration 000002. Block 4 synchronisiert bewusst nur Account, Profil und Starter; die UI kennzeichnet den übrigen Spielstand bis Block 5 und 6 weiterhin als lokal.

### Schritt 2 – Bauen ✅

- [x] Benutzer, Zugangsdaten, Sessions und Profile implementieren
- [x] sichere Passwort-Hashes und HTTP-only Session-Cookies verwenden
- [x] Registrierung, E-Mailbestätigung, Login, Logout, Recovery und Sessionwiderruf umsetzen
- [x] `GET /api/v1/bootstrap` als ehrlichen Account-Bootstrap mit Autoritätsmatrix bauen
- [x] Starterwahl als erstes echtes idempotentes Spielkommando migrieren
- [x] Rollenbasis für Spieler, Support, Moderator und Admin einführen
- [x] Export- und Löschanforderung samt Retentionjob umsetzen
- [x] Account-Client anbinden und lokale Saves strikt nach Account-Namespace trennen

**Definition of Done erfüllt:** Migration `000002_accounts_and_sessions`, Argon2id, gehashte Session-/CSRF-Token, PostgreSQL-Rate-Limits, Mailport, Recovery, Gerätewiderruf, Rollen, Profilkosmetik, idempotente Starterwahl, Exportanforderung und siebentägige Löschfrist sind implementiert. Der Browser nutzt echte Accounts, zeigt die begrenzte Autorität offen an und öffnet lokale Spielstände ausschließlich im serverseitig zugewiesenen Account-Namespace. Details: `backend/AUTH_IMPLEMENTATION.md`.

### Schritt 3 – Prüfen ✅

- [x] Brute-Force-, Rate-Limit- und Session-Fixation-Fälle testen
- [x] abgelaufene, widerrufene und parallele Sessions prüfen
- [x] Account auf zweitem Browser laden und Zustand vergleichen
- [x] doppelte Namen, ungültige Eingaben und gesperrte Accounts testen
- [x] Cookies, CORS, CSRF-Schutz und Produktionskonfiguration prüfen

**Definition of Done erfüllt:** 73 Unit- und Vertragstests, 14 isolierte PostgreSQL-Integrationsfälle, zwölf reguläre Chromium-Abläufe und ein zusätzlicher Live-Ablauf mit zwei getrennten Browserkontexten sind grün. Geprüft sind unter anderem Login- und Reset-Limits, progressive Fehlversuchsverzögerung, CSRF-Rotation, Session-Fixation, Ablauf und Widerruf, gesperrte Accounts, doppelte Namen, Produktions-Cookies und derselbe Starter samt Account-Namespace auf Browser A und B. Der Live-Test deckte außerdem eine falsche Browser-`fetch`-Bindung auf; der behobene Client läuft jetzt über den echten HTTPS-Proxy. Details: `backend/AUTH_SECURITY_VERIFICATION.md`.

### Schritt 4 – Abnehmen ✅

- [x] neuer Account erreicht sicher die Starterwahl
- [x] erneuter Login liefert exakt dasselbe Accountprofil und dieselbe Starterwahl
- [x] Logout und Widerruf beenden die Session zuverlässig
- [x] Support kann Accountstatus nachvollziehen, aber keine Werte heimlich verändern
- [x] Authentifizierungsablauf dokumentieren und freigeben

**Definition of Done erfüllt:** Ein echter Testeraccount wurde registriert, über die private Alpha-Mailbox bestätigt und erfolgreich eingeloggt. Ein separater synthetischer Live-Account durchlief Registrierung, Verifikation, Starterwahl, denselben Zustand in zwei Browsern, Fremdsitzungswiderruf, Löschvormerkung, Löschabbruch und Logout; Account und Mailboxeintrag wurden danach vollständig entfernt. Die serverinterne Supportsicht läuft in einer technisch erzwungenen PostgreSQL-`READ ONLY`-Transaktion, maskiert die E-Mail und gibt weder Credentials noch Token-, Cookie- oder CSRF-Material aus. Block 4 ist für die geschlossene Alpha freigegeben. Externer Mailversand samt SPF, DKIM und DMARC bleibt ein Gate vor der öffentlichen Beta. Details: `backend/AUTH_ACCEPTANCE.md`.

**Gate erfüllt:** Identität und Basiszustand funktionieren online. Besitz- und Wirtschaftsaktionen folgen in Block 5 und 6.

---

## Block 5 – Serverautoritärer Run und Wirtschaft

**Ergebnis:** Kampf, Gold, Level, Zonen und Kampfspeicher werden ausschließlich vom Server berechnet und in PostgreSQL gespeichert.

### Schritt 1 – Planen ⬜

- [ ] serverseitiges Kampftick- und Zeitstempelmodell festlegen
- [ ] Run-, Team-, Zonen- und Kampfspeichertabellen finalisieren
- [ ] Reward-Batches und atomaren Sammelablauf definieren
- [ ] große Zahlen und API-Stringtransport verbindlich festlegen
- [ ] Cheating- und Parallel-Request-Fälle als Testspezifikation schreiben

### Schritt 2 – Bauen ⬜

- [ ] Front, Support, Zone, Stage und Freischaltungen migrieren
- [ ] serverseitige Kampfbewertung und Belohnungserzeugung bauen
- [ ] Kampfspeicher mit serverseitigen Reward-Batches umsetzen
- [ ] Gold, Run-Level und Upgrade-Kosten serverautoritativ machen
- [ ] Sammeln, Leveln und Zonenwahl als Transaktionskommandos migrieren
- [ ] Client für diesen Block auf `HttpGameService` umschalten

### Schritt 3 – Prüfen ⬜

- [ ] Client darf keine Siege, Drops oder resultierenden Bestände festlegen
- [ ] wiederholtes Sammeln und parallele Level-Ups zahlen nicht doppelt
- [ ] negative Goldbestände und ungültige Teamkombinationen verhindern
- [ ] lange Laufzeiten, große Zahlen und Serverneustart simulieren
- [ ] kompletter Run bis zur Prestige-Freischaltung als API-Test

### Schritt 4 – Abnehmen ⬜

- [ ] Kampf läuft nach Reload und auf zweitem Gerät korrekt weiter
- [ ] Gold, Level, Stage und Speicher stimmen zwischen UI und Ledger überein
- [ ] absichtlich veralteter Client erhält einen lösbaren Revisionskonflikt
- [ ] lokaler Save ist für Run-Werte nicht mehr autoritativ
- [ ] Wirtschaftsmetriken und Supportansicht sind verfügbar

**Gate:** Der sichtbare Hauptkampf ist vollständig online und gegen einfache Clientmanipulation abgesichert.

---

## Block 6 – Sammlung, Dauerfortschritt und Zeitjobs

**Ergebnis:** Alle übrigen Solo-Systeme liegen autoritativ auf dem Server. Damit ist die Online-Alpha spielmechanisch vollständig.

### Schritt 1 – Planen ⬜

- [ ] Tabellen und Kommandos für Eier, Monster, Fragmente, Gems und Forschung finalisieren
- [ ] Zeitjobmodell für Brut, Expeditionen und Offline-Ertrag vereinheitlichen
- [ ] Prestige-Transaktion samt Reset- und Erhalteliste festschreiben
- [ ] Ziele, Story, Herstellung, Kosmetik und Systempost als Claims modellieren
- [ ] Content-Veröffentlichung und Admin-Berechtigungen festlegen

### Schritt 2 – Bauen ⬜

- [ ] Eierdrops, Pity, Inkubation, Erstfund und Duplikat-Fragmente migrieren
- [ ] Hyperlevel, Evolution, Gems, Forschung und Prestige migrieren
- [ ] Tages-/Wochenziele, Erfolge, Expeditionen und Herstellung migrieren
- [ ] Story-, Avatar-, Rahmen- und Systempost-Claims migrieren
- [ ] Offline-Ertrag aus Serverzeit und gültiger Content-Version berechnen
- [ ] geschützte Content-, Support- und Admin-Grundwerkzeuge bauen

### Schritt 3 – Prüfen ⬜

- [ ] Zeitmanipulation, Parallel-Tabs und Request-Retries abfangen
- [ ] vollständigen Prestige-Erhalt permanenter Werte prüfen
- [ ] doppelte Claims, doppelte Brut und mehrfach eingesetzte Monster verhindern
- [ ] Quellen und Senken jeder Währung über das Ledger bilanzieren
- [ ] Content-Vorschau, Aktivierung und Rollback testen
- [ ] vollständigen Online-E2E-Kernloop ausführen

### Schritt 4 – Abnehmen ⬜

- [ ] alle Funktionen aus Block 1 arbeiten mit `HttpGameService`
- [ ] `localStorage` enthält nur noch Komfortdaten
- [ ] Offline-Bericht ist serverseitig und einmalig claimbar
- [ ] Support- und Admin-Aktionen sind berechtigt und protokolliert
- [ ] Online-Alpha mit Backup- und Wiederherstellungsprobe freigeben

**Gate:** Die komplette Solo-Version ist online. Erst jetzt beginnen gemeinsame Spielerfunktionen.

---

## Block 7 – Gilden, Gilden-DNA und soziale Systeme

**Ergebnis:** Spieler können sich dauerhaft organisieren, gemeinsam investieren und kooperative Inhalte bestreiten.

### Schritt 1 – Planen ⬜

- [ ] Gildengründung, Mitgliedschaft, Rollen und Wechselregeln finalisieren
- [ ] DNA-Ressource, Chromosomen, Gene, Kostenkurven und Power-Grenzen festlegen
- [ ] Investitionsrechte und Abstimmungsmodell auswählen
- [ ] Gildenboss, Aufgaben, Spenden und Expeditionen spezifizieren
- [ ] Chat-, Freundes-, Blockier- und Moderationsregeln definieren

### Schritt 2 – Bauen ⬜

- [ ] Gilden erstellen, suchen, beitreten, verlassen und verwalten
- [ ] Rollen, Einladungen, Limits, Spenden und Gilden-Ledger umsetzen
- [ ] Gilden-DNA mit Chromosomen, Genstufen und passiven Boni bauen
- [ ] animierte Doppelhelix und sichtbare Mutationen integrieren
- [ ] Gildenaufgaben, Gildenboss und gemeinsame Expeditionen umsetzen
- [ ] Freunde, Gildenchat, Blockieren und Meldungen ergänzen

### Schritt 3 – Prüfen ⬜

- [ ] Berechtigungen jeder Gildenrolle und jedes DNA-Kommandos testen
- [ ] Doppelausgaben, Gildenwechsel und Belohnungs-Hopping verhindern
- [ ] kleine und große Gilden in Simulationen vergleichen
- [ ] DNA-Power-Creep und spätere Komfortgene prüfen
- [ ] Chatfilter, Blockieren, Meldungen und Moderationsaudit testen
- [ ] Gildenboss unter paralleler Last prüfen

### Schritt 4 – Abnehmen ⬜

- [ ] Gilde kann den vollständigen gemeinsamen Wochenloop spielen
- [ ] jede Spende und DNA-Ausgabe ist im Ledger nachvollziehbar
- [ ] Wechsel- und Belohnungsregeln sind für Spieler sichtbar
- [ ] Moderation kann Missbrauch bearbeiten, ohne Wirtschaftsdaten zu verdecken
- [ ] geschlossene Online-Beta freigeben

**Gate:** Der kooperative Mehrspielerloop funktioniert fair, nachvollziehbar und moderierbar.

---

## Block 8 – PvP, Handel und Live-Ops-Grundlage

**Ergebnis:** Wettbewerb, optionale Wirtschaft zwischen Spielern, wiederkehrende Inhalte und eine belastbare Betriebsgrundlage für die erste geschlossene Online-Alpha.

### Schritt 1 – Planen ⬜

- [ ] asynchrones PvP, Verteidigungssnapshots und reproduzierbare Simulation festlegen
- [ ] Ligen, Saisons, Resets und Ranglistenbelohnungen definieren
- [ ] handelbare, gebundene und niemals handelbare Güter festlegen
- [ ] Marktgebühren, Preisgrenzen und Missbrauchsschutz planen
- [ ] Event-, Saison-, Ankündigungs- und Releaseprozess beschreiben
- [ ] rechtliche, Datenschutz- und Community-Anforderungen prüfen

### Schritt 2 – Bauen ⬜

- [ ] PvP-Matches, Verteidigungsteams, Historie und Ranglisten umsetzen
- [ ] Marktangebote, Reservierung, Ablauf und atomaren Besitzerwechsel bauen
- [ ] Events, Kalender, globale Ziele, Eventshops und Saisons umsetzen
- [ ] In-App-Ankündigungen und gezielte Systempost integrieren
- [ ] Monitoring, Alarmierung, Statusseite und Incident-Werkzeuge aufbauen
- [ ] Datenexport, Löschung und Community-Moderationswerkzeuge fertigstellen

### Schritt 3 – Prüfen ⬜

- [ ] Matchmaking-Farmen, Absprachen und manipulierte Teams testen
- [ ] Marktduplikation, Preismanipulation und parallele Käufe verhindern
- [ ] Lasttests für Login, Bootstrap, Claims, Ranglisten und Gildenboss
- [ ] Auth-, Session-, Rechte- und Eingabevalidierung sicherheitsprüfen
- [ ] Datenbankindizes anhand echter Abfragen und Lastdaten prüfen
- [ ] Ausfall, Wiederanlauf, Jobwiederholung und Restore-Übung durchführen

### Schritt 4 – Abnehmen ⬜

- [ ] geschlossene Version-0.2-Alpha mit klarer Testgruppe abnehmen
- [ ] Wirtschafts-, PvP- und Gildenmetriken ohne kritische Ausreißer prüfen
- [ ] Datenschutz-, Nutzungs- und Community-Regeln veröffentlichen
- [ ] Support-, Moderations- und Incident-Ablauf mit Testfällen üben
- [ ] Alpha Candidate einfrieren und vollständigen Regressionstest ausführen
- [ ] ersten Acht-Block-Zyklus abnehmen und den Beta-Zyklus aus echten Messdaten planen

**Gate:** Die Online-Alpha-Grundlage ist funktionsreich, betreibbar, sicher, wiederherstellbar und moderierbar. Sie ist noch nicht Version 1.0.

---

## Verbindliche technische Entscheidungen

- **Datenbank:** PostgreSQL für Accounts, Besitz, Zeitjobs, Gilden und Transaktionen.
- **Serverautorität:** Der Browser übermittelt Absichten, niemals resultierende Bestände.
- **Transaktionen:** Jeder wertverändernde Befehl ist atomar und idempotent.
- **Revisionen:** `expectedRevision` verhindert das Überschreiben neuerer Zustände.
- **Zeit:** Ausschließlich Serverzeit in UTC, gespeichert als `timestamptz`.
- **Große Zahlen:** SQL `numeric`, Transport als String, keine Gleitkomma-Währungen.
- **Content:** Definitionen bleiben versioniert; SQL speichert IDs und aktive Versionen.
- **Sessions:** Sichere HTTP-only Cookies statt Besitz-Tokens in `localStorage`.
- **Audit:** Kritische Wirtschafts-, Gilden- und Admin-Aktionen erhalten ein Ledger.

## Was bewusst nicht vorgezogen wird

- keine lokal vorgetäuschten Gilden, Ranglisten oder Spielerchats
- kein Handel, bevor Besitz und Ledger serverautoritativ sind
- kein sekündliches Speichern des Idle-Kampfs in PostgreSQL
- kein unversioniertes Direkteditieren von Produktions-Content
- keine neue Großfunktion zwischen Block 2 und der Solo-Backendmigration
- keine Echtgeldfunktion ohne gesonderte rechtliche und technische Planung

## Direkt als Nächstes

Wir arbeiten jetzt an **Block 4, Schritt 2 – Bauen**:

1. Migration `000002_accounts_and_sessions` samt PostgreSQL-Integrationstests bauen.
2. Passwort-, Token-, Cookie-, CSRF-, Rate-Limit- und Maildienste implementieren.
3. Registrierung, Verifikation, Login, Geräteverwaltung, Recovery und Account-Bootstrap umsetzen.
4. Profil, idempotente Starterwahl, Export, Löschung und playergebundene lokale Saves anbinden.

Die SQL-Details stehen in `DATABASE_BLUEPRINT.md`, die Servergrenze in `ONLINE_ARCHITECTURE.md`, die Content-Veröffentlichung in `CONTENT_PIPELINE.md` und die abgeschlossene lokale Abnahme in `PRE_BACKEND_ROADMAP.md`.
