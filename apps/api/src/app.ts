import { randomUUID } from "node:crypto";

import { LOG_REDACTION_PATHS, loadServerConfig, publicRuntimeConfig, type ServerConfig } from "@idle-tamer/config";
import { API_PROTOCOL_VERSION, ERROR_CONTRACT_VERSION, type ApiProblem } from "@idle-tamer/contracts";
import Fastify from "fastify";

import { ApiError } from "./errors";

export interface DatabaseHealth {
  ping(): Promise<void>;
}

export interface BuildAppOptions {
  config?: ServerConfig;
  database?: DatabaseHealth;
  logger?: false;
}

export const buildApp = (options: BuildAppOptions = {}) => {
  const config = options.config ?? loadServerConfig(process.env);
  const logger = options.logger ?? (config.NODE_ENV === "test"
    ? false
    : { level: config.LOG_LEVEL, redact: { paths: [...LOG_REDACTION_PATHS], censor: "[REDACTED]" } });
  const app = Fastify({
    logger,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
  });

  app.addHook("onSend", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.setNotFoundHandler(async () => {
    throw new ApiError(404, "UNKNOWN", "Route not found.");
  });

  app.setErrorHandler(async (error, request, reply) => {
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
