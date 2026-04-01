import { useEffect, useRef, useState } from "react";

interface ScanInputProps {
  onScan: (qrCode: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function ScanInput({ onScan, disabled, error }: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [buffer, setBuffer] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = buffer.trim();
      if (trimmed) {
        onScan(trimmed);
        setBuffer("");
      }
      inputRef.current?.focus();
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={buffer}
        onChange={(e) => setBuffer(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Scan QR code or type manually…"
        className={[
          "text-lg px-4 py-3 w-full rounded-lg border border-neutral-300",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
          disabled ? "opacity-50 cursor-not-allowed bg-neutral-50" : "bg-white",
        ].join(" ")}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
