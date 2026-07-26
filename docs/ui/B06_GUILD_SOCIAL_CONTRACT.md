# B.06 · Gilden- und Sozialoberfläche

Stand: **26. Juli 2026 · B.06.4 abgenommen**

## Oberflächenvertrag

Die Gilden-DNA ist ein gemeinsamer permanenter Fortschritt. Die Oberfläche
ordnet DNA-Helix, Genpaare, Rollen, Aufgaben, Wochenboss, Expedition,
Abstimmung und Chat in einem Hub. Der Client zeigt nur den vom Server
gelieferten Snapshot; Rechte, DNA-Balance, Abstimmungen, Chatmoderation und
Boss-/Expeditionsbuchungen bleiben PostgreSQL-autoritativ.

Der deaktivierte Feature-Flag ist ein eigener, verständlicher Zustand. Er
rendert keinen toten Hub, sondern erklärt, dass die Online-Umgebung noch nicht
freigeschaltet ist.

## Implementierte Belege

- `apps/web/src/main.ts` enthält Gilden-DNA, Rollen, Aufgaben, Expedition,
  Wochenboss, Abstimmungen und Chat als servergespeiste Oberflächen.
- `packages/database/src/guild-store.ts` und
  `packages/database/src/guild-integration.test.ts` decken Ledger,
  Berechtigungen, Abstimmungen, Aufgaben, Expedition, Boss und Moderation ab.
- `apps/web/e2e/profile-guild-surfaces.spec.ts` prüft den deterministischen
  Feature-Flag-Aus-Zustand; `navigation-ia.spec.ts` prüft die Erreichbarkeit.
- `apps/web/e2e/live-guild.spec.ts` prüft mit einem ephemeren verifizierten
  Account Login, Starterwahl, Gildengründung, DNA-Helix, Boss, Aufgaben,
  Expedition, Chat und die Live-Capture; Account und Testgilde werden danach
  aus der Dev-Datenbank entfernt.

## Aktueller Online-Befund

Der Dev-Server meldet `FEATURE_GUILDS=true`, `FEATURE_GUILD_DNA=true`,
`/api/v1/meta` liefert beide Flags, und eine getrennte `idle_tamer_test`-
Datenbank ist vorhanden. Nach dem Rebuild des API-Containers bestehen jetzt
Foundation (4/4), Auth (7/7), Run (8/8) und Guild/Social (7/7) gegen diese
Testdatenbank. Der vorherige Fehler war ein Versions-/Deployment-Drift mit
einem alten hardcodierten Testzeitpunkt; Produktionsdaten wurden nicht
verändert.

## Abnahmebefund

Foundation (4/4), Auth (7/7), Run (8/8) und Guild/Social (7/7) sind gegen
`idle_tamer_test` grün. Der aktive Browserpfad wurde auf
`https://idle-tamer-world.de` mit einem temporären QA-Konto und einer
serverseitig angelegten Testgilde erfolgreich durchlaufen; die visuelle
Prüfung liegt unter `apps/web/artifacts/ui-captures/live-guild.png`. Keine
QA-Daten verbleiben auf dem Dev-Server.
