import { GUILD_CONTRACT_VERSION, type GuildBootstrapResponse, type GuildCommand, type GuildCommandEnvelope, type GuildCommandResponse } from "@idle-tamer/contracts";
import { GuildDatabaseError, type GuildStore } from "@idle-tamer/database";

import { ApiError } from "../errors";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/u;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u;

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "VALIDATION", "Ungültiges Sozialkommando.");
  return value as Record<string, unknown>;
};
const uuid = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) throw new ApiError(400, "VALIDATION", `${label} ist ungültig.`);
  return value;
};
const id = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new ApiError(400, "VALIDATION", `${label} ist ungültig.`);
  return value;
};
const text = (value: unknown, label: string, minimum: number, maximum: number): string => {
  if (typeof value !== "string") throw new ApiError(400, "VALIDATION", `${label} fehlt.`);
  const trimmed = value.trim().normalize("NFC");
  if (trimmed.length < minimum || trimmed.length > maximum) throw new ApiError(400, "VALIDATION", `${label} muss ${minimum} bis ${maximum} Zeichen lang sein.`);
  return trimmed;
};

const parseCommand = (value: unknown): GuildCommand => {
  const candidate = object(value);
  switch (candidate.type) {
    case "guild.create": {
      const name = text(candidate.name, "Gildenname", 3, 32);
      const tag = text(candidate.tag, "Gilden-Tag", 2, 5).toUpperCase();
      const description = typeof candidate.description === "string" ? candidate.description.trim().normalize("NFC") : "";
      if (!NAME_PATTERN.test(name) || !/^[A-Z0-9]{2,5}$/u.test(tag) || description.length > 240) throw new ApiError(400, "VALIDATION", "Gildenname, Tag oder Beschreibung ist ungültig.");
      return { type: candidate.type, name, tag, description };
    }
    case "guild.join": return { type: candidate.type, guildId: uuid(candidate.guildId, "Gilde") };
    case "guild.leave": case "guild.boss_attack": case "guild.expedition_start": return { type: candidate.type };
    case "guild.leadership_transfer":
      return { type: candidate.type, playerId: uuid(candidate.playerId, "Mitglied") };
    case "guild.role_set":
      if (!["officer", "member"].includes(String(candidate.role))) throw new ApiError(400, "VALIDATION", "Gildenrolle ist ungültig.");
      return { type: candidate.type, playerId: uuid(candidate.playerId, "Mitglied"), role: candidate.role as "officer" | "member" };
    case "guild.kick": case "friend.accept": case "friend.remove": case "player.block": case "player.unblock":
      return { type: candidate.type, playerId: uuid(candidate.playerId, "Spieler") };
    case "guild.policy_set":
      if (!['open', 'invite'].includes(String(candidate.joinPolicy))) throw new ApiError(400, "VALIDATION", "Beitrittsregel ist ungültig.");
      return { type: candidate.type, joinPolicy: candidate.joinPolicy as "open" | "invite" };
    case "guild.invite": return { type: candidate.type, displayName: text(candidate.displayName, "Tamer-Name", 3, 20) };
    case "guild.invite_accept": case "guild.invite_decline":
      return { type: candidate.type, inviteId: uuid(candidate.inviteId, "Einladung") };
    case "guild.donate":
      if (!Number.isSafeInteger(candidate.amount) || Number(candidate.amount) < 1 || Number(candidate.amount) > 1_000_000) throw new ApiError(400, "VALIDATION", "Spendenmenge ist ungültig.");
      return { type: candidate.type, amount: Number(candidate.amount) };
    case "guild.gene_upgrade": return { type: candidate.type, geneId: id(candidate.geneId, "Gen") };
    case "guild.vote_create":
      if (!['gene_upgrade', 'policy_change'].includes(String(candidate.kind))) throw new ApiError(400, "VALIDATION", "Abstimmungsart ist ungültig.");
      return { type: candidate.type, kind: candidate.kind as "gene_upgrade" | "policy_change", subject: id(candidate.subject, "Abstimmungsthema") };
    case "guild.vote_cast":
      if (!['yes', 'no'].includes(String(candidate.choice))) throw new ApiError(400, "VALIDATION", "Stimme ist ungültig.");
      return { type: candidate.type, voteId: uuid(candidate.voteId, "Abstimmung"), choice: candidate.choice as "yes" | "no" };
    case "guild.vote_resolve": return { type: candidate.type, voteId: uuid(candidate.voteId, "Abstimmung") };
    case "guild.task_claim": return { type: candidate.type, taskId: id(candidate.taskId, "Gildenaufgabe") };
    case "guild.expedition_claim": return { type: candidate.type, expeditionId: uuid(candidate.expeditionId, "Expedition") };
    case "guild.chat_send": return { type: candidate.type, body: text(candidate.body, "Nachricht", 1, 280) };
    case "friend.request": return { type: candidate.type, displayName: text(candidate.displayName, "Tamer-Name", 3, 20) };
    case "player.report": {
      if (!["spam", "harassment", "cheating", "name", "other"].includes(String(candidate.reason))) throw new ApiError(400, "VALIDATION", "Meldegrund ist ungültig.");
      const details = typeof candidate.details === "string" ? candidate.details.trim().normalize("NFC") : "";
      if (details.length > 500) throw new ApiError(400, "VALIDATION", "Meldedetails sind zu lang.");
      return { type: candidate.type, playerId: uuid(candidate.playerId, "Spieler"), reason: String(candidate.reason), details };
    }
    default: throw new ApiError(400, "VALIDATION", "Dieses Sozialkommando ist nicht verfügbar.");
  }
};

const parseEnvelope = (payload: unknown): GuildCommandEnvelope => {
  const body = object(payload);
  if (!Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || typeof body.issuedAt !== "string" || !Number.isFinite(Date.parse(body.issuedAt))) {
    throw new ApiError(400, "VALIDATION", "Das Sozialkommando ist veraltet oder ungültig.");
  }
  return {
    commandId: uuid(body.commandId, "Kommando"),
    clientInstanceId: uuid(body.clientInstanceId, "Browser"),
    expectedRevision: Number(body.expectedRevision),
    issuedAt: body.issuedAt,
    command: parseCommand(body.command),
  };
};

export class GuildService {
  public constructor(private readonly store: GuildStore, private readonly now: () => Date = () => new Date()) {}

  public async bootstrap(userId: string): Promise<GuildBootstrapResponse> {
    try { return { guildContractVersion: GUILD_CONTRACT_VERSION, ...(await this.store.bootstrap(userId, this.now())) }; }
    catch (error) { throw this.map(error); }
  }

  public async command(userId: string, payload: unknown): Promise<GuildCommandResponse> {
    const envelope = parseEnvelope(payload);
    try { return await this.store.executeCommand(userId, envelope, this.now()); }
    catch (error) { throw this.map(error); }
  }

  private map(error: unknown): Error {
    if (!(error instanceof GuildDatabaseError)) return error instanceof Error ? error : new Error("Unknown guild failure.");
    if (error.code === "CONFLICT") return new ApiError(409, "CONFLICT", error.message, error.latestRevision);
    if (error.code === "FORBIDDEN") return new ApiError(403, "VALIDATION", error.message);
    if (error.code === "NOT_FOUND") return new ApiError(404, "UNKNOWN", error.message);
    return new ApiError(409, "VALIDATION", error.message);
  }
}
