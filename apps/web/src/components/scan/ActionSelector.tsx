const actions = [
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "picked_up", label: "Picked Up" },
] as const;

interface ActionSelectorProps {
  value: string;
  onChange: (action: string) => void;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  return (
    <div className="flex">
      {actions.map((action, i) => {
        const isActive = value === action.value;
        const isFirst = i === 0;
        const isLast = i === actions.length - 1;

        return (
          <button
            key={action.value}
            type="button"
            onClick={() => onChange(action.value)}
            className={[
              "px-4 py-2 text-sm font-medium border transition-colors",
              isFirst ? "rounded-l-lg" : "",
              isLast ? "rounded-r-lg" : "",
              !isFirst ? "-ml-px" : "",
              isActive
                ? "bg-brand-600 text-white border-brand-600 z-10"
                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50",
            ].join(" ")}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
