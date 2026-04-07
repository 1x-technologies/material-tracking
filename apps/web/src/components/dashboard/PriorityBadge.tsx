import type { Priority } from "@material-tracking/shared";
import { Badge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";

const PRIORITY_BADGE_COLOR: Record<Priority, BadgeColors> = {
  urgent: "error",
  standard: "gray",
  low: "blue",
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
    <Badge
      type="pill-color"
      size="sm"
      color={PRIORITY_BADGE_COLOR[priority]}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
