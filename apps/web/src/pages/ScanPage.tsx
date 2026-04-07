import { useRef, useState } from "react";
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
import { useAuthContext } from "../context/AuthContext";
import { isReceiver as _isReceiver } from "../lib/receiver-detect";
import { uploadScanPhoto, uploadSignaturePng } from "../lib/storage";
import { trpc } from "../trpc";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { Badge } from "@/components/base/badges/badges";
import { Camera01, Edit01, CheckCircle } from "@untitledui/icons";

type ScanAction = "in_transit" | "delivered" | "completed";
type ScanMode = "auto" | ScanAction;

interface ScannedItem {
  pieceId: string;
  shipmentId: string;
  newStatus: string;
  shipmentNumber: string;
  pieceNumber: number;
  scannedAt: Date;
  origin?: string | null;
  destination?: string | null;
  description?: string | null;
  totalPieces?: number;
}

interface PendingScan {
  qrCode: string;
  photoUrls?: string[];
}

const COOLDOWN_MS = 30_000;

export function ScanPage() {
  const { user: _user } = useAuthContext();
  const [selectedAction, setSelectedAction] = useState<ScanMode>("auto");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const recentScansRef = useRef<Map<string, number>>(new Map());

  const [batchMode, setBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [signatureOpen, setSignatureOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [batchSignatureUrl, setBatchSignatureUrl] = useState<string | undefined>();

  const processMutation = trpc.scan.process.useMutation({
    onSuccess(data, variables) {
      playSuccessBeep();
      recentScansRef.current.set(variables.qrCode, Date.now());
      setScannedItems((prev) => [{ ...data, scannedAt: new Date() }, ...prev]);

      const status = data.newStatus.replace(/_/g, " ");
      const route = [data.origin, data.destination].filter(Boolean).join(" → ");
      const context = route ? ` (${route})` : "";
      toast.success(`${data.shipmentNumber} piece ${data.pieceNumber}/${data.totalPieces} → ${status}${context}`);

      setError(null);
      setPendingPhotos([]);
    },
    onError(err) {
      playErrorBuzz();
      const msg = err.message;
      if (msg.includes("ALREADY_AT_STATUS")) {
        const status = msg.split("already ")[1] ?? "this status";
        setError(`Already scanned -- piece is ${status.replace(/_/g, " ")}`);
      } else if (msg.includes("NO_NEXT_ACTION")) {
        setError("This piece has already completed its journey");
      } else if (msg.includes("UNKNOWN_QR")) {
        setError("QR code not recognized -- check the label and try again");
      } else if (msg.includes("INVALID_TRANSITION")) {
        setError("Cannot perform this action on the piece in its current state");
      } else if (msg.includes("SHIPMENT_CANCELLED")) {
        setError("This shipment has been cancelled");
      } else {
        setError(msg);
      }
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

    // Client-side cooldown: block same QR code within 30 seconds.
    // Applied in all scan modes (auto, in_transit, delivered, completed) to
    // prevent accidental double-scans regardless of the selected action.
    const lastScan = recentScansRef.current.get(qrCode);
    if (lastScan) {
      const elapsed = Date.now() - lastScan;
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        playErrorBuzz();
        setError(`Just scanned this piece ${Math.floor(elapsed / 1000)}s ago. Wait ${remaining}s before scanning again.`);
        return;
      }
    }

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
      action: selectedAction === "auto" ? undefined : (selectedAction as ScanAction),
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
        action: item.action === "auto" ? undefined : (item.action as ScanAction),
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
    <div className="py-8 space-y-6 max-w-2xl">
      <h2 className="text-2xl font-semibold text-primary">Scan</h2>

      <ActionSelector value={selectedAction} onChange={setSelectedAction} />

      <Toggle
        size="sm"
        label="Batch Mode"
        isSelected={batchMode}
        onChange={toggleBatchMode}
      />

      <ScanInput onScan={handleScan} disabled={isBusy} error={error} />

      <PhotoCapture onPhotosChange={setPendingPhotos} disabled={isBusy} />

      <Button
        size="md"
        color="secondary"
        iconLeading={Camera01}
        onClick={() => setCameraOpen(true)}
        className="min-h-[44px]"
      >
        Scan with Camera
      </Button>

      <CameraScanOverlay open={cameraOpen} onScan={handleScan} onClose={() => setCameraOpen(false)} />

      {batchMode ? (
        <div className="border-t border-secondary pt-4">
          <h3 className="text-sm font-medium text-tertiary mb-3">Batch Queue</h3>
          {selectedAction === "delivered" && batchQueue.length > 0 && (
            <div className="mb-3">
              {batchSignatureUrl ? (
                <Badge type="pill-color" size="md" color="success">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle className="size-3" /> Signature captured for batch
                  </span>
                </Badge>
              ) : (
                <Button
                  size="sm"
                  color="secondary"
                  iconLeading={Edit01}
                  onClick={() => setSignatureOpen(true)}
                >
                  Capture Signature (optional)
                </Button>
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
        <div className="border-t border-secondary pt-4">
          <h3 className="text-sm font-medium text-tertiary mb-3">Scanned this session</h3>
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
