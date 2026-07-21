import { createHmac } from "node:crypto";

import type { AuthStore } from "@idle-tamer/database";

import { AuthError } from "./errors";

export class AuthRateLimiter {
  public constructor(
    private readonly store: AuthStore,
    private readonly secret: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async enforce(action: string, key: string, limit: number, windowMs: number): Promise<void> {
    const now = this.now();
    const windowStarted = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
    const blockedUntil = new Date(windowStarted.getTime() + windowMs);
    const keyHash = createHmac("sha256", this.secret).update(`${action}\0${key}`, "utf8").digest();
    const result = await this.store.consumeRateLimit({ action, keyHash, windowStarted, limit, blockedUntil });
    if (!result.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(((result.blockedUntil ?? blockedUntil).getTime() - now.getTime()) / 1_000));
      throw new AuthError(429, "RATE_LIMITED", undefined, "Zu viele Versuche. Bitte warte kurz.", { retryAfterSeconds });
    }
  }
}
