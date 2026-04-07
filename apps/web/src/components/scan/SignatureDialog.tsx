import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Edit01 } from "@untitledui/icons";

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

  function handleConfirm() {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return;

    const canvas = signatureRef.current.getCanvas();
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/png");
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
      <div className="bg-primary rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">
            {receiverName ? `Signature for ${receiverName}` : "Capture Signature"}
          </h3>
          <CloseButton size="sm" label="Close dialog" onPress={onClose} />
        </div>
        <p className="text-sm text-tertiary">
          Sign below to confirm delivery. You can skip if a signature is not available.
        </p>

        <div className="border border-primary rounded-lg overflow-hidden">
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
          <Button
            size="sm"
            color="link-gray"
            iconLeading={Edit01}
            onClick={handleClear}
          >
            Clear
          </Button>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              color="secondary"
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button
              size="sm"
              color="primary"
              isDisabled={isCanvasEmpty}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
