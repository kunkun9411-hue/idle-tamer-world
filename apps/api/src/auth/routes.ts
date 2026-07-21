import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { AUTH_CONTRACT_VERSION, type AcceptedAuthResponse } from "@idle-tamer/contracts";

import { AuthError } from "./errors";
import { AuthRateLimiter } from "./rate-limit";
import { AuthService, type AuthenticatedSession } from "./service";
import { normalizeEmail } from "./security";

export interface AuthRoutesOptions {
  service: AuthService;
  rateLimiter: AuthRateLimiter;
  publicOrigin: string;
}

const cookieOptions = (maxAge?: number) => ({
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "strict" as const,
  ...(maxAge === undefined ? {} : { maxAge }),
});

const bodyRecord = (request: FastifyRequest): Record<string, unknown> =>
  request.body && typeof request.body === "object" && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : {};

const requireOrigin = (request: FastifyRequest, publicOrigin: string): void => {
  if (request.headers.origin !== publicOrigin) throw new AuthError(403, "FORBIDDEN", "ORIGIN_INVALID", "Diese Anfrage stammt nicht von der Spielseite.");
};

const requireJson = (request: FastifyRequest): void => {
  const mediaType = request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") throw new AuthError(415, "VALIDATION", undefined, "Diese Anfrage muss JSON verwenden.");
};

const sessionCookie = (request: FastifyRequest): string | undefined => request.cookies[AuthService.cookieName];
const csrfHeader = (request: FastifyRequest): string | undefined => {
  const value = request.headers["x-csrf-token"];
  return Array.isArray(value) ? value[0] : value;
};

const authenticate = async (
  request: FastifyRequest,
  service: AuthService,
  rateLimiter: AuthRateLimiter,
  requireCsrf: boolean,
): Promise<AuthenticatedSession> => {
  const session = await service.authenticate(sessionCookie(request));
  await rateLimiter.enforce("authenticated.session", session.identity.sessionId, 120, 60 * 1_000);
  return requireCsrf ? service.authorizeCsrf(session, csrfHeader(request)) : session;
};

const accepted = (): AcceptedAuthResponse => ({
  authContractVersion: AUTH_CONTRACT_VERSION,
  accepted: true,
  message: "Wenn die Angaben verwendet werden können, wurde der nächste Schritt vorbereitet.",
  serverTime: new Date().toISOString(),
});

export const registerAuthRoutes = async (app: FastifyInstance, options: AuthRoutesOptions): Promise<void> => {
  app.post("/api/v1/auth/register", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const body = bodyRecord(request);
    const email = typeof body.email === "string" ? normalizeEmail(body.email) ?? "invalid" : "invalid";
    await options.rateLimiter.enforce("register.network", request.ip, 5, 60 * 60 * 1_000);
    await options.rateLimiter.enforce("register.email", email, 3, 60 * 60 * 1_000);
    await options.service.register(body);
    return reply.status(202).send(accepted());
  });

  app.post("/api/v1/auth/verify-email", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    await options.service.verifyEmail(request.body);
    return reply.status(204).send();
  });

  app.post("/api/v1/auth/verification/resend", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const body = bodyRecord(request);
    const email = typeof body.email === "string" ? normalizeEmail(body.email) ?? "invalid" : "invalid";
    await options.rateLimiter.enforce("verification-resend.identity", email, 5, 60 * 60 * 1_000);
    await options.rateLimiter.enforce("verification-resend.network", request.ip, 20, 60 * 60 * 1_000);
    await options.service.resendVerification(body);
    return reply.status(202).send(accepted());
  });

  app.post("/api/v1/auth/password/forgot", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const body = bodyRecord(request);
    const email = typeof body.email === "string" ? normalizeEmail(body.email) ?? "invalid" : "invalid";
    await options.rateLimiter.enforce("password-forgot.identity", email, 3, 60 * 60 * 1_000);
    await options.rateLimiter.enforce("password-forgot.network", request.ip, 10, 60 * 60 * 1_000);
    await options.service.forgotPassword(body);
    return reply.status(202).send(accepted());
  });

  app.post("/api/v1/auth/password/reset", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const body = bodyRecord(request);
    const token = typeof body.token === "string" ? body.token : "invalid";
    await options.rateLimiter.enforce("password-reset.network", request.ip, 20, 60 * 60 * 1_000);
    try {
      await options.service.resetPassword(request.body);
    } catch (error) {
      if (error instanceof AuthError && error.reason === "TOKEN_INVALID") {
        await options.rateLimiter.enforce("password-reset.token", token, 5, 30 * 60 * 1_000);
      }
      throw error;
    }
    return reply.status(204).send();
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    requireJson(request);
    const body = bodyRecord(request);
    const identifier = typeof body.identifier === "string" ? normalizeEmail(body.identifier) ?? "invalid" : "invalid";
    const identityNetworkKey = `${identifier}|${request.ip}`;
    await options.rateLimiter.enforce("login.identity-network", identityNetworkKey, 10, 15 * 60 * 1_000);
    await options.rateLimiter.enforce("login.network", request.ip, 50, 15 * 60 * 1_000);
    let result;
    try {
      result = await options.service.login(body, request.headers["user-agent"]);
    } catch (error) {
      if (error instanceof AuthError && error.reason === "AUTH_INVALID_CREDENTIALS") {
        const failureLimit = await options.rateLimiter.enforce("login.failure.identity-network", identityNetworkKey, 10, 15 * 60 * 1_000);
        await options.rateLimiter.delayAfterLoginFailure(failureLimit.attemptCount);
      }
      throw error;
    }
    reply.setCookie(AuthService.cookieName, result.sessionToken, cookieOptions(result.cookieMaxAgeSeconds));
    return reply.send({ authContractVersion: AUTH_CONTRACT_VERSION, accepted: true, bootstrap: result.bootstrap });
  });

  app.get("/api/v1/bootstrap", async (request) => {
    const session = await authenticate(request, options.service, options.rateLimiter, false);
    return options.service.bootstrap(session, true);
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    await options.service.logout(session);
    reply.clearCookie(AuthService.cookieName, cookieOptions());
    return reply.status(204).send();
  });

  app.get("/api/v1/auth/sessions", async (request) => {
    const session = await authenticate(request, options.service, options.rateLimiter, false);
    return { authContractVersion: AUTH_CONTRACT_VERSION, sessions: await options.service.listSessions(session) };
  });

  app.delete<{ Params: { sessionId: string } }>("/api/v1/auth/sessions/:sessionId", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    await options.service.revokeSession(session, request.params.sessionId);
    return reply.status(204).send();
  });

  app.post("/api/v1/auth/logout-others", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    await options.service.logoutOthers(session);
    return reply.status(204).send();
  });

  app.post("/api/v1/auth/reauthenticate", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    const result = await options.service.reauthenticate(session, request.body);
    reply.setCookie(AuthService.cookieName, result.sessionToken, cookieOptions(result.cookieMaxAgeSeconds));
    return reply.send({ authContractVersion: AUTH_CONTRACT_VERSION, bootstrap: result.bootstrap });
  });

  app.post("/api/v1/account/commands", async (request) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    await options.rateLimiter.enforce("account-command.player", session.identity.userId, 30, 60 * 1_000);
    const result = await options.service.accountCommand(session, request.body);
    return {
      authContractVersion: AUTH_CONTRACT_VERSION,
      accepted: true,
      resultingRevision: result.revision,
      bootstrap: result.bootstrap,
    };
  });

  app.post("/api/v1/account/export", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    return reply.status(202).send({ authContractVersion: AUTH_CONTRACT_VERSION, ...await options.service.createExport(session) });
  });

  app.post("/api/v1/account/deletion", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    const deleteAfter = await options.service.requestDeletion(session, request.body);
    reply.clearCookie(AuthService.cookieName, cookieOptions());
    return reply.send({ authContractVersion: AUTH_CONTRACT_VERSION, status: "deletion_pending", deleteAfter: deleteAfter.toISOString() });
  });

  app.post("/api/v1/account/deletion/cancel", async (request, reply) => {
    requireOrigin(request, options.publicOrigin);
    const session = await authenticate(request, options.service, options.rateLimiter, true);
    await options.service.cancelDeletion(session);
    return reply.status(204).send();
  });
};
