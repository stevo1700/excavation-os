"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceListItem } from "@/lib/actions/invoices";

const statuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"];

export function InvoicesList({ invoices }: { invoices: InvoiceListItem[] }) {
  const [filter, setFilter] = useState("all");

  const options: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: invoices.length },
      ...statuses.map((status) => ({
        value: status,
        label: status.charAt(0) + status.slice(1).toLowerCase(),
        count: invoices.filter((i) => i.status === status).length,
      })),
    ],
    [invoices],
  );

  const visible =
    filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

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
            No invoices to show.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-right">Amount paid</th>
                  <th className="px-5 py-3">Due date</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {invoice.jobName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {invoice.customerName ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <FinanceStatusBadge status={invoice.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {formatCurrency(invoice.amountPaid)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
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
