import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import type { AgentRun, Message } from "./types";
import { MessageList } from "./components/MessageList";
import { NewMessageForm } from "./components/NewMessageForm";
import { RunPanel } from "./components/RunPanel";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([api.listMessages(), api.listRuns()]);
      setMessages(m);
      setRuns(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.listMessages(), api.listRuns()])
      .then(([m, r]) => {
        if (cancelled) return;
        setMessages(m);
        setRuns(r);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load data");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Runs an action, shows any error, reloads data, reports success.
  async function act(fn: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    let ok = true;
    try {
      await fn();
    } catch (e) {
      ok = false;
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    await refresh();
    setBusy(false);
    return ok;
  }

  const selected = messages.find((m) => m.id === selectedId);
  const selectedRun = runs.find((r) => r.messageId === selectedId);

  return (
    <div className="app">
      <header>
        <h1>AgentDesk</h1>
        <p className="muted">Review what your AI agent drafts before anything goes out.</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <main className="layout">
        <aside>
          <NewMessageForm
            busy={busy}
            onCreate={(from, body) =>
              act(async () => {
                const created = await api.createMessage(from, body);
                setSelectedId(created.id);
              })
            }
          />
          <MessageList
            messages={messages}
            runs={runs}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </aside>

        <div>
          {selected ? (
            <RunPanel
              message={selected}
              run={selectedRun}
              busy={busy}
              onRun={() => void act(() => api.runAgent(selected.id))}
              onApprove={(reply) =>
                selectedRun && void act(() => api.approveRun(selectedRun.id, reply))
              }
              onReject={() => selectedRun && void act(() => api.rejectRun(selectedRun.id))}
            />
          ) : (
            <p className="muted">Select a message to see details.</p>
          )}
        </div>
      </main>
    </div>
  );
}