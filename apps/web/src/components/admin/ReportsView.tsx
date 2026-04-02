import { useState } from "react";
import { trpc } from "../../trpc";
import { exportCsv } from "../../lib/exportCsv";
import { Spinner } from "../ui/Spinner";
import { DeliveryTimeChart } from "./charts/DeliveryTimeChart";
import { VolumeChart } from "./charts/VolumeChart";
import { DriverActivityTable } from "./charts/DriverActivityTable";

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
    <div className="py-4">
      {/* Date filter bar */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="report-from" className="block text-xs font-medium text-neutral-600 mb-1">
              From
            </label>
            <input
              id="report-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="report-to" className="block text-xs font-medium text-neutral-600 mb-1">
              To
            </label>
            <input
              id="report-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Report card grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery Time Chart Card */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          {deliveryTime.isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Spinner />
            </div>
          ) : (
            <>
              <DeliveryTimeChart data={deliveryTime.data ?? []} />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleExportDeliveryTime}
                  disabled={!deliveryTime.data?.length}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>

        {/* Volume Chart Card */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          {volume.isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Spinner />
            </div>
          ) : (
            <>
              <VolumeChart data={volume.data ?? []} />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleExportVolume}
                  disabled={!volume.data?.length}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>

        {/* Driver Activity Table Card */}
        <div className="col-span-full rounded-lg border border-neutral-200 bg-white p-6">
          {driverActivity.isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Spinner />
            </div>
          ) : (
            <>
              <DriverActivityTable data={driverActivity.data ?? []} />
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleExportDriverActivity}
                  disabled={!driverActivity.data?.length}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export CSV
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
