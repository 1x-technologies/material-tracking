import type { Priority } from "@material-tracking/shared";

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "bg-red-100 text-red-700",
  standard: "bg-neutral-100 text-neutral-600",
  low: "bg-slate-100 text-slate-600",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgent",
  standard: "Standard",
  low: "Low",
};

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
