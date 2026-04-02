/**
 * @deprecated Use ShipmentTimeline instead for full shipment activity view.
 * This component is retained for transitional compatibility and will be
 * removed once ShipmentFormPage migrates to ShipmentTimeline.
 */

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  in_transit: "In Transit",
  delivered: "Delivered",
  picked_up: "Picked Up",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-neutral-100 text-neutral-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  picked_up: "bg-purple-100 text-purple-700",
};

interface EventEntry {
  action: string;
  timestamp: unknown;
  userId: string;
  userName: string;
}

interface Props {
  pieces: Array<{ pieceNumber: number; events: EventEntry[] }>;
}

function parseTimestamp(ts: unknown): Date {
  if (ts && typeof ts === "object" && "toDate" in ts && typeof (ts as { toDate: unknown }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (ts && typeof ts === "object" && "_seconds" in ts) {
    return new Date((ts as { _seconds: number })._seconds * 1000);
  }
  return new Date(ts as string | number);
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function PieceEventsList({ pieces }: Props) {
  const flatEvents = pieces.flatMap((piece) =>
    piece.events.map((event) => ({
      ...event,
      pieceNumber: piece.pieceNumber,
      parsedTime: parseTimestamp(event.timestamp),
    })),
  );

  flatEvents.sort((a, b) => b.parsedTime.getTime() - a.parsedTime.getTime());

  if (flatEvents.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-6 text-center">
        No scan events recorded yet
      </p>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
      {flatEvents.map((event, idx) => (
        <div
          key={`${event.pieceNumber}-${event.action}-${idx}`}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              Piece {event.pieceNumber}
            </span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[event.action] ?? "bg-neutral-100 text-neutral-700"}`}
            >
              {ACTION_LABELS[event.action] ?? event.action}
            </span>
            <span className="truncate text-sm text-neutral-700">
              {event.userName}
            </span>
          </div>
          <span className="shrink-0 text-xs text-neutral-500">
            {formatDateTime(event.parsedTime)}
          </span>
        </div>
      ))}
    </div>
  );
}
