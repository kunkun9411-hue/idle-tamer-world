import { beforeEach, describe, expect, it, vi } from "vitest";
import { MONSTERS } from "./content";
import { BOSSES, ENEMIES } from "./encounters";
import { LocalGameService } from "./game-service";
import {
  createInitialState,
  createMonster,
  activeZoneSynergy,
  enemyForZone,
  enemyForVictoryCount,
  enemyStats,
  incubationDurationMs,
  levelCost,
  monsterAttack,
  monsterMaxHp,
  prestigeCoreReward,
  prestigeDropChanceBonus,
  prestigeEnemyMultiplier,
  prestigeGoldMultiplier,
  prestigePlayerStatMultiplier,
  rankForVictories,
  researchCost,
  hyperLevelCost,
} from "./rules";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
});

describe("Idle Tamer progression rules", () => {
  it("creates a backend-shaped version 9 save awaiting starter choice", () => {
    const state = createInitialState();
    expect(state.version).toBe(9);
    expect(state.roster).toHaveLength(0);
    expect(state.activeMonsterUid).toBe("");
    expect(state.eggInventory.mossbit).toBe(1);
    expect(state.resources).toEqual({ gold: 100, cores: 0 });
    expect(state.inventory.training_data).toBe(2);
    expect(Object.values(state.gemInventory).reduce((sum, amount) => sum + amount, 0)).toBe(3);
    expect(state.unlockedZoneIds).toEqual(["violet-rim"]);
    expect(state.highestZoneNumber).toBe(1);
    expect(MONSTERS).toHaveLength(10);
    expect(MONSTERS.every((monster) => monster.evolution.name.length > 0)).toBe(true);
    expect(state.research).toEqual({ power: 0, vitality: 0, extraction: 0, incubation: 0 });
    expect(Object.values(state.activityCounters).every((amount) => amount === 0)).toBe(true);
    expect(state.claimedObjectives).toEqual([]);
    expect(state.expeditions).toEqual([]);
    expect(state.settings).toEqual({ soundEnabled: true, combatEffects: true, reducedMotion: false, numberFormat: "compact" });
    expect(state.tutorialStep).toBe(0);
  });

  it("separates temporary levels from permanent Hyperlevels", () => {
    const base = createMonster("pyrook", 1, 1, 0);
    const runLeveled = createMonster("pyrook", 10, 1, 0);
    const hyperLeveled = createMonster("pyrook", 1, 1, 10);
    expect(monsterAttack(runLeveled)).toBeGreaterThan(monsterAttack(base));
    expect(monsterMaxHp(hyperLeveled)).toBeGreaterThan(monsterMaxHp(base));
    expect(hyperLevelCost(1)).toBeGreaterThan(hyperLevelCost(0));
  });

  it("keeps run and permanent prices monotonic", () => {
    for (let level = 1; level < 20; level += 1) expect(levelCost(level + 1)).toBeGreaterThan(levelCost(level));
    for (let level = 0; level < 8; level += 1) expect(researchCost(level + 1)).toBeGreaterThanOrEqual(researchCost(level));
  });

  it("scales enemies, rank, incubation and Prestige rewards", () => {
    const early = enemyStats("mossbit", 1);
    const late = enemyStats("mossbit", 20);
    expect(late.hp).toBeGreaterThan(early.hp);
    expect(late.attack).toBeGreaterThan(early.attack);
    expect(rankForVictories(0)).toBe(1);
    expect(rankForVictories(250)).toBe(11);
    expect(incubationDurationMs(0)).toBe(300_000);
    expect(incubationDurationMs(5)).toBe(150_000);
    expect(incubationDurationMs(20)).toBe(120_000);
    expect(prestigeCoreReward(99, 10)).toBe(0);
    expect(prestigeCoreReward(100, 9)).toBe(0);
    expect(prestigeCoreReward(100, 10)).toBe(1);
    expect(prestigeCoreReward(300, 10)).toBe(3);
  });

  it("keeps Prestige bonuses small and strengthens enemies only every hundred runs", () => {
    expect(prestigePlayerStatMultiplier(1)).toBeCloseTo(1.002);
    expect(prestigeGoldMultiplier(1)).toBeCloseTo(1.001);
    expect(prestigeDropChanceBonus(1)).toBeCloseTo(0.00001);
    expect(prestigeEnemyMultiplier(99)).toBe(1);
    expect(prestigeEnemyMultiplier(100)).toBe(1.02);
    expect(prestigeEnemyMultiplier(200)).toBe(1.04);

    const monster = createMonster("pyrook");
    expect(monsterAttack(monster, 100)).toBeGreaterThan(monsterAttack(monster, 0));
    expect(monsterMaxHp(monster, 100)).toBeGreaterThan(monsterMaxHp(monster, 0));
    expect(enemyStats("mossbit", 1, 99)).toEqual(enemyStats("mossbit", 1, 0));
    expect(enemyStats("mossbit", 1, 100).hp).toBeGreaterThan(enemyStats("mossbit", 1, 99).hp);
  });

  it("ships thirty normal encounters and five rotating bosses", () => {
    expect(ENEMIES).toHaveLength(30);
    expect(BOSSES).toHaveLength(5);
    expect(new Set([...ENEMIES, ...BOSSES].map((encounter) => encounter.id)).size).toBe(35);
    expect(enemyForZone("violet-rim", 1, 0).definitionId).toBe("flickerimp");
    expect(enemyForZone("violet-rim", 10, 0, 0).definitionId).toBe("crownroot-colossus");
    expect(enemyForZone("violet-rim", 10, 0, 1).definitionId).toBe("pyroclast-seraph");
  });

  it("supports the 500-victory story arc with a simple level-up strategy", () => {
    const player = createMonster("pyrook", 3);
    let gold = 80;
    let estimatedElapsedMs = 0;
    for (let victories = 0; victories < 500; victories += 1) {
      while (gold >= levelCost(player.level)) {
        gold -= levelCost(player.level);
        player.level += 1;
      }
      const enemy = enemyForVictoryCount(victories);
      const stats = enemyStats(enemy.definitionId, enemy.level);
      const strikes = Math.ceil(stats.hp / monsterAttack(player));
      const damageTaken = Math.max(0, strikes - 1) * stats.attack;
      estimatedElapsedMs += 700 + Math.max(0, strikes - 1) * 1_650 + 1_800;
      expect(monsterMaxHp(player), `stalled at victory ${victories}`).toBeGreaterThan(damageTaken);
      gold += 9 + enemy.level * 4;
    }
    expect(estimatedElapsedMs / 60_000).toBeGreaterThan(60);
    expect(estimatedElapsedMs / 60_000).toBeLessThan(120);
  });
});

describe("LocalGameService command boundary", () => {
  it("allows exactly one of ten Rookie starters", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    expect(service.chooseStarter("nyxlet")).toBe(true);
    expect(state.roster).toHaveLength(1);
    expect(state.roster[0].definitionId).toBe("nyxlet");
    expect(state.roster[0].evolution).toBe("rookie");
    expect(service.chooseStarter("pyrook")).toBe(false);
  });

  it("uses an egg pity, collects eggs and converts duplicate hatches into fragments", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    for (let victory = 0; victory < 8; victory += 1) service.recordVictory("mossbit", 1);
    expect(state.pendingEggs).toEqual(["mossbit"]);
    service.collectCache();
    expect(state.eggInventory.mossbit).toBe(2);

    expect(service.startIncubation("mossbit")).toBe(true);
    expect(service.hatchIncubation(Number.MAX_SAFE_INTEGER)?.kind).toBe("discovery");
    expect(state.roster.some((monster) => monster.definitionId === "mossbit")).toBe(true);

    expect(service.startIncubation("mossbit")).toBe(true);
    expect(service.hatchIncubation(Number.MAX_SAFE_INTEGER)).toEqual({ definitionId: "mossbit", kind: "duplicate", fragments: 10 });
    const mossbit = state.roster.find((monster) => monster.definitionId === "mossbit");
    expect(mossbit).toBeDefined();
    expect(service.upgradeHyper(mossbit!.uid)).toBe(true);
    expect(mossbit!.hyperLevel).toBe(1);
    expect(state.fragments.mossbit).toBe(0);
  });

  it("resets only run progress during Prestige", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    service.chooseStarter("pyrook");
    state.runVictories = 100;
    state.highestZoneNumber = 10;
    state.totalVictories = 140;
    state.resources.gold = 999;
    state.roster[0].level = 25;
    state.roster[0].hyperLevel = 3;
    expect(service.equipGem(state.roster[0].uid, "common-crimson-triangle")).toBe(true);
    state.fragments.pyrook = 7;
    state.pendingEggs.push("voltfin");
    expect(service.prestige()).toBe(1);
    expect(state.runVictories).toBe(0);
    expect(state.totalVictories).toBe(140);
    expect(state.resources).toEqual({ gold: 0, cores: 1 });
    expect(state.roster[0].level).toBe(1);
    expect(state.roster[0].hyperLevel).toBe(3);
    expect(state.roster[0].gemSlots.triangle).toBe("common-crimson-triangle");
    expect(state.fragments.pyrook).toBe(7);
    expect(state.eggInventory.voltfin).toBe(1);
  });

  it("evolves at level 20 and keeps the form through Prestige", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    service.chooseStarter("voltfin");
    const starter = state.roster[0];
    starter.level = 20;
    state.inventory.evolution_core = 3;
    state.fragments.voltfin = 30;
    expect(service.evolve(starter.uid)).toBe(true);
    expect(starter.evolution).toBe("evolved");
    expect(state.inventory.evolution_core).toBe(0);
    expect(state.fragments.voltfin).toBe(0);
    state.runVictories = 100;
    state.highestZoneNumber = 10;
    expect(service.prestige()).toBe(1);
    expect(starter.level).toBe(1);
    expect(starter.evolution).toBe("evolved");
  });

  it("blocks Prestige before zone 10 even when the victory requirement is met", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    service.chooseStarter("pyrook");
    state.runVictories = 500;
    state.highestZoneNumber = 9;

    expect(service.prestige()).toBe(0);
    expect(state.prestigeCount).toBe(0);
    expect(state.runVictories).toBe(500);

    state.highestZoneNumber = 10;
    expect(service.prestige()).toBe(5);
    expect(state.prestigeCount).toBe(1);
  });

  it("applies the permanent Prestige gold bonus to repeatable combat rewards", () => {
    const baseState = createInitialState();
    const prestigeState = createInitialState();
    prestigeState.prestigeCount = 100;
    const baseService = new LocalGameService(baseState, () => 1);
    const prestigeService = new LocalGameService(prestigeState, () => 1);

    expect(baseService.recordVictory("flickerimp", 1).gold).toBe(13);
    expect(prestigeService.recordVictory("flickerimp", 1).gold).toBe(14);
  });

  it("equips one Gem per shape and applies it to base stats", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    service.chooseStarter("pyrook");
    const monster = state.roster[0];
    const baseAttack = monsterAttack(monster);
    expect(service.equipGem(monster.uid, "common-crimson-triangle")).toBe(true);
    expect(monsterAttack(monster)).toBeGreaterThan(baseAttack);
    expect(state.gemInventory["common-crimson-triangle"]).toBe(0);
    expect(service.unequipGem(monster.uid, "common-crimson-triangle")).toBe(true);
    expect(monsterAttack(monster)).toBe(baseAttack);
    expect(state.gemInventory["common-crimson-triangle"]).toBe(1);
  });

  it("unlocks the next zone after its boss and moves cache items into inventory", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    service.chooseStarter("mossbit");
    for (let victory = 0; victory < 10; victory += 1) service.recordVictory("mossbit", 1);
    expect(state.zoneProgress["violet-rim"]).toEqual({ stage: 1, clears: 1 });
    expect(state.unlockedZoneIds).toContain("glass-gardens");
    expect(state.pendingItems.evolution_core).toBe(1);
    expect(state.pendingGems).toHaveLength(1);
    expect(service.collectCache()).toBe(true);
    expect(state.inventory.evolution_core).toBe(1);
    expect(Object.values(state.gemInventory).reduce((sum, amount) => sum + amount, 0)).toBe(4);
    expect(state.cacheSlotsUsed).toBe(0);
  });

  it("activates zone bonuses from the front and support role combination", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    service.chooseStarter("pyrook");
    const support = createMonster("lumipup");
    state.roster.push(support);
    expect(service.makeSupport(support.uid)).toBe(true);
    expect(activeZoneSynergy(state)?.id).toBe("rim-vanguard");
    expect(service.recordVictory("flickerimp", 1).gold).toBe(14);
    expect(service.makeActive(support.uid)).toBe(true);
    expect(state.supportMonsterUid).toBe(state.roster.find((monster) => monster.definitionId === "pyrook")?.uid);
    expect(activeZoneSynergy(state)?.id).toBe("rim-vanguard");
  });

  it("tracks and claims period objectives exactly once", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    service.chooseStarter("pyrook");
    for (let victory = 0; victory < 10; victory += 1) service.recordVictory("flickerimp", 1);

    const goldBeforeClaim = state.resources.gold;
    expect(service.claimObjective("daily-victories")).toBe(true);
    expect(state.resources.gold).toBe(goldBeforeClaim + 180);
    expect(service.claimObjective("daily-victories")).toBe(false);
    expect(state.claimedObjectives.some((claim) => claim.endsWith(":daily-victories"))).toBe(true);
  });

  it("resets timed objective baselines while keeping achievements permanent", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-07-20T10:00:00.000Z"));
      const state = createInitialState();
      const service = new LocalGameService(state, () => 1);
      service.chooseStarter("pyrook");
      for (let victory = 0; victory < 10; victory += 1) service.recordVictory("flickerimp", 1);
      expect(service.claimObjective("daily-victories")).toBe(true);

      vi.setSystemTime(new Date("2026-07-21T10:00:00.000Z"));
      expect(service.claimObjective("daily-victories")).toBe(false);
      expect(state.activityCounters.monster_discovery).toBe(1);
      expect(state.claimedObjectives.filter((claim) => claim.includes("daily-victories"))).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("runs timestamp-based expeditions and claims each reward once", () => {
    const state = createInitialState();
    const service = new LocalGameService(state, () => 1);
    service.chooseStarter("pyrook");
    const worker = createMonster("mossbit", 3);
    state.roster.push(worker);
    const startedAt = new Date("2026-07-20T10:00:00.000Z").getTime();

    expect(service.startExpedition(1, "rim-root-recovery", worker.uid, startedAt)).toBe(true);
    expect(service.startExpedition(1, "rim-signal-sweep", worker.uid, startedAt)).toBe(false);
    expect(service.makeActive(worker.uid)).toBe(false);
    const expedition = state.expeditions[0];
    expect(service.claimExpedition(expedition.id, expedition.completesAt - 1)).toBeNull();

    const trainingBefore = state.inventory.training_data;
    const result = service.claimExpedition(expedition.id, expedition.completesAt);
    expect(result).toMatchObject({ definitionId: "rim-root-recovery", monsterUid: worker.uid, gold: 286 });
    expect(state.inventory.training_data).toBe(trainingBefore + 3);
    expect(state.activityCounters.expedition_complete).toBe(1);
    expect(service.claimExpedition(expedition.id, expedition.completesAt)).toBeNull();
    expect(service.makeActive(worker.uid)).toBe(true);
  });

  it("crafts deterministic material recipes without negative balances", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    state.resources.gold = 1_000;
    state.inventory.ether_dust = 20;
    const coresBefore = state.inventory.evolution_core;

    expect(service.craftItem("forge-evolution-core")).toBe(true);
    expect(state.resources.gold).toBe(500);
    expect(state.inventory.ether_dust).toBe(0);
    expect(state.inventory.evolution_core).toBe(coresBefore + 1);
    expect(service.craftItem("forge-evolution-core")).toBe(false);
    expect(state.resources.gold).toBe(500);
    expect(state.inventory.ether_dust).toBe(0);
  });

  it("persists accessibility settings, onboarding and one-time system messages", () => {
    const state = createInitialState();
    const service = new LocalGameService(state);
    const goldBefore = state.resources.gold;

    expect(service.setSetting("reducedMotion", true)).toBe(true);
    expect(service.setSetting("numberFormat", "full")).toBe(true);
    expect(state.settings).toMatchObject({ reducedMotion: true, numberFormat: "full" });
    expect(service.advanceTutorial()).toBe(true);
    expect(state.tutorialStep).toBe(1);
    expect(service.advanceTutorial(true)).toBe(true);
    expect(state.tutorialStep).toBe(4);
    expect(service.claimSystemMessage("welcome-protocol")).toBe(true);
    expect(state.resources.gold).toBe(goldBefore + 100);
    expect(service.claimSystemMessage("welcome-protocol")).toBe(false);
  });
});
