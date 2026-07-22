# Idle-Tamer-Entwicklungsserver

Der Entwicklungsserver ist die reale Abnahmeumgebung für Backend-Blöcke. Er ist weder Staging noch Produktion und enthält ausschließlich synthetische Entwicklungsdaten. Release-Systeme werden später getrennt aufgebaut.

## Abgenommener Stand

Stand 22. Juli 2026:

- Ubuntu 26.04 LTS, Kernel `7.0.0-28-generic`
- Docker Engine 29 mit Compose-Plugin
- PostgreSQL 18 als Container `idle-tamer-local-postgres-1`
- Checkout unter `/srv/idle-tamer/app`
- geheime Compose-Variablen unter `/srv/idle-tamer/.env`, Modus `0600`
- persistentes Datenvolume `idle-tamer-local_idle-tamer-postgres`
- privates Mail-Outbox-Volume `idle-tamer-local_idle-tamer-auth-mail`
- Backups unter `/srv/idle-tamer/backups`
- 2 GB Swap als Schutz vor kurzzeitigen Build-Spitzen
- Fastify-API und Web-Container hinter Caddy auf Port 80 und 443
- `/api/*` wird an die API geleitet; Spiel und Roadmap werden vom Web-Container ausgeliefert
- Migrationen bis `000005_guilds_and_social` und insgesamt 57 öffentliche Tabellen aktiv

PostgreSQL wird nur als `127.0.0.1:54329` veröffentlicht. Ein externer Verbindungsversuch auf diesen Port wurde nach Einrichtung und nach Neustart abgewiesen.

## Zugang und Netzwerk

SSH akzeptiert nur Public-Key-Anmeldung. Passwort- und interaktive Anmeldung sind deaktiviert; Root ist ausschließlich mit Schlüssel erlaubt. Die Host-Firewall sperrt eingehenden Verkehr standardmäßig und erlaubt nur 22/TCP für SSH sowie 80/TCP, 443/TCP und 443/UDP für die Web-App über IPv4 und IPv6. Das im Repository und in Supportnachrichten niemals zu speichernde Root-Passwort ist deshalb kein regulärer Zugangsweg.

Für eine lokale Datenbankverbindung wird ein SSH-Tunnel verwendet:

```powershell
ssh -i "$HOME\.ssh\cleancore_freebsd_ed25519" -L 54329:127.0.0.1:54329 root@<DEV_SERVER_IP>
```

Solange dieses Fenster offen ist, erreicht ein lokales Werkzeug PostgreSQL über `127.0.0.1:54329`, ohne den Datenbankport öffentlich freizugeben.

## Serverpfade

| Pfad | Zweck |
| --- | --- |
| `/srv/idle-tamer/app` | Git-Checkout von `main` |
| `/srv/idle-tamer/.env` | servereigene Compose-Secrets |
| `/srv/idle-tamer/backups` | komprimierte SQL-Dumps |
| `/usr/local/sbin/idle-tamer-db-backup` | täglicher Backup-Lauf |
| `/etc/systemd/system/idle-tamer-db-backup.timer` | persistenter Zeitplan |
| `/etc/ssh/sshd_config.d/00-idle-tamer-security.conf` | Key-only-SSH |

## Schnelle Betriebsprüfung

```bash
cd /srv/idle-tamer/app

docker compose \
  --env-file /srv/idle-tamer/.env \
  -f /srv/idle-tamer/app/infra/compose.yaml \
  -f /srv/idle-tamer/app/infra/compose.server.yaml \
  ps

systemctl is-active docker
systemctl is-active idle-tamer-db-backup.timer
ufw status
ss -lntp
```

Erwartet werden gesunde PostgreSQL-, API- und Web-Container, ein aktiver Caddy-Proxy, aktive Docker- und Backup-Dienste, nur SSH/HTTP/HTTPS auf öffentlichen Interfaces und PostgreSQL ausschließlich auf Loopback.

Die öffentliche Route kann ohne Zugangsdaten geprüft werden:

```bash
curl -fsS https://idle-tamer-world.de/api/v1/meta
curl -sS -o /dev/null -w '%{http_code}\n' https://idle-tamer-world.de/api/v1/bootstrap
```

`meta` muss mit HTTP 200 antworten. `bootstrap` muss ohne Session-Cookie kontrolliert HTTP 401 liefern.

Ein manuelles Backup startet mit:

```bash
systemctl start idle-tamer-db-backup.service
journalctl -u idle-tamer-db-backup.service -n 30 --no-pager
```

Der jüngste Dump wird ausschließlich in eine neue temporäre Datenbank zurückgespielt und dort mit Healthcheck, Revision, Beispielbuchung und Ledger geprüft:

```bash
cd /srv/idle-tamer/app
bash infra/scripts/verify-server-backup.sh
```

Das Skript verweigert die Quelldatenbank als Restoreziel und entfernt die temporäre Prüfdatenbank auch nach einem Fehler.

## Nur-Lese-Supportsicht

Support kann einen Account ausschließlich über eine exakte E-Mail-Adresse oder Benutzer-ID nachschlagen. Die Ausgabe maskiert die E-Mail und enthält Status, Rollen, Profil, Starter, Revision und minimierte Sitzungsmetadaten. Passwort-, Token-, Cookie-, CSRF- und vollständige User-Agent-Daten werden niemals ausgegeben.

```bash
cd /srv/idle-tamer/app

docker compose \
  --env-file /srv/idle-tamer/.env \
  -f infra/compose.yaml \
  -f infra/compose.server.yaml \
  exec -T api \
  pnpm --silent support:account -- --email "spieler@example.de"
```

Alternativ ist `--user-id UUID` zulässig. Das Werkzeug öffnet zusätzlich zur reinen SELECT-Implementierung eine PostgreSQL-Transaktion mit `READ ONLY`, setzt ein Fünf-Sekunden-Limit und besitzt bewusst keinen HTTP-Endpunkt. Änderungen erfolgen weiterhin nur über dokumentierte Spieler- oder spätere Moderationskommandos.

## Update-Regel

Updates erfolgen ausschließlich als Fast-Forward von `origin/main`. Vor einer Migration wird ein Backup erzeugt. Danach laufen Compose-Healthcheck, Migration und eine Datenbankstichprobe. Niemals werden Serverdateien durch `git reset --hard` oder ein Datenvolume durch `docker compose down -v` ersetzt.

Wurde `infra/caddy/Caddyfile` durch Git ersetzt, reicht ein Reload des bestehenden Containers wegen des Read-only-Bind-Mounts nicht zuverlässig aus. Der Proxy wird dann gezielt und ohne Abhängigkeiten neu erstellt:

```bash
docker compose \
  --env-file /srv/idle-tamer/.env \
  -f infra/compose.yaml \
  -f infra/compose.server.yaml \
  up -d --no-deps --force-recreate proxy
```

Die Web-App ist über die Server-IP auf HTTP-Port 80 und über `idle-tamer-world.de` hinter Caddy erreichbar. Caddy stellt HTTPS bereit und erneuert Zertifikate. Die API ist ausschließlich über die kontrollierte `/api/*`-Proxyroute erreichbar; API-Container und PostgreSQL besitzen keine öffentliche Freigabe. Diese Dev-Domain ist ausdrücklich keine Release-Infrastruktur.

Der verbindliche Pausen-, Sicherungs- und Wiedereinstiegsstand steht in `../CURRENT_CHECKPOINT.md`.
