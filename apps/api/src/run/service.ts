import type { RunBootstrapResponse, RunCommand, RunCommandEnvelope, RunCommandResponse } from "@idle-tamer/contracts";
import { RUN_CONTRACT_VERSION } from "@idle-tamer/contracts";
import { RunDatabaseError, type RunStore } from "@idle-tamer/database";

import { ApiError } from "../errors";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/u;

const id = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new ApiError(400, "VALIDATION", `${label} ist ungültig.`);
  return value;
};

const uuid = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new ApiError(400, "VALIDATION", `${label} ist ungültig.`);
  return value;
};

const parseCommand = (candidate: Record<string, unknown>): RunCommand => {
  switch (candidate.type) {
    case "cache.claim": case "incubation.accelerate": case "incubation.hatch": case "prestige.activate":
      return { type: candidate.type };
    case "monster.level_up": case "incubation.start":
      return { type: candidate.type, definitionId: id(candidate.definitionId, "Definition") };
    case "monster.train": case "monster.hyper_up": case "monster.evolve": case "monster.activate": case "monster.support":
      return { type: candidate.type, monsterUid: uuid(candidate.monsterUid, "Monster") };
    case "gem.equip":
      return { type: candidate.type, monsterUid: uuid(candidate.monsterUid, "Monster"), gemId: id(candidate.gemId, "Gem") };
    case "gem.unequip":
      if (!["triangle", "square", "diamond"].includes(String(candidate.shape))) throw new ApiError(400, "VALIDATION", "Gem-Form ist ungültig.");
      return { type: candidate.type, monsterUid: uuid(candidate.monsterUid, "Monster"), shape: candidate.shape as "triangle" | "square" | "diamond" };
    case "zone.select":
      return { type: candidate.type, zoneId: id(candidate.zoneId, "Zone") };
    case "research.buy":
      if (!["power", "vitality", "extraction", "incubation"].includes(String(candidate.researchId))) throw new ApiError(400, "VALIDATION", "Forschungszweig ist ungültig.");
      return { type: candidate.type, researchId: candidate.researchId as "power" | "vitality" | "extraction" | "incubation" };
    case "milestone.claim":
      if (!Number.isSafeInteger(candidate.target) || Number(candidate.target) <= 0) throw new ApiError(400, "VALIDATION", "Meilenstein ist ungültig.");
      return { type: candidate.type, target: Number(candidate.target) };
    case "objective.claim":
      return { type: candidate.type, objectiveId: id(candidate.objectiveId, "Auftrag") };
    case "expedition.start":
      if (!Number.isSafeInteger(candidate.slot) || Number(candidate.slot) < 1 || Number(candidate.slot) > 2) throw new ApiError(400, "VALIDATION", "Expeditionsslot ist ungültig.");
      return { type: candidate.type, slot: Number(candidate.slot), definitionId: id(candidate.definitionId, "Expedition"), monsterUid: uuid(candidate.monsterUid, "Monster") };
    case "expedition.claim":
      return { type: candidate.type, expeditionId: uuid(candidate.expeditionId, "Expedition") };
    case "crafting.craft":
      return { type: candidate.type, recipeId: id(candidate.recipeId, "Rezept") };
    case "settings.update": {
      if (!["soundEnabled", "combatEffects", "reducedMotion", "numberFormat"].includes(String(candidate.key))) throw new ApiError(400, "VALIDATION", "Einstellung ist ungültig.");
      const validValue = candidate.key === "numberFormat" ? ["compact", "full"].includes(String(candidate.value)) : typeof candidate.value === "boolean";
      if (!validValue) throw new ApiError(400, "VALIDATION", "Einstellungswert ist ungültig.");
      return { type: candidate.type, key: candidate.key as "soundEnabled" | "combatEffects" | "reducedMotion" | "numberFormat", value: candidate.value as boolean | "compact" | "full" };
    }
    case "tutorial.advance":
      if (typeof candidate.skip !== "boolean") throw new ApiError(400, "VALIDATION", "Tutorialstatus ist ungültig.");
      return { type: candidate.type, skip: candidate.skip };
    case "system_message.claim":
      return { type: candidate.type, messageId: id(candidate.messageId, "Nachricht") };
    default:
      throw new ApiError(400, "VALIDATION", "Dieses Run-Kommando ist nicht verfügbar.");
  }
};

const parseEnvelope = (payload: unknown): RunCommandEnvelope => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ApiError(400, "VALIDATION", "Ungültiges Run-Kommando.");
  const body = payload as Partial<RunCommandEnvelope>;
  if (!UUID_PATTERN.test(body.commandId ?? "") || !UUID_PATTERN.test(body.clientInstanceId ?? "") || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || !body.command || typeof body.command !== "object") {
    throw new ApiError(400, "VALIDATION", "Ungültiges Run-Kommando.");
  }
  if (typeof body.issuedAt !== "string" || !Number.isFinite(Date.parse(body.issuedAt))) throw new ApiError(400, "VALIDATION", "Ungültiger Kommandozeitpunkt.");
  return {
    commandId: body.commandId as string,
    clientInstanceId: body.clientInstanceId as string,
    expectedRevision: body.expectedRevision as number,
    issuedAt: body.issuedAt,
    command: parseCommand(body.command as unknown as Record<string, unknown>),
  };
};

export class RunService {
  public constructor(private readonly store: RunStore, private readonly now: () => Date = () => new Date()) {}

  public async bootstrap(userId: string): Promise<RunBootstrapResponse> {
    try {
      const result = await this.store.bootstrap(userId, this.now());
      return { runContractVersion: RUN_CONTRACT_VERSION, ...result };
    } catch (error) {
      throw this.mapError(error);
    }
  }

  public async command(userId: string, payload: unknown): Promise<RunCommandResponse> {
    const envelope = parseEnvelope(payload);
    try {
      return await this.store.executeCommand(userId, envelope, this.now());
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    if (!(error instanceof RunDatabaseError)) return error instanceof Error ? error : new Error("Unknown run failure.");
    if (error.code === "CONFLICT") return new ApiError(409, "CONFLICT", "Der Run wurde bereits in einem anderen Browser verändert.", error.latestRevision);
    if (error.code === "INSUFFICIENT_BALANCE") return new ApiError(409, "VALIDATION", error.message || "Für diese Aktion fehlen Ressourcen.");
    if (error.code === "NOT_READY") return new ApiError(409, "VALIDATION", "Wähle zuerst einen Starter, bevor der Online-Run beginnt.");
    if (error.code === "NOT_FOUND") return new ApiError(404, "UNKNOWN", "Der Run wurde nicht gefunden.");
    return new ApiError(400, "VALIDATION", error.message === "The combat cache is empty." ? "Der Kampfspeicher ist leer." : error.message || "Diese Run-Aktion ist nicht zulässig.");
  }
}
