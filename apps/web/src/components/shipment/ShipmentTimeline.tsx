/**
 * ShipmentTimeline -- vertical connected-dot timeline showing all shipment
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

import { Edit05, Camera01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { BadgeColors } from "@/components/base/badges/badge-types";

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  shipment_created: "Shipment Created",
};

/** Dot color classes per action type. */
const ACTION_DOT_COLORS: Record<string, string> = {
  created: "bg-utility-neutral-200",
  in_transit: "bg-utility-blue-500",
  delivered: "bg-utility-green-500",
  completed: "bg-utility-purple-500",
  cancelled: "bg-utility-red-500",
  shipment_created: "bg-utility-neutral-200",
};

/** Badge color per action. */
const ACTION_BADGE_COLORS: Record<string, BadgeColors> = {
  created: "gray",
  in_transit: "blue",
  delivered: "success",
  completed: "purple",
  cancelled: "error",
  shipment_created: "gray",
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

  // Cancelled (synthetic) -- D-09: updatedAt is approximate cancel time
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

  // Sort ascending (oldest first)
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (entries.length === 0) {
    return (
      <p className="text-sm text-quaternary py-6 text-center">
        No activity recorded yet
      </p>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Vertical connecting line */}
      <div
        className="absolute left-3 top-2 bottom-2 w-0.5 bg-secondary"
        aria-hidden="true"
      />

      <ol className="space-y-6" aria-label="Shipment activity timeline">
        {entries.map((entry) => {
          const dotColor =
            ACTION_DOT_COLORS[entry.action] ?? "bg-utility-neutral-200";
          const badgeColor =
            ACTION_BADGE_COLORS[entry.action] ?? "gray";

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
                  <Badge size="sm" color={badgeColor}>
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>

                  {entry.pieceNumber != null && (
                    <Badge size="sm" color="gray">
                      Piece {entry.pieceNumber}
                    </Badge>
                  )}

                  {/* D-07: signature indicator */}
                  {entry.hasSignature && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-tertiary"
                      title="Signature captured"
                    >
                      <Edit05 className="h-3.5 w-3.5" aria-hidden="true" />
                      Signed
                    </span>
                  )}

                  {/* D-07: photo indicator */}
                  {entry.hasPhotos && (
                    <span
                      className="inline-flex items-center gap-1 text-xs text-tertiary"
                      title="Photos attached"
                    >
                      <Camera01 className="h-3.5 w-3.5" aria-hidden="true" />
                      Photos
                    </span>
                  )}
                </div>

                {/* Row 2: user + time */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="font-medium text-secondary">
                    {entry.userName}
                  </span>
                  <span
                    className="text-quaternary"
                    title={formatAbsolute(entry.timestamp)}
                  >
                    {formatRelative(entry.timestamp)}
                  </span>
                  <span className="text-xs text-quaternary hidden sm:inline">
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
