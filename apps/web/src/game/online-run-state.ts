import type { AuthoritativeRunSnapshot } from "@idle-tamer/contracts";

import type { GameState, ItemId, MonsterInstance } from "./types";

const safeRunNumber = (value: string, label: string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${label} liegt außerhalb des sicheren Browserbereichs.`);
  return parsed;
};

const numericRecord = (record: Record<string, string>, label: string): Record<string, number> =>
  Object.fromEntries(Object.entries(record).map(([definitionId, amount]) => [definitionId, safeRunNumber(amount, `${label} ${definitionId}`)]));

/** Applies the complete server-owned solo state. localStorage remains only a UI cache. */
export const applyAuthoritativeRunSnapshot = (state: GameState, snapshot: AuthoritativeRunSnapshot): void => {
  const collection = snapshot.collection;
  state.resources.gold = safeRunNumber(snapshot.gold, "Gold");
  state.resources.cores = safeRunNumber(collection.cores, "Ether-Kerne");
  state.pendingGold = safeRunNumber(snapshot.pendingGold, "Kampfspeicher-Gold");
  state.pendingEggs = [...collection.pendingEggs];
  state.pendingItems = numericRecord(collection.pendingItems, "Kampfspeicher") as Record<ItemId, number>;
  state.pendingGems = [...collection.pendingGems];
  state.cacheSlotsUsed = snapshot.cacheSlotsUsed;
  state.currentZoneId = snapshot.currentZoneId;
  state.unlockedZoneIds = [...snapshot.unlockedZoneIds];
  state.highestZoneNumber = snapshot.highestZoneNumber;
  state.zoneProgress = Object.fromEntries(Object.entries(snapshot.zoneProgress).map(([zoneId, progress]) => [zoneId, {
    stage: progress.stage,
    clears: safeRunNumber(progress.clears, `${zoneId}-Abschlüsse`),
  }]));
  state.runVictories = safeRunNumber(snapshot.runVictories, "Run-Siege");
  state.totalVictories = safeRunNumber(snapshot.totalVictories, "Gesamtsiege");
  state.roster = collection.roster.map((monster) => ({ ...monster, gemSlots: { ...monster.gemSlots } }));
  state.activeMonsterUid = collection.activeMonsterUid;
  state.supportMonsterUid = collection.supportMonsterUid;
  state.eggInventory = numericRecord(collection.eggInventory, "Ei");
  state.fragments = numericRecord(collection.fragments, "Fragmente");
  state.inventory = numericRecord(collection.inventory, "Material") as Record<ItemId, number>;
  state.gemInventory = numericRecord(collection.gemInventory, "Gem");
  state.incubation = collection.incubation ? {
    definitionId: collection.incubation.definitionId,
    startedAt: Date.parse(collection.incubation.startedAt),
    hatchAt: Date.parse(collection.incubation.hatchAt),
  } : null;
  state.expeditions = collection.expeditions.map((expedition) => ({
    id: expedition.id,
    slot: expedition.slot,
    definitionId: expedition.definitionId,
    monsterUid: expedition.monsterUid,
    startedAt: Date.parse(expedition.startedAt),
    completesAt: Date.parse(expedition.completesAt),
    rewardMultiplier: expedition.rewardMultiplier,
  }));
  state.research = { ...collection.research };
  state.prestigeCount = collection.prestigeCount;
  state.eggPity = collection.eggPity;
  state.claimedMilestones = [...collection.claimedMilestones];
  state.activityCounters = { ...collection.activityCounters };
  state.objectivePeriods = {
    dailyKey: collection.objectivePeriods.dailyKey,
    weeklyKey: collection.objectivePeriods.weeklyKey,
    dailyBaseline: { ...collection.objectivePeriods.dailyBaseline },
    weeklyBaseline: { ...collection.objectivePeriods.weeklyBaseline },
  };
  state.claimedObjectives = [...collection.claimedObjectives];
  state.settings = { ...collection.settings };
  state.tutorialStep = collection.tutorialStep;
  state.claimedSystemMessages = [...collection.claimedSystemMessages];
  state.lastSavedAt = Date.parse(collection.lastServerSaveAt);
};

/** The authoritative simulator now includes Hyperlevel, evolution, gems and research. */
export const combatMonsterForAuthority = (monster: MonsterInstance, _serverAuthoritative: boolean): MonsterInstance => monster;
