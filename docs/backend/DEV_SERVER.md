# Idle-Tamer-Entwicklungsserver

Der Entwicklungsserver ist die reale Abnahmeumgebung für Backend-Blöcke. Er ist weder Staging noch Produktion und enthält ausschließlich synthetische Entwicklungsdaten. Release-Systeme werden später getrennt aufgebaut.

## Abgenommener Stand

Stand 20. Juli 2026:

- Ubuntu 26.04 LTS, Kernel `7.0.0-28-generic`
- Docker Engine 29 mit Compose-Plugin
- PostgreSQL 18 als Container `idle-tamer-local-postgres-1`
- Checkout unter `/srv/idle-tamer/app`
- geheime Compose-Variablen unter `/srv/idle-tamer/.env`, Modus `0600`
- persistentes Datenvolume `idle-tamer-local_idle-tamer-postgres`
- Backups unter `/srv/idle-tamer/backups`
- 2 GB Swap als Schutz vor kurzzeitigen Build-Spitzen

PostgreSQL wird nur als `127.0.0.1:54329` veröffentlicht. Ein externer Verbindungsversuch auf diesen Port wurde nach Einrichtung und nach Neustart abgewiesen.

## Zugang und Netzwerk

SSH akzeptiert nur Public-Key-Anmeldung. Passwort- und interaktive Anmeldung sind deaktiviert; Root ist ausschließlich mit Schlüssel erlaubt. Die Host-Firewall erlaubt eingehend nur TCP-Port 22. Das im Repository und in Supportnachrichten niemals zu speichernde Root-Passwort ist deshalb kein regulärer Zugangsweg.

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
docker compose \
  --env-file /srv/idle-tamer/.env \
  -f /srv/idle-tamer/app/infra/compose.yaml \
  ps

systemctl is-active docker
systemctl is-active idle-tamer-db-backup.timer
ufw status
ss -lntp
```

Erwartet werden ein gesunder PostgreSQL-Container, zwei aktive Dienste, nur SSH auf allen Interfaces und PostgreSQL ausschließlich auf Loopback.

Ein manuelles Backup startet mit:

```bash
systemctl start idle-tamer-db-backup.service
journalctl -u idle-tamer-db-backup.service -n 30 --no-pager
```

## Update-Regel

Updates erfolgen ausschließlich als Fast-Forward von `origin/main`. Vor einer Migration wird ein Backup erzeugt. Danach laufen Compose-Healthcheck, Migration und eine Datenbankstichprobe. Niemals werden Serverdateien durch `git reset --hard` oder ein Datenvolume durch `docker compose down -v` ersetzt.

Die aktuelle Instanz bleibt absichtlich intern. Öffentliche Web- und API-Ports werden erst zusammen mit Reverse Proxy, TLS, Origin-Regeln und Block 4 freigegeben.
