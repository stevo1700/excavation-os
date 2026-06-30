"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { QuoteListItem } from "@/lib/actions/quotes";

const statuses = ["DRAFT", "SENT", "ACCEPTED", "DECLINED"];

export function QuotesList({ quotes }: { quotes: QuoteListItem[] }) {
  const [filter, setFilter] = useState("all");

  const options: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: quotes.length },
      ...statuses.map((status) => ({
        value: status,
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        count: quotes.filter((q) => q.status === status).length,
      })),
    ],
    [quotes],
  );

  const visible =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  return (
    <>
      <FilterBar
        options={options}
        value={filter}
        onChange={setFilter}
        className="mb-5"
      />

      {visible.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-sm text-slate-400">
            No quotes to show.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Quote #</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Valid until</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((quote) => (
                  <tr
                    key={quote.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/quotes/${quote.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {quote.jobName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {quote.customerName ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <FinanceStatusBadge status={quote.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {quote.validUntil ? formatDate(quote.validUntil) : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(quote.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
