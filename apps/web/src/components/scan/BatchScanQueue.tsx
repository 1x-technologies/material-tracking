export interface BatchItem {
  id: string;
  qrCode: string;
  action: string;
  photoUrls?: string[];
}

export interface BatchResult {
  index: number;
  ok: boolean;
  data?: { pieceId: string; shipmentNumber: string; pieceNumber: number; newStatus: string };
  error?: string;
}

interface BatchScanQueueProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
  onConfirmAll: () => void;
  results: BatchResult[] | null;
  isPending: boolean;
}

const actionBadge: Record<string, string> = {
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  picked_up: "bg-purple-100 text-purple-700",
};

export function BatchScanQueue({ items, onRemove, onConfirmAll, results, isPending }: BatchScanQueueProps) {
  if (items.length === 0 && !results) {
    return <p className="text-sm text-neutral-400 text-center py-4">No scans queued</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => {
          const result = results?.[i];
          return (
            <div
              key={item.id}
              className={[
                "rounded-lg border px-4 py-3 flex items-center justify-between transition-colors",
                result?.ok === true
                  ? "border-green-300 bg-green-50"
                  : result?.ok === false
                    ? "border-red-300 bg-red-50"
                    : "border-neutral-200",
              ].join(" ")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-neutral-400 w-6 shrink-0">{i + 1}.</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{item.qrCode}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${actionBadge[item.action] ?? "bg-neutral-100 text-neutral-700"}`}
                    >
                      {item.action.replace(/_/g, " ")}
                    </span>
                    {item.photoUrls && item.photoUrls.length > 0 && (
                      <span className="text-xs text-neutral-500">
                        📷 {item.photoUrls.length}
                      </span>
                    )}
                  </div>
                  {result?.ok === true && result.data && (
                    <p className="text-xs text-green-700 mt-1">
                      ✓ {result.data.shipmentNumber} — Piece {result.data.pieceNumber} → {result.data.newStatus.replace(/_/g, " ")}
                    </p>
                  )}
                  {result?.ok === false && result.error && (
                    <p className="text-xs text-red-600 mt-1">✗ {result.error}</p>
                  )}
                </div>
              </div>

              {!results && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  disabled={isPending}
                  className="ml-2 shrink-0 flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!results && (
        <button
          type="button"
          onClick={onConfirmAll}
          disabled={isPending || items.length === 0}
          className={[
            "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
            isPending || items.length === 0
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700",
          ].join(" ")}
        >
          {isPending ? "Processing…" : `Confirm All (${items.length})`}
        </button>
      )}
    </div>
  );
}
