import type { RunBootstrapResponse, RunCommand, RunCommandEnvelope, RunCommandResponse } from "@idle-tamer/contracts";
import { RUN_CONTRACT_VERSION } from "@idle-tamer/contracts";
import { RunDatabaseError, type RunStore } from "@idle-tamer/database";

import { ApiError } from "../errors";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const parseEnvelope = (payload: unknown): RunCommandEnvelope => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new ApiError(400, "VALIDATION", "Ungültiges Run-Kommando.");
  const body = payload as Partial<RunCommandEnvelope>;
  if (!UUID_PATTERN.test(body.commandId ?? "") || !UUID_PATTERN.test(body.clientInstanceId ?? "") || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || !body.command || typeof body.command !== "object") {
    throw new ApiError(400, "VALIDATION", "Ungültiges Run-Kommando.");
  }
  if (typeof body.issuedAt !== "string" || !Number.isFinite(Date.parse(body.issuedAt))) throw new ApiError(400, "VALIDATION", "Ungültiger Kommandozeitpunkt.");
  let command: RunCommand;
  if (body.command.type === "monster.level_up") {
    if (typeof body.command.definitionId !== "string" || body.command.definitionId.length > 80) throw new ApiError(400, "VALIDATION", "Ungültiges Monster.");
    command = { type: "monster.level_up", definitionId: body.command.definitionId };
  } else if (body.command.type === "zone.select") {
    if (typeof body.command.zoneId !== "string" || body.command.zoneId.length > 80) throw new ApiError(400, "VALIDATION", "Ungültige Zone.");
    command = { type: "zone.select", zoneId: body.command.zoneId };
  } else if (body.command.type !== "cache.claim") {
    throw new ApiError(400, "VALIDATION", "Dieses Run-Kommando ist nicht verfügbar.");
  } else {
    command = { type: "cache.claim" };
  }
  return {
    commandId: body.commandId as string,
    clientInstanceId: body.clientInstanceId as string,
    expectedRevision: body.expectedRevision as number,
    issuedAt: body.issuedAt,
    command,
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
    if (error.code === "INSUFFICIENT_BALANCE") return new ApiError(409, "VALIDATION", "Für dieses Run-Level fehlt Gold.");
    if (error.code === "NOT_READY") return new ApiError(409, "VALIDATION", "Wähle zuerst einen Starter, bevor der Online-Run beginnt.");
    if (error.code === "NOT_FOUND") return new ApiError(404, "UNKNOWN", "Der Run wurde nicht gefunden.");
    return new ApiError(400, "VALIDATION", error.message === "The combat cache is empty." ? "Der Kampfspeicher ist leer." : "Diese Run-Aktion ist nicht zulässig.");
  }
}
