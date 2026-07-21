"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
        No sales data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6B7280", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6B7280", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `₦${value.toLocaleString()}`}
        />
        <Tooltip
          formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
          contentStyle={{
            backgroundColor: "#FFFFFF",
            borderRadius: "0.5rem",
            borderColor: "#E5E7EB",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#4F46E5"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}