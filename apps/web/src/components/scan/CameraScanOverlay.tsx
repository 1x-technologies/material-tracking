import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";

interface CameraScanOverlayProps {
  open: boolean;
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

const READER_ID = "qr-reader";

export function CameraScanOverlay({ open, onScan, onClose }: CameraScanOverlayProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner
            .stop()
            .then(() => scanner.clear())
            .catch(() => {});
          onClose();
        },
        undefined,
      )
      .catch(() => {});

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
      scannerRef.current = null;
    };
  }, [open, onScan, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-neutral-300 text-2xl leading-none"
            aria-label="Close scanner"
          >
            &times;
          </button>
        </div>
        <div id={READER_ID} className="bg-black" />
      </div>
    </div>
  );
}
