import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/base/input/input";
import { QrCode01 } from "@untitledui/icons";

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

  function handleKeyDown(e: React.KeyboardEvent) {
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
    <div onKeyDown={handleKeyDown}>
      <Input
        ref={inputRef}
        value={buffer}
        onChange={(v) => setBuffer(v)}
        isDisabled={disabled}
        placeholder="Scan QR code or type manually..."
        icon={QrCode01}
        size="lg"
        isInvalid={!!error}
        hint={error || undefined}
        className="text-base"
      />
    </div>
  );
}
