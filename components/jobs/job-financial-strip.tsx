import Link from "next/link";
import type { JobFinancialSnapshot } from "@/lib/actions/job-hub";
import { formatCurrency } from "@/lib/utils";

export function JobFinancialStrip({
  jobId,
  financials,
}: {
  jobId: string;
  financials: JobFinancialSnapshot;
}) {
  const cards = [
    {
      label: "Contract",
      value: formatCurrency(financials.contractValue),
      href: null as string | null,
    },
    {
      label: "Budget",
      value: formatCurrency(financials.budgetTotal),
      href: null,
      sub: financials.budgetTotal > 0 ? "job estimate" : "add below",
    },
    {
      label: "Actual cost",
      value: formatCurrency(financials.actualTotal),
      href: null,
      sub:
        financials.budgetTotal > 0
          ? financials.budgetVariance > 0
            ? "over budget"
            : financials.budgetVariance < 0
              ? "under budget"
              : "on budget"
          : undefined,
      emphasize: financials.budgetVariance > 0,
    },
    {
      label: "Quoted",
      value: formatCurrency(financials.quotedTotal),
      href: null,
      sub: `${financials.quoteCount} quote${financials.quoteCount === 1 ? "" : "s"}`,
    },
    {
      label: "Invoiced",
      value: formatCurrency(financials.invoicedTotal),
      href: null,
      sub: `${financials.invoiceCount} invoice${financials.invoiceCount === 1 ? "" : "s"}`,
    },
    {
      label: "Outstanding",
      value: formatCurrency(financials.outstanding),
      href: null,
      emphasize: financials.outstanding > 0,
    },
  ];

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const body = (
          <div
            className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${
              card.emphasize
                ? "border-amber-300 ring-1 ring-amber-100"
                : "border-surface-600/40"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${
                card.emphasize ? "text-amber-800" : "text-slate-900"
              }`}
            >
              {card.value}
            </p>
            {"sub" in card && card.sub ? (
              <p className="mt-0.5 text-xs text-slate-400">{card.sub}</p>
            ) : null}
          </div>
        );

        if (card.href) {
          return (
            <Link
              key={card.label}
              href={card.href}
              className="block transition-opacity hover:opacity-90"
            >
              {body}
            </Link>
          );
        }
        return <div key={card.label}>{body}</div>;
      })}
    </div>
  );
}
