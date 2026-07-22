# Aktueller Entwicklungs-Checkpoint

Stand: 22. Juli 2026. Dieses Dokument ist der schnelle Wiedereinstiegspunkt. Ausführliche Nachweise liegen in `docs/backend`.

## Projektstand

- Version: `0.2.0`, **Roadmap A – Systemfundament**
- Block 1 bis 7: technisch umgesetzt, geprüft und auf dem Entwicklungsserver
- Block 8: aktiver Abschluss- und Übergabeblock von Roadmap A zu Roadmap B
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

Die genauen Fälle stehen in:

- `backend/BLOCK6_SOLO_ONLINE_ACCEPTANCE.md`
- `backend/BLOCK7_GUILD_SOCIAL_ACCEPTANCE.md`

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

Block A.08 schließt das Systemfundament ab und bereitet Roadmap B vor:

1. alle Ansichten, Dialoge, HUDs, Leer-, Lade-, Fehler- und Sperrzustände inventarisieren;
2. technische UI-Verträge markieren, die bei der Neugestaltung stabil bleiben müssen;
3. UX-Schulden und Lesbarkeitsprobleme mit Screenshots sammeln;
4. Profilbild-, Avatar- und Rahmenkonzept als Daten- und Designvertrag festziehen;
5. Roadmap B in konkrete Design-/UI-Blöcke gliedern und danach offiziell starten.

PvP, Handel, Events und weitere große Features werden in Roadmap C geplant. Roadmap D übernimmt Gesamtprüfung und Abnahme. Erst danach wird das Spiel an die geschlossene Alpha-Testgruppe gegeben. Der vorbereitete Arbeitsrahmen für die direkt folgende UI-Phase liegt in `ROADMAP_B_DESIGN_UI.md`.
