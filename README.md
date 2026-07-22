# Idle Tamer

Eine testbare Grundversion des 2D-Idle-Monster-RPGs für den Browser. Der sichtbare Kern bleibt bewusst verständlich: genau ein eigenes Monster kämpft automatisch gegen ein gegnerisches Monster, immer im Normaltempo. Die Entscheidungen passieren zwischen den Kämpfen – sammeln, leveln, Eier brüten, Hyperlevel erhöhen, Gems ausrüsten, entwickeln, forschen und Prestige auslösen.

## Starten

```powershell
pnpm install
pnpm dev:web
```

Danach `http://127.0.0.1:5173` öffnen.

Für die feste Smartphone-Vorschau: `http://127.0.0.1:5173/dev/mobile-preview.html` (echte 390×844-Spielfläche).

Für die automatisch aus den Katalogen erzeugte Galerie aller Kreaturen und drei Zonenwelten: `http://127.0.0.1:5173/dev/asset-gallery.html`.

Für die interaktive Projekt-Homepage mit acht Roadmap-Blöcken und automatischer Prozentanzeige: `http://127.0.0.1:5173/roadmap/`.

Das neue Backend-Fundament startet nach `pnpm db:up`, `pnpm db:migrate` und `pnpm db:seed` gemeinsam mit dem Client über `pnpm dev`. Die API läuft dann auf `http://127.0.0.1:3001`; `/health/live`, `/health/ready` und `/api/v1/meta` trennen Prozesszustand, Datenbankbereitschaft und öffentliche Versionsdaten sauber voneinander.

## Bereits spielbar

- automatischer 1-gegen-1-Kampf ohne Angriffs- oder Geschwindigkeitsschalter
- einmalige Wahl aus zehn originalen Rookie-Startern mit je einer ersten Evolution
- drei anwählbare Zonen mit je zehn Stages, Zonenboss und Folgefreischaltung
- 30 eigenständige Normalgegner und fünf rotierende Bosse mit kompletten HD-Sprites
- Expeditions-Duo aus sichtbarer Front und Supportplatz; jede Zone belohnt andere Rollenkombinationen
- Run-Gold, normale Monsterlevel und begrenzter Kampfspeicher
- zufällige Monster-Eierdrops mit Pity-Schutz
- Kampfspeicher zum gemeinsamen Einsammeln von Gold, Eiern und vier Materialarten
- Materialinventar mit Trainingsdaten, Evolutionskernen, Brutladungen und Etherstaub
- Ether-Brutstation mit echter Zeit, Erstentdeckung und Duplikaterkennung
- monsterspezifische Fragmente für permanente Hyperlevel und Evolutionen
- Gem-Ausrüstung mit drei Formen, fünf Farben und drei Seltenheiten: 45 transparente HD-Assets
- eigene Prestige-Szene als HD-Ether-Heiligtum mit aufladbarem Kristall, Ritualeffekten und Reset-Animation
- Prestige erst nach Erreichen von Zone 10 und ab 100 Run-Siegen; Hyperlevel, Evolutionen, Gems und Sammlung bleiben erhalten
- kleine dauerhafte Prestige-Boni: +0,2 % Grundwerte, +0,1 % wiederholbares Gold und +0,001 Prozentpunkte Dropchance je Prestige
- permanente Account-Forschung mit Prestige-Kernen
- rundes Accountprofil mit getrennt wechselbaren Avataren und Rahmen
- zehn kurze Ether-Welt-Storyknoten bis 500 Gesamtsiege
- Auftragszentrale mit drei Tageszielen, drei Wochenzielen und vier permanenten Erfolgen
- zwei Zeit-Expeditionsslots mit sechs Missionen, Monsterbindung und Rollen-/Element-Boni
- Etherwerkstatt mit drei festen Rezepten als vollständige Senke für Etherstaub
- kontextuelle Vier-Schritt-Einführung, Systempost und gespeicherte Komfort-/Barrierearm-Einstellungen
- HD-/Cel-Shading-Monster in exakt 200×200 Pixeln
- lokaler Save v9, sichere v1–v8-Migration und bis zu acht Stunden kapazitätsbegrenzte Offline-Beute
- responsive Desktop- und Mobiloberfläche
- klarer Einstieg über Login, sammelbaren Offline-Bericht und die direkte Rückkehr in den Kampf
- bildschirmfüllende Hauptkampfszene: Zonen, Ressourcen, Beute, Duo, Monsterwechsel und Navigation liegen als HUD in der Spielwelt
- Optik V2 mit drei eigenständigen HD-Kampfumgebungen, Bodenkontakt, Trefferfeedback und einer kampfzentrierten Spielhierarchie
- vollständiges Silber-Violett-UI-System mit Dialogen, Toasts, Leer- und Sperrzuständen
- echte Online-Gilden mit Rollen, Einladungen, Wechselregeln, Freunden und moderierbarem Chat
- lebende Gilden-DNA mit sechs vorsichtig begrenzten Genen, Abstimmungen und append-only Ledger
- gemeinsame Tagesziele, tägliche Expedition und paralleler Wochenboss

## Prüfen

```powershell
pnpm check          # Unit-/Contenttests, Build, Roadmap und Asset-Vertrag
pnpm test:e2e       # Desktop, Tablet, 390x844, Tastatur und Mehrtab-Fälle
pnpm check:all      # komplette lokale Qualitätsschranke
```

Die Regel-, Content- und Vertragstests decken Starterwahl, Ei-Pity, Erst- und Duplikatschlupf, Fragmente, Evolution, Zonenbosse, Inventartransfer, Save-Migration, Offline-Grenzen und Reload-Schutz, Zielperioden, Einmal-Claims, Zeit-Expeditionen, Herstellung, Einstellungen, Service-Port und den Prestige-Erhalt permanenter Werte ab. Die Playwright-Suite prüft zusätzlich den echten sichtbaren Kernpfad von Login und Offline-Claim bis Brut, Fragmenten, Hyperlevel, Evolution, Gem und Prestige – inklusive Desktop, Tablet, 390×844, Tastatur, Kontrast, reduzierter Bewegung und paralleler Tabs.

Die GitHub-Action `.github/workflows/quality.yml` führt dieselbe Qualitätsschranke bei jedem Push und Pull Request gegen `main` aus. Das Asset-Manifest wird dabei bewusst nur validiert, nicht automatisch neu erzeugt: unbemerkte Dateiänderungen müssen so als Vertragsbruch auffallen.

Für UI-Abnahmen stehen im lokalen Dev-Server `?ui-state=loading`, `offline`, `conflict` und `error` bereit.

## Struktur

- `apps/web` – bestehender Vite-Client, Browser-Tests, Roadmap und alle Runtime-Assets
- `apps/api` – Fastify-API mit strukturierten Logs, Request-ID, Fehlervertrag und Healthchecks
- `packages/contracts` – API-Protokoll 8, gemeinsame DTOs, Spielstandtypen und Vertragsversionen
- `packages/content` – zehn Monsterlinien, Zonen, 30 Gegner, fünf Bosse, Gems und Storydefinitionen
- `packages/game-core` – deterministische Regeln, Zahlenformat, Aufträge, Expeditionen und Crafting
- `packages/config` – validierte Umgebung, Feature-Flags und Log-Redaction
- `packages/database` – PostgreSQL-Pool, Migration, Seed, Kommando-Transaktion und Ledger
- `infra/compose.yaml` – lokale PostgreSQL-18-Instanz mit separater Testdatenbank
- `apps/web/src/game/game-service.ts` – lokale UI-Aktionsgrenze; später durch den HTTP-Service ersetzbar
- `apps/web/src/game/api-client.ts` – testbarer, Cookie-basierter HTTP-Transport
- `apps/web/src/game/storage.ts` – ausschließlich lokaler Prototyp-Speicher und Migration
- `apps/web/src/main.ts` – Darstellung und Kampf-Taktung
- `apps/web/public/assets` – 96 versionierte HD-Runtime-Assets samt SHA-256-Manifest
- `art-source` – HD-Master, Chroma-Quellen und archivierte Stiltests

## Zentrale Dokumente

- `docs/CURRENT_CHECKPOINT.md` – aktueller Live-, Sicherungs- und Wiedereinstiegsstand in Roadmap A
- `docs/RELEASE_LIFECYCLE.md` – verbindliche Reihenfolge Roadmap A bis D und anschließende Alpha-/Release-Phasen
- `docs/PRODUCT_ROADMAP.md` – abhakebarer 8×4-Arbeitsplan für Roadmap A „Systemfundament“
- `docs/ROADMAP_B_DESIGN_UI.md` – vorbereiteter 8×4-Arbeitsrahmen für Design, Interface, Lesbarkeit, Avatare und Rahmen
- `docs/GAMEPLAY_FOUNDATION_SPEC.md` – verbindliche Zielbalance, Resetmatrix, E2E-Ablauf und UI-Zustände
- `docs/NUMBER_SCALE_POLICY.md` – verbindliche Kleinzahl-, Prestige- und wissenschaftliche Zahlenregeln
- `docs/GAME_CONCEPT.md` – verbindliche Produkt- und Gameplay-Quelle
- `docs/ART_DIRECTION_V2.md` – neue visuelle Richtung, Zonenprompts und schnelle Anpassung
- `docs/PLAYER_ENTRY_FLOW.md` – verbindlicher Ablauf von Login bis Hauptkampfszene
- `docs/ONLINE_ARCHITECTURE.md` – direkter Weg zu Accounts, PostgreSQL, PvP und Gilden
- `docs/API_CONTRACT_V8.md` – für den Backendbau freigegebener Kommando- und Antwortvertrag
- `docs/backend/README.md` – verbindlicher Backend-Stack, Workspace-, Schema- und Betriebsplan
- `docs/PRE_BACKEND_ROADMAP.md` – vollständige Reihenfolge und Fertig-Kriterien vor dem Serverbau
- `docs/DATABASE_BLUEPRINT.md` – verbindliches PostgreSQL-Modell für Besitz und Transaktionen
- `docs/ASSET_PIPELINE.md` – HD-200×200- und spätere PixelLab-API-Pipeline
- `docs/EGG_AND_VFX_ASSET_PACK.md` – elf Eier, Kernmaterialien, Inkubator, Prestige-/Bruteffekte und reproduzierbare Prompts
- `docs/PIXELLAB_ANIMATION_CONTRACT.md` – Frame-, Anker-, Namens- und API-Jobvertrag für Animationen
- `docs/ASSET_PROMPTS.md` – reproduzierbare Designprompts der ersten Monster
- `docs/UI_SYSTEM.md` – verbindliche Farben, Komponenten und Responsive-Regeln
- `docs/ui/SCENE_INVENTORY.md` – vollständige Szenen-, Zustands- und UX-Schuldenliste für Roadmap B
- `docs/PRESTIGE_SCENE_V2.md` – Aufbau, Animation, Assets und reproduzierbare Imagegen-Prompts der Prestige-Szene
- `docs/CONTENT_PIPELINE.md` – Dev-Konzept für Zonenpflege, Validierung und Live-Veröffentlichung
- `docs/CUSTOMIZATION_GUIDE.md` – schnelle Übersicht: welche Werte du morgen wo änderst
- `docs/CORE_GAME_LOOP.md` – kompletter Spielkreislauf und Resetgrenzen
- `docs/GEM_SYSTEM.md` – Gem-Regeln, 45er-Katalog und reproduzierbarer Asset-Prompt
- `docs/ECONOMY_BALANCE.md` – alle Quellen, Senken, Rezepte und Missbrauchsschutz-Regeln
- `docs/MONSTER_ROSTER.md` – alle zehn Linien mit Designbriefs und PixelLab-Prompts
- `docs/ENCOUNTER_CATALOG.md` – Gegnerverteilung, Bosse und Zonen-Rollensynergien

Für Online-Accounts berechnet und speichert ausschließlich der Server Gold, Drops, Brutzeiten, Fragmente, Hyperlevel, Gem-Besitz, Ausrüstung, Evolutionen, Prestige und Gildenzustand. `localStorage` bleibt nur für Komfortdaten und den lokalen UI-Testmodus zuständig.
