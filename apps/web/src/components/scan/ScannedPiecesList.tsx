interface ScannedItem {
  pieceId: string;
  shipmentId: string;
  newStatus: string;
  shipmentNumber: string;
  pieceNumber: number;
  scannedAt: Date;
}

const statusStyles: Record<string, string> = {
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  picked_up: "bg-purple-100 text-purple-700",
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
    return <p className="text-sm text-neutral-400 text-center py-4">No pieces scanned yet</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item.pieceId}-${i}`}
          className="rounded-lg border border-neutral-200 px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-neutral-900">{item.shipmentNumber}</p>
            <p className="text-sm text-neutral-500">Piece {item.pieceNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusStyles[item.newStatus] ?? "bg-neutral-100 text-neutral-700"}`}
            >
              {formatStatus(item.newStatus)}
            </span>
            <span className="text-xs text-neutral-400">{formatTime(item.scannedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
