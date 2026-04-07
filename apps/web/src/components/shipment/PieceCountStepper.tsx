import { useId } from "react";
import { Minus, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

interface PieceCountStepperProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function PieceCountStepper({
  value,
  onChange,
  disabled = false,
  min = 1,
  max = 99,
}: PieceCountStepperProps) {
  const inputId = useId();

  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-secondary mb-1.5">
        Piece Count
      </label>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          color="secondary"
          iconLeading={Minus}
          onClick={() => onChange(clamp(value - 1))}
          isDisabled={disabled || value <= min}
          aria-label="Decrease piece count"
        />
        <Input
          aria-label="Piece count"
          value={String(value)}
          onChange={(v) => {
            const parsed = Number.parseInt(v, 10);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed));
          }}
          isDisabled={disabled}
          className="w-20"
          inputClassName="text-center"
          size="sm"
        />
        <Button
          size="sm"
          color="secondary"
          iconLeading={Plus}
          onClick={() => onChange(clamp(value + 1))}
          isDisabled={disabled || value >= max}
          aria-label="Increase piece count"
        />
      </div>
    </div>
  );
}
