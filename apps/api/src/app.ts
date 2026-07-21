import { randomUUID } from "node:crypto";

import cookie from "@fastify/cookie";
import { loadServerConfig, publicRuntimeConfig, type ServerConfig } from "@idle-tamer/config";
import { API_PROTOCOL_VERSION, AUTH_ERROR_CONTRACT_VERSION, ERROR_CONTRACT_VERSION, type ApiProblem, type AuthApiProblem } from "@idle-tamer/contracts";
import type { AuthStore } from "@idle-tamer/database";
import Fastify from "fastify";

import { AuthError } from "./auth/errors";
import type { AuthMailPort } from "./auth/mail";
import { AuthRateLimiter } from "./auth/rate-limit";
import { registerAuthRoutes } from "./auth/routes";
import { AuthService } from "./auth/service";
import { ApiError } from "./errors";
import { createApiLogger } from "./logger";

export interface DatabaseHealth {
  ping(): Promise<void>;
}

export interface BuildAppOptions {
  config?: ServerConfig;
  database?: DatabaseHealth;
  authStore?: AuthStore;
  authMail?: AuthMailPort;
  authNow?: () => Date;
  authSleep?: (milliseconds: number) => Promise<void>;
  logger?: false;
}

export const buildApp = (options: BuildAppOptions = {}) => {
  const config = options.config ?? loadServerConfig(process.env);
  const logger = options.logger ?? (config.NODE_ENV === "test" ? false : createApiLogger(config));
  const app = Fastify({
    ...(logger === false ? { logger: false } : { loggerInstance: logger }),
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    trustProxy: config.NODE_ENV === "production",
  });

  void app.register(cookie);

  if (options.authStore && options.authMail) {
    const authService = new AuthService(options.authStore, options.authMail, {
      publicOrigin: config.PUBLIC_ORIGIN,
      termsVersion: config.AUTH_TERMS_VERSION,
      privacyVersion: config.AUTH_PRIVACY_VERSION,
      features: publicRuntimeConfig(config).features,
    }, options.authNow);
    const rateLimiter = new AuthRateLimiter(options.authStore, config.RATE_LIMIT_HMAC_SECRET, options.authNow, options.authSleep);
    void app.register(async (authApp) => registerAuthRoutes(authApp, { service: authService, rateLimiter, publicOrigin: config.PUBLIC_ORIGIN }));
  }

  app.addHook("onSend", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.setNotFoundHandler(async () => {
    throw new ApiError(404, "UNKNOWN", "Route not found.");
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof AuthError) {
      if (error.options.retryAfterSeconds !== undefined) reply.header("retry-after", error.options.retryAfterSeconds);
      const problem: AuthApiProblem = {
        errorContractVersion: AUTH_ERROR_CONTRACT_VERSION,
        code: error.code,
        message: error.message,
        correlationId: request.id,
        ...(error.reason === undefined ? {} : { reason: error.reason }),
        ...(error.options.retryAfterSeconds === undefined ? {} : { retryAfterSeconds: error.options.retryAfterSeconds }),
        ...(error.options.latestRevision === undefined ? {} : { latestRevision: error.options.latestRevision }),
        ...(error.options.fieldErrors === undefined ? {} : { fieldErrors: error.options.fieldErrors }),
      };
      return reply.status(error.statusCode).send(problem);
    }
    const validationError = typeof error === "object"
      && error !== null
      && "validation" in error
      && Boolean((error as { validation?: unknown }).validation);
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(validationError ? 400 : 500, validationError ? "VALIDATION" : "UNKNOWN", validationError ? "Request validation failed." : "Unexpected server error.");
    if (apiError.statusCode >= 500) request.log.error({ err: error }, apiError.message);

    const problem: ApiProblem = {
      errorContractVersion: ERROR_CONTRACT_VERSION,
      code: apiError.code,
      message: apiError.message,
      correlationId: request.id,
      ...(apiError.latestRevision === undefined ? {} : { latestRevision: apiError.latestRevision }),
    };
    return reply.status(apiError.statusCode).send(problem);
  });

  app.get("/health/live", async () => ({
    status: "ok",
    service: "idle-tamer-api",
    protocolVersion: API_PROTOCOL_VERSION,
  }));

  app.get("/health/ready", async () => {
    if (!options.database) throw new ApiError(503, "UNAVAILABLE", "Database health dependency is not configured.");
    try {
      await options.database.ping();
    } catch {
      throw new ApiError(503, "UNAVAILABLE", "Database is unavailable.");
    }
    return { status: "ready", service: "idle-tamer-api" };
  });

  app.get("/api/v1/meta", async () => ({
    protocolVersion: API_PROTOCOL_VERSION,
    ...publicRuntimeConfig(config),
  }));

  return app;
};
