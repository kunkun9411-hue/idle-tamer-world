import { AVATARS, BALANCE, FRAMES, GEMS, getGem, getZone, ZONES } from "./catalog";
import { MONSTERS } from "./content";
import { findEncounter } from "./encounters";
import { canCraft, getCraftingRecipe } from "./crafting";
import { canStartExpedition, expeditionRewardMultiplier, getExpedition, isMonsterDispatched } from "./expeditions";
import { isObjectiveClaimable, objectiveClaimKey, OBJECTIVES, recordActivity, refreshObjectivePeriods } from "./objectives";
import { MILESTONES, RESEARCH, type ResearchId } from "./progression";
import {
  cacheCapacity,
  canEvolve,
  createMonster,
  activeZoneSynergy,
  eggDropChance,
  incubationDurationMs,
  isEggPityGuaranteed,
  levelCost,
  prestigeCoreReward,
  rankForVictories,
  researchCost,
  hyperLevelCost,
} from "./rules";
import { saveGame, type SaveResult } from "./storage";
import { getSystemMessage } from "./system-messages";
import type { GameState, GemRarity, ItemId, PlayerSettings } from "./types";

export interface ItemDrop {
  itemId: ItemId;
  amount: number;
}

export interface VictoryResult {
  gold: number;
  eggDefinitionId?: string;
  items: ItemDrop[];
  cacheFull: boolean;
  bossDefeated: boolean;
  unlockedZoneId?: string;
  gemId?: string;
}

export interface HatchResult {
  definitionId: string;
  kind: "discovery" | "duplicate";
  fragments: number;
}

export interface ExpeditionClaimResult {
  definitionId: string;
  monsterUid: string;
  gold: number;
  items: ItemDrop[];
}

export interface GameService {
  readonly state: GameState;
  readonly mode: "local" | "remote";
  chooseStarter(definitionId: string): boolean;
  collectCache(): boolean;
  levelUp(monsterUid: string): boolean;
  trainWithData(monsterUid: string): boolean;
  evolve(monsterUid: string): boolean;
  makeActive(monsterUid: string): boolean;
  makeSupport(monsterUid: string): boolean;
  selectZone(zoneId: string): boolean;
  setAvatar(avatarId: string): boolean;
  setFrame(frameId: string): boolean;
  startIncubation(definitionId: string): boolean;
  useIncubatorCharge(now?: number): boolean;
  hatchIncubation(now?: number): HatchResult | null;
  upgradeHyper(monsterUid: string): boolean;
  equipGem(monsterUid: string, gemId: string): boolean;
  unequipGem(monsterUid: string, gemId: string): boolean;
  buyResearch(id: ResearchId): boolean;
  claimMilestone(target: number): boolean;
  claimObjective(objectiveId: string, now?: number): boolean;
  startExpedition(slot: number, definitionId: string, monsterUid: string, now?: number): boolean;
  claimExpedition(expeditionId: string, now?: number): ExpeditionClaimResult | null;
  craftItem(recipeId: string): boolean;
  setSetting(key: keyof PlayerSettings, value: boolean | PlayerSettings["numberFormat"]): boolean;
  advanceTutorial(skip?: boolean): boolean;
  claimSystemMessage(messageId: string): boolean;
  recordVictory(enemyDefinitionId: string, enemyLevel: number): VictoryResult;
  prestige(): number;
  save(): SaveResult;
}

const addEgg = (inventory: Record<string, number>, definitionId: string): void => {
  inventory[definitionId] = (inventory[definitionId] ?? 0) + 1;
};

const addItem = (inventory: Record<ItemId, number>, itemId: ItemId, amount = 1): void => {
  inventory[itemId] = (inventory[itemId] ?? 0) + amount;
};

const addGem = (inventory: Record<string, number>, gemId: string, amount = 1): void => {
  inventory[gemId] = (inventory[gemId] ?? 0) + amount;
};

export const isAvatarUnlocked = (state: GameState, avatarId: string): boolean => {
  if (avatarId === "wanderer" || avatarId === "keeper") return true;
  if (avatarId === "knight") return rankForVictories(state.totalVictories) >= 5;
  if (avatarId === "breeder") return state.roster.length >= 5;
  if (avatarId === "researcher") return Object.values(state.research).reduce((sum, level) => sum + level, 0) >= 5;
  if (avatarId === "void") return state.prestigeCount >= 1;
  return false;
};

export const isFrameUnlocked = (state: GameState, frameId: string): boolean => {
  if (frameId === "silver" || frameId === "violet") return true;
  if (frameId === "gold") return Object.values(state.zoneProgress).some((progress) => progress.clears > 0);
  if (frameId === "prism") return state.roster.length >= 5;
  return false;
};

export class LocalGameService implements GameService {
  public readonly mode = "local" as const;
  public lastSaveResult: SaveResult;

  public constructor(
    public readonly state: GameState,
    private readonly random: () => number = Math.random,
  ) {
    this.lastSaveResult = { ok: true, savedAt: state.lastSavedAt };
    refreshObjectivePeriods(state);
  }

  public chooseStarter(definitionId: string): boolean {
    if (this.state.roster.length > 0 || !MONSTERS.some((monster) => monster.id === definitionId)) return false;
    const starter = createMonster(definitionId, 1);
    this.state.roster.push(starter);
    this.state.activeMonsterUid = starter.uid;
    recordActivity(this.state, "monster_discovery");
    this.save();
    return true;
  }

  public collectCache(): boolean {
    const itemCount = Object.values(this.state.pendingItems).reduce((sum, amount) => sum + amount, 0);
    if (this.state.pendingGold === 0 && this.state.pendingEggs.length === 0 && itemCount === 0 && this.state.pendingGems.length === 0) return false;
    this.state.resources.gold += this.state.pendingGold;
    this.state.pendingGold = 0;
    for (const definitionId of this.state.pendingEggs) addEgg(this.state.eggInventory, definitionId);
    this.state.pendingEggs = [];
    for (const [itemId, amount] of Object.entries(this.state.pendingItems) as [ItemId, number][]) {
      addItem(this.state.inventory, itemId, amount);
      this.state.pendingItems[itemId] = 0;
    }
    for (const gemId of this.state.pendingGems) addGem(this.state.gemInventory, gemId);
    this.state.pendingGems = [];
    this.state.cacheSlotsUsed = 0;
    recordActivity(this.state, "cache_claim");
    this.save();
    return true;
  }

  public levelUp(monsterUid: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    if (!monster) return false;
    const cost = levelCost(monster.level);
    if (this.state.resources.gold < cost) return false;
    this.state.resources.gold -= cost;
    monster.level += 1;
    recordActivity(this.state, "level_up");
    this.save();
    return true;
  }

  public trainWithData(monsterUid: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    if (!monster || this.state.inventory.training_data <= 0) return false;
    this.state.inventory.training_data -= 1;
    monster.level += 1;
    recordActivity(this.state, "level_up");
    this.save();
    return true;
  }

  public evolve(monsterUid: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    const fragments = monster ? this.state.fragments[monster.definitionId] ?? 0 : 0;
    if (!monster || !canEvolve(monster, this.state.inventory.evolution_core, fragments)) return false;
    this.state.inventory.evolution_core -= BALANCE.evolution.coreCost;
    this.state.fragments[monster.definitionId] = fragments - BALANCE.evolution.fragmentCost;
    monster.evolution = "evolved";
    recordActivity(this.state, "evolution");
    this.save();
    return true;
  }

  public makeActive(monsterUid: string): boolean {
    if (!this.state.roster.some((entry) => entry.uid === monsterUid) || isMonsterDispatched(this.state, monsterUid)) return false;
    if (this.state.supportMonsterUid === monsterUid) this.state.supportMonsterUid = this.state.activeMonsterUid;
    this.state.activeMonsterUid = monsterUid;
    this.save();
    return true;
  }

  public makeSupport(monsterUid: string): boolean {
    if (monsterUid === this.state.activeMonsterUid || !this.state.roster.some((entry) => entry.uid === monsterUid) || isMonsterDispatched(this.state, monsterUid)) return false;
    this.state.supportMonsterUid = monsterUid;
    this.save();
    return true;
  }

  public selectZone(zoneId: string): boolean {
    if (!this.state.unlockedZoneIds.includes(zoneId)) return false;
    this.state.currentZoneId = getZone(zoneId).id;
    this.state.zoneProgress[zoneId] ??= { stage: 1, clears: 0 };
    this.save();
    return true;
  }

  public setAvatar(avatarId: string): boolean {
    if (!AVATARS.some((avatar) => avatar.id === avatarId) || !isAvatarUnlocked(this.state, avatarId)) return false;
    this.state.profile.avatarId = avatarId;
    this.save();
    return true;
  }

  public setFrame(frameId: string): boolean {
    if (!FRAMES.some((frame) => frame.id === frameId) || !isFrameUnlocked(this.state, frameId)) return false;
    this.state.profile.frameId = frameId;
    this.save();
    return true;
  }

  public startIncubation(definitionId: string): boolean {
    if (this.state.incubation || (this.state.eggInventory[definitionId] ?? 0) <= 0) return false;
    this.state.eggInventory[definitionId] -= 1;
    const startedAt = Date.now();
    this.state.incubation = { definitionId, startedAt, hatchAt: startedAt + incubationDurationMs(this.state.research.incubation) };
    this.save();
    return true;
  }

  public useIncubatorCharge(now = Date.now()): boolean {
    if (!this.state.incubation || this.state.incubation.hatchAt <= now || this.state.inventory.incubator_charge <= 0) return false;
    this.state.inventory.incubator_charge -= 1;
    this.state.incubation.hatchAt = Math.max(now, this.state.incubation.hatchAt - 15_000);
    this.save();
    return true;
  }

  public hatchIncubation(now = Date.now()): HatchResult | null {
    const incubation = this.state.incubation;
    if (!incubation || now < incubation.hatchAt) return null;
    const known = this.state.roster.some((monster) => monster.definitionId === incubation.definitionId);
    const fragmentYield = BALANCE.hatch.duplicateFragments;
    if (known) this.state.fragments[incubation.definitionId] = (this.state.fragments[incubation.definitionId] ?? 0) + fragmentYield;
    else {
      this.state.roster.push(createMonster(incubation.definitionId));
      recordActivity(this.state, "monster_discovery");
    }
    recordActivity(this.state, "hatch");
    this.state.incubation = null;
    this.save();
    return { definitionId: incubation.definitionId, kind: known ? "duplicate" : "discovery", fragments: known ? fragmentYield : 0 };
  }

  public upgradeHyper(monsterUid: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    if (!monster) return false;
    const cost = hyperLevelCost(monster.hyperLevel);
    const available = this.state.fragments[monster.definitionId] ?? 0;
    if (available < cost) return false;
    this.state.fragments[monster.definitionId] = available - cost;
    monster.hyperLevel += 1;
    recordActivity(this.state, "hyper_up");
    this.save();
    return true;
  }

  public equipGem(monsterUid: string, gemId: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    const gem = getGem(gemId);
    if (!monster || !gem || (this.state.gemInventory[gemId] ?? 0) <= 0) return false;
    const equipped = monster.gemSlots[gem.shape];
    if (equipped === gemId) return false;
    if (equipped) addGem(this.state.gemInventory, equipped);
    this.state.gemInventory[gemId] -= 1;
    monster.gemSlots[gem.shape] = gemId;
    recordActivity(this.state, "gem_equip");
    this.save();
    return true;
  }

  public unequipGem(monsterUid: string, gemId: string): boolean {
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    const gem = getGem(gemId);
    if (!monster || !gem || monster.gemSlots[gem.shape] !== gemId) return false;
    delete monster.gemSlots[gem.shape];
    addGem(this.state.gemInventory, gemId);
    this.save();
    return true;
  }

  public buyResearch(id: ResearchId): boolean {
    const definition = RESEARCH.find((entry) => entry.id === id);
    if (!definition) return false;
    const level = this.state.research[id];
    const cost = researchCost(level);
    if (level >= definition.maxLevel || this.state.resources.cores < cost) return false;
    this.state.resources.cores -= cost;
    this.state.research[id] += 1;
    this.save();
    return true;
  }

  public claimMilestone(target: number): boolean {
    const milestone = MILESTONES.find((entry) => entry.target === target);
    if (!milestone || this.state.totalVictories < target || this.state.claimedMilestones.includes(target)) return false;
    this.state.resources.gold += milestone.reward.gold;
    if (milestone.reward.eggId) addEgg(this.state.eggInventory, milestone.reward.eggId);
    this.state.claimedMilestones.push(target);
    this.save();
    return true;
  }

  public claimObjective(objectiveId: string, now = Date.now()): boolean {
    refreshObjectivePeriods(this.state, now);
    const objective = OBJECTIVES.find((entry) => entry.id === objectiveId);
    if (!objective || !isObjectiveClaimable(this.state, objective)) return false;
    this.state.resources.gold += objective.reward.gold ?? 0;
    this.state.resources.cores += objective.reward.cores ?? 0;
    for (const [itemId, amount] of Object.entries(objective.reward.items ?? {}) as [ItemId, number][]) {
      addItem(this.state.inventory, itemId, amount);
    }
    if (objective.reward.gemId) addGem(this.state.gemInventory, objective.reward.gemId);
    this.state.claimedObjectives.push(objectiveClaimKey(this.state, objective));
    this.save();
    return true;
  }

  public startExpedition(slot: number, definitionId: string, monsterUid: string, now = Date.now()): boolean {
    const definition = getExpedition(definitionId);
    const monster = this.state.roster.find((entry) => entry.uid === monsterUid);
    if (!definition || !monster || !canStartExpedition(this.state, definition, monster, slot)) return false;
    this.state.expeditions.push({
      id: globalThis.crypto?.randomUUID?.() ?? `expedition-${now}-${slot}`,
      slot,
      definitionId,
      monsterUid,
      startedAt: now,
      completesAt: now + definition.durationMs,
      rewardMultiplier: expeditionRewardMultiplier(monster, definition),
    });
    recordActivity(this.state, "expedition_start", 1, now);
    this.save();
    return true;
  }

  public claimExpedition(expeditionId: string, now = Date.now()): ExpeditionClaimResult | null {
    const index = this.state.expeditions.findIndex((entry) => entry.id === expeditionId);
    const expedition = this.state.expeditions[index];
    const definition = expedition ? getExpedition(expedition.definitionId) : undefined;
    if (!expedition || !definition || now < expedition.completesAt) return null;
    const gold = Math.round(definition.reward.gold * expedition.rewardMultiplier);
    const items = Object.entries(definition.reward.items ?? {}).map(([itemId, amount]) => ({
      itemId: itemId as ItemId,
      amount: Math.max(amount ?? 0, Math.round((amount ?? 0) * expedition.rewardMultiplier)),
    })).filter((entry) => entry.amount > 0);
    this.state.resources.gold += gold;
    for (const item of items) addItem(this.state.inventory, item.itemId, item.amount);
    this.state.expeditions.splice(index, 1);
    recordActivity(this.state, "expedition_complete", 1, now);
    this.save();
    return { definitionId: definition.id, monsterUid: expedition.monsterUid, gold, items };
  }

  public craftItem(recipeId: string): boolean {
    const recipe = getCraftingRecipe(recipeId);
    if (!recipe || !canCraft(this.state, recipe)) return false;
    this.state.resources.gold -= recipe.goldCost;
    for (const [itemId, amount] of Object.entries(recipe.itemCosts) as [ItemId, number][]) {
      this.state.inventory[itemId] -= amount;
    }
    addItem(this.state.inventory, recipe.output.itemId, recipe.output.amount);
    this.save();
    return true;
  }

  public setSetting(key: keyof PlayerSettings, value: boolean | PlayerSettings["numberFormat"]): boolean {
    const valid = key === "numberFormat"
      ? value === "compact" || value === "full"
      : typeof value === "boolean";
    if (!valid) return false;
    (this.state.settings as Record<keyof PlayerSettings, boolean | PlayerSettings["numberFormat"]>)[key] = value;
    this.save();
    return true;
  }

  public advanceTutorial(skip = false): boolean {
    if (this.state.tutorialStep >= 4) return false;
    this.state.tutorialStep = skip ? 4 : Math.min(4, this.state.tutorialStep + 1);
    this.save();
    return true;
  }

  public claimSystemMessage(messageId: string): boolean {
    const message = getSystemMessage(messageId);
    if (!message || !message.available(this.state) || this.state.claimedSystemMessages.includes(messageId)) return false;
    this.state.resources.gold += message.reward?.gold ?? 0;
    for (const [itemId, amount] of Object.entries(message.reward?.items ?? {}) as [ItemId, number][]) {
      addItem(this.state.inventory, itemId, amount);
    }
    this.state.claimedSystemMessages.push(messageId);
    this.save();
    return true;
  }

  public recordVictory(enemyDefinitionId: string, enemyLevel: number): VictoryResult {
    const zone = getZone(this.state.currentZoneId);
    const progress = this.state.zoneProgress[zone.id] ?? { stage: 1, clears: 0 };
    this.state.zoneProgress[zone.id] = progress;
    const bossDefeated = progress.stage >= zone.stages;
    let unlockedZoneId: string | undefined;

    if (bossDefeated) {
      progress.stage = 1;
      progress.clears += 1;
      const nextZone = ZONES.find((entry) => entry.unlockAfterZoneId === zone.id);
      if (nextZone && !this.state.unlockedZoneIds.includes(nextZone.id)) {
        this.state.unlockedZoneIds.push(nextZone.id);
        this.state.zoneProgress[nextZone.id] = { stage: 1, clears: 0 };
        unlockedZoneId = nextZone.id;
      }
      addItem(this.state.pendingItems, "evolution_core", 1);
    } else progress.stage += 1;

    this.state.runVictories += 1;
    this.state.totalVictories += 1;
    recordActivity(this.state, "victory");
    if (bossDefeated) recordActivity(this.state, "boss_victory");

    let gemId: string | undefined;
    const rollGem = (boss: boolean): void => {
      const rarityRoll = this.random();
      const rarity: GemRarity = boss && rarityRoll < 0.05
        ? "mythic"
        : boss && rarityRoll < 0.35 ? "rare" : "common";
      const candidates = GEMS.filter((gem) => gem.rarity === rarity);
      gemId = candidates[this.state.totalVictories % candidates.length]?.id;
      if (gemId) this.state.pendingGems.push(gemId);
    };
    if (bossDefeated) rollGem(true);

    const full = this.state.cacheSlotsUsed >= cacheCapacity(this.state.research.extraction);
    if (full) {
      this.save();
      return { gold: 0, items: bossDefeated ? [{ itemId: "evolution_core", amount: 1 }] : [], cacheFull: true, bossDefeated, unlockedZoneId, gemId };
    }

    const synergy = activeZoneSynergy(this.state);
    const gold = Math.round((9 + enemyLevel * 4) * (1 + this.state.research.extraction * 0.1) * (1 + (synergy?.goldPercent ?? 0) / 100));
    this.state.pendingGold += gold;
    this.state.cacheSlotsUsed += 1;
    const items: ItemDrop[] = [];
    const rollItem = (itemId: ItemId, chance: number): void => {
      if (this.random() < chance) {
        addItem(this.state.pendingItems, itemId, 1);
        items.push({ itemId, amount: 1 });
      }
    };
    if (bossDefeated) items.push({ itemId: "evolution_core", amount: 1 });
    const materialBonus = synergy?.materialChanceBonus ?? 0;
    rollItem("training_data", Math.min(1, BALANCE.drops.trainingDataChance + materialBonus));
    rollItem("ether_dust", Math.min(1, BALANCE.drops.etherDustChance + materialBonus));
    rollItem("incubator_charge", Math.min(1, BALANCE.drops.incubatorChargeChance + materialBonus * 0.35));

    const dropped = isEggPityGuaranteed(this.state.eggPity) || this.random() < Math.min(1, eggDropChance(this.state.eggPity) + (synergy?.eggChanceBonus ?? 0));
    const eggDefinitionId = findEncounter(enemyDefinitionId)?.eggMonsterId ?? enemyDefinitionId;
    if (dropped) {
      this.state.pendingEggs.push(eggDefinitionId);
      this.state.eggPity = 0;
    } else this.state.eggPity += 1;
    if (!bossDefeated && this.random() < BALANCE.drops.gemChance) rollGem(false);
    this.save();
    return { gold, eggDefinitionId: dropped ? eggDefinitionId : undefined, items, cacheFull: false, bossDefeated, unlockedZoneId, gemId };
  }

  public prestige(): number {
    const reward = prestigeCoreReward(this.state.runVictories);
    if (reward <= 0) return 0;
    for (const definitionId of this.state.pendingEggs) addEgg(this.state.eggInventory, definitionId);
    for (const [itemId, amount] of Object.entries(this.state.pendingItems) as [ItemId, number][]) addItem(this.state.inventory, itemId, amount);
    this.state.pendingEggs = [];
    for (const gemId of this.state.pendingGems) addGem(this.state.gemInventory, gemId);
    this.state.pendingGems = [];
    this.state.pendingItems = { training_data: 0, evolution_core: 0, incubator_charge: 0, ether_dust: 0 };
    this.state.pendingGold = 0;
    this.state.cacheSlotsUsed = 0;
    this.state.resources.gold = 0;
    this.state.resources.cores += reward;
    this.state.runVictories = 0;
    this.state.prestigeCount += 1;
    recordActivity(this.state, "prestige");
    this.state.currentZoneId = ZONES[0].id;
    this.state.unlockedZoneIds = [ZONES[0].id];
    this.state.zoneProgress = { [ZONES[0].id]: { stage: 1, clears: 0 } };
    for (const monster of this.state.roster) monster.level = 1;
    this.save();
    return reward;
  }

  public save(): SaveResult {
    this.lastSaveResult = saveGame(this.state);
    return this.lastSaveResult;
  }
}
