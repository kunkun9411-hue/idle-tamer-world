import { getMonster, getMonsterForm } from "@idle-tamer/content";
import type { CombatRole, Element, GameState, ItemInventory, MonsterInstance } from "@idle-tamer/contracts";

export interface ExpeditionDefinition {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  durationMs: number;
  minimumLevel: number;
  requiresEvolved?: boolean;
  preferredRole?: CombatRole;
  preferredElement?: Element;
  reward: {
    gold: number;
    items?: Partial<ItemInventory>;
  };
}

export const EXPEDITION_SLOT_COUNT = 2;

export const EXPEDITIONS: ExpeditionDefinition[] = [
  {
    id: "rim-signal-sweep", zoneId: "violet-rim", name: "Saum-Signale kartieren",
    description: "Ein kurzer, sicherer Auftrag für ein freies Rookie-Monster.",
    durationMs: 2 * 60_000, minimumLevel: 1, preferredRole: "scout", preferredElement: "lightning",
    reward: { gold: 110, items: { training_data: 1 } },
  },
  {
    id: "rim-root-recovery", zoneId: "violet-rim", name: "Wurzelarchive bergen",
    description: "Stabile Monster sichern Trainingsdaten aus überwucherten Speichern.",
    durationMs: 5 * 60_000, minimumLevel: 3, preferredRole: "defender", preferredElement: "earth",
    reward: { gold: 220, items: { training_data: 2, ether_dust: 1 } },
  },
  {
    id: "glass-prism-scan", zoneId: "glass-gardens", name: "Prismengänge scannen",
    description: "Kontrolle und Licht erleichtern die Navigation durch spiegelnde Tunnel.",
    durationMs: 12 * 60_000, minimumLevel: 5, preferredRole: "controller", preferredElement: "light",
    reward: { gold: 430, items: { ether_dust: 3 } },
  },
  {
    id: "glass-spore-escort", zoneId: "glass-gardens", name: "Sporenträger eskortieren",
    description: "Ein Support-Monster hält die empfindliche Fracht resonanzstabil.",
    durationMs: 20 * 60_000, minimumLevel: 7, preferredRole: "support", preferredElement: "earth",
    reward: { gold: 650, items: { incubator_charge: 1, ether_dust: 3 } },
  },
  {
    id: "fjord-ember-watch", zoneId: "obsidian-fjord", name: "Obsidianwacht übernehmen",
    description: "Angreifer halten die heißen Risskanten frei und gewinnen seltenes Material.",
    durationMs: 45 * 60_000, minimumLevel: 10, preferredRole: "attacker", preferredElement: "fire",
    reward: { gold: 1_200, items: { ether_dust: 7, training_data: 2 } },
  },
  {
    id: "fjord-deep-recovery", zoneId: "obsidian-fjord", name: "Tiefenarchiv öffnen",
    description: "Nur eine entwickelte Form hält dem Druck im alten Archiv stand.",
    durationMs: 90 * 60_000, minimumLevel: 12, requiresEvolved: true, preferredRole: "defender", preferredElement: "water",
    reward: { gold: 2_100, items: { evolution_core: 1, ether_dust: 10 } },
  },
];

export const getExpedition = (id: string): ExpeditionDefinition | undefined =>
  EXPEDITIONS.find((entry) => entry.id === id);

export const isMonsterDispatched = (state: GameState, monsterUid: string): boolean =>
  state.expeditions.some((entry) => entry.monsterUid === monsterUid);

export const expeditionMatchCount = (monster: MonsterInstance, definition: ExpeditionDefinition): number => {
  const lineage = getMonster(monster.definitionId);
  const form = getMonsterForm(monster);
  let matches = 0;
  if (definition.preferredRole && form.combatRole === definition.preferredRole) matches += 1;
  if (definition.preferredElement && lineage.element === definition.preferredElement) matches += 1;
  if (monster.evolution === "evolved") matches += 1;
  return matches;
};

export const expeditionRewardMultiplier = (monster: MonsterInstance, definition: ExpeditionDefinition): number =>
  1 + expeditionMatchCount(monster, definition) * 0.15;

export const canStartExpedition = (
  state: GameState,
  definition: ExpeditionDefinition,
  monster: MonsterInstance,
  slot: number,
): boolean =>
  slot >= 1 &&
  slot <= EXPEDITION_SLOT_COUNT &&
  !state.expeditions.some((entry) => entry.slot === slot) &&
  state.unlockedZoneIds.includes(definition.zoneId) &&
  monster.level >= definition.minimumLevel &&
  (!definition.requiresEvolved || monster.evolution === "evolved") &&
  monster.uid !== state.activeMonsterUid &&
  monster.uid !== state.supportMonsterUid &&
  !isMonsterDispatched(state, monster.uid);
