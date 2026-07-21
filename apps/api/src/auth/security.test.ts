import { describe, expect, it } from "vitest";

import { hashPassword, maskEmail, normalizeDisplayName, normalizeEmail, passwordPolicyError, sha256, verifyPassword } from "./security";

describe("auth security primitives", () => {
  it("hashes passwords as Argon2id PHC strings and verifies without truncation", async () => {
    const password = "Eine lange Test-Passphrase 2026";
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/u);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword(`${password}!`, hash)).resolves.toBe(false);
  });

  it("normalizes public identifiers and rejects unsafe names", () => {
    expect(normalizeEmail("  Tamer@Example.COM ")).toBe("tamer@example.com");
    expect(normalizeDisplayName("  Äther   Tamer ")).toEqual({ display: "Äther Tamer", normalized: "äther tamer" });
    expect(normalizeDisplayName("ab")).toBeNull();
    expect(normalizeDisplayName("Tamer\u202EName")).toBeNull();
    expect(maskEmail("tamer@example.com")).toBe("t****@example.com");
  });

  it("enforces the low-friction password length policy", () => {
    expect(passwordPolicyError("zu-kurz")).toContain("15");
    expect(passwordPolicyError("eine sehr lange sichere passphrase")).toBeNull();
    expect(sha256("token")).toHaveLength(32);
  });
});
