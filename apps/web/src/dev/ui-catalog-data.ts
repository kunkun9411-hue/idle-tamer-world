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
  {
    id: "mobile-combat-navigation-overlap",
    priority: "P0",
    title: "Mobile Kampf- und Bereichsnavigation überlagern sich",
    description: "Sieben Bereichsziele umbrechen in zwei Reihen und belegen denselben Raum wie die sechs Kampfkontrollen.",
    blocks: ["B.02", "B.03"],
    appliesAt: { maxWidth: 900 },
  },
  {
    id: "subpage-account-overflow",
    priority: "P1",
    title: "Accountleiste ragt auf 1280 px aus dem Viewport",
    description: "Die rechte Kante der Accountleiste liegt auf Unterseiten rund acht Pixel außerhalb des sichtbaren Bereichs.",
    blocks: ["B.02", "B.07"],
    appliesAt: { minWidth: 1_280 },
  },
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
  { id: "primary-button", name: "Aktionsrahmen", path: "/assets/ui/chrome/primary-button-frame-v1.webp", runtime: "1024x384 WebP" },
  { id: "avatar-frame", name: "Avatarrahmen", path: "/assets/ui/chrome/avatar-frame-v1.webp", runtime: "512x512 WebP" },
  { id: "ether-divider", name: "Ether-Trenner", path: "/assets/ui/chrome/ether-divider-v1.webp", runtime: "1024x256 WebP" },
] as const;

export const knownUiDebtIdsForWidth = (width: number): string[] => KNOWN_UI_DEBTS
  .filter((debt) => (debt.appliesAt.minWidth === undefined || width >= debt.appliesAt.minWidth)
    && (debt.appliesAt.maxWidth === undefined || width <= debt.appliesAt.maxWidth))
  .map((debt) => debt.id)
  .sort();
