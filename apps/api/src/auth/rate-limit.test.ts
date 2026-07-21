import type { AuthStore, ConsumeRateLimitInput } from "@idle-tamer/database";
import { describe, expect, it, vi } from "vitest";

import { AuthRateLimiter } from "./rate-limit";

describe("auth rate limiter", () => {
  it("stores only a stable HMAC key and returns the current attempt", async () => {
    const consumeRateLimit = vi.fn(async (_input: ConsumeRateLimitInput) => ({
      allowed: true,
      attemptCount: 3,
      blockedUntil: null,
    }));
    const store = { consumeRateLimit } as unknown as AuthStore;
    const now = new Date("2026-07-21T20:14:42.000Z");
    const limiter = new AuthRateLimiter(store, "test-rate-limit-secret-at-least-32-characters", () => now);

    await expect(limiter.enforce("login.identity-network", "tamer@example.test|203.0.113.4", 10, 15 * 60_000))
      .resolves.toEqual({ attemptCount: 3 });
    const input = consumeRateLimit.mock.calls[0][0];
    expect(input.keyHash).toHaveLength(32);
    expect(input.keyHash.toString("utf8")).not.toContain("tamer@example.test");
    expect(input.windowStarted).toEqual(new Date("2026-07-21T20:00:00.000Z"));
  });

  it("returns a bounded Retry-After without exposing counters", async () => {
    const blockedUntil = new Date("2026-07-21T20:15:00.000Z");
    const store = {
      consumeRateLimit: vi.fn(async () => ({ allowed: false, attemptCount: 11, blockedUntil })),
    } as unknown as AuthStore;
    const limiter = new AuthRateLimiter(store, "test-rate-limit-secret-at-least-32-characters", () => new Date("2026-07-21T20:14:42.000Z"));

    await expect(limiter.enforce("login.identity-network", "hidden", 10, 15 * 60_000)).rejects.toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
      options: { retryAfterSeconds: 18 },
    });
  });

  it("delays failed logins progressively between 250 and 1500 milliseconds", async () => {
    const delays: number[] = [];
    const store = { consumeRateLimit: vi.fn() } as unknown as AuthStore;
    const limiter = new AuthRateLimiter(store, "test-rate-limit-secret-at-least-32-characters", undefined, async (milliseconds) => {
      delays.push(milliseconds);
    });

    await limiter.delayAfterLoginFailure(1);
    await limiter.delayAfterLoginFailure(3);
    await limiter.delayAfterLoginFailure(99);
    expect(delays).toEqual([250, 750, 1_500]);
  });
});
