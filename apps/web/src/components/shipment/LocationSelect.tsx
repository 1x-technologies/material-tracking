import { useMemo } from "react";
import { NativeSelect } from "@/components/base/select/select-native";
import { trpc } from "../../trpc";

interface LocationSelectProps {
  label: string;
  value: string;
  onChange: (locationId: string) => void;
  disabled?: boolean;
}

export function LocationSelect({ label, value, onChange, disabled = false }: LocationSelectProps) {
  const { data: locations, isLoading } = trpc.locations.list.useQuery();

  const sorted = useMemo(
    () => (locations ? [...locations].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [locations],
  );

  const options = useMemo(() => {
    if (isLoading) {
      return [{ label: "Loading locations...", value: "" }];
    }
    return [
      { label: `Select ${label.toLowerCase()}`, value: "" },
      ...sorted.map((loc) => ({
        label: `${loc.name} - ${loc.fullName}`,
        value: loc.id,
      })),
    ];
  }, [isLoading, sorted, label]);

  return (
    <NativeSelect
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      options={options}
    />
  );
}
