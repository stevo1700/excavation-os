"use client";

import Link from "next/link";
import {
  KanbanBoard,
  type KanbanColumnDef,
} from "@/components/kanban/kanban-board";
import {
  updateCustomerStage,
  type CustomerCard,
} from "@/lib/actions/customers";
import { cn, formatCompactCurrency } from "@/lib/utils";

const STAGES = [
  "Lead",
  "Contacted",
  "Proposal Sent",
  "Negotiating",
  "Won",
  "Lost",
];

const columns: KanbanColumnDef[] = STAGES.map((stage) => ({
  id: stage,
  title: stage,
}));

function stageBadge(stage: string): string {
  if (stage === "Won") return "bg-emerald-100 text-emerald-700";
  if (stage === "Lost") return "bg-slate-200 text-slate-500";
  return "bg-brand-100 text-brand-700";
}

export function CustomerBoard({ customers }: { customers: CustomerCard[] }) {
  return (
    <KanbanBoard
      columns={columns}
      items={customers}
      onMove={(id, stage) => updateCustomerStage(id, stage)}
      renderColumnMeta={(_id, items) =>
        formatCompactCurrency(items.reduce((sum, c) => sum + c.quoteTotal, 0))
      }
      renderCard={(customer) => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/customers/${customer.id}`}
              className="text-base font-semibold leading-tight text-slate-900 hover:text-brand-700"
            >
              {customer.name}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                stageBadge(customer.columnId),
              )}
            >
              {customer.columnId}
            </span>
          </div>

          {customer.contactName || customer.phone ? (
            <p className="text-xs text-slate-500">
              {[customer.contactName, customer.phone]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}

          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-brand-600">
              {formatCompactCurrency(customer.quoteTotal)}
            </span>
            <span className="text-slate-400">
              {customer.openJobs} open job{customer.openJobs === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    />
  );
}
