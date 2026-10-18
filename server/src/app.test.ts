import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "./app";

vi.mock("./services/messageService", () => ({
  getMessages: vi.fn().mockResolvedValue([]),
  createMessage: vi.fn().mockImplementation(async (from: string, body: string) => ({
    id: 1,
    from,
    body,
    createdAt: "2026-01-01T00:00:00.000Z",
  })),
}));

describe("messages API", () => {
  it("returns the list of messages", async () => {
    const res = await request(app).get("/api/messages");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("creates a message with valid input", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({ from: "Nimal", body: "Where is my order?" });
    expect(res.status).toBe(201);
    expect(res.body.from).toBe("Nimal");
  });

  it("rejects a missing body", async () => {
    const res = await request(app).post("/api/messages").send({ from: "Nimal" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("rejects whitespace-only text", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({ from: "   ", body: "hello" });
    expect(res.status).toBe(400);
  });
});