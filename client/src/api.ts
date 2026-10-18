import type { AgentRun, Message, User } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include", // send the session cookie
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("Cannot reach the server");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const details = Array.isArray(body?.details)
      ? `: ${body.details.map((d: { field: string; message: string }) => `${d.field} ${d.message}`).join(", ")}`
      : "";
    throw new ApiError(res.status, `${body?.error ?? `Request failed (${res.status})`}${details}`);
  }
  return res.json() as Promise<T>;
}

export const login = (email: string, password: string) =>
  request<User>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const logout = () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });

export async function me(): Promise<User | null> {
  try {
    return await request<User>("/api/auth/me");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export const listMessages = () => request<Message[]>("/api/messages");

export const createMessage = (from: string, body: string) =>
  request<Message>("/api/messages", { method: "POST", body: JSON.stringify({ from, body }) });

export const listRuns = () => request<AgentRun[]>("/api/runs");

export const runAgent = (messageId: number) =>
  request<AgentRun>(`/api/messages/${messageId}/run`, { method: "POST" });

export const approveRun = (id: number, reply?: string) =>
  request<AgentRun>(`/api/runs/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(reply ? { reply } : {}),
  });

export const rejectRun = (id: number) =>
  request<AgentRun>(`/api/runs/${id}/reject`, { method: "POST" });