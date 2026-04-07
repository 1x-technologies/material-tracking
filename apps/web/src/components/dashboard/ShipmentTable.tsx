import { Package, ArrowUp, ArrowDown } from "@untitledui/icons";
import type { ShipmentWithId } from "../../hooks/useShipmentsSubscription";
import type { ExceptionType } from "../../utils/exceptions";
import { Badge } from "@/components/base/badges/badges";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { ExceptionBadge } from "./ExceptionBadge";
import { EmptyState } from "@/components/application/empty-state/empty-state";

export type SortField = "priority" | "status" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

interface ShipmentTableProps {
  shipments: ShipmentWithId[];
  exceptionsMap: Map<string, ExceptionType[]>;
  onRowClick: (shipmentId: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 0,
  standard: 1,
  low: 2,
};

const STATUS_WEIGHT: Record<string, number> = {
  created: 0,
  in_transit: 1,
  partially_delivered: 2,
  delivered: 3,
  completed: 4,
  cancelled: 5,
};

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

function getSortValue(shipment: ShipmentWithId, field: SortField): number {
  switch (field) {
    case "priority":
      return PRIORITY_WEIGHT[shipment.priority] ?? 99;
    case "status":
      return STATUS_WEIGHT[shipment.status] ?? 99;
    case "createdAt":
      return parseTimestamp(shipment.createdAt).getTime();
    case "updatedAt":
      return parseTimestamp(shipment.updatedAt).getTime();
  }
}

export function sortShipments(
  shipments: ShipmentWithId[],
  field: SortField,
  direction: SortDirection,
): ShipmentWithId[] {
  return [...shipments].sort((a, b) => {
    const aVal = getSortValue(a, field);
    const bVal = getSortValue(b, field);
    return direction === "asc" ? aVal - bVal : bVal - aVal;
  });
}

const SORTABLE_COLUMNS: { field: SortField; label: string; hiddenClass?: string }[] = [
  { field: "priority", label: "Priority" },
  { field: "status", label: "Status" },
  { field: "createdAt", label: "Created" },
  { field: "updatedAt", label: "Last Activity", hiddenClass: "hidden md:table-cell" },
];

function SortIndicator({ field, activeField, direction }: { field: SortField; activeField: SortField; direction: SortDirection }) {
  if (field !== activeField) {
    return <ArrowDown className="ml-1 size-3.5 text-tertiary opacity-0 group-hover/th:opacity-100 transition-opacity" />;
  }
  return direction === "asc"
    ? <ArrowUp className="ml-1 size-3.5 text-brand-secondary" />
    : <ArrowDown className="ml-1 size-3.5 text-brand-secondary" />;
}

export function ShipmentTable({
  shipments,
  exceptionsMap,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
}: ShipmentTableProps) {
  if (shipments.length === 0) {
    return (
      <EmptyState className="py-16">
        <EmptyState.Header pattern="none">
          <EmptyState.FeaturedIcon icon={Package} color="gray" theme="modern" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No shipments found</EmptyState.Title>
          <EmptyState.Description>
            There are no shipments matching the current filter criteria.
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  return (
    <>
      {/* Card view for tablet/mobile */}
      <div className="lg:hidden space-y-3">
        {shipments.map((shipment) => {
          const exceptions = exceptionsMap.get(shipment.id) ?? [];
          return (
            <button
              key={shipment.id}
              type="button"
              className="w-full text-left rounded-xl border border-secondary bg-primary p-4 shadow-xs active:bg-secondary transition-colors"
              onClick={() => onRowClick(shipment.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-primary">{shipment.shipmentNumber}</span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={shipment.status} />
                  {(shipment as Record<string, unknown>).signatureUrl && (
                    <Badge type="pill-color" size="sm" color="success">Signed</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-secondary mb-1.5">
                <span>{shipment.origin.name}</span>
                <span className="text-quaternary">{"\u2192"}</span>
                <span>{shipment.destination.name}</span>
                <span className="text-quaternary">|</span>
                <span>{shipment.pieceCount} pc</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={shipment.priority} />
                  {exceptions.length > 0 && <ExceptionBadge exceptions={exceptions} />}
                </div>
                <span className="text-xs text-quaternary">{formatDateTime(parseTimestamp(shipment.createdAt))}</span>
              </div>

              <div className="flex items-center gap-1 mt-1.5 text-xs text-tertiary">
                <span>{shipment.sender.name}</span>
                <span className="text-quaternary">{"\u2192"}</span>
                <span>{shipment.receiver.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table view for desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-secondary shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">
                Shipment #
              </th>
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.field}
                  className={`group/th px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary cursor-pointer select-none hover:text-secondary transition-colors ${col.hiddenClass ?? ""}`}
                  onClick={() => onSort(col.field)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIndicator field={col.field} activeField={sortField} direction={sortDirection} />
                  </span>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">Route</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">Pieces</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">Sender</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">Receiver</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-tertiary">Exceptions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => {
              const exceptions = exceptionsMap.get(shipment.id) ?? [];
              return (
                <tr
                  key={shipment.id}
                  className="cursor-pointer border-b border-secondary bg-primary hover:bg-secondary active:bg-secondary transition-colors"
                  onClick={() => onRowClick(shipment.id)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-primary whitespace-nowrap">
                    {shipment.shipmentNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={shipment.priority} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <StatusBadge status={shipment.status} />
                      {(shipment as Record<string, unknown>).signatureUrl && (
                        <Badge type="pill-color" size="sm" color="success">Signed</Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary whitespace-nowrap">
                    {formatDateTime(parseTimestamp(shipment.createdAt))}
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary whitespace-nowrap">
                    {formatDateTime(parseTimestamp(shipment.updatedAt))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      {shipment.origin.name}
                      <span className="text-quaternary">{"\u2192"}</span>
                      {shipment.destination.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary tabular-nums">
                    {shipment.pieceCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate max-w-[150px]">
                    {shipment.sender.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate max-w-[150px]">
                    {shipment.receiver.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      <ExceptionBadge exceptions={exceptions} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
