import { Badge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";

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

const statusBadgeColor: Record<string, BadgeColors> = {
  in_transit: "blue",
  delivered: "success",
  completed: "purple",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

interface ScannedPiecesListProps {
  items: ScannedItem[];
}

export function ScannedPiecesList({ items }: ScannedPiecesListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-quaternary text-center py-4">No pieces scanned yet</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item.pieceId}-${i}`}
          className="rounded-lg border border-secondary px-4 py-3 flex items-center justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-primary">{item.shipmentNumber}</p>
            <p className="text-sm text-tertiary">
              Piece {item.pieceNumber}{item.totalPieces ? `/${item.totalPieces}` : ""}
              {item.origin && item.destination ? ` \u2022 ${item.origin} \u2192 ${item.destination}` : ""}
            </p>
            {item.description && (
              <p className="text-xs text-quaternary truncate">{item.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge
              type="pill-color"
              size="sm"
              color={statusBadgeColor[item.newStatus] ?? "gray"}
            >
              {formatStatus(item.newStatus)}
            </Badge>
            <span className="text-xs text-quaternary">{formatTime(item.scannedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
