import { describe, expect, it } from "vitest";

import { guardedTestDatabaseUrl } from "./test-database-guard";

describe("integration database guard", () => {
  it("allows only visibly isolated test databases", () => {
    expect(guardedTestDatabaseUrl(undefined)).toBeUndefined();
    expect(guardedTestDatabaseUrl("postgres://u:p@db/idle_tamer_test")).toContain("idle_tamer_test");
    expect(() => guardedTestDatabaseUrl("postgres://u:p@db/idle_tamer")).toThrow(/dedicated/iu);
  });
});
