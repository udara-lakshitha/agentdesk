import { HttpError } from "../middleware/errorHandler";
import { runAgent, type AgentResult } from "../agent/runAgent";
import { createGeminiAgentLlm } from "../agent/geminiAgentLlm";
import type { AgentLlm } from "../agent/llm";
import * as messages from "../repositories/messageRepository";
import * as runs from "../repositories/agentRunRepository";

export async function runForMessage(
  messageId: number,
  llm: AgentLlm = createGeminiAgentLlm()
) {
  const message = await messages.getMessage(messageId);
  if (!message) throw new HttpError(404, "Message not found");

  let result: AgentResult;
  try {
    result = await runAgent(llm, message.body, { customerId: message.customerId });
  } catch (err) {
    return runs.insertRun({
      messageId,
      status: "failed",
      draftReply: null,
      steps: [],
      error: err instanceof Error ? err.message : "Agent failed",
    });
  }

  return runs.insertRun({
    messageId,
    status: "pending_approval",
    draftReply: result.reply,
    steps: result.steps,
    error: null,
  });
}

export async function getRun(id: number) {
  const run = await runs.getRun(id);
  if (!run) throw new HttpError(404, "Run not found");
  return run;
}

export function listRuns() {
  return runs.listRuns();
}

export async function approveRun(id: number, editedReply?: string) {
  const run = await getRun(id);
  const finalReply = editedReply ?? run.draftReply;
  if (!finalReply) throw new HttpError(409, "Run has no reply to approve");

  const updated = await runs.reviewRun(id, "approved", finalReply);
  if (!updated) throw new HttpError(409, "Run is not pending approval");
  return updated;
}

export async function rejectRun(id: number) {
  await getRun(id);
  const updated = await runs.reviewRun(id, "rejected", null);
  if (!updated) throw new HttpError(409, "Run is not pending approval");
  return updated;
}