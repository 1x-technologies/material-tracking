/**
 * ShipmentTimeline — vertical connected-dot timeline showing all shipment
 * events in ascending chronological order (oldest at top, newest at bottom).
 *
 * Events include:
 * - Shipment created (synthetic, from shipment metadata)
 * - All piece scan events (from Piece.events[])
 * - Shipment cancelled (synthetic, from status + updatedAt)
 *
 * Limitation (D-09): cancellation actor is not stored in a dedicated field.
 * We use shipment.updatedAt as approximate cancel time and mark actor as
 * "System" since no cancel-actor field exists on the shipment document.
 */

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  in_transit: "In Transit",
  delivered: "Delivered",
  picked_up: "Picked Up",
  cancelled: "Cancelled",
  shipment_created: "Shipment Created",
};

/** Dot and badge color classes per action type (D-05 palette). */
const ACTION_DOT_COLORS: Record<string, string> = {
  created: "bg-neutral-400",
  in_transit: "bg-blue-500",
  delivered: "bg-green-500",
  picked_up: "bg-purple-500",
  cancelled: "bg-red-500",
  shipment_created: "bg-neutral-400",
};

const ACTION_BADGE_COLORS: Record<string, string> = {
  created: "bg-neutral-100 text-neutral-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  picked_up: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
  shipment_created: "bg-neutral-100 text-neutral-700",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PieceEventLike {
  action: string;
  timestamp: unknown;
  userId: string;
  userName: string;
  signatureUrl?: string;
  photoUrls?: string[];
}

interface ShipmentTimelineProps {
  /** Shipment-level fields */
  createdBy: { uid: string; name: string };
  createdAt: unknown; // Firestore Timestamp or serialised
  status: string;
  updatedAt: unknown;
  /** Pieces with their events */
  pieces: Array<{ pieceNumber: number; events: PieceEventLike[] }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface TimelineEntry {
  id: string;
  action: string;
  timestamp: Date;
  userName: string;
  pieceNumber?: number;
  hasSignature: boolean;
  hasPhotos: boolean;
}

function parseTimestamp(ts: unknown): Date {
  if (
    ts &&
    typeof ts === "object" &&
    "toDate" in ts &&
    typeof (ts as { toDate: unknown }).toDate === "function"
  ) {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (ts && typeof ts === "object" && "_seconds" in ts) {
    return new Date((ts as { _seconds: number })._seconds * 1000);
  }
  return new Date(ts as string | number);
}

function formatAbsolute(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const absDiff = Math.abs(diffMs);
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const suffix = diffMs >= 0 ? "ago" : "from now";

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ${suffix}`;
  if (hours < 24) return `${hours}h ${suffix}`;
  if (days < 30) return `${days}d ${suffix}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ${suffix}`;
  const years = Math.floor(days / 365);
  return `${years}y ${suffix}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ShipmentTimeline({
  createdBy,
  createdAt,
  status,
  updatedAt,
  pieces,
}: ShipmentTimelineProps) {
  // 1. Build merged timeline entries
  const entries: TimelineEntry[] = [];

  // Shipment created (synthetic)
  const createdDate = parseTimestamp(createdAt);
  entries.push({
    id: "shipment-created",
    action: "shipment_created",
    timestamp: createdDate,
    userName: createdBy.name,
    hasSignature: false,
    hasPhotos: false,
  });

  // Piece scan events
  for (const piece of pieces) {
    for (let i = 0; i < piece.events.length; i++) {
      const event = piece.events[i];
      entries.push({
        id: `piece-${piece.pieceNumber}-${event.action}-${i}`,
        action: event.action,
        timestamp: parseTimestamp(event.timestamp),
        userName: event.userName,
        pieceNumber: piece.pieceNumber,
        hasSignature: !!event.signatureUrl,
        hasPhotos: !!(event.photoUrls && event.photoUrls.length > 0),
      });
    }
  }

  // Cancelled (synthetic) — D-09: updatedAt is approximate cancel time
  if (status === "cancelled") {
    entries.push({
      id: "shipment-cancelled",
      action: "cancelled",
      timestamp: parseTimestamp(updatedAt),
      userName: "System",
      hasSignature: false,
      hasPhotos: false,
    });
  }

  // Sort ascending (oldest first — "story from start to end")
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (entries.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-6 text-center">
        No activity recorded yet
      </p>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Vertical connecting line */}
      <div
        className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200"
        aria-hidden="true"
      />

      <ol className="space-y-6" aria-label="Shipment activity timeline">
        {entries.map((entry) => {
          const dotColor =
            ACTION_DOT_COLORS[entry.action] ?? "bg-neutral-400";
          const badgeColor =
            ACTION_BADGE_COLORS[entry.action] ?? "bg-neutral-100 text-neutral-700";

          return (
            <li key={entry.id} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${dotColor}`}
                aria-hidden="true"
              >
                <span className="h-2 w-2 rounded-full bg-white" />
              </div>

              <div className="min-w-0">
                {/* Row 1: action badge + piece number */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>

                  {entry.pieceNumber != null && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      Piece {entry.pieceNumber}
                    </span>
                  )}

                  {/* D-07: signature indicator */}
                  {entry.hasSignature && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-neutral-500"
                      title="Signature captured"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M3.5 13.5l3-3 2 2 5-5 3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Signed
                    </span>
                  )}

                  {/* D-07: photo indicator */}
                  {entry.hasPhotos && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-neutral-500"
                      title="Photos attached"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm9 3a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Photos
                    </span>
                  )}
                </div>

                {/* Row 2: user + time */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="font-medium text-neutral-700">
                    {entry.userName}
                  </span>
                  <span
                    className="text-neutral-400"
                    title={formatAbsolute(entry.timestamp)}
                  >
                    {formatRelative(entry.timestamp)}
                  </span>
                  <span className="text-xs text-neutral-400 hidden sm:inline">
                    {formatAbsolute(entry.timestamp)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
