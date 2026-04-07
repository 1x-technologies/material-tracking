import { useState } from "react";
import { ChevronDown } from "@untitledui/icons";
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

const actionColors: Record<string, string> = {
  update_user: "bg-utility-brand-500",
  bulk_assign_role: "bg-utility-purple-500",
  create_location: "bg-utility-green-500",
  update_location: "bg-utility-blue-500",
  update_settings: "bg-utility-orange-500",
};

export function AuditLog() {
  const { data: entries } = trpc.admin.listAuditLog.useQuery();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-8 rounded-xl border border-secondary bg-primary">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-primary_hover"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-primary">Recent Activity</h2>
          {entries && entries.length > 0 && (
            <span className="rounded-full bg-secondary_subtle px-2 py-0.5 text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">
              {entries.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`size-5 text-fg-quaternary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Timeline entries */}
      {expanded && (
        <div className="border-t border-secondary">
          {!entries || entries.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-quaternary">No recent activity</p>
          ) : (
            <div className="px-6 py-4">
              {entries.map((entry, index) => {
                const isLast = index === entries.length - 1;
                const dotColor = actionColors[entry.action] ?? "bg-utility-neutral-400";

                return (
                  <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`size-2.5 shrink-0 rounded-full ${dotColor} mt-1.5 ring-4 ring-primary`} />
                      {!isLast && (
                        <div className="w-px flex-1 bg-secondary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary">
                            {entry.adminName || "Admin"}
                          </p>
                          <p className="mt-0.5 text-sm text-tertiary">
                            {formatActionDescription({
                              action: entry.action,
                              targetId: entry.targetId,
                              before: entry.before as Record<string, unknown>,
                              after: entry.after as Record<string, unknown>,
                            })}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs text-quaternary">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
