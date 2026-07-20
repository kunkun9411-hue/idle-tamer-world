import type { GameState, ItemId, ItemInventory } from "@idle-tamer/contracts";

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  goldCost: number;
  itemCosts: Partial<ItemInventory>;
  output: { itemId: ItemId; amount: number };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "refine-training-data",
    name: "Trainingsdaten synthetisieren",
    description: "Verdichtet Etherstaub zu einem sofort einsetzbaren Run-Level.",
    goldCost: 40,
    itemCosts: { ether_dust: 3 },
    output: { itemId: "training_data", amount: 1 },
  },
  {
    id: "charge-incubator",
    name: "Brutladung kalibrieren",
    description: "Speichert gereinigte Etherenergie für eine Verkürzung der Brutzeit.",
    goldCost: 90,
    itemCosts: { ether_dust: 5 },
    output: { itemId: "incubator_charge", amount: 1 },
  },
  {
    id: "forge-evolution-core",
    name: "Evolutionskern formen",
    description: "Ein teurer, garantierter Weg vom gesammelten Staub zum Evolutionsmaterial.",
    goldCost: 500,
    itemCosts: { ether_dust: 20 },
    output: { itemId: "evolution_core", amount: 1 },
  },
];

export const getCraftingRecipe = (id: string): CraftingRecipe | undefined =>
  CRAFTING_RECIPES.find((entry) => entry.id === id);

export const canCraft = (state: GameState, recipe: CraftingRecipe): boolean =>
  state.resources.gold >= recipe.goldCost &&
  Object.entries(recipe.itemCosts).every(([itemId, amount]) => state.inventory[itemId as ItemId] >= (amount ?? 0));
