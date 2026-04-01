import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { ShipmentWithId } from "../../hooks/useShipmentsSubscription";
import { PriorityBadge } from "./PriorityBadge";

interface DriverTripViewProps {
  shipments: ShipmentWithId[];
  locationId: string;
}

export function DriverTripView({ shipments, locationId }: DriverTripViewProps) {
  const navigate = useNavigate();

  const pickupTasks = useMemo(
    () =>
      shipments.filter(
        (s) => s.origin.locationId === locationId && s.status === "created",
      ),
    [shipments, locationId],
  );

  const deliverTasks = useMemo(
    () =>
      shipments.filter(
        (s) =>
          s.destination.locationId === locationId && s.status === "in_transit",
      ),
    [shipments, locationId],
  );

  if (pickupTasks.length === 0 && deliverTasks.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-12 text-center">
        No tasks assigned to your location today
      </p>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <section>
        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <span>📤</span> Pickup
          <span className="text-sm font-normal text-neutral-500">
            ({pickupTasks.length})
          </span>
        </h3>
        {pickupTasks.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">
            No pickups at your location
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pickupTasks.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-neutral-900">
                      {s.shipmentNumber}
                    </span>
                    <PriorityBadge priority={s.priority} />
                  </div>
                  <span className="text-xs text-neutral-500">
                    {s.pieceCount} piece{s.pieceCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {s.sender.name} → {s.receiver.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/scan")}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shrink-0"
                >
                  Scan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
          <span>📥</span> Deliver
          <span className="text-sm font-normal text-neutral-500">
            ({deliverTasks.length})
          </span>
        </h3>
        {deliverTasks.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">
            No deliveries for your location
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {deliverTasks.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-neutral-900">
                      {s.shipmentNumber}
                    </span>
                    <PriorityBadge priority={s.priority} />
                  </div>
                  <span className="text-xs text-neutral-500">
                    {s.pieceCount} piece{s.pieceCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {s.sender.name} → {s.receiver.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/scan")}
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors shrink-0"
                >
                  Scan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
