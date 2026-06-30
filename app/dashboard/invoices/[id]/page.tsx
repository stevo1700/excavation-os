import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { LineItemsTable } from "@/components/finance/line-items-table";
import {
  getInvoice,
  markInvoicePaid,
  updateInvoiceStatus,
} from "@/lib/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();

  const setSent = updateInvoiceStatus.bind(null, invoice.id, "SENT");
  const setVoid = updateInvoiceStatus.bind(null, invoice.id, "VOID");
  const setPaid = markInvoicePaid.bind(null, invoice.id);

  const balanceDue = invoice.total - invoice.amountPaid;
  const paidPct =
    invoice.total > 0
      ? Math.min(100, Math.round((invoice.amountPaid / invoice.total) * 100))
      : 0;

  return (
    <div>
      <Link
        href="/dashboard/invoices"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {invoice.invoiceNumber}
            </h2>
            <FinanceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {invoice.jobName}
            {invoice.customerName ? ` · ${invoice.customerName}` : ""}
            {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
          </p>
          {invoice.quoteId ? (
            <p className="mt-1 text-xs text-slate-400">
              From quote{" "}
              <Link
                href={`/dashboard/quotes/${invoice.quoteId}`}
                className="text-brand-600 hover:text-brand-700"
              >
                {invoice.quoteNumber}
              </Link>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={setSent}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Mark as Sent
            </button>
          </form>
          <form action={setVoid}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Mark as Void
            </button>
          </form>
          <form action={setPaid}>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
            >
              Mark as Paid
            </button>
          </form>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Payment status</span>
            <span className="tabular-nums text-slate-500">
              {formatCurrency(invoice.amountPaid)} of{" "}
              {formatCurrency(invoice.total)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <LineItemsTable items={invoice.lineItems} />
          <div className="mt-4 flex justify-end">
            <dl className="w-full max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <Row
                label={`Tax (${(invoice.taxRate * 100).toFixed(2)}%)`}
                value={formatCurrency(invoice.taxAmount)}
              />
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="font-semibold tabular-nums text-slate-900">
                  {formatCurrency(invoice.total)}
                </dd>
              </div>
              <Row
                label="Amount paid"
                value={formatCurrency(invoice.amountPaid)}
              />
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Balance due</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {formatCurrency(balanceDue)}
                </dd>
              </div>
            </dl>
          </div>
        </CardBody>
      </Card>

      {invoice.notes ? (
        <Card>
          <CardBody>
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">
              {invoice.notes}
            </p>
          </CardBody>
        </Card>
      ) : null}
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
