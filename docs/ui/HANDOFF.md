# Roadmap-A/B-UI-Arbeitsübergabe

Status: **Roadmap A 32/32 abgeschlossen · Roadmap B 28/32 · Übergabe an Roadmap C gesperrt**

## Aktuelle Statusautorität

Der maschinenlesbare Status in
`apps/web/public/roadmap/roadmap-status.json` ist die maßgebliche Quelle für
Roadmap B. `docs/ROADMAP_B_DESIGN_UI.md` bildet diesen Status als
Arbeitsdokument ab. Diese Übergabe ist nur eine Bedien- und Quellenübersicht
und darf keinen davon abweichenden Gate-Stand freigeben.

Aktuell sind **B.03.3, B.03.4, B.08.3 und B.08.4 offen**. Damit stehen
**28 von 32 Gates** auf abgeschlossen. Roadmap C darf erst beginnen, nachdem
die Kampfszene aus Spielersicht geprüft und abgenommen, der Gesamtpolish erneut
geprüft und beide Quellen auf 32/32 synchronisiert wurden.

## Schnellstart

```powershell
pnpm dev:web
```

Danach stehen bereit:

- Spiel: `http://127.0.0.1:5173/`
- UI-Katalog: `http://127.0.0.1:5173/dev/ui-catalog.html`
- feste Mobile-Vorschau: `http://127.0.0.1:5173/dev/mobile-preview.html`
- Asset-Galerie: `http://127.0.0.1:5173/dev/asset-gallery.html`
- öffentliche Roadmap: `http://127.0.0.1:5173/roadmap/`

## Automatische UI-Werkzeuge

```powershell
pnpm ui:audit
pnpm ui:capture
```

`ui:audit` prüft Desktop, Tablet und 390×844. Neue Überlagerungen oder Überläufe lassen den Test fehlschlagen. Die UI-Schulden-Allowlist ist leer; jeder neue Befund muss einem späteren Block zugeordnet werden.

`ui:capture` erzeugt für 1280×720, 1024×768 und 390×844 jeweils 17
Szenenbilder plus Fokus- und Hover-Zustand der Offline-Rückkehr. Vor jedem Lauf
wird nur der jeweilige Viewport-Ordner neu aufgebaut, damit keine veralteten
Dateien den aktuellen Nachweis verfälschen. Die Bilder landen unter
`artifacts/ui-captures/` und werden nicht eingecheckt.

## Verbindliche Quellen

| Frage | Quelle |
| --- | --- |
| Welche Flächen und Probleme existieren? | `SCENE_INVENTORY.md` |
| Welche Komponenten, Zustände und Viewports gelten? | `apps/web/src/dev/ui-catalog-data.ts` und `/dev/ui-catalog.html` |
| Welche Farben und Basiskomponenten gelten? | `../UI_SYSTEM.md` |
| Welche neuen Tokens und Komponenten werden zuerst gebaut? | `B01_DESIGN_SYSTEM_PLAN.md` |
| Welche seriellen UI-Elemente kommen als Nächstes? | `B01_NEXT_SERIAL_GATE.md` (G26/G27/G28/G29/G30/G31/G32/G33/G34/G35/G36/H09/H10/H11/H12 abgenommen; Serienliste abgeschlossen) |
| Was ist der maßgebliche Roadmap-B-Status? | `apps/web/public/roadmap/roadmap-status.json` (aktuell 28/32; B.03 und B.08 offen) |
| Wie weit sind B.02–B.08? | `B02_B08_PROGRESS.md` (nachweisbare Vorarbeit und offene Abnahmegrenzen) |
| Wie funktionieren Avatar und Rahmen? | `AVATAR_FRAME_CONTRACT.md` |
| Welche Assetmaße gelten? | `../ASSET_PIPELINE.md`, `../PIXELLAB_ANIMATION_CONTRACT.md` und UI-Katalog |
| Was darf UI niemals übernehmen? | `../API_CONTRACT_V8.md` und `../ONLINE_ARCHITECTURE.md` |
| In welcher Reihenfolge wird gestaltet? | `../ROADMAP_B_DESIGN_UI.md` |

## Aktuell erlaubte Layoutschulden

Aktuell gibt es keine zugelassene Layoutschuld. Neue Einträge benötigen einen
reproduzierbaren Befund, einen zuständigen B-Block und ein Abnahmekriterium.

Eine behobene Schuld muss aus Katalog, Dokument und Testallowlist gemeinsam entfernt werden. Eine neue Schuld darf nicht einfach ergänzt werden, um einen roten Test grün zu machen; sie benötigt Befund, zuständigen Block und Abnahmekriterium.

## Änderungsablauf in Roadmap B

1. betroffene Fläche und Zustand im Katalog bestimmen;
2. bestehende Server-, Content- und Assetverträge prüfen;
3. Änderung in Desktop und Mobile bauen;
4. `pnpm ui:audit` ausführen;
5. `pnpm ui:capture` erzeugen und Bilder vergleichen;
6. relevante E2E-, Kontrast- und Tastaturtests ausführen;
7. erst dann das jeweilige B-Gate abhaken.

Die vier offenen Gates werden erst nach derselben Prüfkette in
`apps/web/public/roadmap/roadmap-status.json` und
`docs/ROADMAP_B_DESIGN_UI.md` gemeinsam geschlossen. Dieser Ablauf ist für
Roadmap C und spätere UI-Erweiterungen wiederzuverwenden; er ist selbst keine
Freigabe für Roadmap C.

## Unverrückbare Grenze

Roadmap B darf Navigation, Hierarchie, Darstellung und Feedback vollständig verändern. Gold, Besitz, Zeitjobs, Progression, Prestige, Gildenrechte und Transaktionen bleiben jedoch serverautoritativ. PvP, Handel, Saisons, Events und neuer Content bleiben Roadmap C.
# UI-Baukasten-Batch 2026-07-22

Schritt 2 enthält jetzt den vollständigen visuellen Produktionssatz: 18 modulare Rahmenmodule, 14 Innenflächen, 42 Leisten-/Aktions-/Wertprimitive, 16 textfreie Ressourcen-/Item-Icons, 34 textfreie System-/Navigationsicons und 12 Identitätslayer. Die 136 Rasterelemente werden mit `scripts/prepare_ui_kit.py` erzeugt, über `apps/web/public/assets/ui/kit/ui-kit-manifest.json` ausgeliefert und im UI-Katalog (`/dev/ui-catalog.html#identity-kit`) als echte Karten dargestellt; zehn CSS-/Rotationsableitungen sind zusätzlich als `#info-variants` bzw. `#system-variants` sichtbar. Chroma-Quellen und HD-Master bleiben versioniert; Texte, Zahlen und Zustände werden ausschließlich als HTML/CSS gesetzt. G11 Gilden-DNA, G16 Post, G18 Audio an, G21 Information, G22 Warnung, G23 Erfolg, G24 Fehler, G25 Schließen, G26 Zurück, G28 Hinzufügen, G29 Entfernen, G30 Sperre, G31 Filter, G32 Sortieren, G33 Suche, G34 Aktualisieren, G35 Menü, G36 Mehr/Optionen, H09 Rollenplakette Verteidigung, H10 Rollenplakette Support, H11 Rangfassung klein und H12 Rangfassung groß sind abgenommen; G19 Audio aus und G27 Vorwärts sind als CSS-Zustände/Ableitung aus G18/G26 freigegeben, die serielle UI-Liste ist abgeschlossen.

# Spieler-Polish-Folge 2026-07-30

Der aktuelle lokale Stand schließt die in der echten Spieler- und
Capture-Prüfung bestätigten P1/P2-Befunde, ohne Roadmap B formal
vorwegzunehmen:

- vollständige Profilkarte auf Desktop, Tablet und Mobile in Kampf und
  Standardseiten;
- echte vorhandene HD-Porträts in Profilhero, Avatar-Katalog und HUD;
- kollisionsfreier Offline-Bericht mit 44-px-Mobile-Aktion;
- achtteilige Objectives-Navigation ohne zusätzlichen oder abgeschnittenen
  Slot;
- kompakte Expeditionskarten und ein handlungsorientierter Habitat-Leerzustand;
- verständliche Forschungszustände mit Kosten und Besitz sowie
  spielerbezogene Gilden-Texte;
- autoritative Rückkehrberichte melden nur neu hinzugekommene Beute statt den
  bereits wartenden Gesamtbestand.
- die mobile Kampfszene trennt fünf primäre Kampfaktionen von sechs ruhigeren
  Bereichszielen; der dort redundante globale Kampf-Eintrag entfällt;
- sämtliche sichtbare Spielertexte erklären Wirkung und Ergebnis statt
  interne Begriffe wie Ledger, atomare Buchung, Serverautorität oder
  API-Protokoll; der Online-Footer führt sicher zu Profil/Einstellungen.

Nachweis: `pnpm check:all`, `pnpm ui:audit` und `pnpm ui:capture` sind grün.
Der Vollcheck umfasst 67 Web-, 24 API-, 11 Datenbank-Unit-, 6 Core- und 53
lokale Browsertests; die zwei credentialgebundenen Live-E2E werden erst gegen
den deployten Stand ausgeführt. **B.03.3, B.03.4, B.08.3 und B.08.4 bleiben
bis zu dieser Live-Spielerabnahme offen; Roadmap B bleibt bei 28/32.**
