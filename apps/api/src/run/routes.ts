import type { FastifyInstance, FastifyRequest } from "fastify";

import { AuthError } from "../auth/errors";
import { AuthRateLimiter } from "../auth/rate-limit";
import { AuthService } from "../auth/service";
import { RunService } from "./service";

export interface RunRoutesOptions {
  authService: AuthService;
  rateLimiter: AuthRateLimiter;
  runService: RunService;
  publicOrigin: string;
}

const sessionCookie = (request: FastifyRequest): string | undefined => request.cookies[AuthService.cookieName];

const csrfHeader = (request: FastifyRequest): string | undefined => {
  const value = request.headers["x-csrf-token"];
  return Array.isArray(value) ? value[0] : value;
};

const requireOrigin = (request: FastifyRequest, publicOrigin: string): void => {
  if (request.headers.origin !== publicOrigin) throw new AuthError(403, "FORBIDDEN", "ORIGIN_INVALID", "Diese Anfrage stammt nicht von der Spielseite.");
};

const requireJson = (request: FastifyRequest): void => {
  const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") throw new AuthError(415, "VALIDATION", undefined, "Diese Anfrage muss JSON verwenden.");
};

export const registerRunRoutes = async (app: FastifyInstance, options: RunRoutesOptions): Promise<void> => {
  app.get("/api/v1/run", async (request) => {
    const session = await options.authService.authenticate(sessionCookie(request));
    await options.rateLimiter.enforce("run-sync.player", session.identity.userId, 120, 60 * 1_000);
    return options.runService.bootstrap(session.identity.userId);
  });

  app.post("/api/v1/run/commands", async (request) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const session = await options.authService.authenticate(sessionCookie(request));
    options.authService.authorizeCsrf(session, csrfHeader(request));
    await options.rateLimiter.enforce("run-command.player", session.identity.userId, 60, 60 * 1_000);
    return options.runService.command(session.identity.userId, request.body);
  });
};
