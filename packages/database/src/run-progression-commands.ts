import { BALANCE, GEMS, MILESTONES, MONSTERS, RESEARCH, getGem, getMonster, ZONES } from "@idle-tamer/content";
import type { RunCommand, RunCommandResponse } from "@idle-tamer/contracts";
import {
  CRAFTING_RECIPES,
  EXPEDITIONS,
  OBJECTIVES,
  SYSTEM_MESSAGES,
  dailyPeriodKey,
  expeditionRewardMultiplier,
  getCraftingRecipe,
  getExpedition,
  hyperLevelCost,
  incubationDurationMs,
  objectiveClaimKey,
  researchCost,
  weeklyPeriodKey,
} from "@idle-tamer/game-core";
import type { PoolClient, QueryResultRow } from "pg";

import { applyBalanceDelta, DatabaseCommandError } from "./transaction";
import { incrementActivity } from "./run-progression-snapshot";

export class ProgressionCommandError extends Error {
  public constructor(public readonly code: "INSUFFICIENT_BALANCE" | "VALIDATION", message: string) {
    super(message);
    this.name = "ProgressionCommandError";
  }
}

interface MonsterRow extends QueryResultRow {
  id: string;
  definition_id: string;
  level: number;
  hyper_level: number;
  evolution: "rookie" | "evolved";
  generation: number;
}

interface BalanceRow extends QueryResultRow { amount: string }

export interface MutableProgressionCommandContext {
  playerId: string;
  commandId: string;
  now: Date;
  gold: bigint;
  activeDefinitionId: string;
  supportDefinitionId: string | null;
  currentZoneId: string;
  highestZoneNumber: number;
  zoneProgress: Record<string, { stage: number; clears: string }>;
  runVictories: bigint;
  totalVictories: bigint;
  prestigeCount: number;
  eggPity: number;
  pendingEmpty: boolean;
}

export interface ProgressionCommandResult {
  event: RunCommandResponse["event"];
  resetRun?: boolean;
}

const invalid = (message: string): never => { throw new ProgressionCommandError("VALIDATION", message); };

const monsterByUid = async (client: PoolClient, playerId: string, uid: string): Promise<MonsterRow> => {
  const result = await client.query<MonsterRow>(
    `SELECT m.id, m.definition_id, COALESCE(l.level, 1) AS level, m.hyper_level, m.evolution, m.generation
       FROM monster_instances m
       LEFT JOIN player_run_levels l ON l.player_id = m.player_id AND l.monster_definition_id = m.definition_id
      WHERE m.player_id = $1 AND m.id = $2`,
    [playerId, uid],
  );
  return result.rows[0] ?? invalid("Dieses Monster gehört nicht zu deinem Account.");
};

const balance = async (client: PoolClient, table: string, playerId: string, definitionId: string): Promise<bigint> => {
  const result = await client.query<BalanceRow>(`SELECT amount::text FROM ${table} WHERE player_id = $1 AND definition_id = $2`, [playerId, definitionId]);
  return BigInt(result.rows[0]?.amount ?? "0");
};

const delta = async (
  client: PoolClient,
  context: MutableProgressionCommandContext,
  kind: "egg" | "fragment" | "gem" | "item" | "wallet",
  definitionId: string,
  amount: bigint,
  reason: string,
): Promise<bigint> => {
  try {
    return await applyBalanceDelta(client, {
      kind,
      playerId: context.playerId,
      commandId: context.commandId,
      definitionId,
      delta: amount,
      reason,
      contentReleaseId: "foundation-1.0.0",
      balanceReleaseId: "low-numbers-1.0.0",
    });
  } catch (error) {
    if (error instanceof DatabaseCommandError && error.code === "INSUFFICIENT_BALANCE") {
      throw new ProgressionCommandError("INSUFFICIENT_BALANCE", `Nicht genügend ${definitionId}.`);
    }
    throw error;
  }
};

const applyReward = async (
  client: PoolClient,
  context: MutableProgressionCommandContext,
  reason: string,
  reward: { gold?: number; cores?: number; items?: Record<string, number | undefined> | Partial<Record<string, number>>; gemId?: string; eggId?: string },
): Promise<void> => {
  if (reward.gold) context.gold = await delta(client, context, "wallet", "gold", BigInt(reward.gold), reason);
  if (reward.cores) await delta(client, context, "wallet", "ether_core", BigInt(reward.cores), reason);
  for (const [itemId, amount] of Object.entries(reward.items ?? {})) if (amount) await delta(client, context, "item", itemId, BigInt(amount), reason);
  if (reward.gemId) await delta(client, context, "gem", reward.gemId, 1n, reason);
  if (reward.eggId) await delta(client, context, "egg", reward.eggId, 1n, reason);
};

const objectiveServerProgress = async (client: PoolClient, context: MutableProgressionCommandContext, objectiveId: string) => {
  const objective = OBJECTIVES.find((entry) => entry.id === objectiveId) ?? invalid("Dieser Auftrag existiert nicht.");
  const countersResult = await client.query<{ activity_id: string; amount: string } & QueryResultRow>(
    "SELECT activity_id, amount::text FROM player_activity_counters WHERE player_id = $1",
    [context.playerId],
  );
  const counters = Object.fromEntries(countersResult.rows.map((entry) => [entry.activity_id, Number(entry.amount)]));
  const dailyKey = dailyPeriodKey(context.now.getTime());
  const weeklyKey = weeklyPeriodKey(context.now.getTime());
  const periodsResult = await client.query<{ daily_key: string; weekly_key: string; daily_baseline: Record<string, number>; weekly_baseline: Record<string, number> } & QueryResultRow>(
    "SELECT daily_key, weekly_key, daily_baseline, weekly_baseline FROM player_objective_periods WHERE player_id = $1 FOR UPDATE",
    [context.playerId],
  );
  const stored = periodsResult.rows[0];
  const dailyBaseline = stored?.daily_key === dailyKey ? stored.daily_baseline : { ...counters };
  const weeklyBaseline = stored?.weekly_key === weeklyKey ? stored.weekly_baseline : { ...counters };
  await client.query(
    `INSERT INTO player_objective_periods (player_id, daily_key, weekly_key, daily_baseline, weekly_baseline)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
     ON CONFLICT (player_id) DO UPDATE SET daily_key = EXCLUDED.daily_key, weekly_key = EXCLUDED.weekly_key,
       daily_baseline = EXCLUDED.daily_baseline, weekly_baseline = EXCLUDED.weekly_baseline, updated_at = clock_timestamp()`,
    [context.playerId, dailyKey, weeklyKey, JSON.stringify(dailyBaseline), JSON.stringify(weeklyBaseline)],
  );
  const baseline = objective.cadence === "daily" ? dailyBaseline[objective.activity] ?? 0 : objective.cadence === "weekly" ? weeklyBaseline[objective.activity] ?? 0 : 0;
  const progress = Math.max(0, (counters[objective.activity] ?? 0) - baseline);
  const fakeState = { objectivePeriods: { dailyKey, weeklyKey } } as Parameters<typeof objectiveClaimKey>[0];
  const claimKey = objectiveClaimKey(fakeState, objective);
  return { objective, progress, claimKey };
};

export const executeProgressionCommand = async (
  client: PoolClient,
  context: MutableProgressionCommandContext,
  command: RunCommand,
): Promise<ProgressionCommandResult | null> => {
  if (command.type === "monster.train") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    await delta(client, context, "item", "training_data", -1n, command.type);
    const updated = await client.query<{ level: number } & QueryResultRow>(
      `INSERT INTO player_run_levels (player_id, monster_definition_id, level) VALUES ($1, $2, 2)
       ON CONFLICT (player_id, monster_definition_id) DO UPDATE SET level = player_run_levels.level + 1, updated_at = $3
       RETURNING level`,
      [context.playerId, monster.definition_id, context.now],
    );
    await incrementActivity(client, context.playerId, "level_up");
    return { event: { type: "monster.trained", payload: { monsterUid: monster.id, level: updated.rows[0].level } } };
  }

  if (command.type === "monster.hyper_up") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    const cost = BigInt(hyperLevelCost(monster.hyper_level));
    await delta(client, context, "fragment", monster.definition_id, -cost, command.type);
    await client.query("UPDATE monster_instances SET hyper_level = hyper_level + 1, updated_at = $3 WHERE player_id = $1 AND id = $2", [context.playerId, monster.id, context.now]);
    await incrementActivity(client, context.playerId, "hyper_up");
    return { event: { type: "monster.hyper_up", payload: { monsterUid: monster.id, hyperLevel: monster.hyper_level + 1, cost: cost.toString() } } };
  }

  if (command.type === "monster.evolve") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    if (monster.evolution !== "rookie" || monster.level < BALANCE.evolution.requiredLevel) invalid(`Evolution benötigt Run-Level ${BALANCE.evolution.requiredLevel}.`);
    await delta(client, context, "item", "evolution_core", -BigInt(BALANCE.evolution.coreCost), command.type);
    await delta(client, context, "fragment", monster.definition_id, -BigInt(BALANCE.evolution.fragmentCost), command.type);
    await client.query("UPDATE monster_instances SET evolution = 'evolved', updated_at = $3 WHERE player_id = $1 AND id = $2", [context.playerId, monster.id, context.now]);
    await incrementActivity(client, context.playerId, "evolution");
    return { event: { type: "monster.evolved", payload: { monsterUid: monster.id, definitionId: monster.definition_id } } };
  }

  if (command.type === "monster.activate" || command.type === "monster.support") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    const dispatched = await client.query("SELECT 1 FROM timed_expeditions WHERE player_id = $1 AND monster_instance_id = $2 AND status = 'running'", [context.playerId, monster.id]);
    if (dispatched.rowCount) invalid("Ein Monster auf Expedition kann nicht ins Kampfduo wechseln.");
    if (command.type === "monster.activate") {
      context.activeDefinitionId = monster.definition_id;
      if (context.supportDefinitionId === monster.definition_id) context.supportDefinitionId = null;
      return { event: { type: "monster.activated", payload: { monsterUid: monster.id, definitionId: monster.definition_id } } };
    }
    if (context.activeDefinitionId === monster.definition_id) invalid("Das aktive Monster kann nicht gleichzeitig Support sein.");
    context.supportDefinitionId = monster.definition_id;
    return { event: { type: "monster.supported", payload: { monsterUid: monster.id, definitionId: monster.definition_id } } };
  }

  if (command.type === "gem.equip") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    const gem = getGem(command.gemId);
    if (!gem) throw new ProgressionCommandError("VALIDATION", "Dieser Gem existiert nicht.");
    const existing = await client.query<{ gem_definition_id: string } & QueryResultRow>(
      "SELECT gem_definition_id FROM monster_gem_slots WHERE player_id = $1 AND monster_instance_id = $2 AND shape = $3 FOR UPDATE",
      [context.playerId, monster.id, gem.shape],
    );
    if (existing.rows[0]?.gem_definition_id === command.gemId) invalid("Dieser Gem ist bereits eingesetzt.");
    await delta(client, context, "gem", command.gemId, -1n, command.type);
    if (existing.rows[0]) await delta(client, context, "gem", existing.rows[0].gem_definition_id, 1n, "gem.replace");
    await client.query(
      `INSERT INTO monster_gem_slots (player_id, monster_instance_id, shape, gem_definition_id, equipped_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (monster_instance_id, shape) DO UPDATE SET gem_definition_id = EXCLUDED.gem_definition_id, equipped_at = EXCLUDED.equipped_at`,
      [context.playerId, monster.id, gem.shape, gem.id, context.now],
    );
    await incrementActivity(client, context.playerId, "gem_equip");
    return { event: { type: "gem.equipped", payload: { monsterUid: monster.id, gemId: gem.id, shape: gem.shape } } };
  }

  if (command.type === "gem.unequip") {
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    const removed = await client.query<{ gem_definition_id: string } & QueryResultRow>(
      "DELETE FROM monster_gem_slots WHERE player_id = $1 AND monster_instance_id = $2 AND shape = $3 RETURNING gem_definition_id",
      [context.playerId, monster.id, command.shape],
    );
    if (!removed.rows[0]) invalid("Dieser Gem-Slot ist leer.");
    await delta(client, context, "gem", removed.rows[0].gem_definition_id, 1n, command.type);
    return { event: { type: "gem.unequipped", payload: { monsterUid: monster.id, gemId: removed.rows[0].gem_definition_id, shape: command.shape } } };
  }

  if (command.type === "incubation.start") {
    if (!MONSTERS.some((monster) => monster.id === command.definitionId)) invalid("Dieses Ei existiert nicht.");
    const running = await client.query("SELECT 1 FROM incubation_jobs WHERE player_id = $1 AND status = 'running'", [context.playerId]);
    if (running.rowCount) invalid("Die Brutstation ist bereits belegt.");
    const researchResult = await client.query<{ level: number } & QueryResultRow>("SELECT level FROM research_levels WHERE player_id = $1 AND definition_id = 'incubation'", [context.playerId]);
    await delta(client, context, "egg", command.definitionId, -1n, command.type);
    const completesAt = new Date(context.now.getTime() + incubationDurationMs(researchResult.rows[0]?.level ?? 0));
    const inserted = await client.query<{ id: string } & QueryResultRow>(
      "INSERT INTO incubation_jobs (player_id, definition_id, started_at, completes_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [context.playerId, command.definitionId, context.now, completesAt],
    );
    return { event: { type: "incubation.started", payload: { incubationId: inserted.rows[0].id, definitionId: command.definitionId, hatchAt: completesAt.toISOString() } } };
  }

  if (command.type === "incubation.accelerate") {
    const job = await client.query<{ id: string; completes_at: Date; started_at: Date } & QueryResultRow>(
      "SELECT id, completes_at, started_at FROM incubation_jobs WHERE player_id = $1 AND status = 'running' FOR UPDATE",
      [context.playerId],
    );
    if (!job.rows[0] || job.rows[0].completes_at <= context.now) invalid("Diese Inkubation ist bereits fertig.");
    await delta(client, context, "item", "incubator_charge", -1n, command.type);
    const hatchAt = new Date(Math.max(context.now.getTime(), job.rows[0].started_at.getTime() + 1, job.rows[0].completes_at.getTime() - BALANCE.hatch.chargeReductionMs));
    await client.query("UPDATE incubation_jobs SET completes_at = $3, updated_at = $4 WHERE player_id = $1 AND id = $2", [context.playerId, job.rows[0].id, hatchAt, context.now]);
    return { event: { type: "incubation.accelerated", payload: { incubationId: job.rows[0].id, hatchAt: hatchAt.toISOString() } } };
  }

  if (command.type === "incubation.hatch") {
    const result = await client.query<{ id: string; definition_id: string } & QueryResultRow>(
      `UPDATE incubation_jobs SET status = 'hatched', completed_at = $2, completed_by_command_id = $3, updated_at = $2
        WHERE player_id = $1 AND status = 'running' AND completes_at <= $2
      RETURNING id, definition_id`,
      [context.playerId, context.now, context.commandId],
    );
    const job = result.rows[0] ?? invalid("Das Ei ist noch nicht schlupfbereit.");
    const existing = await client.query<MonsterRow>("SELECT id, definition_id, 1 AS level, hyper_level, evolution, generation FROM monster_instances WHERE player_id = $1 AND definition_id = $2", [context.playerId, job.definition_id]);
    let kind: "discovery" | "fragments" = "fragments";
    let fragments = 0;
    if (!existing.rows[0]) {
      kind = "discovery";
      const monster = await client.query<{ id: string } & QueryResultRow>("INSERT INTO monster_instances (player_id, definition_id) VALUES ($1, $2) RETURNING id", [context.playerId, job.definition_id]);
      await client.query("INSERT INTO player_run_levels (player_id, monster_definition_id, level) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING", [context.playerId, job.definition_id]);
      await incrementActivity(client, context.playerId, "monster_discovery");
      existing.rows[0] = { id: monster.rows[0].id, definition_id: job.definition_id, level: 1, hyper_level: 0, evolution: "rookie", generation: 1 };
    } else {
      fragments = BALANCE.hatch.duplicateFragments;
      await delta(client, context, "fragment", job.definition_id, BigInt(fragments), command.type);
    }
    await incrementActivity(client, context.playerId, "hatch");
    return { event: { type: "incubation.hatched", payload: { incubationId: job.id, monsterUid: existing.rows[0].id, definitionId: job.definition_id, kind, fragments } } };
  }

  if (command.type === "research.buy") {
    const definition = RESEARCH.find((entry) => entry.id === command.researchId) ?? invalid("Dieses Forschungsprojekt existiert nicht.");
    const locked = await client.query<{ level: number } & QueryResultRow>("SELECT level FROM research_levels WHERE player_id = $1 AND definition_id = $2 FOR UPDATE", [context.playerId, definition.id]);
    const level = locked.rows[0]?.level ?? 0;
    if (level >= definition.maxLevel) invalid("Diese Forschung ist bereits maximal.");
    const cost = researchCost(level);
    await delta(client, context, "wallet", "ether_core", -BigInt(cost), command.type);
    await client.query("UPDATE research_levels SET level = level + 1, updated_at = $3 WHERE player_id = $1 AND definition_id = $2", [context.playerId, definition.id, context.now]);
    return { event: { type: "research.bought", payload: { researchId: definition.id, level: level + 1, cost } } };
  }

  if (command.type === "milestone.claim") {
    const milestone = MILESTONES.find((entry) => entry.target === command.target) ?? invalid("Dieser Story-Meilenstein existiert nicht.");
    if (context.totalVictories < BigInt(milestone.target)) invalid("Dieser Story-Meilenstein ist noch nicht erreicht.");
    const inserted = await client.query(
      "INSERT INTO player_milestone_claims (player_id, target, claimed_by_command_id, claimed_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [context.playerId, milestone.target, context.commandId, context.now],
    );
    if (!inserted.rowCount) invalid("Diese Story-Belohnung wurde bereits abgeholt.");
    await applyReward(client, context, command.type, milestone.reward);
    return { event: { type: "milestone.claimed", payload: { target: milestone.target, title: milestone.title } } };
  }

  if (command.type === "objective.claim") {
    const { objective, progress, claimKey } = await objectiveServerProgress(client, context, command.objectiveId);
    if (progress < objective.target) invalid("Dieser Auftrag ist noch nicht abgeschlossen.");
    const inserted = await client.query(
      "INSERT INTO player_objective_claims (player_id, claim_key, definition_id, claimed_by_command_id, claimed_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
      [context.playerId, claimKey, objective.id, context.commandId, context.now],
    );
    if (!inserted.rowCount) invalid("Diese Auftragsbelohnung wurde bereits abgeholt.");
    await applyReward(client, context, command.type, objective.reward);
    return { event: { type: "objective.claimed", payload: { objectiveId: objective.id, claimKey } } };
  }

  if (command.type === "expedition.start") {
    const definition = getExpedition(command.definitionId) ?? invalid("Diese Expedition existiert nicht.");
    const monster = await monsterByUid(client, context.playerId, command.monsterUid);
    if (command.slot < 1 || command.slot > 2) invalid("Dieser Expeditionsslot existiert nicht.");
    if (ZONES.findIndex((zone) => zone.id === definition.zoneId) >= context.highestZoneNumber) invalid("Die Zone dieser Expedition ist noch gesperrt.");
    if (monster.level < definition.minimumLevel || (definition.requiresEvolved && monster.evolution !== "evolved")) invalid("Dieses Monster erfüllt die Expeditionsanforderungen nicht.");
    if ([context.activeDefinitionId, context.supportDefinitionId].includes(monster.definition_id)) invalid("Monster aus dem Kampfduo können nicht entsandt werden.");
    const multiplier = expeditionRewardMultiplier({ uid: monster.id, definitionId: monster.definition_id, level: monster.level, hyperLevel: monster.hyper_level, evolution: monster.evolution, generation: monster.generation, gemSlots: {} }, definition);
    const completesAt = new Date(context.now.getTime() + definition.durationMs);
    const inserted = await client.query<{ id: string } & QueryResultRow>(
      `INSERT INTO timed_expeditions (player_id, slot, definition_id, monster_instance_id, reward_multiplier, started_at, completes_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [context.playerId, command.slot, definition.id, monster.id, multiplier, context.now, completesAt],
    ).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505") invalid("Slot oder Monster ist bereits auf Expedition.");
      throw error;
    });
    await incrementActivity(client, context.playerId, "expedition_start");
    return { event: { type: "expedition.started", payload: { expeditionId: inserted.rows[0].id, slot: command.slot, completesAt: completesAt.toISOString() } } };
  }

  if (command.type === "expedition.claim") {
    const claimed = await client.query<{ definition_id: string; reward_multiplier: string } & QueryResultRow>(
      `UPDATE timed_expeditions SET status = 'claimed', claimed_at = $3, claimed_by_command_id = $4, updated_at = $3
        WHERE player_id = $1 AND id = $2 AND status = 'running' AND completes_at <= $3
      RETURNING definition_id, reward_multiplier::text`,
      [context.playerId, command.expeditionId, context.now, context.commandId],
    );
    const expedition = claimed.rows[0] ?? invalid("Diese Expedition ist noch nicht bereit oder bereits geborgen.");
    const definition = getExpedition(expedition.definition_id) ?? invalid("Expeditionsinhalt fehlt.");
    const multiplier = Number(expedition.reward_multiplier);
    context.gold = await delta(client, context, "wallet", "gold", BigInt(Math.round(definition.reward.gold * multiplier)), command.type);
    for (const [itemId, amount] of Object.entries(definition.reward.items ?? {})) if (amount) await delta(client, context, "item", itemId, BigInt(Math.round(amount * multiplier)), command.type);
    await incrementActivity(client, context.playerId, "expedition_complete");
    return { event: { type: "expedition.claimed", payload: { expeditionId: command.expeditionId, gold: Math.round(definition.reward.gold * multiplier) } } };
  }

  if (command.type === "crafting.craft") {
    const recipe = getCraftingRecipe(command.recipeId) ?? invalid("Dieses Rezept existiert nicht.");
    context.gold = await delta(client, context, "wallet", "gold", -BigInt(recipe.goldCost), command.type);
    for (const [itemId, amount] of Object.entries(recipe.itemCosts)) if (amount) await delta(client, context, "item", itemId, -BigInt(amount), command.type);
    await delta(client, context, "item", recipe.output.itemId, BigInt(recipe.output.amount), command.type);
    return { event: { type: "crafting.crafted", payload: { recipeId: recipe.id, itemId: recipe.output.itemId, amount: recipe.output.amount } } };
  }

  if (command.type === "settings.update") {
    const columns = { soundEnabled: "sound_enabled", combatEffects: "combat_effects", reducedMotion: "reduced_motion", numberFormat: "number_format" } as const;
    const column = columns[command.key];
    if (!column || (command.key === "numberFormat" ? !["compact", "full"].includes(String(command.value)) : typeof command.value !== "boolean")) invalid("Diese Einstellung ist ungültig.");
    await client.query(`UPDATE player_settings SET ${column} = $2, updated_at = $3 WHERE player_id = $1`, [context.playerId, command.value, context.now]);
    return { event: { type: "settings.updated", payload: { key: command.key, value: command.value } } };
  }

  if (command.type === "tutorial.advance") {
    await client.query("UPDATE player_settings SET tutorial_step = CASE WHEN $2 THEN 99 ELSE LEAST(99, tutorial_step + 1) END, updated_at = $3 WHERE player_id = $1", [context.playerId, command.skip, context.now]);
    return { event: { type: "tutorial.advanced", payload: { skipped: command.skip } } };
  }

  if (command.type === "system_message.claim") {
    const message = SYSTEM_MESSAGES.find((entry) => entry.id === command.messageId) ?? invalid("Diese Systemnachricht existiert nicht.");
    if (message.id === "collection-online") {
      const count = await client.query<{ count: string } & QueryResultRow>("SELECT count(*)::text AS count FROM monster_instances WHERE player_id = $1", [context.playerId]);
      if (Number(count.rows[0].count) < 2) invalid("Diese Systemnachricht ist noch nicht freigeschaltet.");
    }
    if (message.id === "first-zone-boss" && !Object.values(context.zoneProgress).some((progress) => BigInt(progress.clears) > 0n)) invalid("Diese Systemnachricht ist noch nicht freigeschaltet.");
    const inserted = await client.query(
      "INSERT INTO player_message_claims (player_id, message_id, claimed_by_command_id, claimed_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
      [context.playerId, message.id, context.commandId, context.now],
    );
    if (!inserted.rowCount) invalid("Diese Systemnachricht wurde bereits beansprucht.");
    await applyReward(client, context, command.type, message.reward ?? {});
    return { event: { type: "system_message.claimed", payload: { messageId: message.id } } };
  }

  if (command.type === "prestige.activate") {
    if (context.highestZoneNumber < BALANCE.prestige.requiredZoneNumber || context.runVictories < 100n) invalid(`Prestige ist erst ab Zone ${BALANCE.prestige.requiredZoneNumber} und 100 Run-Siegen verfügbar.`);
    if (!context.pendingEmpty) invalid("Leere vor dem Prestige zuerst den Kampfspeicher.");
    const coreReward = 1n + (context.runVictories - 100n) / 100n;
    await delta(client, context, "wallet", "ether_core", coreReward, command.type);
    if (context.gold > 100n) context.gold = await delta(client, context, "wallet", "gold", 100n - context.gold, command.type);
    if (context.gold < 100n) context.gold = await delta(client, context, "wallet", "gold", 100n - context.gold, command.type);
    context.prestigeCount += 1;
    context.runVictories = 0n;
    context.currentZoneId = ZONES[0].id;
    context.highestZoneNumber = 1;
    context.zoneProgress = { [ZONES[0].id]: { stage: 1, clears: "0" } };
    await client.query("UPDATE player_run_levels SET level = 1, updated_at = $2 WHERE player_id = $1", [context.playerId, context.now]);
    await client.query("DELETE FROM player_zone_progress WHERE player_id = $1", [context.playerId]);
    await incrementActivity(client, context.playerId, "prestige");
    return { event: { type: "prestige.activated", payload: { prestigeCount: context.prestigeCount, cores: coreReward.toString() } }, resetRun: true };
  }

  return null;
};

// Keep imports visible to content contract checks and make accidental catalog removal fail TypeScript.
void GEMS;
void CRAFTING_RECIPES;
void EXPEDITIONS;
void getMonster;
