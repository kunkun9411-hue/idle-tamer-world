import { emptyInventory } from "@idle-tamer/content";
import type { ActivityId, AuthoritativeCollectionSnapshot, GemShape, ItemId, ResearchId } from "@idle-tamer/contracts";
import { ACTIVITIES, dailyPeriodKey, weeklyPeriodKey } from "@idle-tamer/game-core";
import type { PoolClient, QueryResultRow } from "pg";

interface MonsterRow extends QueryResultRow {
  id: string;
  definition_id: string;
  level: number;
  hyper_level: number;
  evolution: "rookie" | "evolved";
  generation: number;
}

interface BalanceRow extends QueryResultRow { definition_id: string; amount: string }
interface SlotRow extends QueryResultRow { monster_instance_id: string; shape: GemShape; gem_definition_id: string }
interface ResearchRow extends QueryResultRow { definition_id: ResearchId; level: number }
interface ActivityRow extends QueryResultRow { activity_id: ActivityId; amount: string }
interface IncubationRow extends QueryResultRow { id: string; definition_id: string; started_at: Date; completes_at: Date }
interface ExpeditionRow extends QueryResultRow {
  id: string;
  slot: number;
  definition_id: string;
  monster_instance_id: string;
  started_at: Date;
  completes_at: Date;
  reward_multiplier: string;
}

export interface PendingProgressionLoot {
  eggs: Record<string, number>;
  items: Record<string, number>;
  gems: Record<string, number>;
}

const recordFromRows = (rows: BalanceRow[]): Record<string, string> =>
  Object.fromEntries(rows.map((entry) => [entry.definition_id, entry.amount]));

const expandDrops = (drops: Record<string, number>): string[] =>
  Object.entries(drops).flatMap(([definitionId, amount]) => Array.from({ length: amount }, () => definitionId));

const emptyActivities = (): Record<ActivityId, number> =>
  Object.fromEntries(ACTIVITIES.map((activity) => [activity, 0])) as Record<ActivityId, number>;

export const incrementActivity = async (client: PoolClient, playerId: string, activity: ActivityId, amount = 1): Promise<void> => {
  if (amount <= 0) return;
  await client.query(
    `INSERT INTO player_activity_counters (player_id, activity_id, amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (player_id, activity_id)
     DO UPDATE SET amount = player_activity_counters.amount + EXCLUDED.amount, updated_at = clock_timestamp()`,
    [playerId, activity, amount],
  );
};

export const loadCollectionSnapshot = async (
  client: PoolClient,
  input: {
    playerId: string;
    activeDefinitionId: string;
    supportDefinitionId: string | null;
    prestigeCount: number;
    eggPity: number;
    pending: PendingProgressionLoot;
    now: Date;
  },
): Promise<AuthoritativeCollectionSnapshot> => {
  const monsters = await client.query<MonsterRow>(
    `SELECT m.id, m.definition_id, COALESCE(l.level, 1) AS level,
            m.hyper_level, m.evolution, m.generation
       FROM monster_instances m
       LEFT JOIN player_run_levels l ON l.player_id = m.player_id AND l.monster_definition_id = m.definition_id
      WHERE m.player_id = $1
      ORDER BY m.discovered_at, m.id`,
    [input.playerId],
  );
  const slots = await client.query<SlotRow>(
    `SELECT monster_instance_id, shape, gem_definition_id
       FROM monster_gem_slots WHERE player_id = $1 ORDER BY monster_instance_id, shape`,
    [input.playerId],
  );
  // A PoolClient executes one query at a time. Keeping this sequence explicit
  // avoids the deprecated concurrent-client-query behaviour in node-postgres.
  const eggs = await client.query<BalanceRow>("SELECT definition_id, amount::text FROM egg_balances WHERE player_id = $1 ORDER BY definition_id", [input.playerId]);
  const fragments = await client.query<BalanceRow>("SELECT definition_id, amount::text FROM monster_fragments WHERE player_id = $1 ORDER BY definition_id", [input.playerId]);
  const items = await client.query<BalanceRow>("SELECT definition_id, amount::text FROM item_balances WHERE player_id = $1 ORDER BY definition_id", [input.playerId]);
  const gems = await client.query<BalanceRow>("SELECT definition_id, amount::text FROM gem_balances WHERE player_id = $1 ORDER BY definition_id", [input.playerId]);
  const research = await client.query<ResearchRow>("SELECT definition_id, level FROM research_levels WHERE player_id = $1 ORDER BY definition_id", [input.playerId]);
  const activities = await client.query<ActivityRow>("SELECT activity_id, amount::text FROM player_activity_counters WHERE player_id = $1 ORDER BY activity_id", [input.playerId]);
  const incubation = await client.query<IncubationRow>("SELECT id, definition_id, started_at, completes_at FROM incubation_jobs WHERE player_id = $1 AND status = 'running'", [input.playerId]);
  const expeditions = await client.query<ExpeditionRow>("SELECT id, slot, definition_id, monster_instance_id, started_at, completes_at, reward_multiplier::text FROM timed_expeditions WHERE player_id = $1 AND status = 'running' ORDER BY slot", [input.playerId]);
  const milestoneClaims = await client.query<{ target: number } & QueryResultRow>("SELECT target FROM player_milestone_claims WHERE player_id = $1 ORDER BY target", [input.playerId]);
  const objectiveClaims = await client.query<{ claim_key: string } & QueryResultRow>("SELECT claim_key FROM player_objective_claims WHERE player_id = $1 ORDER BY claim_key", [input.playerId]);
  const messageClaims = await client.query<{ message_id: string } & QueryResultRow>("SELECT message_id FROM player_message_claims WHERE player_id = $1 ORDER BY message_id", [input.playerId]);
  const settingsResult = await client.query<{ sound_enabled: boolean; combat_effects: boolean; reduced_motion: boolean; number_format: "compact" | "full"; tutorial_step: number } & QueryResultRow>(
    "SELECT sound_enabled, combat_effects, reduced_motion, number_format, tutorial_step FROM player_settings WHERE player_id = $1",
    [input.playerId],
  );
  const periodsResult = await client.query<{ daily_key: string; weekly_key: string; daily_baseline: Record<string, number>; weekly_baseline: Record<string, number> } & QueryResultRow>(
    "SELECT daily_key, weekly_key, daily_baseline, weekly_baseline FROM player_objective_periods WHERE player_id = $1",
    [input.playerId],
  );
  const coresResult = await client.query<{ amount: string } & QueryResultRow>("SELECT amount::text FROM wallet_balances WHERE player_id = $1 AND definition_id = 'ether_core'", [input.playerId]);

  const slotMap = new Map<string, Partial<Record<GemShape, string>>>();
  for (const slot of slots.rows) {
    const monsterSlots = slotMap.get(slot.monster_instance_id) ?? {};
    monsterSlots[slot.shape] = slot.gem_definition_id;
    slotMap.set(slot.monster_instance_id, monsterSlots);
  }
  const roster = monsters.rows.map((monster) => ({
    uid: monster.id,
    definitionId: monster.definition_id,
    level: monster.level,
    hyperLevel: monster.hyper_level,
    evolution: monster.evolution,
    generation: monster.generation,
    gemSlots: slotMap.get(monster.id) ?? {},
  }));
  const active = roster.find((monster) => monster.definitionId === input.activeDefinitionId) ?? roster[0];
  const support = roster.find((monster) => monster.definitionId === input.supportDefinitionId);

  const activityCounters = emptyActivities();
  for (const activity of activities.rows) activityCounters[activity.activity_id] = Number(activity.amount);
  const currentDailyKey = dailyPeriodKey(input.now.getTime());
  const currentWeeklyKey = weeklyPeriodKey(input.now.getTime());
  const storedPeriods = periodsResult.rows[0] ?? { daily_key: currentDailyKey, weekly_key: currentWeeklyKey, daily_baseline: {}, weekly_baseline: {} };
  const dailyBaseline = storedPeriods.daily_key === currentDailyKey ? storedPeriods.daily_baseline : { ...activityCounters };
  const weeklyBaseline = storedPeriods.weekly_key === currentWeeklyKey ? storedPeriods.weekly_baseline : { ...activityCounters };
  if (storedPeriods.daily_key !== currentDailyKey || storedPeriods.weekly_key !== currentWeeklyKey || periodsResult.rowCount === 0) {
    await client.query(
      `INSERT INTO player_objective_periods (player_id, daily_key, weekly_key, daily_baseline, weekly_baseline)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       ON CONFLICT (player_id) DO UPDATE SET daily_key = EXCLUDED.daily_key, weekly_key = EXCLUDED.weekly_key,
         daily_baseline = EXCLUDED.daily_baseline, weekly_baseline = EXCLUDED.weekly_baseline, updated_at = clock_timestamp()`,
      [input.playerId, currentDailyKey, currentWeeklyKey, JSON.stringify(dailyBaseline), JSON.stringify(weeklyBaseline)],
    );
  }

  const inventoryRaw = { ...emptyInventory(), ...recordFromRows(items.rows) } as Record<ItemId, string | number>;
  const inventory = Object.fromEntries(Object.entries(inventoryRaw).map(([key, value]) => [key, String(value)])) as Record<ItemId, string>;
  const pendingItemsRaw = { ...emptyInventory(), ...input.pending.items };
  const pendingItems = Object.fromEntries(Object.entries(pendingItemsRaw).map(([key, value]) => [key, String(value)])) as Record<ItemId, string>;
  const researchLevels = { power: 0, vitality: 0, extraction: 0, incubation: 0 } satisfies Record<ResearchId, number>;
  for (const entry of research.rows) researchLevels[entry.definition_id] = entry.level;
  const settings = settingsResult.rows[0] ?? { sound_enabled: true, combat_effects: true, reduced_motion: false, number_format: "compact" as const, tutorial_step: 0 };
  const runningIncubation = incubation.rows[0];

  return {
    roster,
    activeMonsterUid: active?.uid ?? "",
    supportMonsterUid: support?.uid ?? "",
    eggInventory: recordFromRows(eggs.rows),
    fragments: recordFromRows(fragments.rows),
    inventory,
    gemInventory: recordFromRows(gems.rows),
    pendingEggs: expandDrops(input.pending.eggs),
    pendingItems,
    pendingGems: expandDrops(input.pending.gems),
    incubation: runningIncubation ? {
      id: runningIncubation.id,
      definitionId: runningIncubation.definition_id,
      startedAt: runningIncubation.started_at.toISOString(),
      hatchAt: runningIncubation.completes_at.toISOString(),
    } : null,
    expeditions: expeditions.rows.map((entry) => ({
      id: entry.id,
      slot: entry.slot,
      definitionId: entry.definition_id,
      monsterUid: entry.monster_instance_id,
      startedAt: entry.started_at.toISOString(),
      completesAt: entry.completes_at.toISOString(),
      rewardMultiplier: Number(entry.reward_multiplier),
    })),
    research: researchLevels,
    prestigeCount: input.prestigeCount,
    cores: coresResult.rows[0]?.amount ?? "0",
    eggPity: input.eggPity,
    claimedMilestones: milestoneClaims.rows.map((entry) => entry.target),
    activityCounters,
    objectivePeriods: {
      dailyKey: currentDailyKey,
      weeklyKey: currentWeeklyKey,
      dailyBaseline: { ...emptyActivities(), ...dailyBaseline },
      weeklyBaseline: { ...emptyActivities(), ...weeklyBaseline },
    },
    claimedObjectives: objectiveClaims.rows.map((entry) => entry.claim_key),
    settings: {
      soundEnabled: settings.sound_enabled,
      combatEffects: settings.combat_effects,
      reducedMotion: settings.reduced_motion,
      numberFormat: settings.number_format,
    },
    tutorialStep: settings.tutorial_step,
    claimedSystemMessages: messageClaims.rows.map((entry) => entry.message_id),
    lastServerSaveAt: input.now.toISOString(),
  };
};
