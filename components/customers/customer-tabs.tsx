"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { CustomerDetail } from "@/lib/actions/customers";

type TabKey = "jobs" | "quotes" | "invoices";

export function CustomerTabs({
  jobs,
  quotes,
  invoices,
}: {
  jobs: CustomerDetail["jobs"];
  quotes: CustomerDetail["quotes"];
  invoices: CustomerDetail["invoices"];
}) {
  const [active, setActive] = useState<TabKey>("jobs");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "jobs", label: "Jobs", count: jobs.length },
    { key: "quotes", label: "Quotes", count: quotes.length },
    { key: "invoices", label: "Invoices", count: invoices.length },
  ];

  return (
    <div>
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              tab.key === active
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {tab.label}
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs tabular-nums text-slate-500">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {active === "jobs" ? (
        <Empty count={jobs.length} noun="jobs">
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link key={job.id} href={`/dashboard/jobs/${job.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{job.name}</p>
                      <p className="text-xs text-slate-500">{job.status}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatCurrency(job.value)}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </Empty>
      ) : null}

      {active === "quotes" ? (
        <Empty count={quotes.length} noun="quotes">
          <div className="space-y-2">
            {quotes.map((quote) => (
              <Link key={quote.id} href={`/dashboard/quotes/${quote.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">
                        {quote.quoteNumber}
                      </span>
                      <FinanceStatusBadge status={quote.status} />
                    </div>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatCurrency(quote.total)}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </Empty>
      ) : null}

      {active === "invoices" ? (
        <Empty count={invoices.length} noun="invoices">
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </span>
                      <FinanceStatusBadge status={invoice.status} />
                    </div>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatCurrency(invoice.total)}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </Empty>
      ) : null}
    </div>
  );
}

function Empty({
  count,
  noun,
  children,
}: {
  count: number;
  noun: string;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-slate-400">
          No {noun} for this customer yet.
        </CardBody>
      </Card>
    );
  }
  return <>{children}</>;
}
