# Idle Tamer

Eine testbare Grundversion des 2D-Idle-Monster-RPGs für den Browser. Der sichtbare Kern bleibt bewusst verständlich: genau ein eigenes Monster kämpft automatisch gegen ein gegnerisches Monster, immer im Normaltempo. Die Entscheidungen passieren zwischen den Kämpfen – sammeln, leveln, Eier brüten, Hyperlevel erhöhen, Gems ausrüsten, entwickeln, forschen und Prestige auslösen.

## Starten

```powershell
pnpm install
pnpm dev
```

Danach `http://127.0.0.1:5173` öffnen.

Für die feste Smartphone-Vorschau: `http://127.0.0.1:5173/dev/mobile-preview.html` (echte 390×844-Spielfläche).

Für die automatisch aus den Katalogen erzeugte Galerie aller Kreaturen und drei Zonenwelten: `http://127.0.0.1:5173/dev/asset-gallery.html`.

Für die interaktive Projekt-Homepage mit acht Roadmap-Blöcken und automatischer Prozentanzeige: `http://127.0.0.1:5173/roadmap/`.

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
- eigene Prestige-Szene mit aufladbarem Ether-Kristall und Reset-Animation
- Prestige ab 100 Run-Siegen; Hyperlevel, Evolutionen, Gems und Sammlung bleiben erhalten
- permanente Account-Forschung mit Prestige-Kernen
- rundes Accountprofil mit getrennt wechselbaren Avataren und Rahmen
- zehn kurze Ether-Welt-Storyknoten bis 500 Gesamtsiege
- Auftragszentrale mit drei Tageszielen, drei Wochenzielen und vier permanenten Erfolgen
- zwei Zeit-Expeditionsslots mit sechs Missionen, Monsterbindung und Rollen-/Element-Boni
- Etherwerkstatt mit drei festen Rezepten als vollständige Senke für Etherstaub
- kontextuelle Vier-Schritt-Einführung, Systempost und gespeicherte Komfort-/Barrierearm-Einstellungen
- HD-/Cel-Shading-Monster in exakt 200×200 Pixeln
- lokaler Save v8, sichere v1–v7-Migration und bis zu acht Stunden kapazitätsbegrenzte Offline-Beute
- responsive Desktop- und Mobiloberfläche
- klarer Einstieg über Login, sammelbaren Offline-Bericht und die direkte Rückkehr in den Kampf
- bildschirmfüllende Hauptkampfszene: Zonen, Ressourcen, Beute, Duo, Monsterwechsel und Navigation liegen als HUD in der Spielwelt
- Optik V2 mit drei eigenständigen HD-Kampfumgebungen, Bodenkontakt, Trefferfeedback und einer kampfzentrierten Spielhierarchie
- vollständiges Silber-Violett-UI-System mit Dialogen, Toasts, Leer- und Sperrzuständen
- Vorschau der späteren, serverseitigen Gilden-DNA

## Prüfen

```powershell
pnpm test
pnpm test:e2e
pnpm build
pnpm check:roadmap
python scripts/build_asset_manifest.py
python scripts/validate_assets.py
```

Die 33 Regel- und Vertragstests decken Starterwahl, Ei-Pity, Erst- und Duplikatschlupf, Fragmente, Evolution, Zonenbosse, Inventartransfer, Save-Migration, Offline-Grenzen und Reload-Schutz, Zielperioden, Einmal-Claims, Zeit-Expeditionen, Herstellung, Einstellungen, Service-Port und den Prestige-Erhalt permanenter Werte ab. Die Playwright-Suite prüft zusätzlich den echten sichtbaren Kernpfad von Login und Offline-Claim bis Brut, Fragmenten, Hyperlevel, Evolution, Gem und Prestige.

Für UI-Abnahmen stehen im lokalen Dev-Server `?ui-state=loading`, `offline`, `conflict` und `error` bereit.

## Struktur

- `src/game/content.ts` – zehn Monsterlinien samt Evolutionswerten
- `src/game/catalog.ts` – Zonen, Items, Dropchancen, Avatare und Rahmen
- `src/game/encounters.ts` – 30 normale Gegner, fünf Bosse und Ei-Zuordnung
- `src/game/rules.ts` – deterministische Formeln und Resetgrenzen
- `src/game/objectives.ts` – typisierte Aktivitäten, Tages-/Wochenperioden, Erfolge und Belohnungen
- `src/game/expeditions.ts` – Zeitaufträge, Slots, Anforderungen und Match-Boni
- `src/game/crafting.ts` – feste Herstellrezepte und Kostenprüfung
- `src/game/system-messages.ts` – lokale Systempost und einmalige Belohnungen
- `src/game/game-service.ts` – UI-Aktionsgrenze; später durch einen HTTP-Service ersetzbar
- `src/game/api-contract.ts` – DTOs und idempotente Backend-Kommandos
- `src/game/api-client.ts` – inaktiver, testbarer HTTP-Transport für das spätere echte Backend
- `src/game/game-service-port.ts` – gemeinsame asynchrone Intent-Schnittstelle für lokalen und HTTP-Service
- `src/game/contract-versions.ts` – Content-, Fehler- und Asset-Vertragsversionen
- `src/game/storage.ts` – ausschließlich lokaler Prototyp-Speicher und Migration
- `src/main.ts` – Darstellung und Kampf-Taktung
- `src/styles-v2.css` – isolierte Optik-V2-Schicht, Animationen und Zoneninszenierung
- `src/styles-game-first.css` – Login, Offline-Bericht und bildschirmfüllender Kampf-HUD
- `src/styles-progression-v3.css` – Gem-Arbeitsbereich und eigenständige Prestige-Szene
- `public/assets/monsters` – ausschließlich freigegebene 200×200-Runtime-Assets
- `public/assets/enemies` und `public/assets/bosses` – 35 weitere Imagegen-Runtime-Assets
- `public/assets/zones` – drei optimierte 1600×900-WebP-Kampfumgebungen
- `public/assets/gems` – 45 transparente 200×200-Gems nach Seltenheit
- `public/assets/asset-manifest.json` – 93 eindeutige Runtime-IDs mit Maßen und SHA-256
- `art-source` – HD-Master, Chroma-Quellen und archivierte Stiltests

## Zentrale Dokumente

- `docs/PRODUCT_ROADMAP.md` – abhakebarer 8×4-Arbeitsplan vom Prototyp über PostgreSQL bis zum Launch
- `docs/GAMEPLAY_FOUNDATION_SPEC.md` – verbindliche Zielbalance, Resetmatrix, E2E-Ablauf und UI-Zustände
- `docs/GAME_CONCEPT.md` – verbindliche Produkt- und Gameplay-Quelle
- `docs/ART_DIRECTION_V2.md` – neue visuelle Richtung, Zonenprompts und schnelle Anpassung
- `docs/PLAYER_ENTRY_FLOW.md` – verbindlicher Ablauf von Login bis Hauptkampfszene
- `docs/ONLINE_ARCHITECTURE.md` – direkter Weg zu Accounts, PostgreSQL, PvP und Gilden
- `docs/PRE_BACKEND_ROADMAP.md` – vollständige Reihenfolge und Fertig-Kriterien vor dem Serverbau
- `docs/DATABASE_BLUEPRINT.md` – verbindliches PostgreSQL-Modell für Besitz und Transaktionen
- `docs/ASSET_PIPELINE.md` – HD-200×200- und spätere PixelLab-API-Pipeline
- `docs/PIXELLAB_ANIMATION_CONTRACT.md` – Frame-, Anker-, Namens- und API-Jobvertrag für Animationen
- `docs/ASSET_PROMPTS.md` – reproduzierbare Designprompts der ersten Monster
- `docs/UI_SYSTEM.md` – verbindliche Farben, Komponenten und Responsive-Regeln
- `docs/CONTENT_PIPELINE.md` – Dev-Konzept für Zonenpflege, Validierung und Live-Veröffentlichung
- `docs/CUSTOMIZATION_GUIDE.md` – schnelle Übersicht: welche Werte du morgen wo änderst
- `docs/CORE_GAME_LOOP.md` – kompletter Spielkreislauf und Resetgrenzen
- `docs/GEM_SYSTEM.md` – Gem-Regeln, 45er-Katalog und reproduzierbarer Asset-Prompt
- `docs/ECONOMY_BALANCE.md` – alle Quellen, Senken, Rezepte und Missbrauchsschutz-Regeln
- `docs/MONSTER_ROSTER.md` – alle zehn Linien mit Designbriefs und PixelLab-Prompts
- `docs/ENCOUNTER_CATALOG.md` – Gegnerverteilung, Bosse und Zonen-Rollensynergien

`localStorage` ist nur für diese Grundversion autoritativ. Sobald Accounts existieren, berechnet ausschließlich der Server Gold, Drops, Brutzeiten, Fragmente, Hyperlevel, Gem-Besitz, Ausrüstung, Evolutionen und Prestige.
