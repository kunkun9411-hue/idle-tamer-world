import { findEncounter, getMonster, getZone, ZONES } from "@idle-tamer/content";
import type { RunProgressionStatus, RunZoneProgressSnapshot } from "@idle-tamer/contracts";

const PLAYER_ATTACK_INTERVAL_MS = 1_650;
const PLAYER_FIRST_ATTACK_MS = 700;
const ENEMY_ATTACK_INTERVAL_MS = 1_900;
const ENEMY_FIRST_ATTACK_MS = 1_250;
const RECOVERY_MS = 1_800;
const BLOCKED_RETRY_MS = 30_000;

export const AUTHORITATIVE_CACHE_CAPACITY = 90;

export interface AuthoritativeRunState {
  activeMonsterDefinitionId: string;
  activeMonsterLevel: number;
  currentZoneId: string;
  highestZoneNumber: number;
  zoneProgress: Record<string, RunZoneProgressSnapshot>;
  runVictories: bigint;
  totalVictories: bigint;
  progressionStatus: RunProgressionStatus;
  nextCombatAtMs: number;
}

export interface BattleOutcome {
  enemyDefinitionId: string;
  enemyLevel: number;
  wins: boolean;
  durationMs: number;
  gold: bigint;
  boss: boolean;
}

export interface RunSettlement {
  state: AuthoritativeRunState;
  victoriesAdded: number;
  goldAdded: bigint;
}

const boundedVictories = (victories: bigint): number => Number(victories > 40_000_000n ? 40_000_000n : victories);

const enemyAt = (state: AuthoritativeRunState) => {
  const zone = getZone(state.currentZoneId);
  const progress = state.zoneProgress[zone.id] ?? { stage: 1, clears: "0" };
  const stage = Math.max(1, Math.min(zone.stages, progress.stage));
  const clears = BigInt(progress.clears);
  const boss = stage >= zone.stages;
  const pool = boss ? zone.bossPool : zone.enemyPool;
  const poolIndex = boss ? Number(clears % BigInt(pool.length)) : (stage - 1) % pool.length;
  return {
    definitionId: pool[poolIndex],
    level: Math.min(1_000_000, 1 + zone.levelOffset + Math.floor((stage - 1) / 2) + Math.floor(boundedVictories(state.runVictories) / 40)),
    boss,
  };
};

export const authoritativeBattleOutcome = (state: AuthoritativeRunState): BattleOutcome => {
  const monster = getMonster(state.activeMonsterDefinitionId);
  const enemy = enemyAt(state);
  const encounter = findEncounter(enemy.definitionId) ?? getMonster(enemy.definitionId);
  const level = Math.max(1, state.activeMonsterLevel);
  const playerHp = Math.round(monster.baseHp * (1 + (level - 1) * 0.14));
  const playerAttack = Math.round(monster.baseAttack * (1 + (level - 1) * 0.11));
  const enemyHp = Math.round(encounter.baseHp * 0.72 * (1 + (enemy.level - 1) * 0.13));
  const enemyAttack = Math.max(4, Math.round(encounter.baseAttack * 0.44 * (1 + (enemy.level - 1) * 0.1)));
  const playerHits = Math.max(1, Math.ceil(enemyHp / playerAttack));
  const enemyHits = Math.max(1, Math.ceil(playerHp / enemyAttack));
  const playerKillAt = PLAYER_FIRST_ATTACK_MS + (playerHits - 1) * PLAYER_ATTACK_INTERVAL_MS;
  const enemyKillAt = ENEMY_FIRST_ATTACK_MS + (enemyHits - 1) * ENEMY_ATTACK_INTERVAL_MS;
  return {
    enemyDefinitionId: enemy.definitionId,
    enemyLevel: enemy.level,
    wins: playerKillAt <= enemyKillAt,
    durationMs: Math.max(2_500, Math.min(playerKillAt, enemyKillAt)) + RECOVERY_MS,
    gold: BigInt(9 + enemy.level * 4),
    boss: enemy.boss,
  };
};

const advanceVictory = (state: AuthoritativeRunState, boss: boolean): void => {
  const zone = getZone(state.currentZoneId);
  const progress = state.zoneProgress[zone.id] ?? { stage: 1, clears: "0" };
  state.runVictories += 1n;
  state.totalVictories += 1n;
  if (!boss) {
    state.zoneProgress[zone.id] = { ...progress, stage: Math.min(zone.stages, progress.stage + 1) };
    return;
  }
  state.zoneProgress[zone.id] = { stage: 1, clears: (BigInt(progress.clears) + 1n).toString() };
  const zoneIndex = ZONES.findIndex((entry) => entry.id === zone.id);
  if (zoneIndex >= 0 && zoneIndex + 1 < ZONES.length) {
    state.highestZoneNumber = Math.max(state.highestZoneNumber, zoneIndex + 2);
    const next = ZONES[zoneIndex + 1];
    state.zoneProgress[next.id] ??= { stage: 1, clears: "0" };
  }
};

export const settleAuthoritativeRun = (
  input: AuthoritativeRunState,
  nowMs: number,
  availableCacheSlots: number,
): RunSettlement => {
  const state: AuthoritativeRunState = {
    ...input,
    zoneProgress: Object.fromEntries(Object.entries(input.zoneProgress).map(([key, value]) => [key, { ...value }])),
  };
  let victoriesAdded = 0;
  let goldAdded = 0n;
  const available = Math.max(0, Math.min(AUTHORITATIVE_CACHE_CAPACITY, availableCacheSlots));

  if (available === 0) {
    state.progressionStatus = "cache_full";
    return { state, victoriesAdded, goldAdded };
  }

  while (victoriesAdded < available && state.nextCombatAtMs <= nowMs) {
    const outcome = authoritativeBattleOutcome(state);
    if (!outcome.wins) {
      state.progressionStatus = "blocked";
      state.nextCombatAtMs = nowMs + BLOCKED_RETRY_MS;
      break;
    }
    advanceVictory(state, outcome.boss);
    victoriesAdded += 1;
    goldAdded += outcome.gold;
    state.progressionStatus = "fighting";
    state.nextCombatAtMs += outcome.durationMs;
  }

  if (victoriesAdded === available && state.nextCombatAtMs <= nowMs) {
    state.progressionStatus = "cache_full";
    state.nextCombatAtMs = nowMs;
  }
  return { state, victoriesAdded, goldAdded };
};

export const runLevelCost = (level: number): bigint => BigInt(24 + Math.max(1, level) * 16);

export const resumeCombatAt = (state: AuthoritativeRunState, nowMs: number): number =>
  nowMs + authoritativeBattleOutcome({ ...state, progressionStatus: "fighting" }).durationMs;
