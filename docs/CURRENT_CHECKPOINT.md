# Aktueller Entwicklungs-Checkpoint

Stand: 30. Juli 2026. Dieses Dokument ist der schnelle Wiedereinstiegspunkt. Ausführliche Nachweise liegen in `docs/backend`.

## Projektstand

- Version: `0.2.0`, **Roadmap B – Design, Interface und Lesbarkeit**
- Roadmap A: **32/32 Gates, vollständig abgenommen und technisch eingefroren**
- Roadmap B: **aktiv bei B.03 – Kampfszene visuell nacharbeiten; 28/32 Gates**
- B.01-Art: vollständiger textfreier Silver-Ether-Baukasten mit 136 Rasterelementen, zehn CSS-/Rotationsableitungen, G30–G36-Systemicons und H09–H12-Identitätslayern integriert; technische Prüfkette grün, B.01.4 visuell abgenommen und eingefroren
- Alpha-Status: noch keine Alpha-Testgruppe; Freigabe erst nach Roadmap D
- Spiel: `https://idle-tamer-world.de/`
- Roadmap: `https://idle-tamer-world.de/roadmap/`
- Repository: `kunkun9411-hue/idle-tamer-world`, Branch `main`

## Was jetzt wirklich online ist

- sichere Accounts, Sessions, Profil, Starter und getrennte Account-Saves
- serverzeitbasierter Kampf, Gold, Run-Level, Zonen und Kampfspeicher
- Monsterbesitz, Eier, Brut, Fragmente, Hyperlevel, Evolution, Gems und Forschung
- Ziele, Story, Systempost, Herstellung, Zeit-Expeditionen und Prestige
- Gildengründung, offene Gilden und Einladungen
- Rollen, Leitungsübergabe, Ausschluss und 24-Stunden-Wechselsperre
- persönliche und gemeinsame DNA mit append-only Gilden-Ledger
- sechs niedrig begrenzte Gene als animierte Doppelhelix
- Abstimmungen, Tagesziele, tägliche Gildenexpedition und Wochenboss
- Freundschaften, Blockieren, Gildenchat und Meldungen
- interne, rollenbasierte Content-, Support- und Moderationswerkzeuge mit Audit

Der Browser sendet nur Absichten. Wertstände, Besitz, Zeit und Rechte kommen aus PostgreSQL. Online-`localStorage` enthält keine autoritative Wirtschaft.

## Prüfstand

- lokaler TypeScript-/Produktionsbuild grün
- lokale Unit-, Vertrags-, Regel- und Clienttests grün
- vollständige Integration gegen eine eigene PostgreSQL-18-Datenbank `idle_tamer_test` grün
- Testdatenbank-Schranke lehnt jeden Namen ohne `_test` oder `_ci` ab
- Run-Integrationen: 8/8 grün
- Gilden-/Admin-Integrationen: 7/7 grün
- parallele Claims, DNA-Ausgaben und Bossangriffe geprüft
- Content-Vorschau, Aktivierung, Rollback und Audit geprüft
- kleine/30er-Gilden sowie maximale Genboni automatisiert gegengeprüft
- echter Domain-Smoke-Test: Registrierung, Starter, Gildengründung, DNA-Ledger, Boss, Expedition und Chat
- zwei dabei gefundene UI-Blocker behoben und im erneut gebauten Web-Container bestätigt
- temporäre QA-Daten vollständig bereinigt; die zwei vorher vorhandenen Accounts blieben erhalten
- A.08.1: 16 sichtbare Flächen samt Lade-, Leer-, Fehler-, Sperr- und Erfolgszuständen inventarisiert
- reproduzierbarer UX-Befund auf 1280×720 und 390×844 dokumentiert; die mobile Navigationskollision wurde in B.02/B.03 durch ein einreihiges 7er-Dock geschlossen
- A.08.2: codebasierter UI-Katalog mit 16 Flächen, zehn Zuständen, drei Viewports, Assetverträgen und bekannter Schulden-Allowlist gebaut
- Layout-Audit in Desktop, Tablet und Mobile grün; Screenshotlauf erzeugt 42 Vergleichsbilder ohne Repository-Ballast
- getrennten 512×512-Runtimevertrag für runde Avatare und transparente Rahmen festgezogen
- A.08.3: kompletter lokaler Check, 26 PostgreSQL-18-Integrationen und echter Domain-Smoke grün
- frischen Serverdump in eine leere Datenbank restauriert und Health, Revision, Bestand sowie Ledger geprüft
- vollständigen Serverneustart bestanden; Docker, Datenbank, API, Web, Proxy und Backup-Timer kamen automatisch zurück
- A.08-QA-Account und Testgilde vollständig entfernt; exakt zwei vorher vorhandene Accounts blieben erhalten
- A.08.4: Abschlussbericht veröffentlicht, Roadmap A bei 100 % eingefroren und B.01 historisch bei 0/32 aktiviert
- B.01.2/B.01.3/B.01.4: 136 textfreie Rasterelemente, zehn CSS-/Rotationsableitungen, aktuell 271 Manifest-IDs und 15,33 MB im 16-MB-Foundation-Budget geprüft; UI-Katalog, Asset-Validator, Desktop/Tablet/Mobile-Captures und E2E grün, visuell eingefroren
- B.01.2: Login und Offline-Bericht auf generierte Rahmen, echten HTML-Text und 12-px-Mindestrollen migriert; Desktop, Tablet und 390×844 bleiben innerhalb ihrer Viewports
- B.06-Backend-/Live-Nachweis: Dev-API mit `FEATURE_GUILDS=true` und `FEATURE_GUILD_DNA=true` neu gebaut; Foundation 4/4, Auth 7/7, Run 8/8 und Guild/Social 7/7 gegen `idle_tamer_test` grün; aktive Browser-E2E/Capture auf der Dev-Domain grün, QA-Konto/Testgilde danach entfernt
- UI-Kit-Runtime-Brücke: Kampf-HUD, Kontroll-Dock, Seitenüberschriften und zentrale Arbeitsflächen verwenden jetzt die textfreien B01/B02/B03-/Chrome-Flächen; UI-Audit und B07/B08-E2E bleiben grün
- B.03-Folgeprüfung: QA-01 bis QA-05 technisch geschlossen; Monster- und
  Inventar-Schnellfenster, Truhenfeedback sowie Front/Support/Zonenbonus sind in
  Desktop, Tablet und Mobile automatisiert geprüft
- Spieler-HUD und Inventarfluss nachgezogen: Profilbild, Name, Rang, Gold und
  Kerne bilden eine gemeinsame Profilkarte; sämtliche Inventar-Einstiege öffnen
  dasselbe responsive Kampf-Schnellfenster. Der aktuelle Vollcheck besteht mit
  67 Web-, 24 API-, 9 Datenbank-Unit-, 6 Core- und 34 lokalen Browsertests.
- Mobile-P1 behoben: widersprüchliche Kampf-Schnellleisten-Anker konnten die
  Bühne unsichtbar überdecken; Responsive-E2E prüft nun Monster-Sichtbarkeit,
  geladene Sprites und Kollisionsfreiheit der Bedienleisten

Die genauen Fälle stehen in:

- `backend/BLOCK6_SOLO_ONLINE_ACCEPTANCE.md`
- `backend/BLOCK7_GUILD_SOCIAL_ACCEPTANCE.md`
- `backend/A08_FOUNDATION_VERIFICATION.md`
- `ROADMAP_A_COMPLETION.md`

## Live-Infrastruktur

```text
Internet :80/:443
  -> Caddy (TLS)
  -> /api/* an Fastify
  -> übrige Pfade an den Web-Container
  -> PostgreSQL 18 nur intern/Loopback
```

- Servercheckout: `/srv/idle-tamer/app`
- Serverumgebung: `/srv/idle-tamer/.env` mit Modus `0600`
- Compose: `infra/compose.yaml` plus `infra/compose.server.yaml`
- täglicher Backup-Timer mit lokaler 14-Tage-Aufbewahrung
- SSH nur mit Schlüssel; Passwortanmeldung deaktiviert
- öffentliche Ports: 22, 80, 443 TCP und 443 UDP

## Sicher arbeiten

Vor jeder produktiven Migration:

```bash
systemctl start idle-tamer-db-backup.service
journalctl -u idle-tamer-db-backup.service -n 30 --no-pager
```

Integrationstests ausschließlich so ausführen:

```bash
TEST_DATABASE_URL=postgres://…/idle_tamer_test pnpm test:integration
```

Nie `TEST_DATABASE_URL` auf `idle_tamer` setzen. Die Anwendung prüft den Datenbanknamen zusätzlich im Testprozess.

## Bekannter Sicherheitsrestpunkt

Ein früheres Root-Passwort wurde im Chat genannt. SSH-Passwortanmeldung ist deaktiviert; das Kennwort sollte trotzdem im Contabo-Kundenbereich einzigartig gesetzt bleiben. Geheimnisse gehören weder ins Repository noch in Dokumente oder Terminalausgaben.

## Nächster sinnvoller Arbeitsauftrag

Roadmap A ist abgeschlossen. Roadmap B bleibt nach der visuellen Spielerprüfung bewusst offen: B.03 (Kampfszene) und B.08 (Gesamtpolish) sind noch nicht abgenommen.

1. aktuellen Stand deployen und den zusammenhängenden Live-Spielerweg erneut
   vollständig durchspielen;
2. dabei Kampfszene, Schnellfenster, Truhe, Duo und Rückkehrwege gegen die
   automatisierten Desktop-/Tablet-/Mobile-Belege vergleichen;
3. B.03 nur bei schuldenfreiem Live-Befund abnehmen, danach B.08 erneut prüfen
   und erst dann die Übergabe an Roadmap C freigeben;
4. Roadmap D weiterhin erst nach C für Abnahme, Balance, Sicherheit und Last vorbereiten.

Die erste Runtime-Brücke des UI-Baukastens ist in `ui/UI_KIT_RUNTIME_BRIDGE.md`
dokumentiert. Weitere visuelle Nacharbeit bleibt bis zur B-Abnahme in B.03 und
B.08; Roadmap C ergänzt erst danach neue Content- und Serververträge.

PvP, Handel, Events und weitere große Features werden in Roadmap C geplant. Roadmap D übernimmt Gesamtprüfung und Abnahme. Erst danach wird das Spiel an die geschlossene Alpha-Testgruppe gegeben. Der aktive Arbeitsrahmen liegt in `ROADMAP_B_DESIGN_UI.md`.
