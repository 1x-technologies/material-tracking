import type { ShipmentStatus } from "@material-tracking/shared";
import type { ShipmentWithId } from "../hooks/useShipmentsSubscription";

export const ExceptionType = {
  STALLED: "stalled",
  OVERDUE: "overdue",
  AGED: "aged",
} as const;
export type ExceptionType = (typeof ExceptionType)[keyof typeof ExceptionType];

export interface ShipmentException {
  type: ExceptionType;
  shipmentId: string;
}

const RESOLVED_STATUSES: ShipmentStatus[] = ["delivered", "picked_up", "cancelled"];

function toMillis(ts: { toDate: () => Date }): number {
  return ts.toDate().getTime();
}

export function classifyExceptions(
  shipment: ShipmentWithId,
  now: Date = new Date(),
): ExceptionType[] {
  const exceptions: ExceptionType[] = [];
  const nowMs = now.getTime();

  const isResolved = RESOLVED_STATUSES.includes(shipment.status);

  if (!isResolved && nowMs - toMillis(shipment.updatedAt) >= 4 * 60 * 60 * 1000) {
    exceptions.push(ExceptionType.STALLED);
  }

  if (!isResolved && nowMs - toMillis(shipment.createdAt) >= 24 * 60 * 60 * 1000) {
    exceptions.push(ExceptionType.OVERDUE);
  }

  if (
    shipment.status === "delivered" &&
    shipment.deliveredAt &&
    nowMs - toMillis(shipment.deliveredAt) >= 24 * 60 * 60 * 1000
  ) {
    exceptions.push(ExceptionType.AGED);
  }

  return exceptions;
}

export function classifyAllExceptions(
  shipments: ShipmentWithId[],
  now: Date = new Date(),
): Map<string, ExceptionType[]> {
  const result = new Map<string, ExceptionType[]>();

  for (const shipment of shipments) {
    const exceptions = classifyExceptions(shipment, now);
    if (exceptions.length > 0) {
      result.set(shipment.id, exceptions);
    }
  }

  return result;
}
