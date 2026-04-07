import { BadgeWithDot } from "@/components/base/badges/badges";

interface StatusPillProps {
  status: "active" | "inactive" | "pending";
}

const statusColorMap: Record<StatusPillProps["status"], "success" | "gray" | "warning"> = {
  active: "success",
  inactive: "gray",
  pending: "warning",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <BadgeWithDot size="sm" type="pill-color" color={statusColorMap[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </BadgeWithDot>
  );
}
