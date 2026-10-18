import type { RunStatus } from "../types";

const labels: Record<RunStatus | "new", string> = {
  new: "New",
  pending_approval: "Needs review",
  approved: "Approved",
  rejected: "Rejected",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: RunStatus | "new" }) {
  return <span className={`badge badge-${status}`}>{labels[status]}</span>;
}