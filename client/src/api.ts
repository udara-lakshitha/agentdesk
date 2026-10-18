import type { AgentRun, Message } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const details = Array.isArray(body?.details)
      ? `: ${body.details.map((d: { field: string; message: string }) => `${d.field} ${d.message}`).join(", ")}`
      : "";
    throw new Error(`${body?.error ?? `Request failed (${res.status})`}${details}`);
  }
  return res.json() as Promise<T>;
}

export const listMessages = () => request<Message[]>("/api/messages");

export const createMessage = (from: string, body: string) =>
  request<Message>("/api/messages", {
    method: "POST",
    body: JSON.stringify({ from, body }),
  });

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