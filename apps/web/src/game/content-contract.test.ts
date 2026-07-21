import { describe, expect, it } from "vitest";

import { AVATARS, FRAMES, GEMS, ITEMS, ZONES } from "./catalog";
import { MONSTERS } from "./content";
import { CRAFTING_RECIPES } from "./crafting";
import { BOSSES, ENEMIES, ENCOUNTERS } from "./encounters";
import { EXPEDITIONS } from "./expeditions";
import { OBJECTIVES } from "./objectives";
import { MILESTONES, RESEARCH } from "./progression";

const expectUnique = (label: string, values: string[]): void => {
  expect(new Set(values).size, `${label} must not contain duplicate IDs`).toBe(values.length);
  expect(values.every((value) => /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(value)), `${label} IDs must be URL and database safe`).toBe(true);
};

describe("Foundation 1.0 content contract", () => {
  it("keeps every catalog identity unique and stable", () => {
    expect(MONSTERS).toHaveLength(10);
    expect(ENEMIES).toHaveLength(30);
    expect(BOSSES).toHaveLength(5);
    expect(GEMS).toHaveLength(45);
    expect(ZONES).toHaveLength(10);

    expectUnique("monster", MONSTERS.map((entry) => entry.id));
    expectUnique("encounter", ENCOUNTERS.map((entry) => entry.id));
    expectUnique("gem", GEMS.map((entry) => entry.id));
    expectUnique("zone", ZONES.map((entry) => entry.id));
    expectUnique("item", ITEMS.map((entry) => entry.id));
    expectUnique("avatar", AVATARS.map((entry) => entry.id));
    expectUnique("frame", FRAMES.map((entry) => entry.id));
    expectUnique("expedition", EXPEDITIONS.map((entry) => entry.id));
    expectUnique("recipe", CRAFTING_RECIPES.map((entry) => entry.id));
    expectUnique("objective", OBJECTIVES.map((entry) => entry.id));
    expectUnique("research", RESEARCH.map((entry) => entry.id));
  });

  it("resolves all cross-catalog references", () => {
    const monsterIds = new Set<string>(MONSTERS.map((entry) => entry.id));
    const encounterIds = new Set<string>(ENCOUNTERS.map((entry) => entry.id));
    const zoneIds = new Set<string>(ZONES.map((entry) => entry.id));
    const gemIds = new Set<string>(GEMS.map((entry) => entry.id));
    const itemIds = new Set<string>(ITEMS.map((entry) => entry.id));

    for (const encounter of ENCOUNTERS) {
      expect(monsterIds.has(encounter.eggMonsterId), `${encounter.id}.eggMonsterId`).toBe(true);
      expect(zoneIds.has(encounter.zoneId), `${encounter.id}.zoneId`).toBe(true);
    }
    for (const zone of ZONES) {
      expect(zone.enemyPool).toHaveLength(10);
      for (const id of [...zone.enemyPool, ...zone.bossPool]) expect(encounterIds.has(id), `${zone.id} -> ${id}`).toBe(true);
      if (zone.unlockAfterZoneId) expect(zoneIds.has(zone.unlockAfterZoneId), `${zone.id}.unlockAfterZoneId`).toBe(true);
      expectUnique(`${zone.id} synergy`, zone.synergies.map((entry) => entry.id));
    }
    for (let index = 1; index < ZONES.length; index += 1) {
      expect(ZONES[index].unlockAfterZoneId, `${ZONES[index].id} unlock chain`).toBe(ZONES[index - 1].id);
    }
    for (const expedition of EXPEDITIONS) expect(zoneIds.has(expedition.zoneId), `${expedition.id}.zoneId`).toBe(true);
    for (const milestone of MILESTONES) if (milestone.reward.eggId) expect(monsterIds.has(milestone.reward.eggId), `${milestone.title}.eggId`).toBe(true);
    for (const objective of OBJECTIVES) {
      if (objective.reward.gemId) expect(gemIds.has(objective.reward.gemId), `${objective.id}.gemId`).toBe(true);
      for (const itemId of Object.keys(objective.reward.items ?? {})) expect(itemIds.has(itemId), `${objective.id}.items.${itemId}`).toBe(true);
    }
    for (const recipe of CRAFTING_RECIPES) {
      expect(itemIds.has(recipe.output.itemId), `${recipe.id}.output`).toBe(true);
      for (const itemId of Object.keys(recipe.itemCosts)) expect(itemIds.has(itemId), `${recipe.id}.cost.${itemId}`).toBe(true);
    }
  });

  it("keeps runtime image paths deterministic", () => {
    expectUnique("monster sprite", MONSTERS.map((entry) => entry.sprite!.replace("/assets/monsters/", "").replace("_idle_right.png", "").replace("_idle_left.png", "")));
    expect(new Set(MONSTERS.map((entry) => entry.sprite)).size).toBe(MONSTERS.length);
    expect(new Set(ENCOUNTERS.map((entry) => entry.sprite)).size).toBe(ENCOUNTERS.length);
    expect(new Set(GEMS.map((entry) => entry.image)).size).toBe(GEMS.length);
    expect(MONSTERS.every((entry) => entry.sprite?.startsWith("/assets/monsters/") && entry.sprite.endsWith(".png"))).toBe(true);
    expect(ENEMIES.every((entry) => entry.sprite?.startsWith("/assets/enemies/") && entry.sprite.endsWith(".png"))).toBe(true);
    expect(BOSSES.every((entry) => entry.sprite?.startsWith("/assets/bosses/") && entry.sprite.endsWith(".png"))).toBe(true);
    expect(GEMS.every((entry) => entry.image.startsWith(`/assets/gems/${entry.rarity}/`) && entry.image.endsWith(".png"))).toBe(true);
  });
});
