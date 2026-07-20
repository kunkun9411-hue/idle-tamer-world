import { BALANCE, emptyGemInventory, emptyInventory, ENEMY_ROTATION, findEncounter, getGem, getMonster, getMonsterForm, getZone, getZoneSynergy, type ZoneSynergyDefinition } from "@idle-tamer/content";
import type { EvolutionStage, GameState, MonsterInstance } from "@idle-tamer/contracts";
import { createObjectivePeriods, emptyActivityCounters } from "./objectives";

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `tamer-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const EVOLUTION_LABELS: Record<EvolutionStage, string> = {
  rookie: "Rookie",
  evolved: "Evolution",
};

export const createMonster = (
  definitionId: string,
  level = 1,
  generation = 1,
  hyperLevel = 0,
  evolution: EvolutionStage = "rookie",
  createUid: () => string = uid,
): MonsterInstance => ({ uid: createUid(), definitionId, level, hyperLevel, evolution, generation, gemSlots: {} });

export const createInitialState = (now: () => number = Date.now): GameState => {
  const activityCounters = emptyActivityCounters();
  return ({
  version: 9,
  playerName: "Tamer",
  resources: { gold: 100, cores: 0 },
  pendingGold: 0,
  pendingEggs: [],
  pendingItems: emptyInventory(),
  pendingGems: [],
  cacheSlotsUsed: 0,
  eggInventory: { mossbit: 1 },
  fragments: {},
  inventory: { ...emptyInventory(), training_data: 2, incubator_charge: 1 },
  gemInventory: {
    ...emptyGemInventory(),
    "common-crimson-triangle": 1,
    "common-azure-square": 1,
    "common-violet-diamond": 1,
  },
  roster: [],
  activeMonsterUid: "",
  supportMonsterUid: "",
  incubation: null,
  currentZoneId: "violet-rim",
  unlockedZoneIds: ["violet-rim"],
  highestZoneNumber: 1,
  zoneProgress: { "violet-rim": { stage: 1, clears: 0 } },
  runVictories: 0,
  totalVictories: 0,
  prestigeCount: 0,
  eggPity: 0,
  research: { power: 0, vitality: 0, extraction: 0, incubation: 0 },
  profile: { avatarId: "wanderer", frameId: "silver" },
  claimedMilestones: [],
  activityCounters,
  objectivePeriods: createObjectivePeriods(activityCounters),
  claimedObjectives: [],
  expeditions: [],
  settings: { soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" },
  tutorialStep: 0,
  claimedSystemMessages: [],
  lastSavedAt: now(),
  });
};

export const levelCost = (level: number): number => 24 + level * 16;
export const hyperLevelCost = (hyperLevel: number): number => 10 + hyperLevel * 10;
export const cacheCapacity = (extractionLevel: number): number =>
  BALANCE.cache.baseCapacity + extractionLevel * BALANCE.cache.capacityPerExtractionLevel;

export const prestigePlayerStatMultiplier = (prestigeCount: number): number =>
  1 + Math.max(0, prestigeCount) * BALANCE.prestige.playerBaseStatPerPrestige;

export const prestigeGoldMultiplier = (prestigeCount: number): number =>
  1 + Math.max(0, prestigeCount) * BALANCE.prestige.repeatableGoldPerPrestige;

export const prestigeDropChanceBonus = (prestigeCount: number): number =>
  Math.max(0, prestigeCount) * BALANCE.prestige.dropChancePerPrestige;

export const prestigeEnemyMultiplier = (prestigeCount: number): number =>
  1 + Math.floor(Math.max(0, prestigeCount) / BALANCE.prestige.enemyStepInterval) * BALANCE.prestige.enemyPercentPerStep;

export const monsterMaxHp = (monster: MonsterInstance, prestigeCount = 0): number => {
  const form = getMonsterForm(monster);
  const runMultiplier = 1 + (monster.level - 1) * 0.14;
  const hyperMultiplier = 1 + monster.hyperLevel * 0.08;
  return Math.round(form.baseHp * (1 + monsterGemBonuses(monster).hpPercent / 100) * runMultiplier * hyperMultiplier * prestigePlayerStatMultiplier(prestigeCount));
};

export const monsterAttack = (monster: MonsterInstance, prestigeCount = 0): number => {
  const form = getMonsterForm(monster);
  const runMultiplier = 1 + (monster.level - 1) * 0.11;
  const hyperMultiplier = 1 + monster.hyperLevel * 0.07;
  return Math.round(form.baseAttack * (1 + monsterGemBonuses(monster).attackPercent / 100) * runMultiplier * hyperMultiplier * prestigePlayerStatMultiplier(prestigeCount));
};

export const monsterGemBonuses = (monster: MonsterInstance): { attackPercent: number; hpPercent: number } =>
  Object.values(monster.gemSlots).reduce((total, gemId) => {
    const gem = gemId ? getGem(gemId) : undefined;
    return {
      attackPercent: total.attackPercent + (gem?.attackPercent ?? 0),
      hpPercent: total.hpPercent + (gem?.hpPercent ?? 0),
    };
  }, { attackPercent: 0, hpPercent: 0 });

export const enemyForZone = (zoneId: string, stage: number, runVictories: number, zoneClears = 0): { definitionId: string; level: number; isBoss: boolean } => {
  const zone = getZone(zoneId);
  const isBoss = stage >= zone.stages;
  const definitionId = isBoss ? zone.bossPool[zoneClears % zone.bossPool.length] : zone.enemyPool[(stage - 1) % zone.enemyPool.length];
  return {
    definitionId,
    level: 1 + zone.levelOffset + Math.floor((stage - 1) / 2) + Math.floor(runVictories / 40),
    isBoss,
  };
};

/** Compatibility helper used by progression simulations. */
export const enemyForVictoryCount = (runVictories: number): { definitionId: string; level: number } => ({
  definitionId: ENEMY_ROTATION[runVictories % ENEMY_ROTATION.length],
  level: 1 + Math.floor(runVictories / 3),
});

export const enemyStats = (definitionId: string, level: number, prestigeCount = 0): { hp: number; attack: number } => {
  const definition = findEncounter(definitionId) ?? getMonster(definitionId);
  const prestigeMultiplier = prestigeEnemyMultiplier(prestigeCount);
  return {
    hp: Math.round(definition.baseHp * 0.72 * (1 + (level - 1) * 0.13) * prestigeMultiplier),
    attack: Math.max(4, Math.round(definition.baseAttack * 0.44 * (1 + (level - 1) * 0.1) * prestigeMultiplier)),
  };
};

export const rankForVictories = (totalVictories: number): number => 1 + Math.floor(totalVictories / 25);
export const researchCost = (level: number): number => 1 + Math.floor(level / 2);

export const playerMaxHp = (monster: MonsterInstance, vitalityLevel: number, zoneHpPercent = 0, prestigeCount = 0): number =>
  Math.round(monsterMaxHp(monster, prestigeCount) * (1 + vitalityLevel * 0.08) * (1 + zoneHpPercent / 100));

export const playerAttack = (monster: MonsterInstance, powerLevel: number, zoneAttackPercent = 0, prestigeCount = 0): number =>
  Math.round(monsterAttack(monster, prestigeCount) * (1 + powerLevel * 0.07) * (1 + zoneAttackPercent / 100));

export const activeZoneSynergy = (state: GameState): ZoneSynergyDefinition | null => {
  const lead = state.roster.find((monster) => monster.uid === state.activeMonsterUid);
  const support = state.roster.find((monster) => monster.uid === state.supportMonsterUid);
  return getZoneSynergy(
    state.currentZoneId,
    lead ? getMonsterForm(lead).combatRole : undefined,
    support ? getMonsterForm(support).combatRole : undefined,
  );
};

export const incubationDurationMs = (incubationLevel: number): number =>
  Math.max(BALANCE.hatch.minDurationMs, Math.round(BALANCE.hatch.baseDurationMs * (1 - incubationLevel * 0.1)));

export interface OfflineProgress {
  offlineSeconds: number;
  offlineGold: number;
  offlineSlots: number;
  offlineItems: ReturnType<typeof emptyInventory>;
}

/** Pure offline calculation. Browser storage and wall-clock access stay outside the rule. */
export const calculateOfflineProgress = (state: GameState, now: number): OfflineProgress => {
  const elapsed = Math.max(0, Math.floor((now - state.lastSavedAt) / 1_000));
  const offlineSeconds = Math.min(elapsed, BALANCE.cache.maxOfflineSeconds);
  const availableSlots = Math.max(0, cacheCapacity(state.research.extraction) - state.cacheSlotsUsed);
  const offlineSlots = state.roster.length > 0
    ? Math.min(availableSlots, Math.floor(offlineSeconds / BALANCE.cache.offlineSecondsPerReward))
    : 0;
  const offlineGold = Math.round(offlineSlots * 12 * (1 + state.research.extraction * 0.1) * prestigeGoldMultiplier(state.prestigeCount));
  const offlineItems = emptyInventory();
  offlineItems.training_data = Math.floor(offlineSlots / 3);
  offlineItems.ether_dust = Math.floor(offlineSlots / 8);
  return { offlineSeconds, offlineGold, offlineSlots, offlineItems };
};

export const prestigeCoreReward = (runVictories: number, highestZoneNumber: number): number =>
  highestZoneNumber < BALANCE.prestige.requiredZoneNumber || runVictories < 100
    ? 0
    : 1 + Math.floor((runVictories - 100) / 100);

export const eggDropChance = (eggPity: number): number => Math.min(1, BALANCE.drops.eggBaseChance + eggPity * 0.015);
export const isEggPityGuaranteed = (eggPity: number): boolean => eggPity >= BALANCE.drops.eggPityMisses;

export const canEvolve = (monster: MonsterInstance, evolutionCores: number, fragments: number): boolean =>
  monster.evolution === "rookie" &&
  monster.level >= BALANCE.evolution.requiredLevel &&
  evolutionCores >= BALANCE.evolution.coreCost &&
  fragments >= BALANCE.evolution.fragmentCost;
