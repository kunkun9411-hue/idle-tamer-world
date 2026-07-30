export const TEST_CHEST_REWARD = {
  gold: 250,
  itemId: "ether_dust" as const,
  itemName: "Etherstaub",
  itemAmount: 3,
};

export interface TestChestPresentation {
  actionLabel: "ÖFFNEN" | "PRÜFEN";
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
      actionLabel: "PRÜFEN",
      description: `Die versiegelte Truhe enthält ${rewardSummary}.`,
      detail: "Ether-Versiegelung aktiv",
    }
  : {
      actionLabel: "ÖFFNEN",
      description: `Enthält ${rewardSummary}.`,
      detail: "Wird deinem Inventar gutgeschrieben",
    };

export const testChestOpenResult = (online: boolean): TestChestOpenResult => online
  ? {
      consumeChest: false,
      creditRewards: false,
      title: "Versiegelte Ether-Truhe",
      message: `Die Truhe enthält ${rewardSummary}. Ihre Ether-Versiegelung ist noch aktiv und der Inhalt bleibt sicher verwahrt.`,
      tone: "violet",
    }
  : {
      consumeChest: true,
      creditRewards: true,
      title: "Ether-Truhe geöffnet",
      message: `+${TEST_CHEST_REWARD.gold} Gold und +${TEST_CHEST_REWARD.itemAmount} ${TEST_CHEST_REWARD.itemName} wurden deinem Inventar gutgeschrieben.`,
      tone: "success",
    };
