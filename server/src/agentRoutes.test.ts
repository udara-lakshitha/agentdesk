import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "./app";

vi.mock("./middleware/requireAuth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("./services/agentService", () => ({
  runForMessage: vi.fn().mockResolvedValue({ id: 1, status: "pending_approval" }),
  listRuns: vi.fn().mockResolvedValue([]),
  getRun: vi.fn().mockResolvedValue({ id: 1 }),
  approveRun: vi.fn().mockResolvedValue({ id: 1, status: "approved" }),
  rejectRun: vi.fn().mockResolvedValue({ id: 1, status: "rejected" }),
}));

describe("agent routes", () => {
  it("rejects a non-numeric message id", async () => {
    const res = await request(app).post("/api/messages/abc/run");
    expect(res.status).toBe(400);
  });

  it("starts a run for a valid message id", async () => {
    const res = await request(app).post("/api/messages/1/run");
    expect(res.status).toBe(201);
  });

  it("rejects an empty edited reply", async () => {
    const res = await request(app).post("/api/runs/1/approve").send({ reply: "  " });
    expect(res.status).toBe(400);
  });

  it("approves with a valid edited reply", async () => {
    const res = await request(app).post("/api/runs/1/approve").send({ reply: "Hello!" });
    expect(res.status).toBe(200);
  });
});