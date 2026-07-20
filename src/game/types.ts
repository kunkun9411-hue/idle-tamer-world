export type Element = "fire" | "water" | "earth" | "lightning" | "ice" | "light" | "dark";
export type EvolutionStage = "rookie" | "evolved";
export type ItemId = "training_data" | "evolution_core" | "incubator_charge" | "ether_dust";
export type CombatRole = "attacker" | "defender" | "support" | "controller" | "scout";
export type GemShape = "triangle" | "square" | "diamond";
export type GemColor = "crimson" | "azure" | "jade" | "violet" | "amber";
export type GemRarity = "common" | "rare" | "mythic";
export type ActivityId = "victory" | "boss_victory" | "cache_claim" | "hatch" | "monster_discovery" | "level_up" | "hyper_up" | "evolution" | "gem_equip" | "prestige" | "expedition_start" | "expedition_complete";

export interface EvolutionDefinition {
  name: string;
  species: string;
  role: string;
  combatRole?: CombatRole;
  baseHp: number;
  baseAttack: number;
  accent: string;
  glyph: string;
  description: string;
  sprite?: string;
  nativeFacing?: "left" | "right";
}

export interface MonsterDefinition {
  id: string;
  name: string;
  species: string;
  element: Element;
  role: string;
  combatRole: CombatRole;
  baseHp: number;
  baseAttack: number;
  accent: string;
  glyph: string;
  description: string;
  sprite?: string;
  nativeFacing?: "left" | "right";
  evolution: EvolutionDefinition;
}

export interface MonsterInstance {
  uid: string;
  definitionId: string;
  level: number;
  hyperLevel: number;
  evolution: EvolutionStage;
  generation: number;
  gemSlots: Partial<Record<GemShape, string>>;
}

export interface Resources {
  gold: number;
  cores: number;
}

export type ItemInventory = Record<ItemId, number>;

export interface IncubationState {
  definitionId: string;
  startedAt: number;
  hatchAt: number;
}

export interface ZoneRunProgress {
  stage: number;
  clears: number;
}

export interface ProfileCustomization {
  avatarId: string;
  frameId: string;
}

export interface TimedExpeditionState {
  id: string;
  slot: number;
  definitionId: string;
  monsterUid: string;
  startedAt: number;
  completesAt: number;
  rewardMultiplier: number;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  combatEffects: boolean;
  reducedMotion: boolean;
  numberFormat: "compact" | "full";
}

export interface GameState {
  version: 9;
  playerName: string;
  resources: Resources;
  pendingGold: number;
  pendingEggs: string[];
  pendingItems: ItemInventory;
  pendingGems: string[];
  cacheSlotsUsed: number;
  eggInventory: Record<string, number>;
  fragments: Record<string, number>;
  inventory: ItemInventory;
  gemInventory: Record<string, number>;
  roster: MonsterInstance[];
  activeMonsterUid: string;
  supportMonsterUid: string;
  incubation: IncubationState | null;
  currentZoneId: string;
  unlockedZoneIds: string[];
  highestZoneNumber: number;
  zoneProgress: Record<string, ZoneRunProgress>;
  runVictories: number;
  totalVictories: number;
  prestigeCount: number;
  eggPity: number;
  research: {
    power: number;
    vitality: number;
    extraction: number;
    incubation: number;
  };
  profile: ProfileCustomization;
  claimedMilestones: number[];
  activityCounters: Record<ActivityId, number>;
  objectivePeriods: {
    dailyKey: string;
    weeklyKey: string;
    dailyBaseline: Record<ActivityId, number>;
    weeklyBaseline: Record<ActivityId, number>;
  };
  claimedObjectives: string[];
  expeditions: TimedExpeditionState[];
  settings: PlayerSettings;
  tutorialStep: number;
  claimedSystemMessages: string[];
  lastSavedAt: number;
}

export interface BattleState {
  enemyDefinitionId: string;
  enemyLevel: number;
  playerHp: number;
  enemyHp: number;
  playerMaxHp: number;
  enemyMaxHp: number;
  playerNextAttackAt: number;
  enemyNextAttackAt: number;
  recoveryUntil: number;
  status: "fighting" | "victory" | "recovering";
  log: string[];
  playerHit: boolean;
  enemyHit: boolean;
  playerDamageTaken: number;
  enemyDamageTaken: number;
}
