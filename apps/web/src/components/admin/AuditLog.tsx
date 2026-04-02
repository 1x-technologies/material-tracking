import { useState } from "react";
import { trpc } from "../../trpc";

function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

function formatActionDescription(entry: {
  action: string;
  targetId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}): string {
  switch (entry.action) {
    case "update_user": {
      const after = entry.after as Record<string, unknown>;
      const before = entry.before as Record<string, unknown>;
      if (after.active === false) {
        return `Deactivated user ${entry.targetId}`;
      }
      if (after.active === true && before.active === false) {
        return `Reactivated user ${entry.targetId}`;
      }
      if (after.role !== undefined && before.role !== undefined) {
        return `Changed role of user from ${String(before.role ?? "none")} to ${String(after.role ?? "none")}`;
      }
      const changedFields = Object.keys(after).join(", ");
      return `Updated user ${entry.targetId}: ${changedFields}`;
    }
    case "bulk_assign_role": {
      const after = entry.after as Record<string, unknown>;
      return `Bulk assigned role ${String(after.role ?? "")} to user ${entry.targetId}`;
    }
    case "create_location": {
      const after = entry.after as Record<string, unknown>;
      return `Created location ${String(after.name ?? entry.targetId)}`;
    }
    case "update_location": {
      const after = entry.after as Record<string, unknown>;
      const changedFields = Object.keys(after).join(", ");
      return `Updated location ${entry.targetId}: ${changedFields}`;
    }
    case "update_settings": {
      const after = entry.after as Record<string, unknown>;
      const changedFields = Object.keys(after).join(", ");
      return `Updated settings: ${changedFields}`;
    }
    default:
      return `Admin action: ${entry.action}`;
  }
}

export function AuditLog() {
  const { data: entries } = trpc.admin.listAuditLog.useQuery();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white mt-6">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
        <svg
          className={`size-5 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Entries */}
      {expanded && (
        <div>
          {!entries || entries.length === 0 ? (
            <p className="text-sm text-neutral-400 p-4">No recent activity</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-3 border-b border-neutral-100 last:border-b-0 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    {entry.adminName || "Admin"}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatActionDescription({
                      action: entry.action,
                      targetId: entry.targetId,
                      before: entry.before as Record<string, unknown>,
                      after: entry.after as Record<string, unknown>,
                    })}
                  </p>
                </div>
                <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
