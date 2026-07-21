import type { AccountBootstrapResponse } from "@idle-tamer/contracts";
import { describe, expect, it, vi } from "vitest";

import { AccountClient, getClientInstanceId } from "./client";

const bootstrap = (): AccountBootstrapResponse => ({
  authContractVersion: 1,
  serverTime: "2026-07-21T20:00:00.000Z",
  session: { sessionId: "s", deviceName: "Chrome", createdAt: "2026-07-21T20:00:00.000Z", lastSeenAt: "2026-07-21T20:00:00.000Z", idleExpiresAt: "2026-07-22T20:00:00.000Z", absoluteExpiresAt: "2026-07-28T20:00:00.000Z", reauthenticatedAt: "2026-07-21T20:00:00.000Z" },
  account: { userId: "u", status: "active", emailMasked: "t***@example.test", emailVerified: true, roles: ["player"], createdAt: "2026-07-21T20:00:00.000Z" },
  profile: { playerId: "p", displayName: "Test", avatarId: "wanderer", frameId: "silver", revision: 0 },
  onboarding: { starterDefinitionId: null, availableStarterDefinitionIds: ["pyrook"], requiredAction: "starter_choice" },
  authority: { mode: "account-online-game-local", server: ["account", "profile", "starter"], local: ["run"], localStorageNamespace: "namespace" },
  features: { guilds: false, guildDna: false, liveEvents: false, pvp: false },
  csrfToken: "csrf-token",
});

describe("AccountClient", () => {
  it("keeps cookies implicit and forwards the rotated CSRF token to commands", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(bootstrap()), { status: 200, headers: { "content-type": "application/json" } }))
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        expect(new Headers(init.headers).get("x-csrf-token")).toBe("csrf-token");
        return new Response(JSON.stringify({ authContractVersion: 1, accepted: true, resultingRevision: 1, bootstrap: { ...bootstrap(), profile: { ...bootstrap().profile, revision: 1 } } }), { status: 200, headers: { "content-type": "application/json" } });
      });
    const client = new AccountClient(fetchImpl as unknown as typeof fetch);
    await client.bootstrap();
    await expect(client.command({ type: "starter.choose", definitionId: "pyrook" }, 0, crypto.randomUUID())).resolves.toMatchObject({ resultingRevision: 1 });
  });

  it("creates one stable browser instance id", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) };
    expect(getClientInstanceId(storage)).toBe(getClientInstanceId(storage));
  });
});
