import { BALANCE, GEMS, MONSTERS } from "@idle-tamer/content";

export interface CombatLootBundle {
  eggs: Record<string, number>;
  items: Record<string, number>;
  gems: Record<string, number>;
  nextEggPity: number;
}

const hashUnit = (seed: string): number => {
  let hash = 2_166_136_261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) / 4_294_967_296;
};

const increment = (target: Record<string, number>, key: string, amount = 1): void => {
  target[key] = (target[key] ?? 0) + amount;
};

/**
 * Reproducible loot based on server-owned player/victory identity. Replaying a
 * settlement therefore cannot reroll rewards, while clients cannot choose the seed.
 */
export const deterministicCombatLoot = (
  playerId: string,
  firstTotalVictory: bigint,
  victories: number,
  initialEggPity: number,
  prestigeCount: number,
): CombatLootBundle => {
  const loot: CombatLootBundle = { eggs: {}, items: {}, gems: {}, nextEggPity: initialEggPity };
  const prestigeDropBonus = Math.max(0, prestigeCount) * BALANCE.prestige.dropChancePerPrestige;
  for (let offset = 0; offset < victories; offset += 1) {
    const victory = firstTotalVictory + BigInt(offset + 1);
    const seed = `${playerId}:${victory}`;
    const eggChance = Math.min(1, BALANCE.drops.eggBaseChance + loot.nextEggPity * 0.015 + prestigeDropBonus);
    const eggDrops = loot.nextEggPity >= BALANCE.drops.eggPityMisses || hashUnit(`${seed}:egg`) < eggChance;
    if (eggDrops) {
      const index = Math.min(MONSTERS.length - 1, Math.floor(hashUnit(`${seed}:egg-kind`) * MONSTERS.length));
      increment(loot.eggs, MONSTERS[index].id);
      loot.nextEggPity = 0;
    } else {
      loot.nextEggPity += 1;
    }

    if (hashUnit(`${seed}:training`) < BALANCE.drops.trainingDataChance + prestigeDropBonus) increment(loot.items, "training_data");
    if (hashUnit(`${seed}:dust`) < BALANCE.drops.etherDustChance + prestigeDropBonus) increment(loot.items, "ether_dust");
    if (hashUnit(`${seed}:charge`) < BALANCE.drops.incubatorChargeChance + prestigeDropBonus) increment(loot.items, "incubator_charge");
    if (hashUnit(`${seed}:gem`) < BALANCE.drops.gemChance + prestigeDropBonus) {
      const commonGems = GEMS.filter((gem) => gem.rarity === "common");
      const index = Math.min(commonGems.length - 1, Math.floor(hashUnit(`${seed}:gem-kind`) * commonGems.length));
      increment(loot.gems, commonGems[index].id);
    }
  }
  return loot;
};
