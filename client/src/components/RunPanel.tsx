import { useState } from "react";
import type { AgentRun, Message } from "../types";

type Props = {
  message: Message;
  run: AgentRun | undefined;
  busy: boolean;
  onRun: () => void;
  onApprove: (reply?: string) => void;
  onReject: () => void;
};

function ReviewForm({
  run,
  busy,
  onApprove,
  onReject,
}: {
  run: AgentRun;
  busy: boolean;
  onApprove: (reply?: string) => void;
  onReject: () => void;
}) {
  const original = run.draftReply ?? "";
  const [reply, setReply] = useState(original);
  const edited = reply.trim() !== original.trim();

  return (
    <div>
      <label htmlFor="reply">Draft reply (you can edit it)</label>
      <textarea
        id="reply"
        rows={6}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
      />
      <div className="actions">
        <button
          className="primary"
          disabled={busy || !reply.trim()}
          onClick={() => onApprove(edited ? reply : undefined)}
        >
          {edited ? "Approve edited reply" : "Approve"}
        </button>
        <button className="danger" disabled={busy} onClick={onReject}>
          Reject
        </button>
      </div>
      <p className="muted small">
        Approving records your decision. Actually sending the reply comes in a later step.
      </p>
    </div>
  );
}

export function RunPanel({ message, run, busy, onRun, onApprove, onReject }: Props) {
  return (
    <section className="panel">
      <h2>{message.from}</h2>
      <p className="customer-message">{message.body}</p>

      {!run && (
        <button className="primary" disabled={busy} onClick={onRun}>
          {busy ? "Running agent…" : "Run agent"}
        </button>
      )}

      {run?.status === "failed" && (
        <>
          <p className="error">Agent failed: {run.error}</p>
          <button disabled={busy} onClick={onRun}>
            {busy ? "Running agent…" : "Try again"}
          </button>
        </>
      )}

      {run?.status === "pending_approval" && (
        <ReviewForm
          key={run.id}
          run={run}
          busy={busy}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}

      {run?.status === "approved" && (
        <>
          <h3>Approved reply</h3>
          <p className="reply">{run.finalReply}</p>
        </>
      )}

      {run?.status === "rejected" && (
        <>
          <p className="muted">Rejected. Nothing was sent.</p>
          <button disabled={busy} onClick={onRun}>
            {busy ? "Running agent…" : "Run again"}
          </button>
        </>
      )}

      {run && run.steps.length > 0 && (
        <>
          <h3>What the agent did</h3>
          <ol className="steps">
            {run.steps.map((s, i) => (
              <li key={i}>
                <strong>{s.tool}</strong>
                <details>
                  <summary>Details</summary>
                  <pre>{JSON.stringify({ args: s.args, result: s.result }, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}