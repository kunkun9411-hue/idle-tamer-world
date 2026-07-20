import type { CombatRole, Element, GemColor, GemRarity, GemShape, ItemId } from "./types";

export const BALANCE = {
  cache: {
    baseCapacity: 90,
    capacityPerExtractionLevel: 12,
    maxOfflineSeconds: 8 * 60 * 60,
    offlineSecondsPerReward: 45,
  },
  evolution: {
    requiredLevel: 20,
    coreCost: 3,
    fragmentCost: 30,
  },
  hatch: {
    duplicateFragments: 10,
    baseDurationMs: 45_000,
  },
  drops: {
    eggBaseChance: 0.12,
    eggPityMisses: 7,
    trainingDataChance: 0.55,
    etherDustChance: 0.18,
    incubatorChargeChance: 0.04,
    gemChance: 0.04,
  },
} as const;

export interface GemDefinition {
  id: string;
  shape: GemShape;
  color: GemColor;
  rarity: GemRarity;
  name: string;
  attackPercent: number;
  hpPercent: number;
  image: string;
}

export const GEM_SHAPES: Record<GemShape, { name: string; glyph: string }> = {
  triangle: { name: "Dreieck", glyph: "△" },
  square: { name: "Quadrat", glyph: "□" },
  diamond: { name: "Raute", glyph: "◇" },
};

export const GEM_COLORS: Record<GemColor, { name: string; hex: string }> = {
  crimson: { name: "Karmin", hex: "#ef6672" },
  azure: { name: "Azur", hex: "#62b8ff" },
  jade: { name: "Jade", hex: "#68d6a2" },
  violet: { name: "Violett", hex: "#ab8cff" },
  amber: { name: "Bernstein", hex: "#f3bd62" },
};

export const GEM_RARITIES: Record<GemRarity, { name: string; potency: number }> = {
  common: { name: "Gewöhnlich", potency: 4 },
  rare: { name: "Selten", potency: 8 },
  mythic: { name: "Mythisch", potency: 14 },
};

const gemStats = (shape: GemShape, potency: number): Pick<GemDefinition, "attackPercent" | "hpPercent"> => {
  if (shape === "triangle") return { attackPercent: potency, hpPercent: 0 };
  if (shape === "square") return { attackPercent: 0, hpPercent: potency };
  const balanced = Math.round(potency * 0.7);
  return { attackPercent: balanced, hpPercent: balanced };
};

export const GEMS: GemDefinition[] = (Object.keys(GEM_RARITIES) as GemRarity[]).flatMap((rarity) =>
  (Object.keys(GEM_COLORS) as GemColor[]).flatMap((color) =>
    (Object.keys(GEM_SHAPES) as GemShape[]).map((shape) => ({
      id: `${rarity}-${color}-${shape}`,
      shape,
      color,
      rarity,
      name: `${GEM_COLORS[color].name}-${GEM_SHAPES[shape].name}`,
      ...gemStats(shape, GEM_RARITIES[rarity].potency),
      image: `/assets/gems/${rarity}/${shape}-${color}.png`,
    })),
  ),
);

export const getGem = (id: string): GemDefinition | undefined => GEMS.find((gem) => gem.id === id);

export const emptyGemInventory = (): Record<string, number> => Object.fromEntries(GEMS.map((gem) => [gem.id, 0]));

export interface ItemDefinition {
  id: ItemId;
  name: string;
  icon: string;
  rarity: "Gewöhnlich" | "Selten" | "Episch";
  description: string;
  source: string;
  action?: "train" | "accelerate";
}

export const ITEMS: ItemDefinition[] = [
  { id: "training_data", name: "Trainingsdaten", icon: "↗", rarity: "Gewöhnlich", description: "Erhöht das normale Level eines Monsters sofort um 1 – ohne Goldkosten.", source: "Normale Expeditionen", action: "train" },
  { id: "evolution_core", name: "Evolutionskern", icon: "◇", rarity: "Episch", description: "Drei Kerne entwickeln ein Rookie ab Level 20 in seine nächste Form.", source: "Zonenbosse und Story-Ziele" },
  { id: "incubator_charge", name: "Brutladung", icon: "○", rarity: "Selten", description: "Verkürzt eine laufende Inkubation sofort um 15 Sekunden.", source: "Seltene Expeditionsbeute", action: "accelerate" },
  { id: "ether_dust", name: "Etherstaub", icon: "✦", rarity: "Gewöhnlich", description: "Universelles Herstellmaterial für Trainingsdaten, Brutladungen und Evolutionskerne.", source: "Kampf, Zeit-Expeditionen und Offline-Erträge" },
];

export const emptyInventory = (): Record<ItemId, number> => ({
  training_data: 0,
  evolution_core: 0,
  incubator_charge: 0,
  ether_dust: 0,
});

export interface ZoneDefinition {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  element: Element;
  accent: string;
  stages: number;
  levelOffset: number;
  enemyPool: string[];
  bossPool: string[];
  synergies: ZoneSynergyDefinition[];
  unlockAfterZoneId?: string;
  backgroundKey: string;
}

export interface ZoneSynergyDefinition {
  id: string;
  name: string;
  roles: [CombatRole, CombatRole];
  description: string;
  attackPercent?: number;
  hpPercent?: number;
  goldPercent?: number;
  eggChanceBonus?: number;
  materialChanceBonus?: number;
}

export const COMBAT_ROLE_LABELS: Record<CombatRole, string> = {
  attacker: "Angriff",
  defender: "Verteidigung",
  support: "Support",
  controller: "Kontrolle",
  scout: "Späher",
};

export const ZONES: ZoneDefinition[] = [
  {
    id: "violet-rim",
    name: "Violetter Saum",
    subtitle: "Schwebende Ruinen",
    description: "Die erste stabile Grenze der Ether-Welt. Hier tauchen die ältesten Spuren des Virus auf.",
    element: "light",
    accent: "#a88bff",
    stages: 10,
    levelOffset: 0,
    enemyPool: ["flickerimp", "rootkin", "zapplet", "rainskip", "gloamite", "emberling", "pebblit", "currentail", "halopeep", "frostnip"],
    bossPool: ["crownroot-colossus", "pyroclast-seraph"],
    synergies: [
      { id: "rim-vanguard", name: "Vorhut-Signal", roles: ["attacker", "support"], description: "+18% Angriff und +10% Gold", attackPercent: 18, goldPercent: 10 },
      { id: "rim-convoy", name: "Schutzkonvoi", roles: ["defender", "support"], description: "+22% Leben und +4% Ei-Chance", hpPercent: 22, eggChanceBonus: 0.04 },
    ],
    backgroundKey: "zone.violet-rim",
  },
  {
    id: "glass-gardens",
    name: "Glasgärten",
    subtitle: "Kristallflora",
    description: "Lebende Archive speichern Erinnerungen in durchsichtigen Blättern und Lockrufen.",
    element: "earth",
    accent: "#75d3bd",
    stages: 10,
    levelOffset: 7,
    enemyPool: ["glasscarab", "vinecoil", "prismole", "staticress", "bloomcap", "mistray", "cindervex", "quartzling", "sunmidge", "mirehorn"],
    bossPool: ["mirrormaw-hydra", "tempest-leviathan"],
    synergies: [
      { id: "glass-analysis", name: "Archiv-Analyse", roles: ["scout", "controller"], description: "+8% Ei-Chance und +12% Materialchance", eggChanceBonus: 0.08, materialChanceBonus: 0.12 },
      { id: "glass-anchor", name: "Kristall-Anker", roles: ["attacker", "defender"], description: "+12% Angriff und +18% Leben", attackPercent: 12, hpPercent: 18 },
    ],
    unlockAfterZoneId: "violet-rim",
    backgroundKey: "zone.glass-gardens",
  },
  {
    id: "obsidian-fjord",
    name: "Obsidian-Fjord",
    subtitle: "Dunkle Strömung",
    description: "Ein kaltes Grenzgebiet zwischen alten Gildenfestungen und einem instabilen Weltriss.",
    element: "dark",
    accent: "#7e8ee8",
    stages: 10,
    levelOffset: 14,
    enemyPool: ["obsidrake", "riftling", "cryobat", "ashmaw", "nullshell", "stormelk", "duskweaver", "glacifin", "eclipsprout", "deepflare"],
    bossPool: ["nihil-warden"],
    synergies: [
      { id: "fjord-hunt", name: "Rissjagd", roles: ["attacker", "scout"], description: "+24% Angriff und +10% Materialchance", attackPercent: 24, materialChanceBonus: 0.1 },
      { id: "fjord-bastion", name: "Letzte Bastion", roles: ["defender", "controller"], description: "+30% Leben und +12% Gold", hpPercent: 30, goldPercent: 12 },
    ],
    unlockAfterZoneId: "glass-gardens",
    backgroundKey: "zone.obsidian-fjord",
  },
];

export const getZone = (id: string): ZoneDefinition => ZONES.find((zone) => zone.id === id) ?? ZONES[0];

export const getZoneSynergy = (
  zoneId: string,
  leadRole?: CombatRole,
  supportRole?: CombatRole,
): ZoneSynergyDefinition | null => {
  if (!leadRole || !supportRole) return null;
  return getZone(zoneId).synergies.find((synergy) =>
    (synergy.roles[0] === leadRole && synergy.roles[1] === supportRole) ||
    (synergy.roles[0] === supportRole && synergy.roles[1] === leadRole),
  ) ?? null;
};

export interface AvatarDefinition {
  id: string;
  name: string;
  glyph: string;
  colors: [string, string];
  unlock: string;
}

export const AVATARS: AvatarDefinition[] = [
  { id: "wanderer", name: "Weltenwanderer", glyph: "W", colors: ["#b9a5ff", "#403765"], unlock: "Standard" },
  { id: "keeper", name: "Archivhüterin", glyph: "A", colors: ["#79d8c2", "#244b4a"], unlock: "Standard" },
  { id: "knight", name: "Ether-Ritter", glyph: "E", colors: ["#c8cedc", "#394052"], unlock: "Rang 5" },
  { id: "breeder", name: "Brutmeister", glyph: "B", colors: ["#e0aecc", "#59384f"], unlock: "5 Monster" },
  { id: "researcher", name: "Resonanzforscher", glyph: "R", colors: ["#d7c47d", "#534823"], unlock: "Forschung 5" },
  { id: "void", name: "Riftläufer", glyph: "Ø", colors: ["#9a89dc", "#231e3e"], unlock: "Prestige 1" },
];

export interface FrameDefinition {
  id: string;
  name: string;
  colors: [string, string];
  unlock: string;
}

export const FRAMES: FrameDefinition[] = [
  { id: "silver", name: "Gebürstetes Silber", colors: ["#ebe9ef", "#777481"], unlock: "Standard" },
  { id: "violet", name: "Violette Resonanz", colors: ["#c7b5ff", "#6f51c7"], unlock: "Standard" },
  { id: "gold", name: "Zonenbrecher", colors: ["#f0d590", "#8c692b"], unlock: "Erster Zonenboss" },
  { id: "prism", name: "Prismatisches Archiv", colors: ["#78d9c5", "#9e86ef"], unlock: "5 Monster" },
  { id: "guild", name: "Gilden-Chromosom", colors: ["#e1a7d7", "#6853c3"], unlock: "Später: Gilden-DNA" },
];
