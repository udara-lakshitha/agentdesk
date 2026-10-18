import type { AgentRun, Message } from "../types";
import { StatusBadge } from "./StatusBadge";

type Props = {
  messages: Message[];
  runs: AgentRun[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function MessageList({ messages, runs, selectedId, onSelect }: Props) {
  if (messages.length === 0) {
    return <p className="muted">No messages yet. Add one above.</p>;
  }

  return (
    <ul className="message-list">
      {[...messages].reverse().map((m) => {
        const run = runs.find((r) => r.messageId === m.id); // runs are newest first
        return (
          <li key={m.id}>
            <button
              className={m.id === selectedId ? "message-item selected" : "message-item"}
              onClick={() => onSelect(m.id)}
            >
              <span className="message-from">{m.from}</span>
              <span className="message-body">{m.body}</span>
              <StatusBadge status={run?.status ?? "new"} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}