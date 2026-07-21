import type { AuthoritativeRunSnapshot } from "@idle-tamer/contracts";

import type { GameState, MonsterInstance } from "./types";

const FOUNDATION_GEM_IDS = [
  "common-crimson-triangle",
  "common-azure-square",
  "common-violet-diamond",
] as const;

const safeRunNumber = (value: string, label: string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${label} liegt außerhalb des sicheren Browserbereichs.`);
  return parsed;
};

const repairOrphanedFoundationGems = (state: GameState): void => {
  if (state.activityCounters.gem_equip <= 0) return;
  const equipped = new Set(state.roster.flatMap((monster) => Object.values(monster.gemSlots)).filter((gemId): gemId is string => Boolean(gemId)));
  const pending = new Set(state.pendingGems);
  for (const gemId of FOUNDATION_GEM_IDS) {
    if ((state.gemInventory[gemId] ?? 0) <= 0 && !equipped.has(gemId) && !pending.has(gemId)) state.gemInventory[gemId] = 1;
  }
};

export const applyAuthoritativeRunSnapshot = (state: GameState, snapshot: AuthoritativeRunSnapshot): void => {
  repairOrphanedFoundationGems(state);
  state.resources.gold = safeRunNumber(snapshot.gold, "Gold");
  state.pendingGold = safeRunNumber(snapshot.pendingGold, "Kampfspeicher-Gold");
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
  const active = state.roster.find((monster) => monster.definitionId === snapshot.activeMonster.definitionId) ?? state.roster[0];
  if (active) {
    active.level = snapshot.activeMonster.level;
    state.activeMonsterUid = active.uid;
  }
};

export const combatMonsterForAuthority = (monster: MonsterInstance, serverAuthoritative: boolean): MonsterInstance =>
  serverAuthoritative
    ? { ...monster, hyperLevel: 0, evolution: "rookie", gemSlots: {} }
    : monster;
