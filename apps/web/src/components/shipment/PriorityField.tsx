import { Button } from "@/components/base/buttons/button";

const PRIORITIES = [
  { value: "urgent" as const, label: "Urgent", border: "border-red-500" },
  { value: "standard" as const, label: "Standard", border: "border-primary" },
  { value: "low" as const, label: "Low", border: "border-slate-400" },
];

type Priority = "urgent" | "standard" | "low";

interface PriorityFieldProps {
  value: Priority;
  onChange: (v: Priority) => void;
  disabled?: boolean;
}

export function PriorityField({ value, onChange, disabled = false }: PriorityFieldProps) {
  const selected = PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1];

  return (
    <div data-priority={value} className={`border-l-4 ${selected.border} pl-3`}>
      <span className="block text-sm font-medium text-secondary mb-2">Priority</span>
      <div className="flex gap-2" role="radiogroup" aria-label="Priority">
        {PRIORITIES.map((p) => (
          <Button
            key={p.value}
            size="sm"
            color={value === p.value ? "primary" : "secondary"}
            onClick={() => onChange(p.value)}
            isDisabled={disabled}
            aria-pressed={value === p.value}
            role="radio"
            aria-checked={value === p.value}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
