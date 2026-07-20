import { describe, expect, it } from "vitest";

import { hashCommand, withTransaction } from "./transaction";

const fakePool = (failure?: Error) => {
  const statements: string[] = [];
  let released = false;
  const client = {
    query: async (statement: string) => {
      statements.push(statement);
      if (failure && statement === "WORK") throw failure;
      return { rows: [], rowCount: 0 };
    },
    release: () => {
      released = true;
    },
  };
  return {
    pool: { connect: async () => client },
    client,
    statements,
    wasReleased: () => released,
  };
};

describe("database transaction foundation", () => {
  it("commits and releases the same client", async () => {
    const fake = fakePool();
    const result = await withTransaction(fake.pool as never, async (client) => {
      await client.query("WORK");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(fake.statements).toEqual(["BEGIN", "WORK", "COMMIT"]);
    expect(fake.wasReleased()).toBe(true);
  });

  it("rolls back and releases after a failure", async () => {
    const fake = fakePool(new Error("broken"));
    await expect(withTransaction(fake.pool as never, async (client) => client.query("WORK"))).rejects.toThrow("broken");
    expect(fake.statements).toEqual(["BEGIN", "WORK", "ROLLBACK"]);
    expect(fake.wasReleased()).toBe(true);
  });

  it("hashes equivalent command objects identically", () => {
    expect(hashCommand({ type: "cache.claim", nested: { b: 2, a: 1 } })).toEqual(
      hashCommand({ nested: { a: 1, b: 2 }, type: "cache.claim" }),
    );
  });
});
