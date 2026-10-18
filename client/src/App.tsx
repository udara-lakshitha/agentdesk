import { useCallback, useEffect, useState } from "react";
import * as api from "./api";
import type { User } from "./types";
import { LoginForm } from "./components/LoginForm";
import { Inbox } from "./Inbox";

export default function App() {
  // undefined = still checking, null = signed out
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoggedOut = useCallback(() => setUser(null), []);

  if (user === undefined) return <p className="app muted">Loading…</p>;
  if (user === null) return <LoginForm onLoggedIn={setUser} />;
  return <Inbox user={user} onLoggedOut={handleLoggedOut} />;
}