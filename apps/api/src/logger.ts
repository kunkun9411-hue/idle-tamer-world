import { LOG_REDACTION_PATHS, type ServerConfig } from "@idle-tamer/config";
import pino, { type DestinationStream, type Logger } from "pino";

export const createApiLogger = (config: ServerConfig, destination?: DestinationStream): Logger =>
  pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: [...LOG_REDACTION_PATHS],
      censor: "[REDACTED]",
    },
  }, destination);
