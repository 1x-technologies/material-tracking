interface StatusPillProps {
  status: "active" | "inactive" | "pending";
}

const statusStyles: Record<StatusPillProps["status"], string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-neutral-100 text-neutral-500",
  pending: "bg-amber-100 text-amber-700",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
