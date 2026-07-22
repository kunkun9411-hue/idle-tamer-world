# Roadmap A – Abschluss und Übergabe

Stand: **22. Juli 2026**  
Status: **abgenommen, 32/32 Gates, technisch eingefroren**

## Ergebnis

Roadmap A liefert das vollständige Systemfundament für Idle Tamer World. Der Kernloop ist spielbar, Accounts und Fortschritt liegen in PostgreSQL, Wertänderungen werden serverautoritativ ausgeführt, der Solo-Dauerfortschritt ist online und die erste kooperative Gilden- und Sozialbasis funktioniert. Das System wurde lokal, gegen PostgreSQL 18 und über die echte Entwicklungsdomain geprüft.

| Block | Abgenommenes Ergebnis | Wichtigster Nachweis |
| --- | --- | --- |
| A.01 | spielbarer Idle-Kern mit Kampf, Sammlung und Prestige | `PRODUCT_ROADMAP.md` |
| A.02 | stabiler, backend-bereiter Clientvertrag | `VERSION_0_2_STABILIZATION.md` |
| A.03 | Fastify-/PostgreSQL-Fundament, Migrationen und Backups | `backend/DEV_SERVER.md` |
| A.04 | Accounts, sichere Sessions, Bootstrap und Starter | `backend/AUTH_ACCEPTANCE.md` |
| A.05 | serverautoritärer Run, Gold, Level und Zonen | `backend/RUN_SECURITY_VERIFICATION.md` |
| A.06 | Sammlung, Eier, Gems, Zeitjobs, Forschung und Prestige online | `backend/BLOCK6_SOLO_ONLINE_ACCEPTANCE.md` |
| A.07 | Gilden, DNA, Boss, Expedition, Freunde, Chat und Moderation | `backend/BLOCK7_GUILD_SOCIAL_ACCEPTANCE.md` |
| A.08 | Gesamtprüfung, UI-Übergabepaket, Restore und Betriebsabnahme | `backend/A08_FOUNDATION_VERIFICATION.md` |

## Eingefrorene Schutzgrenzen

Roadmap B darf Oberflächen, Navigation, Komponenten, Animationen und Lesbarkeit neu gestalten. Folgende Regeln bleiben dabei unverändert:

- Der Browser sendet Absichten; API und PostgreSQL besitzen die Wahrheit.
- Gold, Besitz, Claims, Zeit, Gildenrechte und Transaktionen werden nicht lokal berechnet oder überschrieben.
- Wertändernde Kommandos bleiben atomar, revisionsgeschützt und idempotent.
- Große Zahlen werden verlustfrei als SQL `numeric` und im Transport als String behandelt.
- Accounts verwenden sichere HTTP-only Sessions.
- Kritische Wirtschafts-, Gilden-, Moderations- und Adminaktionen bleiben auditierbar.
- Der 200×200-Vertrag gilt für PixelLab-Kampfanimationen; Profilavatar und Rahmen bleiben getrennte 512×512-Runtime-Layer.

Änderungen an diesen Grenzen öffnen Roadmap A nur bei einem kritischen Fehler oder einer ausdrücklich beschlossenen Architekturänderung erneut. Normale UI-Arbeit zählt ausschließlich zu Roadmap B.

## Offene UX-Themen für Roadmap B

Diese Punkte sind bekannte Gestaltungsschulden und kein versteckter Fehler im Abschluss von A:

1. **P0 – mobile Navigation:** Auf 390×844 kollidiert die bestehende Navigation mit der Kampfszene. B.02 und B.03 müssen den Hauptweg neu ordnen.
2. **P1 – Kampffokus:** Die Kampfszene enthält noch zu viele gleichzeitig sichtbare Nebeninformationen. B.03 führt einklappbare, priorisierte HUD-Flächen ein.
3. **P1 – Informationshierarchie:** Sammlung, Entwicklung, Gems, Forschung und Prestige benötigen ein gemeinsames visuelles Vokabular. Das gehört in B.01 und B.04.
4. **P1 – Identität:** Avatar und Rahmen besitzen einen stabilen Datenvertrag, aber noch keine endgültige Auswahl- und Profiloberfläche. Das übernimmt B.05.
5. **P1 – lange Inhalte:** Lange Namen, große Zahlen, Fehlertexte und leere Zustände brauchen systematische Layoutregeln. B.01 und B.07 prüfen diese Fälle über den UI-Katalog.
6. **P2 – visuelles Feedback:** Animation, Erfolg, Sperre, Laden und Fehler sind funktional vorhanden, aber noch nicht durchgehend konsistent. B.08 schließt diese Restschuld.

Die messbare Ausgangsbasis liegt in `ui/SCENE_INVENTORY.md`, `ui/HANDOFF.md` und dem internen UI-Katalog unter `/dev/ui-catalog/`.

## Betriebs- und Prüfnachweis

- vollständiger lokaler Check inklusive Produktionsbuild und Browserprüfungen grün;
- 26 PostgreSQL-18-Integrationen für Fundament, Accounts, Run und Gilden grün;
- echter Domain-Smoke von Registrierung bis Gildenchat grün;
- frischer Serverdump erfolgreich in eine leere Prüfdatenbank restauriert;
- Migrationen, Revisionen, Bestände und Ledger nach Restore geprüft;
- vollständiger Serverneustart mit automatisch gesundem Proxy, Web, API und PostgreSQL bestanden;
- temporäre QA-Daten entfernt und Servercheckout auf den geprüften Git-Stand gebracht.

## Übergabe

Roadmap B ist mit **B.01 – Inventar und Designsystem, Schritt 1 Planen** aktiv. Sie beginnt bei 0/32 Gates; die 100 % von Roadmap A werden nicht als B-Fortschritt wiederverwendet.

Es startet ausdrücklich **noch keine Alpha-Testgruppe**. Nach Roadmap B folgen Roadmap C für Content und Features und Roadmap D für Gesamtprüfung und Abnahme. Erst ein vollständig abgenommenes D öffnet die geschlossene Alpha.
