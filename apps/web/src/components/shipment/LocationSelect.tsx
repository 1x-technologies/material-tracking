import { useId, useMemo } from "react";
import { trpc } from "../../trpc";

interface LocationSelectProps {
  label: string;
  value: string;
  onChange: (locationId: string) => void;
  disabled?: boolean;
}

export function LocationSelect({ label, value, onChange, disabled = false }: LocationSelectProps) {
  const selectId = useId();
  const { data: locations, isLoading } = trpc.locations.list.useQuery();

  const sorted = useMemo(
    () => (locations ? [...locations].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [locations],
  );

  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-400"
      >
        {isLoading ? (
          <option value="">Loading locations…</option>
        ) : (
          <>
            <option value="">Select {label.toLowerCase()}</option>
            {sorted.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} — {loc.fullName}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}
