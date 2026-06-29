import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Kpi } from "@/lib/types";
import { cn } from "@/lib/utils";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const positive = kpi.change >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {kpi.value}
      </p>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            positive ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          {Math.abs(kpi.change)}%
        </span>
        <span className="text-slate-400">{kpi.hint}</span>
      </div>
    </div>
  );
}
