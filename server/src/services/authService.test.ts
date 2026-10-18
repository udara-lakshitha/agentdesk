import { describe, it, expect, vi, beforeEach } from "vitest";
import * as service from "./authService";
import * as users from "../repositories/userRepository";
import * as sessions from "../repositories/sessionRepository";
import { hashPassword } from "../auth/password";

vi.mock("../repositories/userRepository");
vi.mock("../repositories/sessionRepository");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("login", () => {
  it("creates a session and stores only a hash of the token", async () => {
    const passwordHash = await hashPassword("correct-password");
    vi.mocked(users.findByEmail).mockResolvedValue({ id: 1, email: "a@example.com", passwordHash });

    const result = await service.login("a@example.com", "correct-password");

    expect(result.user).toEqual({ id: 1, email: "a@example.com" });
    const storedHash = vi.mocked(sessions.create).mock.calls[0][1];
    expect(storedHash).not.toBe(result.token);
    expect(storedHash).toHaveLength(64); // sha256 in hex
  });

  it("rejects a wrong password", async () => {
    const passwordHash = await hashPassword("correct-password");
    vi.mocked(users.findByEmail).mockResolvedValue({ id: 1, email: "a@example.com", passwordHash });
    await expect(service.login("a@example.com", "nope")).rejects.toMatchObject({ status: 401 });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it("gives the same error for an unknown email", async () => {
    vi.mocked(users.findByEmail).mockResolvedValue(null);
    await expect(service.login("ghost@example.com", "whatever")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
  });
});