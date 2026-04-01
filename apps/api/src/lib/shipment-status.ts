import type { PieceStatus, ScanAction, ShipmentStatus } from "@material-tracking/shared";

type TransitionResult =
  | { valid: true; newStatus: PieceStatus }
  | { valid: false; error: string };

const TRANSITION_MAP: Record<string, PieceStatus | undefined> = {
  "created->in_transit": "in_transit" as PieceStatus,
  "in_transit->delivered": "delivered" as PieceStatus,
  "delivered->picked_up": "picked_up" as PieceStatus,
};

const STATUS_ORDER: Record<string, number> = {
  created: 0,
  in_transit: 1,
  delivered: 2,
  picked_up: 3,
};

export function validateTransition(
  currentStatus: PieceStatus,
  action: ScanAction,
): TransitionResult {
  if (STATUS_ORDER[action] !== undefined && STATUS_ORDER[currentStatus] >= STATUS_ORDER[action]) {
    return {
      valid: false,
      error: `ALREADY_AT_STATUS: piece is already ${currentStatus}`,
    };
  }

  const key = `${currentStatus}->${action}`;
  const newStatus = TRANSITION_MAP[key];

  if (!newStatus) {
    return {
      valid: false,
      error: `INVALID_TRANSITION: cannot go from ${currentStatus} to ${action}`,
    };
  }

  return { valid: true, newStatus };
}

interface DeriveResult {
  status: ShipmentStatus;
  deliveredCount?: number;
  pieceCount?: number;
}

export function deriveShipmentStatus(
  pieceStatuses: PieceStatus[],
  currentShipmentStatus: ShipmentStatus,
): DeriveResult {
  if (currentShipmentStatus === "cancelled") {
    return { status: "cancelled" as ShipmentStatus };
  }

  const total = pieceStatuses.length;
  let pickedUp = 0;
  let delivered = 0;
  let inTransit = 0;

  for (const s of pieceStatuses) {
    if (s === "picked_up") pickedUp++;
    else if (s === "delivered") delivered++;
    else if (s === "in_transit") inTransit++;
  }

  if (pickedUp === total) {
    return { status: "picked_up" as ShipmentStatus };
  }

  const atLeastDelivered = pickedUp + delivered;
  if (atLeastDelivered === total) {
    return { status: "delivered" as ShipmentStatus };
  }

  if (atLeastDelivered > 0) {
    return {
      status: "partially_delivered" as ShipmentStatus,
      deliveredCount: atLeastDelivered,
      pieceCount: total,
    };
  }

  if (inTransit > 0) {
    return { status: "in_transit" as ShipmentStatus };
  }

  return { status: "created" as ShipmentStatus };
}
