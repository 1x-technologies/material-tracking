import { useState } from "react";
import { toast } from "sonner";
import { Download01, CalendarDate } from "@untitledui/icons";
import { trpc } from "../../trpc";
import { exportCsv } from "../../lib/exportCsv";
import { Spinner } from "../ui/Spinner";
import { DeliveryTimeChart } from "./charts/DeliveryTimeChart";
import { VolumeChart } from "./charts/VolumeChart";
import { DriverActivityTable } from "./charts/DriverActivityTable";
import { Button } from "@/components/base/buttons/button";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function ReportsView() {
  const today = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const [dateFrom, setDateFrom] = useState(formatDate(thirtyDaysAgo));
  const [dateTo, setDateTo] = useState(formatDate(today));
  const [appliedFrom, setAppliedFrom] = useState(`${formatDate(thirtyDaysAgo)}T00:00:00.000Z`);
  const [appliedTo, setAppliedTo] = useState(`${formatDate(today)}T23:59:59.999Z`);

  const handleApply = () => {
    // Validate that the start date is not after the end date
    if (dateFrom > dateTo) {
      toast.error("'From' date cannot be after 'To' date. Please fix the date range.");
      return;
    }
    setAppliedFrom(`${dateFrom}T00:00:00.000Z`);
    setAppliedTo(`${dateTo}T23:59:59.999Z`);
  };

  const deliveryTime = trpc.admin.reportDeliveryTime.useQuery({
    dateFrom: appliedFrom,
    dateTo: appliedTo,
  });
  const volume = trpc.admin.reportVolume.useQuery({
    dateFrom: appliedFrom,
    dateTo: appliedTo,
  });
  const driverActivity = trpc.admin.reportDriverActivity.useQuery({
    dateFrom: appliedFrom,
    dateTo: appliedTo,
  });

  const todayStr = formatDate(today);

  const handleExportDeliveryTime = () => {
    if (!deliveryTime.data) return;
    exportCsv(
      `delivery-times-${todayStr}.csv`,
      ["Location", "Avg Hours", "Count"],
      deliveryTime.data.map((d) => [d.name, String(d.avgHours), String(d.count)]),
    );
  };

  const handleExportVolume = () => {
    if (!volume.data) return;
    exportCsv(
      `shipment-volume-${todayStr}.csv`,
      ["Date", "Count"],
      volume.data.map((d) => [d.date, String(d.count)]),
    );
  };

  const handleExportDriverActivity = () => {
    if (!driverActivity.data) return;
    exportCsv(
      `driver-activity-${todayStr}.csv`,
      ["Driver Name", "Total Scans", "Pickups", "Deliveries", "Avg Scans/Day"],
      driverActivity.data.map((d) => [
        d.userName || d.userId,
        String(d.totalScans),
        String(d.pickups),
        String(d.deliveries),
        String(d.avgScansPerDay),
      ]),
    );
  };

  return (
    <div>
      {/* Date filter bar */}
      <div className="mb-6 rounded-xl border border-secondary bg-primary p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="report-from" className="mb-1.5 block text-sm font-medium text-secondary">
              From
            </label>
            <div className="relative">
              <input
                id="report-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full appearance-none rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary shadow-xs outline-hidden ring-1 ring-primary ring-inset transition duration-100 ease-linear focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </div>
          <div>
            <label htmlFor="report-to" className="mb-1.5 block text-sm font-medium text-secondary">
              To
            </label>
            <div className="relative">
              <input
                id="report-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full appearance-none rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary shadow-xs outline-hidden ring-1 ring-primary ring-inset transition duration-100 ease-linear focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </div>
          <Button size="sm" color="primary" iconLeading={CalendarDate} onClick={handleApply}>
            Apply Filter
          </Button>
        </div>
      </div>

      {/* Report card grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Delivery Time Chart Card */}
        <div className="rounded-xl border border-secondary bg-primary p-6">
          {deliveryTime.isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <DeliveryTimeChart data={deliveryTime.data ?? []} />
              <div className="mt-4 flex justify-end">
                <Button
                  size="xs"
                  color="secondary"
                  iconLeading={Download01}
                  onClick={handleExportDeliveryTime}
                  isDisabled={!deliveryTime.data?.length}
                >
                  Export CSV
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Volume Chart Card */}
        <div className="rounded-xl border border-secondary bg-primary p-6">
          {volume.isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <VolumeChart data={volume.data ?? []} />
              <div className="mt-4 flex justify-end">
                <Button
                  size="xs"
                  color="secondary"
                  iconLeading={Download01}
                  onClick={handleExportVolume}
                  isDisabled={!volume.data?.length}
                >
                  Export CSV
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Driver Activity Table Card */}
        <div className="col-span-full rounded-xl border border-secondary bg-primary p-6">
          {driverActivity.isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <DriverActivityTable data={driverActivity.data ?? []} />
              <div className="mt-4 flex justify-end">
                <Button
                  size="xs"
                  color="secondary"
                  iconLeading={Download01}
                  onClick={handleExportDriverActivity}
                  isDisabled={!driverActivity.data?.length}
                >
                  Export CSV
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
