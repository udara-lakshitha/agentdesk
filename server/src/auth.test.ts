import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "./app";
import * as authService from "./services/authService";
import { HttpError } from "./middleware/errorHandler";

vi.mock("./services/authService");
vi.mock("./services/messageService", () => ({
  getMessages: vi.fn().mockResolvedValue([]),
  createMessage: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(authService.getUserBySession).mockReset();
  vi.mocked(authService.login).mockReset();
});

describe("authentication", () => {
  it("blocks protected routes without a cookie", async () => {
    const res = await request(app).get("/api/messages");
    expect(res.status).toBe(401);
  });

  it("blocks protected routes with an invalid session", async () => {
    vi.mocked(authService.getUserBySession).mockResolvedValue(null);
    const res = await request(app).get("/api/messages").set("Cookie", "sid=bogus");
    expect(res.status).toBe(401);
  });

  it("allows protected routes with a valid session", async () => {
    vi.mocked(authService.getUserBySession).mockResolvedValue({ id: 1, email: "a@example.com" });
    const res = await request(app).get("/api/messages").set("Cookie", "sid=good");
    expect(res.status).toBe(200);
  });

  it("returns the current user from /me", async () => {
    vi.mocked(authService.getUserBySession).mockResolvedValue({ id: 1, email: "a@example.com" });
    const res = await request(app).get("/api/auth/me").set("Cookie", "sid=good");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 1, email: "a@example.com" });
  });

  it("sets an HttpOnly cookie on login", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: "tok123",
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 1, email: "a@example.com" },
    });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "pw" });
    expect(res.status).toBe(200);
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toContain("sid=tok123");
    expect(cookie).toContain("HttpOnly");
  });

  it("rejects a login with no password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@example.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 for wrong credentials", async () => {
    vi.mocked(authService.login).mockRejectedValue(new HttpError(401, "Invalid email or password"));
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@example.com", password: "wrong" });
    expect(res.status).toBe(401);
  });
});