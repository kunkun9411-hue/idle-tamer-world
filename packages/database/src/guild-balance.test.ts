import { GUILD_GENES, GUILD_TASKS, guildBossMaxHp, guildMemberScale, guildTaskReward, guildTaskTarget } from "@idle-tamer/content";
import { describe, expect, it } from "vitest";

describe("guild balance guardrails", () => {
  it("gives large guilds a sublinear rather than linear throughput advantage", () => {
    expect(guildMemberScale(1)).toBe(1);
    expect(guildMemberScale(3)).toBe(1);
    expect(guildMemberScale(30)).toBeCloseTo(Math.sqrt(10));
    for (const task of GUILD_TASKS) {
      const smallRatio = guildTaskReward(task.rewardDna, 3) / guildTaskTarget(task.target, 3);
      const largeRatio = guildTaskReward(task.rewardDna, 30) / guildTaskTarget(task.target, 30);
      expect(Math.abs(largeRatio - smallRatio) / smallRatio).toBeLessThanOrEqual(0.05);
    }
    expect(guildBossMaxHp(30) / guildBossMaxHp(3)).toBeCloseTo(Math.sqrt(10), 1);
    expect(guildBossMaxHp(30) / guildBossMaxHp(3)).toBeLessThan(4);
  });

  it("caps the first chromosome at deliberately small bonuses", () => {
    const maximums = new Map(GUILD_GENES.map((gene) => [gene.id, gene.maxLevel * gene.effectPerLevel]));
    expect(maximums.get("wealth-signal")).toBe(2.5);
    expect(maximums.get("boss-resonance")).toBe(5);
    expect(maximums.get("incubation-spiral")).toBe(1.5);
    expect(Math.max(...maximums.values())).toBeLessThanOrEqual(5);
  });
});
