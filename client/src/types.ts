export type Message = { id: number; from: string; body: string; createdAt: string };

export type RunStatus = "pending_approval" | "approved" | "rejected" | "failed";

export type AgentStep = { tool: string; args: unknown; result: unknown };

export type AgentRun = {
  id: number;
  messageId: number;
  status: RunStatus;
  draftReply: string | null;
  finalReply: string | null;
  steps: AgentStep[];
  error: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type User = { id: number; email: string };