import { pool } from "../db/pool";
import type { AgentStep } from "../agent/runAgent";

export type RunStatus = "pending_approval" | "approved" | "rejected" | "failed";

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

const columns = `
  id,
  message_id AS "messageId",
  status,
  draft_reply AS "draftReply",
  final_reply AS "finalReply",
  steps,
  error,
  created_at AS "createdAt",
  reviewed_at AS "reviewedAt"
`;

export async function insertRun(input: {
  messageId: number;
  status: RunStatus;
  draftReply: string | null;
  steps: AgentStep[];
  error: string | null;
}): Promise<AgentRun> {
  const { rows } = await pool.query(
    `INSERT INTO agent_runs (message_id, status, draft_reply, steps, error)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING ${columns}`,
    [input.messageId, input.status, input.draftReply, JSON.stringify(input.steps), input.error]
  );
  return rows[0];
}

export async function getRun(id: number): Promise<AgentRun | null> {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM agent_runs WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listRuns(): Promise<AgentRun[]> {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM agent_runs ORDER BY id DESC LIMIT 50`
  );
  return rows;
}

// Only succeeds if the run is still pending. Returns null otherwise.
export async function reviewRun(
  id: number,
  status: "approved" | "rejected",
  finalReply: string | null
): Promise<AgentRun | null> {
  const { rows } = await pool.query(
    `UPDATE agent_runs
     SET status = $2, final_reply = $3, reviewed_at = now()
     WHERE id = $1 AND status = 'pending_approval'
     RETURNING ${columns}`,
    [id, status, finalReply]
  );
  return rows[0] ?? null;
}