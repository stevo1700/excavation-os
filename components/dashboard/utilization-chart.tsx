"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface UtilizationSlice {
  label: string;
  value: number;
  color: string;
}

/**
 * Donut chart of fleet status (in use / available / maintenance) with the
 * in-use percentage called out in the center.
 */
export function UtilizationChart({ data }: { data: UtilizationSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const inUse = data.find((slice) => slice.label === "In use")?.value ?? 0;
  const pct = total === 0 ? 0 : Math.round((inUse / total) * 100);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} machines`,
                name,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">
            {pct}%
          </span>
          <span className="text-xs text-slate-500">in use</span>
        </div>
      </div>

      <ul className="w-full space-y-2 sm:w-auto">
        {data.map((slice) => (
          <li
            key={slice.label}
            className="flex items-center justify-between gap-6 text-sm sm:justify-start"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              {slice.label}
            </span>
            <span className="font-medium tabular-nums text-slate-900">
              {slice.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
