"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RevenuePoint } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const lastIndex = data.length - 1;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} stroke="#eef1f5" />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 12, fill: "#94a3b8" }}
          tickFormatter={(value: number) => formatCompactCurrency(value)}
        />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={entry.week}
              // Highlight the most recent week in the brand amber.
              fill={index === lastIndex ? "#f59e0b" : "#fcd34d"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
