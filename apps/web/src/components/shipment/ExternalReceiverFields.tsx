import { Input } from "@/components/base/input/input";

interface ExternalReceiverFieldsProps {
  value: { name: string; company: string; email: string };
  onChange: (v: { name: string; company: string; email: string }) => void;
  disabled?: boolean;
}

export function ExternalReceiverFields({ value, onChange, disabled = false }: ExternalReceiverFieldsProps) {
  return (
    <div className="space-y-3">
      <Input
        label="Name"
        isRequired
        value={value.name}
        onChange={(v) => onChange({ ...value, name: v })}
        isDisabled={disabled}
        placeholder="Full name"
      />
      <Input
        label="Company"
        isRequired
        value={value.company}
        onChange={(v) => onChange({ ...value, company: v })}
        isDisabled={disabled}
        placeholder="Company name"
      />
      <Input
        label="Email"
        type="email"
        isRequired
        value={value.email}
        onChange={(v) => onChange({ ...value, email: v })}
        isDisabled={disabled}
        placeholder="email@example.com"
      />
    </div>
  );
}
