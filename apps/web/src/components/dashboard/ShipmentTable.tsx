import type { ShipmentWithId } from "../../hooks/useShipmentsSubscription";
import type { ExceptionType } from "../../utils/exceptions";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { ExceptionBadge } from "./ExceptionBadge";

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
  picked_up: 4,
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

const SORTABLE_COLUMNS: { field: SortField; label: string }[] = [
  { field: "priority", label: "Priority" },
  { field: "status", label: "Status" },
  { field: "createdAt", label: "Created" },
  { field: "updatedAt", label: "Last Activity" },
];

function SortIndicator({ field, activeField, direction }: { field: SortField; activeField: SortField; direction: SortDirection }) {
  if (field !== activeField) return <span className="ml-1 text-neutral-300">▼</span>;
  return <span className="ml-1">{direction === "asc" ? "▲" : "▼"}</span>;
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
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm font-medium">No shipments found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
            <th className="sticky top-0 bg-white px-4 py-3">Shipment #</th>
            {SORTABLE_COLUMNS.map((col) => (
              <th
                key={col.field}
                className="sticky top-0 bg-white px-4 py-3 cursor-pointer select-none hover:text-neutral-700 transition-colors"
                onClick={() => onSort(col.field)}
              >
                {col.label}
                <SortIndicator field={col.field} activeField={sortField} direction={sortDirection} />
              </th>
            ))}
            <th className="sticky top-0 bg-white px-4 py-3">Route</th>
            <th className="sticky top-0 bg-white px-4 py-3">Pieces</th>
            <th className="sticky top-0 bg-white px-4 py-3">Sender</th>
            <th className="sticky top-0 bg-white px-4 py-3">Receiver</th>
            <th className="sticky top-0 bg-white px-4 py-3">Exceptions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {shipments.map((shipment) => {
            const exceptions = exceptionsMap.get(shipment.id) ?? [];
            return (
              <tr
                key={shipment.id}
                className="cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => onRowClick(shipment.id)}
              >
                <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
                  {shipment.shipmentNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={shipment.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <PriorityBadge priority={shipment.priority} />
                </td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                  {formatDateTime(parseTimestamp(shipment.createdAt))}
                </td>
                <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                  {formatDateTime(parseTimestamp(shipment.updatedAt))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                  {shipment.origin.name} → {shipment.destination.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                  {shipment.pieceCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-700 truncate max-w-[150px]">
                  {shipment.sender.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-neutral-700 truncate max-w-[150px]">
                  {shipment.receiver.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex gap-1">
                    <ExceptionBadge exceptions={exceptions} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
