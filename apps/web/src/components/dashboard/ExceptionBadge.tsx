import type { ExceptionType } from "../../utils/exceptions";

const EXCEPTION_COLORS: Record<ExceptionType, string> = {
  aged: "bg-red-100 text-red-700",
  overdue: "bg-orange-100 text-orange-700",
  stalled: "bg-yellow-100 text-yellow-700",
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
        <span
          key={type}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EXCEPTION_COLORS[type]}`}
        >
          {EXCEPTION_LABELS[type]}
        </span>
      ))}
    </>
  );
}
