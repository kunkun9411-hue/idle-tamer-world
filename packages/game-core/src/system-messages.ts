import type { GameState, ItemInventory } from "@idle-tamer/contracts";

export interface SystemMessageDefinition {
  id: string;
  title: string;
  body: string;
  category: "welcome" | "progress" | "system";
  reward?: {
    gold?: number;
    items?: Partial<ItemInventory>;
  };
  available: (state: GameState) => boolean;
}

export const SYSTEM_MESSAGES: SystemMessageDefinition[] = [
  {
    id: "welcome-protocol",
    title: "Willkommen im Ether-Protokoll",
    body: "Dein lokaler Tamer-Datensatz wurde angelegt. Dieses Startpaket hilft beim ersten Run.",
    category: "welcome",
    reward: { gold: 100, items: { training_data: 1 } },
    available: () => true,
  },
  {
    id: "collection-online",
    title: "Sammlungsarchiv erweitert",
    body: "Du besitzt jetzt mehrere Monster. Freie Partner können unabhängig vom Hauptkampf auf Zeit-Expedition gehen.",
    category: "progress",
    reward: { items: { ether_dust: 2 } },
    available: (state) => state.roster.length >= 2,
  },
  {
    id: "first-zone-boss",
    title: "Zonenboss-Signal bestätigt",
    body: "Der erste Boss wurde besiegt. Evolutionskerne, Gems und neue Zonen sind jetzt Teil deiner normalen Progression.",
    category: "progress",
    reward: { items: { incubator_charge: 1 } },
    available: (state) => Object.values(state.zoneProgress).some((progress) => progress.clears > 0),
  },
];

export const getSystemMessage = (id: string): SystemMessageDefinition | undefined =>
  SYSTEM_MESSAGES.find((entry) => entry.id === id);
