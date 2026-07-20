import type { GameState, ItemInventory, ResearchId } from "./domain";
import { BALANCE_CONTRACT_VERSION, BALANCE_RELEASE_ID, CONTENT_CONTRACT_VERSION, CONTENT_RELEASE_ID, ERROR_CONTRACT_VERSION } from "./versions";

export const API_PROTOCOL_VERSION = 8;

export interface SessionSummary {
  authenticated: boolean;
  playerId: string | null;
  displayName: string;
}

export interface GameFeatureFlags {
  guilds: boolean;
  guildDna: boolean;
  liveEvents: boolean;
  pvp: boolean;
}

/** Server-calculated result of the time between the last save and bootstrap. */
export interface OfflineProgressSummary {
  elapsedSeconds: number;
  rewardedSeconds: number;
  slotsAdded: number;
  goldAdded: number;
  eggDefinitionIds: string[];
  itemDeltas: Partial<ItemInventory>;
}

/** Stable bootstrap boundary shared by the browser and the authoritative API. */
export interface GameStateResponse {
  protocolVersion: typeof API_PROTOCOL_VERSION;
  contentContractVersion: typeof CONTENT_CONTRACT_VERSION;
  contentReleaseId: typeof CONTENT_RELEASE_ID;
  balanceContractVersion: typeof BALANCE_CONTRACT_VERSION;
  balanceReleaseId: typeof BALANCE_RELEASE_ID;
  revision: number;
  serverTime: string;
  state: GameState;
}

export interface GameBootstrapResponse extends GameStateResponse {
  session: SessionSummary;
  features: GameFeatureFlags;
  offline: OfflineProgressSummary;
}

export type GameCommand =
  | { type: "starter.choose"; definitionId: string }
  | { type: "cache.claim" }
  | { type: "monster.activate"; monsterUid: string }
  | { type: "monster.support"; monsterUid: string }
  | { type: "monster.level_up"; monsterUid: string }
  | { type: "monster.train"; monsterUid: string }
  | { type: "monster.hyper_up"; monsterUid: string }
  | { type: "monster.evolve"; monsterUid: string }
  | { type: "monster.gem_equip"; monsterUid: string; gemId: string }
  | { type: "monster.gem_unequip"; monsterUid: string; gemId: string }
  | { type: "zone.select"; zoneId: string }
  | { type: "incubation.start"; definitionId: string }
  | { type: "incubation.hatch"; incubationId: string }
  | { type: "incubation.accelerate" }
  | { type: "research.upgrade"; researchId: ResearchId }
  | { type: "milestone.claim"; target: number }
  | { type: "objective.claim"; objectiveId: string; periodKey: string }
  | { type: "expedition.start"; slot: number; definitionId: string; monsterUid: string }
  | { type: "expedition.claim"; expeditionId: string }
  | { type: "crafting.craft"; recipeId: string }
  | { type: "settings.update"; key: string; value: string | boolean }
  | { type: "tutorial.advance"; skip: boolean }
  | { type: "system_message.claim"; messageId: string }
  | { type: "profile.avatar"; avatarId: string }
  | { type: "profile.frame"; frameId: string }
  | { type: "prestige.start" };

export interface GameCommandEnvelope {
  commandId: string;
  clientInstanceId: string;
  expectedRevision: number;
  issuedAt: string;
  command: GameCommand;
}

export interface GameCommandResponse extends GameStateResponse {
  accepted: boolean;
  event?: {
    type: string;
    payload: Record<string, string | number | boolean>;
  };
}

export interface ApiProblem {
  errorContractVersion: typeof ERROR_CONTRACT_VERSION;
  code: "UNAUTHENTICATED" | "CONFLICT" | "VALIDATION" | "RATE_LIMITED" | "UNAVAILABLE" | "UNKNOWN";
  message: string;
  correlationId?: string;
  latestRevision?: number;
}

export const createCommandEnvelope = (
  command: GameCommand,
  expectedRevision: number,
  clientInstanceId: string,
  commandId = crypto.randomUUID(),
): GameCommandEnvelope => ({
  commandId,
  clientInstanceId,
  expectedRevision,
  issuedAt: new Date().toISOString(),
  command,
});
