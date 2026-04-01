import { useId } from "react";

interface ExternalReceiverFieldsProps {
  value: { name: string; company: string; email: string };
  onChange: (v: { name: string; company: string; email: string }) => void;
  disabled?: boolean;
}

export function ExternalReceiverFields({ value, onChange, disabled = false }: ExternalReceiverFieldsProps) {
  const nameId = useId();
  const companyId = useId();
  const emailId = useId();

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={nameId} className="block text-sm font-medium text-neutral-700 mb-1">
          Name
        </label>
        <input
          id={nameId}
          type="text"
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
        />
      </div>
      <div>
        <label htmlFor={companyId} className="block text-sm font-medium text-neutral-700 mb-1">
          Company
        </label>
        <input
          id={companyId}
          type="text"
          required
          value={value.company}
          onChange={(e) => onChange({ ...value, company: e.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
        />
      </div>
      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-neutral-700 mb-1">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          required
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
        />
      </div>
    </div>
  );
}
