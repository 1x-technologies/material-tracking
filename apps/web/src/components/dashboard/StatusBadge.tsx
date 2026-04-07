import type { ShipmentStatus } from "@material-tracking/shared";
import { BadgeWithDot } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";

const STATUS_BADGE_COLOR: Record<ShipmentStatus, BadgeColors> = {
  created: "gray",
  in_transit: "blue",
  partially_delivered: "orange",
  delivered: "success",
  completed: "purple",
  cancelled: "error",
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  created: "Created",
  in_transit: "In Transit",
  partially_delivered: "Partial",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface StatusBadgeProps {
  status: ShipmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <BadgeWithDot
      type="pill-color"
      size="sm"
      color={STATUS_BADGE_COLOR[status]}
    >
      {STATUS_LABELS[status]}
    </BadgeWithDot>
  );
}
