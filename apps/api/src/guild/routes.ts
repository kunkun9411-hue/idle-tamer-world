import type { FastifyInstance, FastifyRequest } from "fastify";

import { AuthError } from "../auth/errors";
import { AuthRateLimiter } from "../auth/rate-limit";
import { AuthService } from "../auth/service";
import { GuildService } from "./service";

export interface GuildRoutesOptions {
  authService: AuthService;
  rateLimiter: AuthRateLimiter;
  guildService: GuildService;
  publicOrigin: string;
}

const cookie = (request: FastifyRequest): string | undefined => request.cookies[AuthService.cookieName];
const csrf = (request: FastifyRequest): string | undefined => {
  const value = request.headers["x-csrf-token"];
  return Array.isArray(value) ? value[0] : value;
};

export const registerGuildRoutes = async (app: FastifyInstance, options: GuildRoutesOptions): Promise<void> => {
  app.get("/api/v1/guild", async (request) => {
    const session = await options.authService.authenticate(cookie(request));
    await options.rateLimiter.enforce("guild-sync.player", session.identity.userId, 90, 60_000);
    return options.guildService.bootstrap(session.identity.userId);
  });

  app.post("/api/v1/guild/commands", async (request) => {
    if (request.headers.origin !== options.publicOrigin) throw new AuthError(403, "FORBIDDEN", "ORIGIN_INVALID", "Diese Anfrage stammt nicht von der Spielseite.");
    if (request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") throw new AuthError(415, "VALIDATION", undefined, "Diese Anfrage muss JSON verwenden.");
    const session = await options.authService.authenticate(cookie(request));
    options.authService.authorizeCsrf(session, csrf(request));
    await options.rateLimiter.enforce("guild-command.player", session.identity.userId, 40, 60_000);
    return options.guildService.command(session.identity.userId, request.body);
  });
};
