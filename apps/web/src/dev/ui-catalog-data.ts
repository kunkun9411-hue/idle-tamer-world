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
  { id: "inputs", name: "Eingaben", items: ["Text", "Passwort", "Checkbox", "Validierung"] },
  { id: "status", name: "Status", items: ["Chip", "Sync", "Banner", "Toast"] },
  { id: "progress", name: "Fortschritt", items: ["Lebenspunkte", "Mission", "Brut", "Forschung"] },
  { id: "cards", name: "Karten", items: ["Standard", "Aktiv", "Gesperrt", "Leer"] },
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
  { id: "monster", name: "Monsteranimation", runtime: "200×200 PNG/WebP", source: "PixelLab-Frames", document: "PIXELLAB_ANIMATION_CONTRACT.md" },
  { id: "avatar", name: "Profilbild", runtime: "512×512 WebP/PNG", source: "1024×1024 HD-Master", document: "ui/AVATAR_FRAME_CONTRACT.md" },
  { id: "frame", name: "Profilrahmen", runtime: "512×512 transparent PNG", source: "1024×1024 HD-Master", document: "ui/AVATAR_FRAME_CONTRACT.md" },
  { id: "zone", name: "Zonenwelt", runtime: "1600×900 WebP", source: "HD-Master ohne UI", document: "ART_DIRECTION_V2.md" },
  { id: "item", name: "Item und Ei", runtime: "200×200 transparent PNG", source: "HD-Master", document: "ASSET_PIPELINE.md" },
] as const;

export const knownUiDebtIdsForWidth = (width: number): string[] => KNOWN_UI_DEBTS
  .filter((debt) => (debt.appliesAt.minWidth === undefined || width >= debt.appliesAt.minWidth)
    && (debt.appliesAt.maxWidth === undefined || width <= debt.appliesAt.maxWidth))
  .map((debt) => debt.id)
  .sort();
