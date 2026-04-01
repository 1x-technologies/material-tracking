import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useShipmentsSubscription } from "../hooks/useShipmentsSubscription";
import { useAuthContext } from "../context/AuthContext";
import { classifyAllExceptions } from "../utils/exceptions";
import { FilterTabs } from "../components/dashboard/FilterTabs";
import {
  ShipmentTable,
  sortShipments,
  type SortField,
  type SortDirection,
} from "../components/dashboard/ShipmentTable";
import { DriverTripView } from "../components/dashboard/DriverTripView";
import { Spinner } from "../components/ui/Spinner";

export function DashboardPage() {
  const navigate = useNavigate();
  const { appUser } = useAuthContext();
  const isDriver = appUser?.role === "driver";

  const [daysBack, setDaysBack] = useState(30);
  const { shipments, loading, error } = useShipmentsSubscription({ showCompleted: true, daysBack });

  const [activeTab, setActiveTab] = useState(() => isDriver ? "my_tasks" : "all");
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

  const driverTaskCount = useMemo(() => {
    if (!isDriver || !appUser) return 0;
    return shipments.filter(
      (s) =>
        (s.origin.locationId === appUser.locationId && s.status === "created") ||
        (s.destination.locationId === appUser.locationId && s.status === "in_transit"),
    ).length;
  }, [shipments, isDriver, appUser]);

  const tabs = useMemo(
    () => {
      const baseTabs = [
        { id: "all", label: "All", count: shipments.length },
        { id: "in_transit", label: "In Transit", count: shipments.filter((s) => s.status === "in_transit").length },
        { id: "delivered", label: "Delivered", count: shipments.filter((s) => s.status === "delivered" || s.status === "partially_delivered").length },
        { id: "picked_up", label: "Picked Up", count: shipments.filter((s) => s.status === "picked_up").length },
        { id: "exceptions", label: "Exceptions", count: exceptionCount },
      ];
      if (isDriver) {
        baseTabs.unshift({ id: "my_tasks", label: "My Tasks", count: driverTaskCount });
      }
      return baseTabs;
    },
    [shipments, exceptionCount, isDriver, driverTaskCount],
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

      {activeTab === "my_tasks" ? (
        <DriverTripView shipments={shipments} locationId={appUser?.locationId ?? ""} />
      ) : (
        <>
          <ShipmentTable
            shipments={sortedShipments}
            exceptionsMap={exceptionsMap}
            onRowClick={handleRowClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-xs text-neutral-400">
              Showing last {daysBack} days
            </p>
            <button
              type="button"
              onClick={() => setDaysBack((d) => d + 30)}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors"
            >
              Show Older Shipments
            </button>
          </div>
        </>
      )}
    </div>
  );
}
