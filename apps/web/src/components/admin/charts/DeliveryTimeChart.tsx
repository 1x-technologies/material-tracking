import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DeliveryTimeChartProps {
  data: Array<{ name: string; avgHours: number; count: number }>;
}

export function DeliveryTimeChart({ data }: DeliveryTimeChartProps) {
  return (
    <figure>
      <figcaption className="text-lg font-semibold text-neutral-900 mb-4">
        Average Delivery Time by Location
      </figcaption>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-neutral-400">No delivery data for selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#404040" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#404040" }}
              label={{ value: "Hours", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.375rem",
                border: "1px solid #E5E5E5",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Bar dataKey="avgHours" fill="#7F56D9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </figure>
  );
}
