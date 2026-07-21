import { BALANCE_RELEASE_ID, CONTENT_RELEASE_ID } from "./versions";

export const RUN_CONTRACT_VERSION = 1 as const;

export type RunProgressionStatus = "fighting" | "blocked" | "cache_full";

export interface RunZoneProgressSnapshot {
  stage: number;
  clears: string;
}

export interface AuthoritativeRunSnapshot {
  revision: number;
  serverTime: string;
  contentReleaseId: typeof CONTENT_RELEASE_ID;
  balanceReleaseId: typeof BALANCE_RELEASE_ID;
  gold: string;
  pendingGold: string;
  cacheSlotsUsed: number;
  cacheCapacity: number;
  activeMonster: {
    definitionId: string;
    level: number;
  };
  currentZoneId: string;
  unlockedZoneIds: string[];
  highestZoneNumber: number;
  zoneProgress: Record<string, RunZoneProgressSnapshot>;
  runVictories: string;
  totalVictories: string;
  progressionStatus: RunProgressionStatus;
  nextCombatAt: string;
}

export interface RunBootstrapResponse {
  runContractVersion: typeof RUN_CONTRACT_VERSION;
  snapshot: AuthoritativeRunSnapshot;
  settlement: {
    victoriesAdded: number;
    goldAdded: string;
  };
}

export type RunCommand =
  | { type: "cache.claim" }
  | { type: "monster.level_up"; definitionId: string }
  | { type: "zone.select"; zoneId: string };

export interface RunCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: RunCommand;
}

export interface RunCommandResponse {
  runContractVersion: typeof RUN_CONTRACT_VERSION;
  accepted: true;
  replayed: boolean;
  snapshot: AuthoritativeRunSnapshot;
  event: {
    type: "cache.claimed" | "monster.level_up" | "zone.selected";
    payload: Record<string, string | number | boolean>;
  };
}
