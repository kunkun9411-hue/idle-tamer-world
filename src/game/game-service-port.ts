import type { GameApiClient } from "./api-client";
import { GameApiError } from "./api-client";
import type { GameCommand } from "./api-contract";
import { BALANCE_CONTRACT_VERSION, BALANCE_RELEASE_ID, CONTENT_CONTRACT_VERSION, CONTENT_RELEASE_ID } from "./contract-versions";
import type { LocalGameService } from "./game-service";
import type { GameState } from "./types";
import type { PlayerSettings } from "./types";

export type ServiceConnectionState = "idle" | "loading" | "ready" | "offline" | "conflict" | "error";

export interface GameServiceResult {
  accepted: boolean;
  revision: number;
  state: GameState;
  event?: { type: string; payload: Record<string, string | number | boolean> };
}

/**
 * Async intent boundary used by both local development and the authoritative API.
 * The UI sends commands; it never supplies resulting balances or rewards.
 */
export interface GameServicePort {
  readonly mode: "local" | "remote";
  readonly connection: ServiceConnectionState;
  readonly revision: number;
  readonly state: GameState;
  bootstrap(signal?: AbortSignal): Promise<GameServiceResult>;
  send(command: GameCommand, signal?: AbortSignal): Promise<GameServiceResult>;
}

const event = (type: string, payload: Record<string, string | number | boolean> = {}) => ({ type, payload });

export class LocalGameServicePort implements GameServicePort {
  public readonly mode = "local" as const;
  public connection: ServiceConnectionState = "ready";
  public revision = 0;

  public constructor(private readonly local: LocalGameService) {}

  public get state(): GameState {
    return this.local.state;
  }

  public async bootstrap(): Promise<GameServiceResult> {
    return { accepted: true, revision: this.revision, state: this.state, event: event("bootstrap.local", { contentContractVersion: CONTENT_CONTRACT_VERSION, contentReleaseId: CONTENT_RELEASE_ID, balanceContractVersion: BALANCE_CONTRACT_VERSION, balanceReleaseId: BALANCE_RELEASE_ID }) };
  }

  public async send(command: GameCommand): Promise<GameServiceResult> {
    let accepted = false;
    let emitted: GameServiceResult["event"];
    switch (command.type) {
      case "starter.choose": accepted = this.local.chooseStarter(command.definitionId); break;
      case "cache.claim": accepted = this.local.collectCache(); break;
      case "monster.activate": accepted = this.local.makeActive(command.monsterUid); break;
      case "monster.support": accepted = this.local.makeSupport(command.monsterUid); break;
      case "monster.level_up": accepted = this.local.levelUp(command.monsterUid); break;
      case "monster.train": accepted = this.local.trainWithData(command.monsterUid); break;
      case "monster.hyper_up": accepted = this.local.upgradeHyper(command.monsterUid); break;
      case "monster.evolve": accepted = this.local.evolve(command.monsterUid); break;
      case "monster.gem_equip": accepted = this.local.equipGem(command.monsterUid, command.gemId); break;
      case "monster.gem_unequip": accepted = this.local.unequipGem(command.monsterUid, command.gemId); break;
      case "zone.select": accepted = this.local.selectZone(command.zoneId); break;
      case "incubation.start": accepted = this.local.startIncubation(command.definitionId); break;
      case "incubation.hatch": {
        const result = this.local.hatchIncubation();
        accepted = result !== null;
        if (result) emitted = event("incubation.hatched", { definitionId: result.definitionId, kind: result.kind, fragments: result.fragments });
        break;
      }
      case "incubation.accelerate": accepted = this.local.useIncubatorCharge(); break;
      case "research.upgrade": accepted = this.local.buyResearch(command.researchId); break;
      case "milestone.claim": accepted = this.local.claimMilestone(command.target); break;
      case "objective.claim": accepted = this.local.claimObjective(command.objectiveId); break;
      case "expedition.start": accepted = this.local.startExpedition(command.slot, command.definitionId, command.monsterUid); break;
      case "expedition.claim": {
        const result = this.local.claimExpedition(command.expeditionId);
        accepted = result !== null;
        if (result) emitted = event("expedition.claimed", { expeditionId: command.expeditionId, gold: result.gold });
        break;
      }
      case "crafting.craft": accepted = this.local.craftItem(command.recipeId); break;
      case "settings.update": {
        const booleanKeys: Array<keyof PlayerSettings> = ["soundEnabled", "combatEffects", "reducedMotion"];
        if (booleanKeys.includes(command.key as keyof PlayerSettings) && typeof command.value === "boolean") {
          accepted = this.local.setSetting(command.key as keyof PlayerSettings, command.value);
        } else if (command.key === "numberFormat" && (command.value === "compact" || command.value === "full")) {
          accepted = this.local.setSetting("numberFormat", command.value);
        }
        break;
      }
      case "tutorial.advance": accepted = this.local.advanceTutorial(command.skip); break;
      case "system_message.claim": accepted = this.local.claimSystemMessage(command.messageId); break;
      case "profile.avatar": accepted = this.local.setAvatar(command.avatarId); break;
      case "profile.frame": accepted = this.local.setFrame(command.frameId); break;
      case "prestige.start": {
        const reward = this.local.prestige();
        accepted = reward > 0;
        if (accepted) emitted = event("prestige.completed", { cores: reward });
        break;
      }
    }
    if (accepted) this.revision += 1;
    return { accepted, revision: this.revision, state: this.state, event: emitted };
  }
}

export class HttpGameService implements GameServicePort {
  public readonly mode = "remote" as const;
  public connection: ServiceConnectionState = "idle";
  public revision = 0;
  private currentState: GameState | null = null;

  public constructor(private readonly client: GameApiClient) {}

  public get state(): GameState {
    if (!this.currentState) throw new Error("HttpGameService must be bootstrapped before state is read.");
    return this.currentState;
  }

  public async bootstrap(signal?: AbortSignal): Promise<GameServiceResult> {
    this.connection = "loading";
    try {
      const response = await this.client.bootstrap(signal);
      this.currentState = response.state;
      this.revision = response.revision;
      this.connection = "ready";
      return { accepted: true, revision: this.revision, state: this.state, event: event("bootstrap.remote") };
    } catch (error) {
      this.connection = this.connectionFor(error);
      throw error;
    }
  }

  public async send(command: GameCommand, signal?: AbortSignal): Promise<GameServiceResult> {
    try {
      const response = await this.client.send(command, this.revision, signal);
      this.currentState = response.state;
      this.revision = response.revision;
      this.connection = "ready";
      return { accepted: response.accepted, revision: response.revision, state: response.state, event: response.event };
    } catch (error) {
      this.connection = this.connectionFor(error);
      throw error;
    }
  }

  private connectionFor(error: unknown): ServiceConnectionState {
    if (error instanceof GameApiError && error.problem.code === "CONFLICT") return "conflict";
    if (error instanceof GameApiError && error.problem.code === "UNAVAILABLE") return "offline";
    return "error";
  }
}
