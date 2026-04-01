import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignatureDialogProps {
  open: boolean;
  onConfirm: (signatureBlob: Blob) => void;
  onSkip: () => void;
  onClose: () => void;
  receiverName?: string;
}

export function SignatureDialog({ open, onConfirm, onSkip, onClose, receiverName }: SignatureDialogProps) {
  const signatureRef = useRef<SignatureCanvas>(null);

  if (!open) return null;

  function handleClear() {
    signatureRef.current?.clear();
  }

  async function handleConfirm() {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;

    const dataUrl = signatureRef.current.toDataURL("image/png");
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    onConfirm(blob);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") onClose();
  }

  const isCanvasEmpty = signatureRef.current?.isEmpty() ?? true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Signature capture"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">
          {receiverName ? `Signature for ${receiverName}` : "Capture Signature"}
        </h3>
        <p className="text-sm text-neutral-500">
          Sign below to confirm delivery. You can skip if a signature is not available.
        </p>

        <div className="border border-neutral-300 rounded-lg overflow-hidden">
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              className: "w-full",
              style: { height: 200, width: "100%" },
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Clear
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCanvasEmpty}
              className={[
                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                isCanvasEmpty
                  ? "bg-brand-300 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700",
              ].join(" ")}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
