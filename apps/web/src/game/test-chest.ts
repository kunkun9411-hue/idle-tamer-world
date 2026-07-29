export const TEST_CHEST_REWARD = {
  gold: 250,
  itemId: "ether_dust" as const,
  itemName: "Etherstaub",
  itemAmount: 3,
};

export interface TestChestPresentation {
  actionLabel: "ÖFFNEN" | "VORSCHAU";
  description: string;
  detail: string;
}

export interface TestChestOpenResult {
  consumeChest: boolean;
  creditRewards: boolean;
  title: string;
  message: string;
  tone: "violet" | "success";
}

const rewardSummary = `${TEST_CHEST_REWARD.gold} Gold und ${TEST_CHEST_REWARD.itemAmount} ${TEST_CHEST_REWARD.itemName}`;

export const testChestPresentation = (online: boolean): TestChestPresentation => online
  ? {
      actionLabel: "VORSCHAU",
      description: `Vorschauinhalt: ${rewardSummary}.`,
      detail: "Keine Kontobuchung im Online-Modus",
    }
  : {
      actionLabel: "ÖFFNEN",
      description: `Enthält ${rewardSummary}.`,
      detail: "Wird sofort lokal gutgeschrieben",
    };

export const testChestOpenResult = (online: boolean): TestChestOpenResult => online
  ? {
      consumeChest: false,
      creditRewards: false,
      title: "Truhenvorschau",
      message: `${rewardSummary} sind als Inhalt vorgesehen. Es wurde nichts von deinem Online-Konto verbraucht oder gebucht.`,
      tone: "violet",
    }
  : {
      consumeChest: true,
      creditRewards: true,
      title: "Ether-Truhe geöffnet",
      message: `+${TEST_CHEST_REWARD.gold} Gold und +${TEST_CHEST_REWARD.itemAmount} ${TEST_CHEST_REWARD.itemName} wurden deinem Inventar gutgeschrieben.`,
      tone: "success",
    };
