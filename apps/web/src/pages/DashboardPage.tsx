import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useShipmentsSubscription } from "../hooks/useShipmentsSubscription";
import { classifyAllExceptions } from "../utils/exceptions";
import { FilterTabs } from "../components/dashboard/FilterTabs";
import {
  ShipmentTable,
  sortShipments,
  type SortField,
  type SortDirection,
} from "../components/dashboard/ShipmentTable";
import { Spinner } from "../components/ui/Spinner";

export function DashboardPage() {
  const navigate = useNavigate();
  const { shipments, loading, error } = useShipmentsSubscription({ showCompleted: true });

  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const lastUpdatedRef = useRef<string>(new Date().toLocaleTimeString());
  if (!loading && shipments.length > 0) {
    lastUpdatedRef.current = new Date().toLocaleTimeString();
  }

  const exceptionsMap = useMemo(
    () => classifyAllExceptions(shipments),
    [shipments],
  );

  const exceptionCount = useMemo(() => {
    let count = 0;
    for (const exceptions of exceptionsMap.values()) {
      if (exceptions.length > 0) count++;
    }
    return count;
  }, [exceptionsMap]);

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", count: shipments.length },
      { id: "in_transit", label: "In Transit", count: shipments.filter((s) => s.status === "in_transit").length },
      { id: "delivered", label: "Delivered", count: shipments.filter((s) => s.status === "delivered" || s.status === "partially_delivered").length },
      { id: "picked_up", label: "Picked Up", count: shipments.filter((s) => s.status === "picked_up").length },
      { id: "exceptions", label: "Exceptions", count: exceptionCount },
    ],
    [shipments, exceptionCount],
  );

  const filteredShipments = useMemo(() => {
    switch (activeTab) {
      case "in_transit":
        return shipments.filter((s) => s.status === "in_transit");
      case "delivered":
        return shipments.filter((s) => s.status === "delivered" || s.status === "partially_delivered");
      case "picked_up":
        return shipments.filter((s) => s.status === "picked_up");
      case "exceptions":
        return shipments.filter((s) => exceptionsMap.has(s.id));
      default:
        return shipments;
    }
  }, [shipments, activeTab, exceptionsMap]);

  const sortedShipments = useMemo(
    () => sortShipments(filteredShipments, sortField, sortDirection),
    [filteredShipments, sortField, sortDirection],
  );

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/shipments/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Last updated: {lastUpdatedRef.current}
        </p>
      </div>

      <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <ShipmentTable
        shipments={sortedShipments}
        exceptionsMap={exceptionsMap}
        onRowClick={handleRowClick}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
