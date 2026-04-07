import { Button } from "@/components/base/buttons/button";
import { Zap, Truck01, CheckCircle, CheckDone01 } from "@untitledui/icons";

const actions = [
  { value: "auto", label: "Auto Detect", icon: Zap },
  { value: "in_transit", label: "In Transit", icon: Truck01 },
  { value: "delivered", label: "Delivered", icon: CheckCircle },
  { value: "completed", label: "Completed", icon: CheckDone01 },
] as const;

interface ActionSelectorProps {
  value: string;
  onChange: (action: string) => void;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex">
      {actions.map((action) => {
        const isActive = value === action.value;

        return (
          <Button
            key={action.value}
            type="button"
            size="md"
            color={isActive ? "primary" : "secondary"}
            iconLeading={action.icon}
            onClick={() => onChange(action.value)}
            className="min-h-[44px]"
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
