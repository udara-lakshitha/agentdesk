import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(await verifyPassword("correct-horse-battery", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-here", hash)).toBe(false);
  });

  it("salts: the same password gives different hashes", async () => {
    expect(await hashPassword("same-password-123")).not.toBe(await hashPassword("same-password-123"));
  });

  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});