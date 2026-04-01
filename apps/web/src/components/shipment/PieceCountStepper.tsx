import { useId } from "react";

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
      <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
        Piece Count
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          aria-label="Decrease piece count"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &minus;
        </button>
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(parsed)) onChange(clamp(parsed));
          }}
          disabled={disabled}
          className="h-9 w-16 rounded-md border border-neutral-300 text-center text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= max}
          aria-label="Increase piece count"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
