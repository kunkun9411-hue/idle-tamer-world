import type { ActivityId, GameState, ItemInventory } from "@idle-tamer/contracts";

export type ObjectiveCadence = "daily" | "weekly" | "achievement";

export interface ObjectiveReward {
  gold?: number;
  cores?: number;
  items?: Partial<ItemInventory>;
  gemId?: string;
}

export interface ObjectiveDefinition {
  id: string;
  cadence: ObjectiveCadence;
  title: string;
  description: string;
  activity: ActivityId;
  target: number;
  reward: ObjectiveReward;
}

export const ACTIVITIES: ActivityId[] = [
  "victory", "boss_victory", "cache_claim", "hatch", "monster_discovery",
  "level_up", "hyper_up", "evolution", "gem_equip", "prestige",
  "expedition_start", "expedition_complete",
];

export const emptyActivityCounters = (): Record<ActivityId, number> => Object.fromEntries(
  ACTIVITIES.map((activity) => [activity, 0]),
) as Record<ActivityId, number>;

export const OBJECTIVES: ObjectiveDefinition[] = [
  { id: "daily-victories", cadence: "daily", title: "Stabiles Signal", description: "Gewinne 10 automatische Kämpfe.", activity: "victory", target: 10, reward: { gold: 180 } },
  { id: "daily-cache", cadence: "daily", title: "Saubere Bergung", description: "Leere den Kampfspeicher zweimal.", activity: "cache_claim", target: 2, reward: { items: { training_data: 1 } } },
  { id: "daily-hatch", cadence: "daily", title: "Lebende Resonanz", description: "Brüte ein Ei vollständig aus.", activity: "hatch", target: 1, reward: { items: { incubator_charge: 1 } } },
  { id: "weekly-victories", cadence: "weekly", title: "Ether-Ausdauer", description: "Gewinne 75 Kämpfe in dieser Woche.", activity: "victory", target: 75, reward: { gold: 900, items: { ether_dust: 5 } } },
  { id: "weekly-bosses", cadence: "weekly", title: "Grenzenbrecher", description: "Besiege drei Zonenbosse.", activity: "boss_victory", target: 3, reward: { items: { evolution_core: 1 } } },
  { id: "weekly-training", cadence: "weekly", title: "Gemeinsames Wachstum", description: "Erhöhe normale Level 25-mal.", activity: "level_up", target: 25, reward: { items: { training_data: 3 } } },
  { id: "achievement-collection", cadence: "achievement", title: "Kleines Archiv", description: "Entdecke fünf unterschiedliche Monsterlinien.", activity: "monster_discovery", target: 5, reward: { gemId: "rare-violet-diamond" } },
  { id: "achievement-evolution", cadence: "achievement", title: "Neue Gestalt", description: "Schließe deine erste Evolution ab.", activity: "evolution", target: 1, reward: { cores: 1 } },
  { id: "achievement-hyper", cadence: "achievement", title: "Unvergessliche Bindung", description: "Erhöhe Hyperlevel insgesamt fünfmal.", activity: "hyper_up", target: 5, reward: { gemId: "rare-amber-triangle" } },
  { id: "achievement-prestige", cadence: "achievement", title: "Zeitlinien-Wanderer", description: "Aktiviere deinen ersten Ether-Kristall.", activity: "prestige", target: 1, reward: { gemId: "mythic-violet-diamond" } },
];

export const dailyPeriodKey = (now = Date.now()): string => new Date(now).toISOString().slice(0, 10);

export const weeklyPeriodKey = (now = Date.now()): string => {
  const date = new Date(now);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export const createObjectivePeriods = (counters: Record<ActivityId, number>, now = Date.now()): GameState["objectivePeriods"] => ({
  dailyKey: dailyPeriodKey(now),
  weeklyKey: weeklyPeriodKey(now),
  dailyBaseline: { ...counters },
  weeklyBaseline: { ...counters },
});

export const refreshObjectivePeriods = (state: GameState, now = Date.now()): void => {
  const dailyKey = dailyPeriodKey(now);
  const weeklyKey = weeklyPeriodKey(now);
  if (state.objectivePeriods.dailyKey !== dailyKey) {
    state.objectivePeriods.dailyKey = dailyKey;
    state.objectivePeriods.dailyBaseline = { ...state.activityCounters };
  }
  if (state.objectivePeriods.weeklyKey !== weeklyKey) {
    state.objectivePeriods.weeklyKey = weeklyKey;
    state.objectivePeriods.weeklyBaseline = { ...state.activityCounters };
  }
};

export const recordActivity = (state: GameState, activity: ActivityId, amount = 1, now = Date.now()): void => {
  refreshObjectivePeriods(state, now);
  state.activityCounters[activity] += amount;
};

export const objectiveClaimKey = (state: GameState, objective: ObjectiveDefinition): string => {
  if (objective.cadence === "daily") return `${state.objectivePeriods.dailyKey}:${objective.id}`;
  if (objective.cadence === "weekly") return `${state.objectivePeriods.weeklyKey}:${objective.id}`;
  return `permanent:${objective.id}`;
};

export const objectiveProgress = (state: GameState, objective: ObjectiveDefinition): number => {
  const total = state.activityCounters[objective.activity] ?? 0;
  if (objective.cadence === "daily") return Math.max(0, total - (state.objectivePeriods.dailyBaseline[objective.activity] ?? 0));
  if (objective.cadence === "weekly") return Math.max(0, total - (state.objectivePeriods.weeklyBaseline[objective.activity] ?? 0));
  return total;
};

export const isObjectiveClaimable = (state: GameState, objective: ObjectiveDefinition): boolean =>
  objectiveProgress(state, objective) >= objective.target && !state.claimedObjectives.includes(objectiveClaimKey(state, objective));
