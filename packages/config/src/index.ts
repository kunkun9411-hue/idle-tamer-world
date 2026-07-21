import { CONTENT_RELEASE_ID } from "@idle-tamer/contracts";
import { z } from "zod";

const booleanFromEnvironment = z.preprocess(
  (value) => value === true || value === "true" || value === "1",
  z.boolean(),
);

const localRateLimitSecret = "local-only-rate-limit-secret-change-me";

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3_001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z.string().min(1).default("postgres://idle_tamer:idle_tamer_local@127.0.0.1:54329/idle_tamer"),
  PUBLIC_ORIGIN: z.string().url().default("http://127.0.0.1:5173"),
  AUTH_TERMS_VERSION: z.string().min(1).default("alpha-foundation-1"),
  AUTH_PRIVACY_VERSION: z.string().min(1).default("alpha-foundation-1"),
  RATE_LIMIT_HMAC_SECRET: z.string().min(32).default(localRateLimitSecret),
  AUTH_MAIL_OUTBOX_PATH: z.string().min(1).default(".local/auth-outbox.jsonl"),
  FEATURE_GUILDS: booleanFromEnvironment.default(false),
  FEATURE_GUILD_DNA: booleanFromEnvironment.default(false),
  FEATURE_LIVE_EVENTS: booleanFromEnvironment.default(false),
  FEATURE_PVP: booleanFromEnvironment.default(false),
}).superRefine((config, context) => {
  if (config.NODE_ENV === "production" && config.RATE_LIMIT_HMAC_SECRET === localRateLimitSecret) {
    context.addIssue({ code: "custom", path: ["RATE_LIMIT_HMAC_SECRET"], message: "Production requires an external rate-limit HMAC secret." });
  }
  if (config.NODE_ENV === "production" && !config.PUBLIC_ORIGIN.startsWith("https://")) {
    context.addIssue({ code: "custom", path: ["PUBLIC_ORIGIN"], message: "Production requires an HTTPS public origin." });
  }
});

export type ServerConfig = z.infer<typeof serverEnvironmentSchema>;

export const loadServerConfig = (environment: Record<string, string | undefined> = {}): ServerConfig =>
  serverEnvironmentSchema.parse(environment);

export const LOG_REDACTION_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers.set-cookie",
  "req.body.email",
  "req.body.emailNormalized",
  "req.body.password",
  "req.body.token",
  "email",
  "emailNormalized",
  "password",
  "passwordHash",
  "token",
] as const;

export const publicRuntimeConfig = (config: ServerConfig) => ({
  contentReleaseId: CONTENT_RELEASE_ID,
  features: {
    guilds: config.FEATURE_GUILDS,
    guildDna: config.FEATURE_GUILD_DNA,
    liveEvents: config.FEATURE_LIVE_EVENTS,
    pvp: config.FEATURE_PVP,
  },
});
