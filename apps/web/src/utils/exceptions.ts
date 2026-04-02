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

export interface ExceptionThresholds {
  stalledThresholdHours: number;
  overdueThresholdHours: number;
  agedThresholdHours: number;
}

const DEFAULT_THRESHOLDS: ExceptionThresholds = {
  stalledThresholdHours: 4,
  overdueThresholdHours: 24,
  agedThresholdHours: 24,
};

const RESOLVED_STATUSES: ShipmentStatus[] = ["delivered", "picked_up", "cancelled"];

function toMillis(ts: { toDate: () => Date }): number {
  return ts.toDate().getTime();
}

export function classifyExceptions(
  shipment: ShipmentWithId,
  now: Date = new Date(),
  thresholds?: ExceptionThresholds,
): ExceptionType[] {
  const exceptions: ExceptionType[] = [];
  const nowMs = now.getTime();

  const stalledMs = (thresholds?.stalledThresholdHours ?? DEFAULT_THRESHOLDS.stalledThresholdHours) * 60 * 60 * 1000;
  const overdueMs = (thresholds?.overdueThresholdHours ?? DEFAULT_THRESHOLDS.overdueThresholdHours) * 60 * 60 * 1000;
  const agedMs = (thresholds?.agedThresholdHours ?? DEFAULT_THRESHOLDS.agedThresholdHours) * 60 * 60 * 1000;

  const isResolved = RESOLVED_STATUSES.includes(shipment.status);

  if (!isResolved && nowMs - toMillis(shipment.updatedAt) >= stalledMs) {
    exceptions.push(ExceptionType.STALLED);
  }

  if (!isResolved && nowMs - toMillis(shipment.createdAt) >= overdueMs) {
    exceptions.push(ExceptionType.OVERDUE);
  }

  if (
    shipment.status === "delivered" &&
    shipment.deliveredAt &&
    nowMs - toMillis(shipment.deliveredAt) >= agedMs
  ) {
    exceptions.push(ExceptionType.AGED);
  }

  return exceptions;
}

export function classifyAllExceptions(
  shipments: ShipmentWithId[],
  now: Date = new Date(),
  thresholds?: ExceptionThresholds,
): Map<string, ExceptionType[]> {
  const result = new Map<string, ExceptionType[]>();

  for (const shipment of shipments) {
    const exceptions = classifyExceptions(shipment, now, thresholds);
    if (exceptions.length > 0) {
      result.set(shipment.id, exceptions);
    }
  }

  return result;
}
