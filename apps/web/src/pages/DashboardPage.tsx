import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Package, Route, CheckCircle, AlertTriangle } from "@untitledui/icons";
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
import { Button } from "@/components/base/buttons/button";
import { Spinner } from "../components/ui/Spinner";

/* ------------------------------------------------------------------ */
/*  Metric Card                                                       */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ label, value, icon: Icon, iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:gap-4 sm:p-6">
      <div className={`flex items-center justify-center size-10 rounded-lg sm:size-11 ${iconBg}`}>
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-tertiary sm:text-sm">{label}</p>
        <p className="text-lg font-semibold text-primary tabular-nums sm:text-display-xs">{value}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                    */
/* ------------------------------------------------------------------ */

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

  const inTransitCount = useMemo(
    () => shipments.filter((s) => s.status === "in_transit").length,
    [shipments],
  );

  const deliveredCount = useMemo(
    () => shipments.filter((s) => s.status === "delivered" || s.status === "partially_delivered").length,
    [shipments],
  );

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
        { id: "created", label: "Created", count: shipments.filter((s) => s.status === "created").length },
        { id: "in_transit", label: "In Transit", count: inTransitCount },
        { id: "delivered", label: "Delivered", count: deliveredCount },
        { id: "completed", label: "Completed", count: shipments.filter((s) => s.status === "completed").length },
        { id: "exceptions", label: "Exceptions", count: exceptionCount },
      ];
      if (isDriver) {
        baseTabs.push({ id: "my_tasks", label: "My Tasks", count: driverTaskCount });
      }
      return baseTabs;
    },
    [shipments, exceptionCount, isDriver, driverTaskCount, inTransitCount, deliveredCount],
  );

  const filteredShipments = useMemo(() => {
    switch (activeTab) {
      case "created":
        return shipments.filter((s) => s.status === "created");
      case "in_transit":
        return shipments.filter((s) => s.status === "in_transit");
      case "delivered":
        return shipments.filter((s) => s.status === "delivered" || s.status === "partially_delivered");
      case "completed":
        return shipments.filter((s) => s.status === "completed");
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
      <div className="rounded-xl bg-utility-red-50 border border-utility-red-200 px-4 py-3 text-sm text-utility-red-700 mt-4">
        <strong>Error:</strong> {error.message}
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-display-xs font-semibold text-primary">Dashboard</h1>
        <p className="text-sm text-tertiary mt-1">
          Last updated: {lastUpdatedRef.current}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard
          label="Total Shipments"
          value={shipments.length}
          icon={Package}
          iconBg="bg-utility-brand-50"
          iconColor="text-utility-brand-700"
        />
        <MetricCard
          label="In Transit"
          value={inTransitCount}
          icon={Route}
          iconBg="bg-utility-blue-50"
          iconColor="text-utility-blue-700"
        />
        <MetricCard
          label="Delivered"
          value={deliveredCount}
          icon={CheckCircle}
          iconBg="bg-utility-green-50"
          iconColor="text-utility-green-700"
        />
        <MetricCard
          label="Exceptions"
          value={exceptionCount}
          icon={AlertTriangle}
          iconBg="bg-utility-red-50"
          iconColor="text-utility-red-700"
        />
      </div>

      {/* Tabs */}
      <FilterTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
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
            <p className="text-xs text-quaternary">
              Showing last {daysBack} days
            </p>
            <Button
              size="sm"
              color="secondary"
              onClick={() => setDaysBack((d) => d + 30)}
            >
              Show Older Shipments
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
