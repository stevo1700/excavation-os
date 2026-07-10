"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";
import type { DocumentListItem } from "@/lib/actions/documents";
import type { ContractTemplateView } from "@/lib/actions/contracts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Filter = "all" | "quote" | "invoice" | "contract" | "templates";

export function DocumentsHub({
  documents,
  templates,
}: {
  documents: DocumentListItem[];
  templates: ContractTemplateView[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    return {
      all: documents.length,
      quote: documents.filter((d) => d.kind === "quote").length,
      invoice: documents.filter((d) => d.kind === "invoice").length,
      contract: documents.filter((d) => d.kind === "contract").length,
      templates: templates.length,
    };
  }, [documents, templates]);

  const filtered =
    filter === "templates"
      ? []
      : filter === "all"
        ? documents
        : documents.filter((d) => d.kind === filter);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "quote", label: "Quotes" },
    { key: "invoice", label: "Invoices" },
    { key: "contract", label: "Contracts" },
    { key: "templates", label: "Templates" },
  ];

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filter === "templates" ? (
        templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No contract templates"
            description="Create templates under Contracts, then apply them from a job’s Documents tab."
            action={
              <Link
                href="/dashboard/contracts/new"
                className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900"
              >
                New template
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/contracts/${t.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <Badge
                    tone={t.active ? "green" : "neutral"}
                    label={t.active ? "Active" : "Off"}
                  />
                </div>
                {t.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {t.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Create quotes and invoices from a job’s Budget or Documents tab. They’ll show up here."
          action={
            <Link
              href="/dashboard/jobs"
              className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900"
            >
              Go to jobs
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Document</th>
                <th className="px-4 py-2.5 font-medium">Job</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                <th className="px-4 py-2.5 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={`${doc.kind}-${doc.id}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        doc.kind === "quote"
                          ? "blue"
                          : doc.kind === "invoice"
                            ? "amber"
                            : "neutral"
                      }
                      label={doc.kind}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={doc.href}
                      className="font-medium text-slate-900 hover:text-brand-700"
                    >
                      {doc.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/jobs/${doc.jobId}`}
                      className="text-slate-600 hover:text-brand-700"
                    >
                      {doc.jobName}
                    </Link>
                    {doc.customerName ? (
                      <p className="text-xs text-slate-400">{doc.customerName}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <FinanceStatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {doc.total == null ? "—" : formatCurrency(doc.total)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {formatDate(doc.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
