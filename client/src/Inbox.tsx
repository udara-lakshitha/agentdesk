import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import type { AgentRun, Message, User } from "./types";
import { MessageList } from "./components/MessageList";
import { NewMessageForm } from "./components/NewMessageForm";
import { RunPanel } from "./components/RunPanel";

type Props = { user: User; onLoggedOut: () => void };

export function Inbox({ user, onLoggedOut }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A 401 anywhere means the session ended: go back to the login screen.
  const handleError = useCallback(
    (e: unknown, fallback: string) => {
      if (e instanceof api.ApiError && e.status === 401) {
        onLoggedOut();
        return;
      }
      setError(e instanceof Error ? e.message : fallback);
    },
    [onLoggedOut]
  );

  const refresh = useCallback(async () => {
    try {
      const [m, r] = await Promise.all([api.listMessages(), api.listRuns()]);
      setMessages(m);
      setRuns(r);
    } catch (e) {
      handleError(e, "Could not load data");
    }
  }, [handleError]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.listMessages(), api.listRuns()])
      .then(([m, r]) => {
        if (cancelled) return;
        setMessages(m);
        setRuns(r);
      })
      .catch((e) => {
        if (!cancelled) handleError(e, "Could not load data");
      });

    return () => {
      cancelled = true;
    };
  }, [handleError]);

  async function act(fn: () => Promise<unknown>): Promise<boolean> {
    setBusy(true);
    setError(null);
    let ok = true;
    try {
      await fn();
    } catch (e) {
      ok = false;
      handleError(e, "Something went wrong");
    }
    await refresh();
    setBusy(false);
    return ok;
  }

  async function signOut() {
    try {
      await api.logout();
    } finally {
      onLoggedOut();
    }
  }

  const selected = messages.find((m) => m.id === selectedId);
  const selectedRun = runs.find((r) => r.messageId === selectedId);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>AgentDesk</h1>
          <p className="muted">Review what your AI agent drafts before anything goes out.</p>
        </div>
        <div className="user-box">
          <span className="muted small">{user.email}</span>
          <button onClick={() => void signOut()}>Sign out</button>
        </div>
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