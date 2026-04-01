const PRIORITIES = [
  { value: "urgent" as const, label: "Urgent", border: "border-red-500" },
  { value: "standard" as const, label: "Standard", border: "border-neutral-300" },
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
      <span className="block text-sm font-medium text-neutral-700 mb-2">Priority</span>
      <div className="flex gap-3" role="radiogroup" aria-label="Priority">
        {PRIORITIES.map((p) => (
          <label
            key={p.value}
            className={`flex items-center gap-1.5 cursor-pointer rounded-md px-3 py-1.5 text-sm border transition-colors ${
              value === p.value
                ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="priority"
              value={p.value}
              checked={value === p.value}
              onChange={() => onChange(p.value)}
              disabled={disabled}
              className="sr-only"
            />
            {p.label}
          </label>
        ))}
      </div>
    </div>
  );
}
