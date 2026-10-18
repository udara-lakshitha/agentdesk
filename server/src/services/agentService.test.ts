import { describe, it, expect, vi, beforeEach } from "vitest";
import * as service from "./agentService";
import * as runs from "../repositories/agentRunRepository";
import * as messages from "../repositories/messageRepository";
import type { AgentLlm } from "../agent/llm";

vi.mock("../repositories/agentRunRepository");
vi.mock("../repositories/messageRepository");

const okLlm: AgentLlm = {
  chat: async () => ({ text: "Draft reply", toolCalls: [] }),
};
const badLlm: AgentLlm = {
  chat: async () => {
    throw new Error("quota exceeded");
  },
};

const pending = {
  id: 1,
  status: "pending_approval",
  draftReply: "Draft reply",
} as unknown as runs.AgentRun;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(runs.insertRun).mockImplementation(
    async (input) => ({ id: 1, ...input }) as unknown as runs.AgentRun
  );
});

describe("runForMessage", () => {
  it("returns 404 when the message does not exist", async () => {
    vi.mocked(messages.getMessage).mockResolvedValue(null);
    await expect(service.runForMessage(99, okLlm)).rejects.toMatchObject({ status: 404 });
  });

  it("saves a pending run when the agent succeeds", async () => {
    vi.mocked(messages.getMessage).mockResolvedValue({
      id: 1, from: "Nimal", body: "Where is order 1001?", createdAt: "",
    });
    const run = await service.runForMessage(1, okLlm);
    expect(runs.insertRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_approval", draftReply: "Draft reply" })
    );
    expect(run.status).toBe("pending_approval");
  });

  it("saves a failed run when the agent throws", async () => {
    vi.mocked(messages.getMessage).mockResolvedValue({
      id: 1, from: "Nimal", body: "Hi", createdAt: "",
    });
    await service.runForMessage(1, badLlm);
    expect(runs.insertRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", error: "quota exceeded" })
    );
  });
});

describe("approveRun", () => {
  it("uses the edited reply when one is given", async () => {
    vi.mocked(runs.getRun).mockResolvedValue(pending);
    vi.mocked(runs.reviewRun).mockResolvedValue({ ...pending, status: "approved" });
    await service.approveRun(1, "Edited reply");
    expect(runs.reviewRun).toHaveBeenCalledWith(1, "approved", "Edited reply");
  });

  it("falls back to the draft when no edit is given", async () => {
    vi.mocked(runs.getRun).mockResolvedValue(pending);
    vi.mocked(runs.reviewRun).mockResolvedValue({ ...pending, status: "approved" });
    await service.approveRun(1);
    expect(runs.reviewRun).toHaveBeenCalledWith(1, "approved", "Draft reply");
  });

  it("returns 409 when the run is no longer pending", async () => {
    vi.mocked(runs.getRun).mockResolvedValue(pending);
    vi.mocked(runs.reviewRun).mockResolvedValue(null);
    await expect(service.approveRun(1)).rejects.toMatchObject({ status: 409 });
  });
});