export interface GuildGeneDefinition {
  id: string;
  name: string;
  chromosome: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  effectPerLevel: number;
  effectUnit: string;
  color: string;
}

export const GUILD_GENES: GuildGeneDefinition[] = [
  { id: "wealth-signal", name: "Wohlstands-Gen", chromosome: "Ökonomie", description: "Mehr Gold aus automatischen Kämpfen.", maxLevel: 10, baseCost: 50, costStep: 35, effectPerLevel: 0.25, effectUnit: "% Gold", color: "#d9bd72" },
  { id: "boss-resonance", name: "Boss-Resonanz", chromosome: "Kampf", description: "Mehr Schaden gegen den wöchentlichen Gildenboss.", maxLevel: 10, baseCost: 60, costStep: 40, effectPerLevel: 0.5, effectUnit: "% Bossschaden", color: "#d987a9" },
  { id: "hyper-memory", name: "Hyper-Gedächtnis", chromosome: "Monster", description: "Verbessert spätere Fragmentbelohnungen in Gildenaktivitäten.", maxLevel: 8, baseCost: 70, costStep: 50, effectPerLevel: 0.25, effectUnit: "% Fragmente", color: "#ad8cff" },
  { id: "expedition-link", name: "Expeditions-Link", chromosome: "Expedition", description: "Erhöht Belohnungen gemeinsamer Aufträge behutsam.", maxLevel: 8, baseCost: 65, costStep: 45, effectPerLevel: 0.35, effectUnit: "% Belohnung", color: "#72d4c0" },
  { id: "research-lattice", name: "Forschungs-Gitter", chromosome: "Forschung", description: "Stärkt Forschungs- und Komfortfortschritt ohne große Kampfsprünge.", maxLevel: 6, baseCost: 90, costStep: 65, effectPerLevel: 0.2, effectUnit: "% Forschung", color: "#78aee8" },
  { id: "incubation-spiral", name: "Brut-Spirale", chromosome: "Ultra", description: "Verkürzt Brutzeiten für Mitglieder minimal.", maxLevel: 6, baseCost: 100, costStep: 70, effectPerLevel: 0.25, effectUnit: "% Brutzeit", color: "#d995db" },
] as const;

export const guildGeneCost = (geneId: string, level: number): number => {
  const gene = GUILD_GENES.find((entry) => entry.id === geneId);
  if (!gene || level >= gene.maxLevel) return 0;
  return gene.baseCost + gene.costStep * level;
};

export const GUILD_TASKS = [
  { id: "daily-victories", name: "Gemeinsame Jagd", activity: "victory", target: 50, rewardDna: 40 },
  { id: "daily-expeditions", name: "Verbundene Pfade", activity: "expedition_complete", target: 5, rewardDna: 55 },
  { id: "daily-hatches", name: "Neue Resonanzen", activity: "hatch", target: 3, rewardDna: 45 },
] as const;

export const GUILD_BOSS = {
  definitionId: "chromawyrm-prime",
  baseHp: 5_000,
  attackCooldownMs: 30_000,
  defeatRewardDna: 150,
} as const;

export const GUILD_EXPEDITION = {
  definitionId: "ether-vein-survey",
  name: "Vermessung der Etherader",
  durationMs: 5 * 60 * 1_000,
  rewardDna: 90,
} as const;
