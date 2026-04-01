import type { ShipmentStatus } from "@material-tracking/shared";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  created: "bg-neutral-100 text-neutral-700",
  in_transit: "bg-blue-100 text-blue-700",
  partially_delivered: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  picked_up: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  created: "Created",
  in_transit: "In Transit",
  partially_delivered: "Partially Delivered",
  delivered: "Delivered",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
};

interface StatusBadgeProps {
  status: ShipmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
