import { ZONES } from "./catalog";
import { createMonster } from "./rules";
import type { GameState, MonsterInstance } from "./types";

export type QaPreset = "zone-next" | "zone-10" | "resources" | "combat" | "prestige";

const ensureStarter = (state: GameState): MonsterInstance => {
  const active = state.roster.find((monster) => monster.uid === state.activeMonsterUid);
  if (active) return active;
  if (state.roster[0]) {
    state.activeMonsterUid = state.roster[0].uid;
    return state.roster[0];
  }
  const starter = createMonster("pyrook", 1, 1, 0, "rookie", () => "qa-pyrook");
  state.roster.push(starter);
  state.activeMonsterUid = starter.uid;
  return starter;
};

const ensureCombatPair = (state: GameState): void => {
  const front = ensureStarter(state);
  const reserveDefinitionId = front.definitionId === "bramblet" ? "pyrook" : "bramblet";
  let reserve = state.roster.find((monster) => monster.uid !== front.uid && monster.definitionId === reserveDefinitionId);
  reserve ??= state.roster.find((monster) => monster.uid !== front.uid);
  if (!reserve) {
    reserve = createMonster(reserveDefinitionId, 1, 1, 0, "rookie", () => `qa-${reserveDefinitionId}`);
    state.roster.push(reserve);
  }

  state.activeMonsterUid = front.uid;
  state.supportMonsterUid = "";
  state.expeditions = state.expeditions.filter((expedition) =>
    expedition.monsterUid !== front.uid && expedition.monsterUid !== reserve.uid,
  );
};

export const unlockThroughZone = (state: GameState, requestedZoneNumber: number): void => {
  const zoneNumber = Math.max(1, Math.min(ZONES.length, Math.floor(requestedZoneNumber)));
  const unlocked = ZONES.slice(0, zoneNumber);
  state.unlockedZoneIds = unlocked.map((zone) => zone.id);
  for (const zone of unlocked) state.zoneProgress[zone.id] ??= { stage: 1, clears: 0 };
  state.currentZoneId = unlocked[unlocked.length - 1].id;
  state.highestZoneNumber = Math.max(state.highestZoneNumber, zoneNumber);
};

export const applyQaPreset = (state: GameState, preset: QaPreset): void => {
  ensureStarter(state);
  switch (preset) {
    case "zone-next": {
      const current = Math.max(1, ZONES.findIndex((zone) => zone.id === state.currentZoneId) + 1);
      unlockThroughZone(state, current + 1);
      break;
    }
    case "zone-10":
      unlockThroughZone(state, 10);
      break;
    case "resources":
      state.resources.gold += 1_000_000;
      state.inventory.training_data += 100;
      state.inventory.evolution_core += 30;
      state.inventory.incubator_charge += 30;
      state.inventory.ether_dust += 500;
      for (const monster of state.roster) state.fragments[monster.definitionId] = (state.fragments[monster.definitionId] ?? 0) + 500;
      break;
    case "combat":
      ensureCombatPair(state);
      for (const monster of state.roster) {
        monster.level = Math.max(monster.level, 100);
        monster.hyperLevel = Math.max(monster.hyperLevel, 10);
      }
      break;
    case "prestige":
      unlockThroughZone(state, 10);
      state.runVictories = Math.max(state.runVictories, 100);
      state.totalVictories = Math.max(state.totalVictories, state.runVictories);
      for (const monster of state.roster) monster.level = Math.max(monster.level, 100);
      break;
  }
};
