import type { ActivityId, EvolutionStage, GemShape, ItemId, PlayerSettings, ResearchId } from "./domain";
import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID } from "./versions";

export const RUN_CONTRACT_VERSION = 2 as const;

export type RunProgressionStatus = "fighting" | "blocked" | "cache_full";

export interface RunZoneProgressSnapshot {
  stage: number;
  clears: string;
}

export interface AuthoritativeMonsterSnapshot {
  uid: string;
  definitionId: string;
  level: number;
  hyperLevel: number;
  evolution: EvolutionStage;
  generation: number;
  gemSlots: Partial<Record<GemShape, string>>;
}

export interface AuthoritativeIncubationSnapshot {
  id: string;
  definitionId: string;
  startedAt: string;
  hatchAt: string;
}

export interface AuthoritativeExpeditionSnapshot {
  id: string;
  slot: number;
  definitionId: string;
  monsterUid: string;
  startedAt: string;
  completesAt: string;
  rewardMultiplier: number;
}

export interface AuthoritativeCollectionSnapshot {
  roster: AuthoritativeMonsterSnapshot[];
  activeMonsterUid: string;
  supportMonsterUid: string;
  eggInventory: Record<string, string>;
  fragments: Record<string, string>;
  inventory: Record<ItemId, string>;
  gemInventory: Record<string, string>;
  pendingEggs: string[];
  pendingItems: Record<ItemId, string>;
  pendingGems: string[];
  incubation: AuthoritativeIncubationSnapshot | null;
  expeditions: AuthoritativeExpeditionSnapshot[];
  research: Record<ResearchId, number>;
  prestigeCount: number;
  cores: string;
  eggPity: number;
  claimedMilestones: number[];
  activityCounters: Record<ActivityId, number>;
  objectivePeriods: {
    dailyKey: string;
    weeklyKey: string;
    dailyBaseline: Record<ActivityId, number>;
    weeklyBaseline: Record<ActivityId, number>;
  };
  claimedObjectives: string[];
  settings: PlayerSettings;
  tutorialStep: number;
  claimedSystemMessages: string[];
  lastServerSaveAt: string;
}

export interface AuthoritativeRunSnapshot {
  revision: number;
  serverTime: string;
  contentReleaseId: typeof CONTENT_RELEASE_ID;
  balanceReleaseId: typeof BALANCE_RELEASE_ID;
  gold: string;
  pendingGold: string;
  cacheSlotsUsed: number;
  cacheCapacity: number;
  activeMonster: {
    definitionId: string;
    level: number;
  };
  currentZoneId: string;
  unlockedZoneIds: string[];
  highestZoneNumber: number;
  zoneProgress: Record<string, RunZoneProgressSnapshot>;
  runVictories: string;
  totalVictories: string;
  progressionStatus: RunProgressionStatus;
  nextCombatAt: string;
  collection: AuthoritativeCollectionSnapshot;
}

export interface RunBootstrapResponse {
  runContractVersion: typeof RUN_CONTRACT_VERSION;
  snapshot: AuthoritativeRunSnapshot;
  settlement: {
    victoriesAdded: number;
    goldAdded: string;
    eggsAdded: number;
    itemsAdded: number;
    gemsAdded: number;
  };
}

export type RunCommand =
  | { type: "cache.claim" }
  | { type: "monster.level_up"; definitionId: string }
  | { type: "monster.train"; monsterUid: string }
  | { type: "monster.hyper_up"; monsterUid: string }
  | { type: "monster.evolve"; monsterUid: string }
  | { type: "monster.activate"; monsterUid: string }
  | { type: "monster.support"; monsterUid: string }
  | { type: "gem.equip"; monsterUid: string; gemId: string }
  | { type: "gem.unequip"; monsterUid: string; shape: GemShape }
  | { type: "zone.select"; zoneId: string }
  | { type: "incubation.start"; definitionId: string }
  | { type: "incubation.accelerate" }
  | { type: "incubation.hatch" }
  | { type: "research.buy"; researchId: ResearchId }
  | { type: "milestone.claim"; target: number }
  | { type: "objective.claim"; objectiveId: string }
  | { type: "expedition.start"; slot: number; definitionId: string; monsterUid: string }
  | { type: "expedition.claim"; expeditionId: string }
  | { type: "crafting.craft"; recipeId: string }
  | { type: "settings.update"; key: keyof PlayerSettings; value: boolean | PlayerSettings["numberFormat"] }
  | { type: "tutorial.advance"; skip: boolean }
  | { type: "system_message.claim"; messageId: string }
  | { type: "prestige.activate" };

export interface RunCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: RunCommand;
}

export type RunEventType =
  | "cache.claimed"
  | "monster.level_up"
  | "monster.trained"
  | "monster.hyper_up"
  | "monster.evolved"
  | "monster.activated"
  | "monster.supported"
  | "gem.equipped"
  | "gem.unequipped"
  | "zone.selected"
  | "incubation.started"
  | "incubation.accelerated"
  | "incubation.hatched"
  | "research.bought"
  | "milestone.claimed"
  | "objective.claimed"
  | "expedition.started"
  | "expedition.claimed"
  | "crafting.crafted"
  | "settings.updated"
  | "tutorial.advanced"
  | "system_message.claimed"
  | "prestige.activated";

export interface RunCommandResponse {
  runContractVersion: typeof RUN_CONTRACT_VERSION;
  accepted: true;
  replayed: boolean;
  snapshot: AuthoritativeRunSnapshot;
  event: {
    type: RunEventType;
    payload: Record<string, string | number | boolean>;
  };
}
