import { useState } from "react";
import { toast } from "sonner";
import { ActionSelector } from "../components/scan/ActionSelector";
import { CameraScanOverlay } from "../components/scan/CameraScanOverlay";
import { ScanInput } from "../components/scan/ScanInput";
import { ScannedPiecesList } from "../components/scan/ScannedPiecesList";
import { playErrorBuzz, playSuccessBeep } from "../components/scan/scanSounds";
import { trpc } from "../trpc";

interface ScannedItem {
  pieceId: string;
  shipmentId: string;
  newStatus: string;
  shipmentNumber: string;
  pieceNumber: number;
  scannedAt: Date;
}

export function ScanPage() {
  const [selectedAction, setSelectedAction] = useState("in_transit");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const processMutation = trpc.scan.process.useMutation({
    onSuccess(data) {
      playSuccessBeep();
      setScannedItems((prev) => [{ ...data, scannedAt: new Date() }, ...prev]);
      toast.success(`Piece ${data.pieceNumber} → ${data.newStatus.replace(/_/g, " ")}`);
      setError(null);
    },
    onError(err) {
      playErrorBuzz();
      setError(err.message);
    },
  });

  function handleScan(qrCode: string) {
    setError(null);
    processMutation.mutate({ qrCode, action: selectedAction as "in_transit" | "delivered" | "picked_up" });
  }

  return (
    <div className="py-8 space-y-6">
      <h2 className="text-2xl font-semibold text-neutral-900">Scan</h2>

      <ActionSelector value={selectedAction} onChange={setSelectedAction} />

      <ScanInput onScan={handleScan} disabled={processMutation.isPending} error={error} />

      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        📷 Scan with Camera
      </button>

      <CameraScanOverlay open={cameraOpen} onScan={handleScan} onClose={() => setCameraOpen(false)} />

      <div className="border-t border-neutral-200 pt-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-3">Scanned this session</h3>
        <ScannedPiecesList items={scannedItems} />
      </div>
    </div>
  );
}
