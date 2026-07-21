import { AdminDatabaseError, type AdminStore, type InternalRole, type ModerationAction } from "@idle-tamer/database";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { AuthError } from "../auth/errors";
import { AuthRateLimiter } from "../auth/rate-limit";
import { AuthService } from "../auth/service";
import { ApiError } from "../errors";

export interface AdminRoutesOptions {
  authService: AuthService;
  rateLimiter: AuthRateLimiter;
  adminStore: AdminStore;
  publicOrigin: string;
  now?: () => Date;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RELEASE_PATTERN = /^[a-z0-9][a-z0-9.-]{0,79}$/u;
const cookie = (request: FastifyRequest): string | undefined => request.cookies[AuthService.cookieName];
const csrf = (request: FastifyRequest): string | undefined => {
  const value = request.headers["x-csrf-token"];
  return Array.isArray(value) ? value[0] : value;
};
const bodyObject = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "VALIDATION", "Ungültige interne Anfrage.");
  return body as Record<string, unknown>;
};
const mapped = async <T>(operation: () => Promise<T>): Promise<T> => {
  try { return await operation(); }
  catch (error) {
    if (!(error instanceof AdminDatabaseError)) throw error;
    if (error.code === "FORBIDDEN") throw new AuthError(403, "FORBIDDEN", undefined, error.message);
    if (error.code === "NOT_FOUND") throw new ApiError(404, "UNKNOWN", error.message);
    throw new ApiError(409, "VALIDATION", error.message);
  }
};

export const registerAdminRoutes = async (app: FastifyInstance, options: AdminRoutesOptions): Promise<void> => {
  const now = options.now ?? (() => new Date());
  const session = async (request: FastifyRequest, roles: InternalRole[], mutating = false) => {
    if (mutating) {
      if (request.headers.origin !== options.publicOrigin) throw new AuthError(403, "FORBIDDEN", "ORIGIN_INVALID", "Diese Anfrage stammt nicht von der Spielseite.");
      if (request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") throw new AuthError(415, "VALIDATION", undefined, "Diese Anfrage muss JSON verwenden.");
    }
    const authenticated = await options.authService.authenticate(cookie(request));
    if (mutating) options.authService.authorizeCsrf(authenticated, csrf(request));
    await mapped(() => options.adminStore.authorize(authenticated.identity.userId, roles));
    await options.rateLimiter.enforce("internal-tool.user", authenticated.identity.userId, mutating ? 30 : 120, 60_000);
    return authenticated;
  };

  app.get("/api/v1/internal/content", async (request) => {
    await session(request, ["support", "moderator", "admin"]);
    return mapped(() => options.adminStore.contentOverview());
  });
  app.post<{ Params: { action: string } }>("/api/v1/internal/content/:action", async (request) => {
    const authenticated = await session(request, ["admin"], true);
    const body = bodyObject(request.body);
    const contentReleaseId = typeof body.contentReleaseId === "string" ? body.contentReleaseId : "";
    if (!RELEASE_PATTERN.test(contentReleaseId)) throw new ApiError(400, "VALIDATION", "Content-Release-ID ist ungültig.");
    if (request.params.action === "preview") return mapped(() => options.adminStore.previewContent(authenticated.identity.userId, contentReleaseId));
    if (request.params.action === "activate" || request.params.action === "rollback") {
      const action: "activate" | "rollback" = request.params.action;
      return mapped(() => options.adminStore.switchContent(authenticated.identity.userId, contentReleaseId, action));
    }
    throw new ApiError(404, "UNKNOWN", "Diese Content-Aktion existiert nicht.");
  });
  app.get("/api/v1/internal/moderation/reports", async (request) => {
    await session(request, ["moderator", "admin"]);
    return mapped(() => options.adminStore.moderationQueue());
  });
  app.post<{ Params: { reportId: string } }>("/api/v1/internal/moderation/reports/:reportId/actions", async (request) => {
    const authenticated = await session(request, ["moderator", "admin"], true);
    if (!UUID_PATTERN.test(request.params.reportId)) throw new ApiError(400, "VALIDATION", "Meldungs-ID ist ungültig.");
    const body = bodyObject(request.body);
    const action = String(body.action) as ModerationAction;
    const reason = typeof body.reason === "string" ? body.reason.trim().normalize("NFC") : "";
    if (!["warn", "mute", "remove_message", "lock_account", "dismiss"].includes(action) || reason.length < 3 || reason.length > 500) throw new ApiError(400, "VALIDATION", "Moderationsaktion oder Begründung ist ungültig.");
    return mapped(() => options.adminStore.moderate(authenticated.identity.userId, request.params.reportId, action, reason, now()));
  });
  app.get<{ Params: { guildId: string } }>("/api/v1/internal/guilds/:guildId/ledger", async (request) => {
    await session(request, ["support", "moderator", "admin"]);
    if (!UUID_PATTERN.test(request.params.guildId)) throw new ApiError(400, "VALIDATION", "Gilden-ID ist ungültig.");
    return mapped(() => options.adminStore.guildLedger(request.params.guildId));
  });
};
