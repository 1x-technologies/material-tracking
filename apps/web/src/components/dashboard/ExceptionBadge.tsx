import type { ExceptionType } from "../../utils/exceptions";
import { Badge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";

const EXCEPTION_BADGE_COLOR: Record<ExceptionType, BadgeColors> = {
  stalled: "warning",
  overdue: "error",
  aged: "error",
};

const EXCEPTION_LABELS: Record<ExceptionType, string> = {
  aged: "Aged",
  overdue: "Overdue",
  stalled: "Stalled",
};

interface ExceptionBadgeProps {
  exceptions: ExceptionType[];
}

export function ExceptionBadge({ exceptions }: ExceptionBadgeProps) {
  if (exceptions.length === 0) return null;

  return (
    <>
      {exceptions.map((type) => (
        <Badge
          key={type}
          type="pill-color"
          size="sm"
          color={EXCEPTION_BADGE_COLOR[type]}
        >
          {EXCEPTION_LABELS[type]}
        </Badge>
      ))}
    </>
  );
}
