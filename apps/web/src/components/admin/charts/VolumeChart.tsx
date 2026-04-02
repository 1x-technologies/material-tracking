import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface VolumeChartProps {
  data: Array<{ date: string; count: number }>;
}

export function VolumeChart({ data }: VolumeChartProps) {
  return (
    <figure>
      <figcaption className="text-lg font-semibold text-neutral-900 mb-4">
        Shipment Volume Over Time
      </figcaption>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-neutral-400">No shipment data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#404040" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#404040" }}
              label={{ value: "Shipments", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.375rem",
                border: "1px solid #E5E5E5",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area type="monotone" dataKey="count" fill="#F5F3FF" stroke="none" />
            <Line type="monotone" dataKey="count" stroke="#7F56D9" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
