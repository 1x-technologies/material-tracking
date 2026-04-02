import { useMemo, useState } from "react";

interface DriverActivity {
  userId: string;
  userName: string;
  totalScans: number;
  pickups: number;
  deliveries: number;
  avgScansPerDay: number;
}

interface DriverActivityTableProps {
  data: DriverActivity[];
}

export function DriverActivityTable({ data }: DriverActivityTableProps) {
  const [sortDesc, setSortDesc] = useState(true);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      sortDesc ? b.totalScans - a.totalScans : a.totalScans - b.totalScans,
    );
  }, [data, sortDesc]);

  return (
    <figure className="col-span-full">
      <figcaption className="text-lg font-semibold text-neutral-900 mb-4">
        Driver Activity
      </figcaption>

      {data.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-neutral-400">No scan activity for selected period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Driver Name
                </th>
                <th
                  className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider cursor-pointer select-none hover:text-neutral-900"
                  onClick={() => setSortDesc((d) => !d)}
                >
                  Total Scans{" "}
                  <span className="text-neutral-400">{sortDesc ? "\u2193" : "\u2191"}</span>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Pickups
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Deliveries
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Avg Scans/Day
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((driver) => (
                <tr key={driver.userId} className="border-b border-neutral-100">
                  <td className="px-3 py-3 text-sm font-semibold text-neutral-900">
                    {driver.userName || driver.userId}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{driver.totalScans}</td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{driver.pickups}</td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{driver.deliveries}</td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{driver.avgScansPerDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
