import { BALANCE, emptyGemInventory, emptyInventory, ZONES } from "./catalog";
import { cacheCapacity, createInitialState } from "./rules";
import { createObjectivePeriods, emptyActivityCounters } from "./objectives";
import type { EvolutionStage, GameState, ItemInventory, MonsterInstance } from "./types";

const STORAGE_KEY = "idle-tamer.save.v8";
const PREVIOUS_STORAGE_KEYS = ["idle-tamer.save.v7", "idle-tamer.save.v6", "idle-tamer.save.v5", "idle-tamer.save.v4", "idle-tamer.save.v3"];
const LEGACY_STORAGE_KEY = "echobound.save.v1";

export interface LoadedGame {
  state: GameState;
  offlineSeconds: number;
  offlineGold: number;
  offlineSlots: number;
  offlineItems: ItemInventory;
  migrated: boolean;
}

export type SaveResult =
  | { ok: true; savedAt: number }
  | { ok: false; savedAt: number; reason: "storage-unavailable" };

const isValidState = (value: unknown): value is GameState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<GameState>;
  return (
    state.version === 8 &&
    Array.isArray(state.roster) &&
    typeof state.activeMonsterUid === "string" &&
    typeof state.lastSavedAt === "number" &&
    !!state.inventory &&
    !!state.zoneProgress &&
    !!state.profile &&
    !!state.gemInventory &&
    Array.isArray(state.pendingGems) &&
    !!state.activityCounters &&
    !!state.objectivePeriods &&
    Array.isArray(state.claimedObjectives) &&
    Array.isArray(state.expeditions) &&
    !!state.settings &&
    typeof state.tutorialStep === "number" &&
    Array.isArray(state.claimedSystemMessages)
  );
};

const migrateMonster = (value: unknown): MonsterInstance | null => {
  if (!value || typeof value !== "object") return null;
  const monster = value as Partial<MonsterInstance> & { ultraLevel?: number };
  if (!monster.uid || !monster.definitionId || typeof monster.level !== "number") return null;
  const stage: EvolutionStage = monster.evolution === "evolved" ? "evolved" : "rookie";
  return {
    uid: monster.uid,
    definitionId: monster.definitionId,
    level: monster.level,
    hyperLevel: typeof monster.hyperLevel === "number"
      ? monster.hyperLevel
      : typeof monster.ultraLevel === "number" ? monster.ultraLevel : 0,
    evolution: stage,
    generation: typeof monster.generation === "number" ? monster.generation : 1,
    gemSlots: monster.gemSlots && typeof monster.gemSlots === "object" ? monster.gemSlots : {},
  };
};

const backfillActivityCounters = (
  roster: MonsterInstance[],
  totalVictories: number,
  prestigeCount: number,
  zoneProgress: GameState["zoneProgress"],
): GameState["activityCounters"] => {
  const counters = emptyActivityCounters();
  counters.victory = totalVictories;
  counters.boss_victory = Object.values(zoneProgress).reduce((sum, progress) => sum + progress.clears, 0);
  counters.monster_discovery = new Set(roster.map((monster) => monster.definitionId)).size;
  counters.level_up = roster.reduce((sum, monster) => sum + Math.max(0, monster.level - 1), 0);
  counters.hyper_up = roster.reduce((sum, monster) => sum + monster.hyperLevel, 0);
  counters.evolution = roster.filter((monster) => monster.evolution === "evolved").length;
  counters.gem_equip = roster.reduce((sum, monster) => sum + Object.keys(monster.gemSlots).length, 0);
  counters.prestige = prestigeCount;
  return counters;
};

const normalizeActivityCounters = (value: unknown): GameState["activityCounters"] =>
  value && typeof value === "object"
    ? { ...emptyActivityCounters(), ...value } as GameState["activityCounters"]
    : emptyActivityCounters();

const migrateModernState = (value: Record<string, unknown>): GameState => {
  const initial = createInitialState();
  const roster = Array.isArray(value.roster)
    ? value.roster.map(migrateMonster).filter((monster): monster is MonsterInstance => monster !== null)
    : [];
  const activeMonsterUid = typeof value.activeMonsterUid === "string" && roster.some((monster) => monster.uid === value.activeMonsterUid)
    ? value.activeMonsterUid
    : roster[0]?.uid ?? "";
  const totalVictories = typeof value.totalVictories === "number" ? value.totalVictories : 0;
  const prestigeCount = typeof value.prestigeCount === "number" ? value.prestigeCount : 0;
  const zoneProgress = value.zoneProgress && typeof value.zoneProgress === "object" ? value.zoneProgress as GameState["zoneProgress"] : initial.zoneProgress;
  const hasObjectiveState = (value.version === 6 || value.version === 7) && value.activityCounters && typeof value.activityCounters === "object" &&
    value.objectivePeriods && typeof value.objectivePeriods === "object" && Array.isArray(value.claimedObjectives);
  const activityCounters = hasObjectiveState
    ? normalizeActivityCounters(value.activityCounters)
    : backfillActivityCounters(roster, totalVictories, prestigeCount, zoneProgress);
  const rawPeriods = hasObjectiveState ? value.objectivePeriods as Partial<GameState["objectivePeriods"]> : undefined;
  const objectivePeriods = rawPeriods && typeof rawPeriods.dailyKey === "string" && typeof rawPeriods.weeklyKey === "string"
    ? {
      dailyKey: rawPeriods.dailyKey,
      weeklyKey: rawPeriods.weeklyKey,
      dailyBaseline: normalizeActivityCounters(rawPeriods.dailyBaseline),
      weeklyBaseline: normalizeActivityCounters(rawPeriods.weeklyBaseline),
    }
    : createObjectivePeriods(activityCounters);
  return {
    ...initial,
    version: 8,
    playerName: typeof value.playerName === "string" ? value.playerName : initial.playerName,
    resources: value.resources && typeof value.resources === "object" ? value.resources as GameState["resources"] : initial.resources,
    pendingGold: typeof value.pendingGold === "number" ? value.pendingGold : 0,
    pendingEggs: Array.isArray(value.pendingEggs) ? value.pendingEggs.filter((entry): entry is string => typeof entry === "string") : [],
    pendingItems: value.pendingItems && typeof value.pendingItems === "object" ? { ...emptyInventory(), ...value.pendingItems } as ItemInventory : emptyInventory(),
    pendingGems: Array.isArray(value.pendingGems) ? value.pendingGems.filter((entry): entry is string => typeof entry === "string") : [],
    cacheSlotsUsed: typeof value.cacheSlotsUsed === "number" ? value.cacheSlotsUsed : 0,
    eggInventory: value.eggInventory && typeof value.eggInventory === "object" ? value.eggInventory as Record<string, number> : initial.eggInventory,
    fragments: value.fragments && typeof value.fragments === "object" ? value.fragments as Record<string, number> : {},
    inventory: value.inventory && typeof value.inventory === "object" ? { ...emptyInventory(), ...value.inventory } as ItemInventory : initial.inventory,
    gemInventory: value.gemInventory && typeof value.gemInventory === "object" ? { ...emptyGemInventory(), ...value.gemInventory } as Record<string, number> : initial.gemInventory,
    roster,
    activeMonsterUid,
    supportMonsterUid: typeof value.supportMonsterUid === "string" ? value.supportMonsterUid : "",
    incubation: value.incubation && typeof value.incubation === "object" ? value.incubation as GameState["incubation"] : null,
    currentZoneId: typeof value.currentZoneId === "string" ? value.currentZoneId : initial.currentZoneId,
    unlockedZoneIds: Array.isArray(value.unlockedZoneIds) ? value.unlockedZoneIds.filter((entry): entry is string => typeof entry === "string") : initial.unlockedZoneIds,
    zoneProgress,
    runVictories: typeof value.runVictories === "number" ? value.runVictories : 0,
    totalVictories,
    prestigeCount,
    eggPity: typeof value.eggPity === "number" ? value.eggPity : 0,
    research: value.research && typeof value.research === "object" ? value.research as GameState["research"] : initial.research,
    profile: value.profile && typeof value.profile === "object" ? value.profile as GameState["profile"] : initial.profile,
    claimedMilestones: Array.isArray(value.claimedMilestones) ? value.claimedMilestones.filter((entry): entry is number => typeof entry === "number") : [],
    activityCounters,
    objectivePeriods,
    claimedObjectives: hasObjectiveState ? (value.claimedObjectives as unknown[]).filter((entry): entry is string => typeof entry === "string") : [],
    expeditions: Array.isArray(value.expeditions)
      ? value.expeditions.filter((entry) => entry && typeof entry === "object") as GameState["expeditions"]
      : [],
    settings: value.settings && typeof value.settings === "object"
      ? { ...initial.settings, ...value.settings } as GameState["settings"]
      : initial.settings,
    tutorialStep: typeof value.tutorialStep === "number" ? value.tutorialStep : 4,
    claimedSystemMessages: Array.isArray(value.claimedSystemMessages)
      ? value.claimedSystemMessages.filter((entry): entry is string => typeof entry === "string")
      : [],
    lastSavedAt: typeof value.lastSavedAt === "number" ? value.lastSavedAt : Date.now(),
  };
};

const migratedZoneState = (totalVictories: number): Pick<GameState, "currentZoneId" | "unlockedZoneIds" | "zoneProgress"> => {
  const unlockedZoneIds = [ZONES[0].id];
  if (totalVictories >= 25) unlockedZoneIds.push(ZONES[1].id);
  if (totalVictories >= 80) unlockedZoneIds.push(ZONES[2].id);
  const stage = 1 + (totalVictories % ZONES[0].stages);
  return {
    currentZoneId: ZONES[0].id,
    unlockedZoneIds,
    zoneProgress: {
      [ZONES[0].id]: { stage, clears: Math.floor(totalVictories / ZONES[0].stages) },
      ...(unlockedZoneIds.includes(ZONES[1].id) ? { [ZONES[1].id]: { stage: 1, clears: 0 } } : {}),
      ...(unlockedZoneIds.includes(ZONES[2].id) ? { [ZONES[2].id]: { stage: 1, clears: 0 } } : {}),
    },
  };
};

const migrateOlderState = (value: unknown): GameState | null => {
  if (!value || typeof value !== "object") return null;
  const legacy = value as Record<string, unknown>;
  if (legacy.version === 4 || legacy.version === 5 || legacy.version === 6 || legacy.version === 7) return migrateModernState(legacy);
  if (legacy.version !== 1 && legacy.version !== 2 && legacy.version !== 3) return null;
  const roster = Array.isArray(legacy.roster)
    ? legacy.roster.map(migrateMonster).filter((monster): monster is MonsterInstance => monster !== null)
    : [];

  const resources = (legacy.resources ?? {}) as Record<string, unknown>;
  const pending = (legacy.pending ?? {}) as Record<string, unknown>;
  const research = (legacy.research ?? {}) as Record<string, unknown>;
  const v3 = legacy.version === 3;
  const totalVictories = typeof legacy.totalVictories === "number"
    ? legacy.totalVictories
    : typeof legacy.victories === "number" ? legacy.victories : 0;
  const runVictories = typeof legacy.runVictories === "number" ? legacy.runVictories : totalVictories;
  const gold = v3
    ? typeof resources.gold === "number" ? resources.gold : 100
    : typeof resources.bits === "number" ? resources.bits : 100;
  const cores = typeof resources.cores === "number" ? resources.cores : 0;
  const pendingGold = typeof legacy.pendingGold === "number"
    ? legacy.pendingGold
    : typeof pending.bits === "number" ? pending.bits : 0;
  const oldGenes = typeof resources.genes === "number" ? resources.genes : 0;
  const activeUid = typeof legacy.activeMonsterUid === "string" && roster.some((monster) => monster.uid === legacy.activeMonsterUid)
    ? legacy.activeMonsterUid
    : roster[0]?.uid ?? "";
  const activeDefinition = roster.find((monster) => monster.uid === activeUid)?.definitionId ?? roster[0]?.definitionId ?? "pyrook";
  const extractionLevel = typeof research.extraction === "number" ? research.extraction : 0;
  const zoneState = migratedZoneState(totalVictories);
  const activityCounters = backfillActivityCounters(
    roster,
    totalVictories,
    typeof legacy.prestigeCount === "number" ? legacy.prestigeCount : 0,
    zoneState.zoneProgress,
  );

  return {
    version: 8,
    playerName: typeof legacy.playerName === "string" ? legacy.playerName : "Tamer",
    resources: { gold, cores },
    pendingGold,
    pendingEggs: Array.isArray(legacy.pendingEggs) ? legacy.pendingEggs.filter((entry): entry is string => typeof entry === "string") : [],
    pendingItems: emptyInventory(),
    pendingGems: [],
    cacheSlotsUsed: Math.min(cacheCapacity(extractionLevel), Math.ceil(pendingGold / 20)),
    eggInventory: legacy.eggInventory && typeof legacy.eggInventory === "object" ? legacy.eggInventory as Record<string, number> : { mossbit: 1 },
    fragments: legacy.fragments && typeof legacy.fragments === "object"
      ? legacy.fragments as Record<string, number>
      : oldGenes > 0 ? { [activeDefinition]: oldGenes } : {},
    inventory: { ...emptyInventory(), training_data: 2, incubator_charge: 1 },
    gemInventory: {
      ...emptyGemInventory(),
      "common-crimson-triangle": 1,
      "common-azure-square": 1,
      "common-violet-diamond": 1,
    },
    roster,
    activeMonsterUid: activeUid,
    supportMonsterUid: "",
    incubation: legacy.incubation && typeof legacy.incubation === "object" ? legacy.incubation as GameState["incubation"] : null,
    ...zoneState,
    runVictories,
    totalVictories,
    prestigeCount: typeof legacy.prestigeCount === "number" ? legacy.prestigeCount : 0,
    eggPity: typeof legacy.eggPity === "number" ? legacy.eggPity : 0,
    research: {
      power: typeof research.power === "number" ? research.power : 0,
      vitality: typeof research.vitality === "number" ? research.vitality : 0,
      extraction: extractionLevel,
      incubation: typeof research.incubation === "number"
        ? research.incubation
        : typeof research.genome === "number" ? research.genome : 0,
    },
    profile: { avatarId: "wanderer", frameId: "silver" },
    claimedMilestones: Array.isArray(legacy.claimedMilestones)
      ? legacy.claimedMilestones.filter((entry): entry is number => typeof entry === "number")
      : [],
    activityCounters,
    objectivePeriods: createObjectivePeriods(activityCounters),
    claimedObjectives: [],
    expeditions: [],
    settings: { soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" },
    tutorialStep: 4,
    claimedSystemMessages: [],
    lastSavedAt: typeof legacy.lastSavedAt === "number" ? legacy.lastSavedAt : Date.now(),
  };
};

export const loadGame = (): LoadedGame => {
  let state = createInitialState();
  let migrated = false;
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const previous = PREVIOUS_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find((entry) => entry !== null) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    const saved = current ?? previous;
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (isValidState(parsed)) state = parsed;
      else {
        const migratedState = migrateOlderState(parsed);
        if (migratedState) {
          state = migratedState;
          migrated = true;
        }
      }
    }
  } catch {
    // A damaged local save should never prevent the game from starting.
  }

  if (typeof state.supportMonsterUid !== "string" || !state.roster.some((monster) => monster.uid === state.supportMonsterUid)) {
    state.supportMonsterUid = "";
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - state.lastSavedAt) / 1000));
  const offlineSeconds = Math.min(elapsed, BALANCE.cache.maxOfflineSeconds);
  const availableSlots = Math.max(0, cacheCapacity(state.research.extraction) - state.cacheSlotsUsed);
  const offlineSlots = state.roster.length > 0
    ? Math.min(availableSlots, Math.floor(offlineSeconds / BALANCE.cache.offlineSecondsPerReward))
    : 0;
  const offlineGold = Math.round(offlineSlots * 12 * (1 + state.research.extraction * 0.1));
  const offlineItems = emptyInventory();
  offlineItems.training_data = Math.floor(offlineSlots / 3);
  offlineItems.ether_dust = Math.floor(offlineSlots / 8);

  state.pendingGold += offlineGold;
  state.pendingItems.training_data += offlineItems.training_data;
  state.pendingItems.ether_dust += offlineItems.ether_dust;
  state.cacheSlotsUsed += offlineSlots;
  state.lastSavedAt = Date.now();
  // Persist the consumed offline window immediately so a fast reload cannot claim it twice.
  saveGame(state);
  return { state, offlineSeconds, offlineGold, offlineSlots, offlineItems, migrated };
};

export const saveGame = (state: GameState): SaveResult => {
  const previousSavedAt = state.lastSavedAt;
  const savedAt = Date.now();
  state.lastSavedAt = savedAt;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, savedAt };
  } catch {
    state.lastSavedAt = previousSavedAt;
    return { ok: false, savedAt: previousSavedAt, reason: "storage-unavailable" };
  }
};

export const resetGame = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  for (const key of PREVIOUS_STORAGE_KEYS) localStorage.removeItem(key);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
};
