import { useState } from "react";
import { toast } from "sonner";
import { ActionSelector } from "../components/scan/ActionSelector";
import type { BatchItem, BatchResult } from "../components/scan/BatchScanQueue";
import { BatchScanQueue } from "../components/scan/BatchScanQueue";
import { CameraScanOverlay } from "../components/scan/CameraScanOverlay";
import { PhotoCapture } from "../components/scan/PhotoCapture";
import { ScanInput } from "../components/scan/ScanInput";
import { ScannedPiecesList } from "../components/scan/ScannedPiecesList";
import { SignatureDialog } from "../components/scan/SignatureDialog";
import { playErrorBuzz, playSuccessBeep } from "../components/scan/scanSounds";
import { uploadScanPhoto, uploadSignaturePng } from "../lib/storage";
import { trpc } from "../trpc";

type ScanAction = "in_transit" | "delivered" | "picked_up";

interface ScannedItem {
  pieceId: string;
  shipmentId: string;
  newStatus: string;
  shipmentNumber: string;
  pieceNumber: number;
  scannedAt: Date;
}

interface PendingScan {
  qrCode: string;
  photoUrls?: string[];
}

export function ScanPage() {
  const [selectedAction, setSelectedAction] = useState("in_transit");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [batchMode, setBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [batchSignatureUrl, setBatchSignatureUrl] = useState<string | undefined>();

  const processMutation = trpc.scan.process.useMutation({
    onSuccess(data) {
      playSuccessBeep();
      setScannedItems((prev) => [{ ...data, scannedAt: new Date() }, ...prev]);
      toast.success(`Piece ${data.pieceNumber} → ${data.newStatus.replace(/_/g, " ")}`);
      setError(null);
      setPendingPhotos([]);
    },
    onError(err) {
      playErrorBuzz();
      setError(err.message);
    },
  });

  const batchMutation = trpc.scan.processBatch.useMutation({
    onSuccess(data) {
      const results: BatchResult[] = data.map((r, i) => ({
        index: i,
        ok: r.ok,
        data: r.ok ? r.data : undefined,
        error: !r.ok ? r.error : undefined,
      }));
      setBatchResults(results);

      const successCount = results.filter((r) => r.ok).length;
      if (successCount > 0) {
        playSuccessBeep();
        const successItems: ScannedItem[] = results
          .filter((r) => r.ok && r.data)
          .map((r) => ({
            pieceId: r.data!.pieceId,
            shipmentId: "",
            newStatus: r.data!.newStatus,
            shipmentNumber: r.data!.shipmentNumber,
            pieceNumber: r.data!.pieceNumber,
            scannedAt: new Date(),
          }));
        setScannedItems((prev) => [...successItems, ...prev]);
      }

      const failCount = results.filter((r) => !r.ok).length;
      if (failCount > 0) {
        playErrorBuzz();
        toast.error(`${failCount} scan(s) failed`);
      }
      if (successCount > 0 && failCount === 0) {
        toast.success(`All ${successCount} scans processed`);
      }
    },
    onError(err) {
      playErrorBuzz();
      toast.error(err.message);
    },
  });

  const isBusy = processMutation.isPending || batchMutation.isPending || uploading;

  async function uploadPendingPhotos(): Promise<string[]> {
    if (pendingPhotos.length === 0) return [];
    setUploading(true);
    try {
      const urls = await Promise.all(
        pendingPhotos.map((file) => uploadScanPhoto(file, "unassigned", "unassigned")),
      );
      return urls;
    } finally {
      setUploading(false);
    }
  }

  async function handleScan(qrCode: string) {
    setError(null);

    if (batchMode) {
      let photoUrls: string[] | undefined;
      if (pendingPhotos.length > 0) {
        try {
          photoUrls = await uploadPendingPhotos();
        } catch {
          toast.error("Photo upload failed");
          return;
        }
        setPendingPhotos([]);
      }

      setBatchQueue((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          qrCode,
          action: selectedAction,
          photoUrls,
        },
      ]);
      setBatchResults(null);
      return;
    }

    let photoUrls: string[] | undefined;
    if (pendingPhotos.length > 0) {
      try {
        photoUrls = await uploadPendingPhotos();
      } catch {
        toast.error("Photo upload failed");
        return;
      }
    }

    if (selectedAction === "delivered") {
      setPendingScan({ qrCode, photoUrls });
      setSignatureOpen(true);
      return;
    }

    processMutation.mutate({
      qrCode,
      action: selectedAction as ScanAction,
      photoUrls,
    });
  }

  async function handleSignatureConfirm(blob: Blob) {
    if (!pendingScan) return;
    setSignatureOpen(false);
    try {
      const signatureUrl = await uploadSignaturePng(blob, "pending", "pending");
      processMutation.mutate({
        qrCode: pendingScan.qrCode,
        action: "delivered" as ScanAction,
        signatureUrl,
        photoUrls: pendingScan.photoUrls,
      });
    } catch {
      toast.error("Signature upload failed");
    }
    setPendingScan(null);
  }

  function handleSignatureSkip() {
    if (!pendingScan) return;
    setSignatureOpen(false);
    processMutation.mutate({
      qrCode: pendingScan.qrCode,
      action: "delivered" as ScanAction,
      photoUrls: pendingScan.photoUrls,
    });
    setPendingScan(null);
  }

  async function handleBatchSignature(blob: Blob) {
    try {
      const url = await uploadSignaturePng(blob, "batch", "batch");
      setBatchSignatureUrl(url);
      setSignatureOpen(false);
      toast.success("Signature captured for batch");
    } catch {
      toast.error("Signature upload failed");
    }
  }

  function handleConfirmAll() {
    batchMutation.mutate({
      scans: batchQueue.map((item) => ({
        qrCode: item.qrCode,
        action: item.action as ScanAction,
        photoUrls: item.photoUrls,
        ...(selectedAction === "delivered" && batchSignatureUrl
          ? { signatureUrl: batchSignatureUrl }
          : {}),
      })),
    });
    setBatchSignatureUrl(undefined);
  }

  function handleRemove(id: string) {
    setBatchQueue((prev) => prev.filter((item) => item.id !== id));
    setBatchResults(null);
  }

  function toggleBatchMode() {
    setBatchMode((prev) => {
      if (prev) {
        setBatchQueue([]);
        setBatchResults(null);
      }
      return !prev;
    });
  }

  return (
    <div className="py-8 space-y-6">
      <h2 className="text-2xl font-semibold text-neutral-900">Scan</h2>

      <ActionSelector value={selectedAction} onChange={setSelectedAction} />

      <div className="flex items-center gap-3">
        <label htmlFor="batch-toggle" className="text-sm font-medium text-neutral-700">
          Batch Mode
        </label>
        <button
          id="batch-toggle"
          type="button"
          role="switch"
          aria-checked={batchMode}
          onClick={toggleBatchMode}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            batchMode ? "bg-brand-600" : "bg-neutral-200",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform",
              batchMode ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>

      <ScanInput onScan={handleScan} disabled={isBusy} error={error} />

      <PhotoCapture onPhotosChange={setPendingPhotos} disabled={isBusy} />

      <button
        type="button"
        onClick={() => setCameraOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        📷 Scan with Camera
      </button>

      <CameraScanOverlay open={cameraOpen} onScan={handleScan} onClose={() => setCameraOpen(false)} />

      {batchMode ? (
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Batch Queue</h3>
          {selectedAction === "delivered" && batchQueue.length > 0 && (
            <div className="mb-3">
              {batchSignatureUrl ? (
                <p className="text-sm text-green-700">Signature captured for batch</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setSignatureOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Capture Signature (optional)
                </button>
              )}
            </div>
          )}
          <BatchScanQueue
            items={batchQueue}
            onRemove={handleRemove}
            onConfirmAll={handleConfirmAll}
            results={batchResults}
            isPending={batchMutation.isPending}
          />
        </div>
      ) : (
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Scanned this session</h3>
          <ScannedPiecesList items={scannedItems} />
        </div>
      )}

      <SignatureDialog
        open={signatureOpen}
        onConfirm={batchMode ? handleBatchSignature : handleSignatureConfirm}
        onSkip={batchMode ? () => setSignatureOpen(false) : handleSignatureSkip}
        onClose={() => {
          setSignatureOpen(false);
          if (!batchMode) setPendingScan(null);
        }}
      />
    </div>
  );
}
