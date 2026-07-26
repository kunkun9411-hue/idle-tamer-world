export type RoadmapBBlock = "B.01" | "B.02" | "B.03" | "B.04" | "B.05" | "B.06" | "B.07" | "B.08";
export type UiDebtPriority = "P0" | "P1" | "P2";

export interface UiSurfaceDefinition {
  id: string;
  name: string;
  area: string;
  states: string[];
  blocks: RoadmapBBlock[];
}

export interface UiStateDefinition {
  id: string;
  name: string;
  purpose: string;
  previewQuery?: string;
}

export interface UiViewportDefinition {
  id: "desktop" | "tablet" | "mobile";
  name: string;
  width: number;
  height: number;
}

export interface UiDebtDefinition {
  id: string;
  priority: UiDebtPriority;
  title: string;
  description: string;
  blocks: RoadmapBBlock[];
  appliesAt: { minWidth?: number; maxWidth?: number };
}

export interface UiTypographyRole {
  id: string;
  name: string;
  size: string;
  lineHeight: string;
  weight: number;
  use: string;
}

export const UI_COLOR_TOKENS = [
  "bg", "panel-solid", "panel-raised", "silver", "silver-2", "muted",
  "violet", "violet-bright", "success", "warning", "danger",
] as const;

export const UI_TYPOGRAPHY_ROLES: UiTypographyRole[] = [
  { id: "display-hero", name: "Hero", size: "clamp(48px, 6vw, 82px)", lineHeight: ".96", weight: 580, use: "Login, Roadmap und große Einstiege" },
  { id: "display-scene", name: "Szenentitel", size: "clamp(32px, 4vw, 52px)", lineHeight: "1.02", weight: 580, use: "Hauptszene und Seitenauftakt" },
  { id: "heading-page", name: "Seitentitel", size: "28px", lineHeight: "1.12", weight: 620, use: "Unterseiten und Dialoge" },
  { id: "heading-card", name: "Kartentitel", size: "18px", lineHeight: "1.25", weight: 650, use: "Karten, Panels und Gruppen" },
  { id: "body-large", name: "Einleitung", size: "16px", lineHeight: "1.6", weight: 450, use: "Erklärende Haupttexte" },
  { id: "body", name: "Fließtext", size: "14px", lineHeight: "1.55", weight: 450, use: "Reguläre UI-Texte" },
  { id: "body-small", name: "Sekundärtext", size: "12px", lineHeight: "1.45", weight: 550, use: "Metadaten und Hilfetexte" },
  { id: "label", name: "Label", size: "12px", lineHeight: "1.2", weight: 750, use: "Buttons, Chips und kurze Statuswerte" },
  { id: "value", name: "Spielwert", size: "20px", lineHeight: "1.1", weight: 650, use: "Gold, Level, Kosten und Fortschritt" },
];

export const UI_FOUNDATION_SCALES = [
  { id: "space", name: "Abstand", values: "4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px" },
  { id: "radius", name: "Radien", values: "6 · 8 · 12 · 16 · 24 px · rund" },
  { id: "motion", name: "Bewegung", values: "120 · 180 · 300 ms · reduced-motion" },
  { id: "layer", name: "Ebenen", values: "0 · 10 · 20 · 30 · 50 · 70 · 80 · 90" },
] as const;

export const UI_VIEWPORTS: UiViewportDefinition[] = [
  { id: "desktop", name: "Laptop", width: 1_280, height: 720 },
  { id: "tablet", name: "Tablet", width: 1_024, height: 768 },
  { id: "mobile", name: "Smartphone", width: 390, height: 844 },
];

export const UI_STATES: UiStateDefinition[] = [
  { id: "standard", name: "Standard", purpose: "Geladene Oberfläche mit echten Daten." },
  { id: "loading", name: "Laden", purpose: "Blockiert Doppelaktionen ohne Layoutsprung.", previewQuery: "loading" },
  { id: "empty", name: "Leer", purpose: "Erklärt Ursache und nächsten sinnvollen Schritt." },
  { id: "locked", name: "Gesperrt", purpose: "Nennt die konkrete Freischaltbedingung." },
  { id: "offline", name: "Offline", purpose: "Bewahrt Eingaben und ermöglicht Wiederholung.", previewQuery: "offline" },
  { id: "conflict", name: "Konflikt", purpose: "Verhindert das Überschreiben neuerer Revisionen.", previewQuery: "conflict" },
  { id: "error", name: "Fehler", purpose: "Beschreibt Problem und nächste Aktion.", previewQuery: "error" },
  { id: "success", name: "Erfolg", purpose: "Bestätigt sichtbar die tatsächliche Änderung." },
  { id: "full", name: "Voll/Maximal", purpose: "Erklärt Kapazität, Senke oder Endzustand." },
  { id: "reduced-motion", name: "Reduzierte Bewegung", purpose: "Alle Informationen bleiben ohne Animation erhalten." },
];

export const UI_SURFACES: UiSurfaceDefinition[] = [
  { id: "S01", name: "Login und Registrierung", area: "Account", states: ["standard", "loading", "offline", "error", "success"], blocks: ["B.02", "B.07"] },
  { id: "S02", name: "Starterwahl", area: "Einstieg", states: ["standard", "loading", "empty", "error", "success"], blocks: ["B.04"] },
  { id: "S03", name: "Offline-Bericht", area: "Rückkehr", states: ["standard", "empty", "full", "success"], blocks: ["B.01", "B.03"] },
  { id: "S04", name: "Hauptkampfszene", area: "Kampf", states: ["standard", "loading", "locked", "success", "reduced-motion"], blocks: ["B.03"] },
  { id: "S05", name: "Kampf-HUD", area: "Kampf", states: ["standard", "empty", "locked", "full"], blocks: ["B.02", "B.03"] },
  { id: "S06", name: "Auftragszentrale", area: "Fortschritt", states: ["standard", "empty", "locked", "success", "full"], blocks: ["B.04"] },
  { id: "S07", name: "Zeit-Expeditionen", area: "Fortschritt", states: ["standard", "empty", "locked", "success", "full"], blocks: ["B.04"] },
  { id: "S08", name: "Monster-Habitat und Gems", area: "Sammlung", states: ["standard", "empty", "locked", "success", "full"], blocks: ["B.04"] },
  { id: "S09", name: "Brutstation", area: "Sammlung", states: ["standard", "empty", "loading", "locked", "success"], blocks: ["B.04"] },
  { id: "S10", name: "Inventar und Etherwerkstatt", area: "Sammlung", states: ["standard", "empty", "locked", "success", "full"], blocks: ["B.04"] },
  { id: "S11", name: "Ether-Forschung", area: "Dauerfortschritt", states: ["standard", "empty", "locked", "success", "full"], blocks: ["B.04"] },
  { id: "S12", name: "Prestige-Heiligtum", area: "Dauerfortschritt", states: ["standard", "locked", "loading", "success", "reduced-motion"], blocks: ["B.04", "B.08"] },
  { id: "S13", name: "Tamer-Profil", area: "Identität", states: ["standard", "empty", "locked", "success"], blocks: ["B.05"] },
  { id: "S14", name: "Gilde und Soziales", area: "Gemeinschaft", states: ["standard", "loading", "empty", "locked", "offline", "error", "success"], blocks: ["B.06"] },
  { id: "S15", name: "Globale Systemzustände", area: "System", states: ["loading", "offline", "conflict", "error", "success", "reduced-motion"], blocks: ["B.01", "B.07"] },
  { id: "S16", name: "Entwicklungsflächen", area: "Entwicklung", states: ["standard", "loading", "error"], blocks: ["B.01", "B.07"] },
];

export const UI_COMPONENT_GROUPS = [
  { id: "actions", name: "Aktionen", items: ["Primär", "Sekundär", "Ghost", "Disabled"] },
  { id: "inputs", name: "Eingaben", items: ["Text", "Passwort", "Checkbox", "Auswahl", "Validierung"] },
  { id: "navigation", name: "Navigation", items: ["Hauptbereich", "Kontext", "Tab", "Zurück", "Mobil"] },
  { id: "surfaces", name: "Flächen", items: ["Panel", "Karte", "Dialog", "Dock", "Popover"] },
  { id: "status", name: "Status", items: ["Chip", "Sync", "Banner", "Toast", "Fehler"] },
  { id: "progress", name: "Fortschritt", items: ["Lebenspunkte", "Mission", "Brut", "Forschung"] },
  { id: "cards", name: "Karten", items: ["Standard", "Aktiv", "Gesperrt", "Leer"] },
  { id: "resources", name: "Ressourcen", items: ["Icon", "Wert", "Kosten", "Delta", "Kapazität"] },
  { id: "overlays", name: "Überlagerungen", items: ["Modal", "Bestätigung", "Tooltip", "Kontextpanel"] },
  { id: "identity", name: "Identität", items: ["Avatar", "Rahmen", "Rang", "Profilchip"] },
] as const;

export const KNOWN_UI_DEBTS: UiDebtDefinition[] = [
  // Keep this list empty until a new, measured debt is intentionally assigned.
];

export const UI_ASSET_CONTRACTS = [
  { id: "monster", name: "Monsteranimation", runtime: "200×200 PNG/WebP", source: "PixelLab-Frames", textPolicy: "textfrei", document: "PIXELLAB_ANIMATION_CONTRACT.md" },
  { id: "avatar", name: "Profilbild", runtime: "512×512 WebP/PNG", source: "1024×1024 HD-Master", textPolicy: "textfrei", document: "ui/AVATAR_FRAME_CONTRACT.md" },
  { id: "frame", name: "Profilrahmen", runtime: "512×512 transparent PNG", source: "1024×1024 HD-Master", textPolicy: "textfrei", document: "ui/AVATAR_FRAME_CONTRACT.md" },
  { id: "zone", name: "Zonenwelt", runtime: "1600×900 WebP", source: "HD-Master ohne UI", textPolicy: "textfrei", document: "ART_DIRECTION_V2.md" },
  { id: "item", name: "Item und Ei", runtime: "200×200 transparent PNG", source: "HD-Master", textPolicy: "textfrei", document: "ASSET_PIPELINE.md" },
  { id: "ui-decoration", name: "UI-Rahmen und Ornament", runtime: "PNG/WebP/SVG nach Einsatz", source: "ImageGen oder Codegrafik", textPolicy: "keine Texte, Zahlen oder Pseudoschrift", document: "ASSET_PIPELINE.md" },
] as const;

export const UI_GENERATED_CHROME = [
  { id: "panel-frame", name: "Panelrahmen", path: "/assets/ui/chrome/panel-frame-v1.webp", runtime: "1024x1024 WebP" },
  { id: "offline-report-frame", name: "Offline-Bericht Rahmen", path: "/assets/ui/chrome/offline-report-frame-v4.png", runtime: "1024x1024 transparent PNG" },
  { id: "primary-button", name: "Aktionsrahmen", path: "/assets/ui/chrome/primary-button-frame-v1.webp", runtime: "1024x384 WebP" },
  { id: "avatar-frame", name: "Avatarrahmen", path: "/assets/ui/chrome/avatar-frame-v1.webp", runtime: "512x512 WebP" },
  { id: "ether-divider", name: "Ether-Trenner", path: "/assets/ui/chrome/ether-divider-v1.webp", runtime: "1024x256 WebP" },
] as const;

export const UI_MODULAR_KIT_ITEMS = [
  {
    id: "A01",
    family: "Rahmen",
    name: "Große universelle Rahmenecke",
    path: "/assets/ui/kit/frame/corner-large-v1.webp",
    runtime: "512×512 WebP",
    use: "Drehbares Eckmodul für große Fenster und Dialoge",
    state: "FREIGEGEBEN",
  },
  {
    id: "A02",
    family: "Rahmen",
    name: "Dicke horizontale Rahmenkante",
    path: "/assets/ui/kit/frame/edge-thick-horizontal-v1.webp",
    runtime: "1024×192 WebP",
    use: "Gerade, streckbare Kante für große Fenster und Dialoge",
    state: "FREIGEGEBEN",
  },
  {
    id: "A03",
    family: "Rahmen",
    name: "Dicke vertikale Rahmenkante",
    path: "/assets/ui/kit/frame/edge-thick-vertical-v1.webp",
    runtime: "192×1024 WebP",
    use: "Verlustfreie 90°-Ableitung von A02 für die Fensterseiten",
    state: "ABGELEITET",
  },
  {
    id: "A04",
    family: "Rahmen",
    name: "Dünne horizontale Rahmenkante",
    path: "/assets/ui/kit/frame/edge-thin-horizontal-v1.webp",
    runtime: "1024×64 WebP",
    use: "Leichte streckbare Kontur für Karten, Tooltips und Sekundärflächen",
    state: "FREIGEGEBEN",
  },
  {
    id: "A05",
    family: "Rahmen",
    name: "Dünne vertikale Rahmenkante",
    path: "/assets/ui/kit/frame/edge-thin-vertical-v1.webp",
    runtime: "64×1024 WebP",
    use: "Verlustfreie 90°-Ableitung von A04 für kompakte Seitenkonturen",
    state: "ABGELEITET",
  },
  {
    id: "A06",
    family: "Rahmen",
    name: "Kompakte Kartenrahmenecke",
    path: "/assets/ui/kit/frame/corner-compact-v1.webp",
    runtime: "256×256 WebP",
    use: "Drehbare leichte Ecke für Karten, Tooltips und Sekundärfenster",
    state: "FREIGEGEBEN",
  },
  {
    id: "A07",
    family: "Rahmen",
    name: "Minimale Tooltip-Rahmenecke",
    path: "/assets/ui/kit/frame/corner-tooltip-v1.webp",
    runtime: "192×192 WebP",
    use: "Kurze ruhige Eckkappe für Tooltips, Hinweise und Mikropanels",
    state: "FREIGEGEBEN",
  },
  { id: "A08", family: "Rahmen", name: "Gerader horizontaler Verbinder", path: "/assets/ui/kit/frame/connector-horizontal-v1.webp", runtime: "1024×192 WebP", use: "Streckbarer Verbinder für Fensterleisten und Karten", state: "FREIGEGEBEN" },
  { id: "A09", family: "Rahmen", name: "Gerader vertikaler Verbinder", path: "/assets/ui/kit/frame/connector-vertical-v1.webp", runtime: "192×1024 WebP", use: "90°-Ableitung von A08 für Seitenleisten", state: "ABGELEITET" },
  { id: "A10", family: "Rahmen", name: "Verzierter horizontaler Verbinder", path: "/assets/ui/kit/frame/connector-ornate-horizontal-v1.webp", runtime: "1024×192 WebP", use: "Fokusleisten, Dialogköpfe und besondere Abschnitte", state: "FREIGEGEBEN" },
  { id: "A11", family: "Rahmen", name: "Verzierter vertikaler Verbinder", path: "/assets/ui/kit/frame/connector-ornate-vertical-v1.webp", runtime: "192×1024 WebP", use: "90°-Ableitung von A10 für verschachtelte Schalen", state: "ABGELEITET" },
  { id: "A12", family: "Rahmen", name: "Horizontale Endkappe", path: "/assets/ui/kit/frame/endcap-horizontal-v1.webp", runtime: "256×192 WebP", use: "Saubere Abschlüsse für Leisten und Trenner", state: "FREIGEGEBEN" },
  { id: "A13", family: "Rahmen", name: "Vertikale Endkappe", path: "/assets/ui/kit/frame/endcap-vertical-v1.webp", runtime: "192×256 WebP", use: "90°-Ableitung von A12 für Seitenabschlüsse", state: "ABGELEITET" },
  { id: "A14", family: "Rahmen", name: "T-Verbindung", path: "/assets/ui/kit/frame/junction-t-v1.webp", runtime: "256×256 WebP", use: "Verschachtelte Karten und geteilte Informationsflächen", state: "FREIGEGEBEN" },
  { id: "A15", family: "Rahmen", name: "Fokus-Eckaufsatz", path: "/assets/ui/kit/frame/cap-focus-v1.webp", runtime: "256×256 WebP", use: "Aktive Auswahl, Primäraktion und Prestige-Fokus", state: "FREIGEGEBEN" },
  { id: "A16", family: "Rahmen", name: "Warnungs-Eckaufsatz", path: "/assets/ui/kit/frame/cap-warning-v1.webp", runtime: "256×256 WebP", use: "Fehler, Warnungen und kapazitätsnahe Zustände", state: "FREIGEGEBEN" },
  { id: "A17", family: "Rahmen", name: "Kompakter Ether-Trenner", path: "/assets/ui/kit/frame/divider-compact-v1.webp", runtime: "1024×128 WebP", use: "Kurze horizontale Hierarchietrenner", state: "FREIGEGEBEN" },
  { id: "A18", family: "Rahmen", name: "Kleine Ether-Niete", path: "/assets/ui/kit/frame/rivet-small-v1.webp", runtime: "128×128 WebP", use: "Wiederholbares Detail für Karten und Buttonkanten", state: "FREIGEGEBEN" },
] as const;

export const UI_ECONOMY_ICONS = [
  ["F01", "Silber-Ether-Münze", "Währungschip und Gold-/Run-Ertrag"],
  ["F02", "Ether-Premiumkristall", "Premiumressource und Prestigeaufladung"],
  ["F03", "Monsterfragment", "Zucht- und Evolutionsfragmente"],
  ["F04", "Forschungsmaterial", "Forschungs- und Expeditionskosten"],
  ["F05", "Gilden-DNA", "Gemeinsame DNA-Investitionen"],
  ["F06", "Starter-Ei", "Drop aus dem Hauptkampf"],
  ["F07", "Dreieck-Gem", "Equipment-Slot: Angriff"],
  ["F08", "Quadrat-Gem", "Equipment-Slot: Verteidigung"],
  ["F09", "Raute-Gem", "Equipment-Slot: Support"],
  ["F10", "Hyperlevel-Fragment", "Permanenter Run-übergreifender Fortschritt"],
  ["F11", "Evolutionskern", "Entwicklung und Grundwerte"],
  ["F12", "Expeditionsmarke", "Zeit-Expeditionen und Belohnungen"],
  ["F13", "Gilden-Essenz", "Gildenaufgaben und DNA"],
  ["F14", "Kampfmaterial", "Offline-Speicher und Crafting"],
  ["F15", "Offline-Speicher", "Kapazitäts- und Offlinefortschritt"],
  ["F16", "Freischaltkristall", "Zonen- und Systemfreischaltungen"],
].map(([id, name, use]) => ({
  id,
  family: "Ökonomie",
  name,
  path: `/assets/ui/kit/economy/${id.toLowerCase()}-v1.webp`,
  runtime: "256×256 WebP",
  use,
  state: "FREIGEGEBEN",
}));

export const UI_SYSTEM_ICONS = [
  ["G01", "Start und Kampf"], ["G02", "Weltkarte"], ["G03", "Monster-Habitat"], ["G04", "Brutstation"],
  ["G05", "Inventar"], ["G06", "Forschung"], ["G07", "Expedition"], ["G08", "Auftrag und Quest"],
  ["G09", "Prestige"], ["G10", "Gilde"], ["G11", "Gilden-DNA"], ["G12", "Freunde"], ["G13", "Chat"],
  ["G14", "Rangliste"], ["G15", "Profil"], ["G16", "Post"], ["G17", "Einstellungen"], ["G18", "Audio an"], ["G20", "Hilfe"], ["G21", "Information"], ["G22", "Warnung"], ["G23", "Erfolg und Haken"], ["G24", "Fehler"], ["G25", "Schließen"], ["G26", "Zurück"], ["G28", "Hinzufügen"], ["G29", "Entfernen"], ["G30", "Sperre"], ["G31", "Filter"], ["G32", "Sortieren"], ["G33", "Suche"], ["G34", "Aktualisieren"], ["G35", "Menü"], ["G36", "Mehr/Optionen"],
].map(([id, name]) => ({
  id,
  family: "System",
  name,
  path: `/assets/ui/kit/system/${id.toLowerCase()}-v1.webp`,
  runtime: "256×256 WebP",
  use: "Textfreie Navigationsebene; Label bleibt lokalisierbares HTML",
  state: "FREIGEGEBEN",
}));

export const UI_SURFACE_ASSETS = [
  ["B01", "Ruhige Fensterfläche", "Große Dialoge und Hauptfenster"],
  ["B02", "Erhöhte Kartenfläche", "Karten mit leicht angehobener Hierarchie"],
  ["B03", "Kompakte Kartenfläche", "Nebeninformationen und kurze Panels"],
  ["B04", "Tooltipfläche", "Kontext-Hinweise mit lokalisierbarem HTML"],
  ["B05", "Eingabefläche", "Textfelder und Account-Eingaben"],
  ["B06", "Dropdownfläche", "Auswahl- und Filterkontext"],
  ["B07", "Gesperrte Flächenauflage", "Freischaltbedingungen ohne Layoutsprung"],
  ["B08", "Hover-Lichtauflage", "Feines Feedback für interaktive Flächen"],
  ["B09", "Fokus-Lichtauflage", "Tastaturfokus und Primärziel ohne Layoutsprung"],
  ["B10", "Auswahl-Lichtauflage", "Dauerhaft gewählte Karte, Tab oder Monster"],
  ["B11", "Fehler-Lichtauflage", "Ungültige Eingabe und fehlgeschlagene Aktion"],
  ["B12", "Erfolg-Lichtauflage", "Bestätigte Änderung und abgeschlossene Aktion"],
  ["B13", "Subtile Glasrauschtextur", "Leise, wiederholbare Tiefe für Ether-Flächen"],
  ["B14", "Tiefe Graphittextur", "Modal- und Overlay-Tiefe hinter HTML"],
].map(([id, name, use]) => ({
  id,
  family: "Fläche",
  name,
  path: `/assets/ui/kit/surface/${id.toLowerCase()}-v1.webp`,
  runtime: id === "B13" || id === "B14" ? "512×512 WebP · Material" : "768×384 WebP",
  use,
  state: "FREIGEGEBEN",
}));

const UI_CHROME_PRIMITIVE_DEFS = [
  ["C01", "Große Kopfleistenschale", "chrome", "Kopfbereiche und große Abschnittstitel"],
  ["C02", "Kompakte Kopfleistenschale", "chrome", "Kompakte Karten- und Seitenköpfe"],
  ["C03", "Fußleistenschale", "chrome", "Fußzeilen, Dockbereiche und Aktionen"],
  ["C04", "Dünner Ether-Trenner", "chrome", "Leichte Hierarchie zwischen Informationen"],
  ["C05", "Dicker Ether-Trenner", "chrome", "Starke Szenen- und Paneltrennung"],
  ["C06", "Kurzer symmetrischer Trenner", "chrome", "Kleine Gruppen und Tooltips"],
  ["C07", "Aktiver Tab-Unterstrich", "chrome", "Aktiver Navigationszustand"],
  ["C08", "Aktiver Seitenmarker", "chrome", "Seitenleiste und aktuelle Szene"],
  ["C09", "Zentraler Fokusdiamant", "chrome", "Titel-, Auswahl- und Prestigeachsen"],
  ["C10", "Kleine Eckniete", "chrome", "Wiederholbare Kantenakzente"],
  ["C11", "Kleine Ether-Kristallfassung", "chrome", "Ressourcenchip und Tabmarker"],
  ["C12", "Große Ether-Kristallfassung", "chrome", "Hero-Header und Prestige-/Gilden-DNA-Kopf"],
  ["C13", "Passive Etherlinie", "chrome", "Ruhige Trennerlinie ohne Interaktion"],
  ["C14", "Aktive Etherlinie", "chrome", "Aktive Auswahl, Fortschritt und Fokuszustand"],
  ["C15", "Warnungsleiste", "chrome", "Warnbanner mit echtem HTML-Text und Icon"],
  ["C16", "Erfolgsleiste", "chrome", "Erfolgsbanner nach serverseitiger Änderung"],
  ["D01", "Primärer Buttonrahmen", "control", "Hauptaktion mit HTML-Label"],
  ["D02", "Sekundärer Buttonrahmen", "control", "Nebenaktion und Rücksprung"],
  ["D03", "Ghost-Buttonrahmen", "control", "Leichte Kontextaktion"],
  ["D04", "Kompakter Buttonrahmen", "control", "Kleine Toolbar- und Kartenaktion"],
  ["D05", "Gefahren-Buttonrahmen", "control", "Bestätigung und Prestige-Reset mit Warnstatus"],
  ["D06", "Runde Icon-Buttonfassung", "control", "Settings, Audio und Schließen mit Tooltip"],
  ["D07", "Eckige Icon-Buttonfassung", "control", "Toolbar, Filter und Inventaraktionen"],
  ["D08", "Tabrahmen Standard", "control", "Nicht ausgewählter Bereichstab"],
  ["D09", "Tabrahmen aktiv", "control", "Aktiver Tab zusammen mit C07/C14"],
  ["D10", "Äußerer Segmentsteuerungsrahmen", "control", "Zwei-/Drei-Wege-Auswahl ohne Textasset"],
  ["D11", "Toggle-Schiene", "control", "Audio-/Auto-Toggle in an/aus"],
  ["D12", "Toggle-Knopf", "control", "D11 mit Tastaturfokus und Disabled"],
  ["D13", "Slider-Schiene", "control", "Lautstärke-/Helligkeitsregler"],
  ["D14", "Slider-Griff", "control", "D13 mit Tastatur- und Touchbedienung"],
  ["D15", "Checkboxfassung", "control", "Ungeprüft, geprüft und deaktiviert"],
  ["D16", "Radiobuttonfassung", "control", "Starter-/Zonenauswahl mit exakt einer Auswahl"],
  ["E01", "Ressourcen-Chiprahmen", "info", "Icon, Wert und Besitzanzeige"],
  ["E02", "Wertplakette", "info", "Level, Rang und numerische Werte"],
  ["E03", "Kostenplakette", "info", "Upgrade- und Kaufkosten"],
  ["E04", "Horizontale Fortschrittsfassung", "info", "XP, Brut, HP und Missionen"],
  ["E05", "Statusbadge neutral", "info", "Neutrale Rückmeldung mit HTML-Status"],
  ["E09", "Große horizontale Fortschrittsfassung", "info", "Lange XP-, Brut-, HP- und Missionswerte"],
  ["E10", "Kompakte Fortschrittsfassung", "info", "Kompakte Karten- und Nebenwerte"],
  ["E11", "Runde Fortschrittsfassung", "info", "Avatarnahe Lade- und Timerwerte"],
  ["E14", "Tooltip-Pfeil oben", "info", "Richtungshinweis für Tooltip-HTML"],
  ["E18", "Benachrichtigungspunkt", "info", "Unread-Signal auf Navigation und Profil"],
] as const;

export const UI_CHROME_PRIMITIVES = UI_CHROME_PRIMITIVE_DEFS.map(([id, name, family, use]) => ({
  id,
  family,
  name,
  path: `/assets/ui/kit/${family}/${id.toLowerCase()}-v1.webp`,
  runtime: "WebP · textfrei",
  use,
  state: "FREIGEGEBEN",
}));

export const UI_INFO_DERIVATIONS = [
  ["E06", "Statusbadge aktiv", "E05", "CSS-Variante · aktiver Token", "violet"],
  ["E07", "Statusbadge Warnung", "E05", "CSS-Variante · Warn-Token", "warning"],
  ["E08", "Statusbadge Fehler", "E05", "CSS-Variante · Fehler-Token", "error"],
  ["E12", "Fortschrittsfüllung neutral", "E09", "CSS-Füllung · neutraler Token", "neutral"],
  ["E13", "Fortschrittsfüllung Ether", "E09", "CSS-Füllung · Ether-Token", "ether"],
  ["E15", "Tooltip-Pfeil unten", "E14", "Rotation · 180°", "rotate-180"],
  ["E16", "Tooltip-Pfeil links", "E14", "Rotation · 90°", "rotate-90"],
  ["E17", "Tooltip-Pfeil rechts", "E14", "Rotation · 270°", "rotate-270"],
].map(([id, name, base, use, variant]) => ({
  id,
  name,
  base,
  use,
  variant,
  path: `/assets/ui/kit/info/${base.toLowerCase()}-v1.webp`,
  state: "CSS-/ROTATIONSABLEITUNG",
}));

export const UI_SYSTEM_DERIVATIONS = [
  ["G19", "Audio aus", "G18", "CSS-Variante · Ether-Wellen gedimmt", "audio-off"],
  ["G27", "Vorwärts", "G26", "CSS-Rotation 180° aus dem Zurück-Master", "forward"],
].map(([id, name, base, use, variant]) => ({
  id,
  name,
  base,
  use,
  variant,
  path: `/assets/ui/kit/system/${base.toLowerCase()}-v1.webp`,
  state: "CSS-ABLEITUNG",
}));

export const UI_IDENTITY_ASSETS = [
  ["H01", "Neutraler runder Avatarrahmen", "Profilbild ohne Seltenheitsbonus"],
  ["H02", "Gewöhnlicher Avatarrahmen", "Erster wechselbarer Rahmen"],
  ["H03", "Seltener Avatarrahmen", "Seltene Profilidentität"],
  ["H04", "Epischer Avatarrahmen", "Epische Profilidentität"],
  ["H05", "Gildenleiter-Aufsatz", "Gemeinsame Rolle in Gilde und Chat"],
  ["H06", "Offiziers-Aufsatz", "Gildenberechtigung sichtbar"],
  ["H07", "Online-Statusfassung", "Live-Status ohne Text im Asset"],
  ["H08", "Rollenplakette Angriff", "Monsterrolle als visuelles Signal"],
  ["H09", "Rollenplakette Verteidigung", "Monsterrolle als visuelles Signal"],
  ["H10", "Rollenplakette Support", "Monsterrolle als visuelles Signal"],
  ["H11", "Rangfassung klein", "Kompakte Rangdarstellung im Profil und Chat"],
  ["H12", "Rangfassung groß", "Große Rangdarstellung im Profil-Header"],
].map(([id, name, use]) => ({
  id,
  family: "Identität",
  name,
  path: `/assets/ui/kit/identity/${id.toLowerCase()}-v1.webp`,
  runtime: "192×192 WebP",
  use,
  state: "FREIGEGEBEN",
}));

export const knownUiDebtIdsForWidth = (width: number): string[] => KNOWN_UI_DEBTS
  .filter((debt) => (debt.appliesAt.minWidth === undefined || width >= debt.appliesAt.minWidth)
    && (debt.appliesAt.maxWidth === undefined || width <= debt.appliesAt.maxWidth))
  .map((debt) => debt.id)
  .sort();
