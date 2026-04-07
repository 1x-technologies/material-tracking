import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Trash01, CheckCircle, XCircle, Image01 } from "@untitledui/icons";

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

const actionBadgeColor: Record<string, BadgeColors> = {
  in_transit: "blue",
  delivered: "success",
  completed: "purple",
};

export function BatchScanQueue({ items, onRemove, onConfirmAll, results, isPending }: BatchScanQueueProps) {
  if (items.length === 0 && !results) {
    return <p className="text-sm text-quaternary text-center py-4">No scans queued</p>;
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
                    : "border-secondary",
              ].join(" ")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-quaternary w-6 shrink-0">{i + 1}.</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{item.qrCode}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      type="pill-color"
                      size="sm"
                      color={actionBadgeColor[item.action] ?? "gray"}
                    >
                      {item.action.replace(/_/g, " ")}
                    </Badge>
                    {item.photoUrls && item.photoUrls.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-tertiary">
                        <Image01 className="size-3" /> {item.photoUrls.length}
                      </span>
                    )}
                  </div>
                  {result?.ok === true && result.data && (
                    <p className="text-xs text-green-700 mt-1 inline-flex items-center gap-1">
                      <CheckCircle className="size-3" /> {result.data.shipmentNumber} -- Piece {result.data.pieceNumber} → {result.data.newStatus.replace(/_/g, " ")}
                    </p>
                  )}
                  {result?.ok === false && result.error && (
                    <p className="text-xs text-red-600 mt-1 inline-flex items-center gap-1">
                      <XCircle className="size-3" /> {result.error}
                    </p>
                  )}
                </div>
              </div>

              {!results && (
                <Button
                  size="sm"
                  color="tertiary-destructive"
                  iconLeading={Trash01}
                  isDisabled={isPending}
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove scan"
                />
              )}
            </div>
          );
        })}
      </div>

      {!results && (
        <Button
          size="lg"
          color="primary"
          isDisabled={isPending || items.length === 0}
          isLoading={isPending}
          onClick={onConfirmAll}
          className="w-full"
        >
          {isPending ? "Processing..." : `Confirm All (${items.length})`}
        </Button>
      )}
    </div>
  );
}
