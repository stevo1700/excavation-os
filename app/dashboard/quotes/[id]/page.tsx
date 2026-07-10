import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { LineItemsTable } from "@/components/finance/line-items-table";
import { getQuote, updateQuoteStatus } from "@/lib/actions/quotes";
import { createInvoiceFromQuote } from "@/lib/actions/invoices";
import { isApprovedQuoteStatus } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Quote Details" };

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quote = await getQuote(params.id);
  if (!quote) notFound();

  const setSent = updateQuoteStatus.bind(null, quote.id, "SENT");
  const setAccepted = updateQuoteStatus.bind(null, quote.id, "ACCEPTED");
  const setDeclined = updateQuoteStatus.bind(null, quote.id, "DECLINED");
  const toInvoice = createInvoiceFromQuote.bind(null, quote.id);
  const approved = isApprovedQuoteStatus(quote.status);

  return (
    <div>
      <Link
        href="/dashboard/documents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to quotes
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {quote.quoteNumber}
            </h2>
            <FinanceStatusBadge status={quote.status} />
          </div>
          {quote.title ? (
            <p className="mt-0.5 text-sm font-medium text-slate-700">
              {quote.title}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">
            {quote.jobName}
            {quote.customerName ? (
              <>
                {" · "}
                {quote.customerId ? (
                  <Link
                    href={`/dashboard/customers/${quote.customerId}`}
                    className="text-brand-600 hover:text-brand-700"
                  >
                    {quote.customerName}
                  </Link>
                ) : (
                  quote.customerName
                )}
              </>
            ) : null}
            {quote.validUntil
              ? ` · valid until ${formatDate(quote.validUntil)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusButton action={setSent} label="Mark as Sent" />
          <StatusButton action={setAccepted} label="Mark as Accepted" />
          <StatusButton action={setDeclined} label="Mark as Declined" />
          {approved ? (
            <form action={toInvoice}>
              <button
                type="submit"
                className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
              >
                Convert to Invoice
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <LineItemsTable items={quote.lineItems} />
          <Totals
            subtotal={quote.subtotal}
            taxRate={quote.taxRate}
            taxAmount={quote.taxAmount}
            total={quote.total}
          />
        </CardBody>
      </Card>

      {quote.notes ? (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">
              {quote.notes}
            </p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function StatusButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        {label}
      </button>
    </form>
  );
}

function Totals({
  subtotal,
  taxRate,
  taxAmount,
  total,
}: {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}) {
  return (
    <div className="mt-4 flex justify-end">
      <dl className="w-full max-w-xs space-y-1.5 text-sm">
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        <Row
          label={`Tax (${(taxRate * 100).toFixed(2)}%)`}
          value={formatCurrency(taxAmount)}
        />
        <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
          <dt className="font-semibold text-slate-700">Total</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {formatCurrency(total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
