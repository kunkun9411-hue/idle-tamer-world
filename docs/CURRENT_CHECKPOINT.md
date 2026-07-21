# Aktueller Entwicklungs-Checkpoint

Dieses Dokument ist der verbindliche Wiedereinstiegspunkt nach dem Infrastruktur-Checkpoint vom 20. Juli 2026 und der Version-0.2-Stabilisierung vom 21. Juli 2026. Account- und Sessionbasis aus Block 4 sind abgenommen; Block 5 hat den sichtbaren Run, Kampfzeit, Gold, normale Level, Zonen und Kampfspeicher inzwischen bis einschließlich Schritt 3 auf den Server migriert und live geprüft.

## Wo wir stehen

- Gesamtfortschritt: **19 von 32 Schritten (59,4 %)**
- Clientversion: **0.2.0**
- Abgeschlossen: **Block 1 bis Block 4**
- Aktiver Arbeitsblock: **Block 5 – Serverautoritärer Run und Wirtschaft**
- Nächster Arbeitsschritt: **Schritt 4 – Abnehmen**
- Neu fertig: **Block 5, Schritte 1 bis 3 – Planen, Bauen und Prüfen**
- Checkpoint-Tag: `checkpoint/domain-live-backend-foundation-2026-07-20`

Die Roadmap steht bei 19/32. E-Mailstatus, Accountstatus, Rollen, Profil, Kosmetik, Sitzungen und Starterwahl bleiben serverautoritativ. Neu kommen Kampfzeit, Gold, Run-Level, Zone, Stage, Siege und der Kampfspeicher hinzu. Der Browser stellt Kämpfe dar und sendet nur Sammel-, Level- und Zonenabsichten; lokale Savewerte werden nicht als Runfortschritt importiert. Sammlung, Eier, Fragmente, Hyperlevel, Evolutionen, Gems, Forschung, Zeitjobs und Prestige bleiben ehrlich als lokale Block-6-Systeme getrennt.

Nach dem Checkpoint ergänzt: elf Ei-Assets, fünf Material-Icons, ein Ether-Inkubator und vier animierbare Effekt-Layer. Promptset und Ablage stehen in `EGG_AND_VFX_ASSET_PACK.md`.

Version 0.2 beseitigt den vollständigen periodischen Neuaufbau der Kampfszene, stabilisiert Erstklicks, überspringt bei frischen Accounts den leeren Offline-Bericht und ergänzt sieben spielbare Foundation-Zonen. Der aktuelle Stand wird durch 84 lokale Unit-, Vertrags- und Browsertests, 22 isolierte PostgreSQL-18-Fälle, zwölf reguläre Chromium-Abläufe sowie einen vollständigen Zwei-Browser-Livetest mit serverseitigem Run-Level abgesichert. Die lokalen QA-Presets sind im Produktionsbuild deaktiviert.

Die bestätigte Sammlungsrichtung sind 40 Rookie-Linien: die zehn vorhandenen plus die 30 momentan technisch als Normalgegner geführten Designs. Ihre Migration mit Evolutionen, Eier- und Fragmentdaten ist dokumentiert, aber noch nicht vorgetäuscht umgesetzt. Details stehen in `VERSION_0_2_STABILIZATION.md`.

## Live erreichbar

| Ziel | Adresse |
| --- | --- |
| Spiel | `https://idle-tamer-world.de/` |
| Roadmap | `https://idle-tamer-world.de/roadmap/` |
| WWW-Alias | `https://www.idle-tamer-world.de/` |
| Entwicklungsserver | `185.190.143.112` / `2a02:c207:3019:8470::1` |

Am 20. Juli 2026 wurden HTTP-zu-HTTPS-Weiterleitung, Spiel, Roadmap und WWW-Alias extern geprüft. HTTPS antwortete über IPv4 und IPv6 mit Status 200. Das aktive Let's-Encrypt-Zertifikat ist für `idle-tamer-world.de` ausgestellt und war bei der Prüfung bis 18. Oktober 2026 gültig; Caddy übernimmt Ausstellung und Erneuerung.

## Laufende Architektur

```text
Internet :80/:443
        -> Caddy (TLS und Reverse Proxy)
        -> /api/* an Fastify-API :3001, nur im Compose-Netz
        -> alle übrigen Pfade an Web-Container :80, nur im Compose-Netz

PostgreSQL 18
        -> API-interne Verbindung im Compose-Netz
        -> Host 127.0.0.1:54329
        -> nicht öffentlich erreichbar
```

- Server: Ubuntu 26.04 LTS, Kernel `7.0.0-28-generic`
- Checkout: `/srv/idle-tamer/app`
- Serverumgebung: `/srv/idle-tamer/.env`, Modus `0600`
- Docker: 29.6.2; Compose: 5.3.1
- Container: PostgreSQL gesund, API gesund, Web gesund, Caddy aktiv
- Firewall: standardmäßig eingehend gesperrt; nur 22/TCP, 80/TCP, 443/TCP und 443/UDP für IPv4 und IPv6 freigegeben
- SSH: Public-Key aktiv, Passwort und Keyboard-Interactive deaktiviert, Root nur mit Schlüssel
- Datenbank: nur an Loopback gebunden
- Backup-Timer: aktiv, täglicher Lauf mit 14 Tagen lokaler Aufbewahrung

## Gesicherter Stand

Unmittelbar vor der Runmigration vom 21. Juli 2026 wurde der Dump `/srv/idle-tamer/backups/idle-tamer-20260721T212419Z.sql.gz` erzeugt. Danach wurden Migration `000003_authoritative_run`, **23 öffentliche Tabellen** und die vollständige Zuordnung jedes vorhandenen Starterprofils zu einem autoritativen Run geprüft. Die Auth-Outbox liegt in einem privaten Docker-Volume und ist weder über Caddy noch als statische Datei erreichbar. Alle kurzlebigen Block-5-QA-Accounts und ihre Outboxeinträge wurden nach der Prüfung entfernt.

Am 20. Juli 2026 wurde vor der Pause ein neuer Sicherungssatz erstellt:

| Sicherung | Serverpfad | SHA-256 |
| --- | --- | --- |
| PostgreSQL-Dump | `/srv/idle-tamer/backups/idle-tamer-20260720T191431Z.sql.gz` | `ced0e251bb0c4e0283ae405d541f55b3ca328c1951faa961bff6e34740664f1f` |
| Bereinigter Betriebs-Snapshot | `/srv/idle-tamer/backups/idle-tamer-ops-20260720T191430Z.tar.gz` | `d046efc228be1ff098f1ae25aa631a36d5de8795fefb80ecf8b54cac908993e0` |

Der SQL-Dump wurde nicht nur entpackt: Er wurde erfolgreich in die temporäre Datenbank `idle_tamer_checkpoint_restore` eingespielt, dort mit **8 öffentlichen Tabellen** geprüft und anschließend wieder entfernt.

Eine zweite Kopie liegt lokal und wird von Git ignoriert:

```text
C:\Users\xapu\Documents\idle browsergame\.runtime\checkpoints\2026-07-20
```

Der Betriebs-Snapshot enthält ausgewählte SSH-, Firewall-/Netzwerk-, Docker- und systemd-Konfigurationen sowie einen Zustandsbericht. Er enthält weder `.env`-Werte noch SSH-Privatschlüssel oder private TLS-Schlüssel. Server und lokale Kopie allein sind für eine spätere Produktion noch keine ausreichende Backupstrategie; vor echten Spielerdaten kommen verschlüsselte, automatisierte Offsite-Backups und regelmäßige Restore-Proben hinzu.

## Sicherheitsrestpunkt

Ein früheres Root-Passwort wurde im Chat offengelegt. SSH-Passwortanmeldung ist auf dem Server zwar wirksam deaktiviert, das Passwort sollte dennoch im Contabo-Kundenbereich beziehungsweise über die Serverkonsole erneut auf einen einzigartigen, nirgendwo dokumentierten Wert geändert werden. Es gehört weder ins Repository noch in dieses Dokument.

## Sicher wieder einsteigen

### 1. Lokal prüfen

```powershell
git status --short
git fetch --tags origin
git switch main
git pull --ff-only
git describe --tags --exact-match
pnpm check
```

Erwartet werden ein sauberer Arbeitsbaum und der Tag `checkpoint/domain-live-backend-foundation-2026-07-20` am Checkpoint. Spätere Commits dürfen natürlich hinter diesem Tag liegen.

### 2. Server prüfen

```powershell
ssh -i "$HOME\.ssh\cleancore_freebsd_ed25519" root@185.190.143.112
```

```bash
cd /srv/idle-tamer/app
git status --short
git pull --ff-only

docker compose \
  --env-file /srv/idle-tamer/.env \
  -f infra/compose.yaml \
  -f infra/compose.server.yaml \
  ps

systemctl is-active docker
systemctl is-active idle-tamer-db-backup.timer
ufw status
ss -lntup
```

Vor jeder Datenbankmigration:

```bash
systemctl start idle-tamer-db-backup.service
journalctl -u idle-tamer-db-backup.service -n 30 --no-pager
```

Keine Wiederaufnahme darf `git reset --hard`, `docker compose down -v`, eine öffentliche PostgreSQL-Freigabe oder Secrets im Repository verwenden.

## Exakter nächster Arbeitsauftrag

Weiter geht es ausschließlich mit **Block 5, Schritt 4 – Abnehmen**:

1. echten Hauptkampf nach Reload und in einem zweiten Browser aus Spielersicht prüfen.
2. Gold, Level, Stage und Speicher sichtbar mit den Serverantworten abgleichen.
3. absichtlich einen Revisionskonflikt erzeugen und die Neusynchronisierung bewerten.
4. Wirtschafts-Supportsicht sowie die sichtbare Block-6-Grenze freigeben.

Plan, Vertrag, Umsetzung und Prüfnachweise stehen in `backend/BLOCK5_RUN_PLAN.md`, `backend/RUN_API_CONTRACT.md`, `backend/RUN_IMPLEMENTATION.md` und `backend/RUN_SECURITY_VERIFICATION.md`. Schritt 4 ist eine bewusste Spielerabnahme und wurde nicht automatisch vorweggenommen.

## Relevante Unterlagen

- `PRODUCT_ROADMAP.md` – Status, Reihenfolge und Gates
- `VERSION_0_2_STABILIZATION.md` – P0-Ursache, Zonenpfad, QA und 40-Linien-Entscheidung
- `RELEASE_LIFECYCLE.md` – Alpha, Beta, Gamma, Beta Release und Launch 1.0
- `backend/README.md` – Backend-Einstieg und abgenommener Stand
- `backend/DEV_SERVER.md` – Betrieb des Entwicklungsservers
- `backend/OPERATIONS_PLAN.md` – Umgebungen, Backups und Restore
- `backend/SCHEMA_REVIEW.md` – Tabellen- und Transaktionsregeln
- `backend/BLOCK4_AUTH_PLAN.md` – Accountzustände, Sicherheit, Recovery, Datenschutz und Baufolge
- `backend/AUTH_API_CONTRACT.md` – Auth-Vertrag 1, Bootstrap, DTOs und Fehler
- `backend/AUTH_SCHEMA_PLAN.md` – Zielmigration 000002 und SQL-Abnahme
- `backend/AUTH_ACCEPTANCE.md` – Block-4-Abnahme, Supportsicht und bekannte Alpha-Grenzen
- `backend/BLOCK5_RUN_PLAN.md` – Serverzeit, Runregeln, Reward-Batches und Autoritätsgrenze
- `backend/RUN_API_CONTRACT.md` – Run-Vertrag 1 und Transaktionskommandos
- `backend/RUN_IMPLEMENTATION.md` – gebaute Run-, Datenbank- und Clientarchitektur
- `backend/RUN_SECURITY_VERIFICATION.md` – PostgreSQL-, Manipulations- und Live-Nachweise
- `API_CONTRACT_V8.md` – Client-/Serververtrag
- `DATABASE_BLUEPRINT.md` – langfristiges PostgreSQL-Modell
- `ONLINE_ARCHITECTURE.md` – Grenze zwischen Client und Server
