import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Badge } from "@/components/base/badges/badges";
import { CheckCircle } from "@untitledui/icons";

interface CameraScanOverlayProps {
  open: boolean;
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

const READER_ID = "qr-reader";
const PAUSE_AFTER_SCAN_MS = 1500;

export function CameraScanOverlay({ open, onScan, onClose }: CameraScanOverlayProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  const [lastCode, setLastCode] = useState<string | null>(null);
  onScanRef.current = onScan;
  onCloseRef.current = onClose;

  const safeStop = useCallback(async (scanner: Html5Qrcode) => {
    if (!runningRef.current) return;
    try {
      runningRef.current = false;
      await scanner.stop();
      scanner.clear();
    } catch {
      // scanner already stopped
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const scanner = new Html5Qrcode(READER_ID);
    scannerRef.current = scanner;
    pausedRef.current = false;
    lastScannedRef.current = null;
    setLastCode(null);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: Math.min(window.innerWidth * 0.6, 300), height: Math.min(window.innerWidth * 0.6, 300) } },
        (decodedText) => {
          if (pausedRef.current) return;
          if (decodedText === lastScannedRef.current) return;

          pausedRef.current = true;
          lastScannedRef.current = decodedText;
          setLastCode(decodedText);
          onScanRef.current(decodedText);

          setTimeout(() => {
            pausedRef.current = false;
            lastScannedRef.current = null;
            setLastCode(null);
          }, PAUSE_AFTER_SCAN_MS);
        },
        undefined,
      )
      .then(() => {
        runningRef.current = true;
      })
      .catch((err) => {
        console.error("Failed to start camera scanner:", err);
      });

    return () => {
      safeStop(scanner);
      scannerRef.current = null;
    };
  }, [open, safeStop]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          <CloseButton
            theme="dark"
            size="sm"
            label="Close scanner"
            onPress={onClose}
          />
        </div>
        <div id={READER_ID} className="bg-black" />
        {lastCode && (
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            <Badge type="pill-color" size="md" color="success">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="size-3.5" />
                Scanned
              </span>
            </Badge>
          </div>
        )}
        <p className="text-center text-sm text-quaternary px-4 py-2">
          Point camera at QR code. Scanner stays open for continuous scanning.
        </p>
      </div>
    </div>
  );
}
