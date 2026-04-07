import { useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowUp, ArrowDown, Package, QrCode01 } from "@untitledui/icons";
import type { ShipmentWithId } from "../../hooks/useShipmentsSubscription";
import { PriorityBadge } from "./PriorityBadge";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";

interface DriverTripViewProps {
  shipments: ShipmentWithId[];
  locationId: string;
}

function TaskCard({ shipment, onScan }: { shipment: ShipmentWithId; onScan: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-secondary bg-primary p-5 shadow-xs hover:bg-primary_hover transition-colors">
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-primary">
            {shipment.shipmentNumber}
          </span>
          <PriorityBadge priority={shipment.priority} />
        </div>
        <span className="text-xs text-quaternary">
          {shipment.pieceCount} piece{shipment.pieceCount !== 1 ? "s" : ""}
        </span>
        <span className="text-sm text-secondary">
          {shipment.sender.name}
          <span className="text-quaternary mx-1.5">--</span>
          {shipment.receiver.name}
        </span>
      </div>
      <Button
        size="sm"
        color="primary"
        iconLeading={QrCode01}
        onClick={onScan}
      >
        Scan
      </Button>
    </div>
  );
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
      <EmptyState className="py-16">
        <EmptyState.Header pattern="none">
          <EmptyState.FeaturedIcon icon={Package} color="gray" theme="modern" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No tasks assigned</EmptyState.Title>
          <EmptyState.Description>
            No tasks assigned to your location today.
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8 mt-6">
      {/* Pickup Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center size-9 rounded-lg bg-utility-brand-50">
            <ArrowUp className="size-4 text-utility-brand-700" />
          </div>
          <h3 className="text-md font-semibold text-primary">Pickup</h3>
          <span className="text-sm text-tertiary">
            ({pickupTasks.length})
          </span>
        </div>
        {pickupTasks.length === 0 ? (
          <p className="text-sm text-quaternary py-4 text-center rounded-xl border border-secondary bg-secondary">
            No pickups at your location
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pickupTasks.map((s) => (
              <TaskCard key={s.id} shipment={s} onScan={() => navigate("/scan")} />
            ))}
          </div>
        )}
      </section>

      {/* Deliver Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center size-9 rounded-lg bg-utility-green-50">
            <ArrowDown className="size-4 text-utility-green-700" />
          </div>
          <h3 className="text-md font-semibold text-primary">Deliver</h3>
          <span className="text-sm text-tertiary">
            ({deliverTasks.length})
          </span>
        </div>
        {deliverTasks.length === 0 ? (
          <p className="text-sm text-quaternary py-4 text-center rounded-xl border border-secondary bg-secondary">
            No deliveries for your location
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {deliverTasks.map((s) => (
              <TaskCard key={s.id} shipment={s} onScan={() => navigate("/scan")} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
