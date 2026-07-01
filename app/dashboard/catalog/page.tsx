import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { getCatalogOverview } from "@/lib/actions/catalog-overview";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Catalog" };

export const dynamic = "force-dynamic";

export default async function CatalogOverviewPage() {
  const overview = await getCatalogOverview();

  const cards = [
    {
      label: "Open quotes",
      value: formatCurrency(overview.openQuotesValue),
      hint: "draft + sent",
    },
    {
      label: "Outstanding invoices",
      value: formatCurrency(overview.outstandingInvoices),
      hint: "sent, partial, or overdue",
    },
    {
      label: "Received this month",
      value: formatCurrency(overview.receivedThisMonth),
      hint: "payments recorded",
    },
    {
      label: "Customers",
      value: String(overview.customerCount),
      hint: "total on file",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Quotes, invoices, customers, and the reusable item library — nothing is a dead end."
        action={
          <Link
            href="/dashboard/catalog/items"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <BookOpen className="h-4 w-4" />
            Item library
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/dashboard/customers"
          title="Customers"
          description="CRM pipeline, jobs, quotes, and invoices per customer"
        />
        <QuickLink
          href="/dashboard/quotes"
          title="Quotes"
          description="Draft, send, approve, and convert quotes to invoices"
        />
        <QuickLink
          href="/dashboard/invoices"
          title="Invoices"
          description="Track balances and record payments as they come in"
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-brand-300">
        <CardBody className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
        </CardBody>
      </Card>
    </Link>
  );
}
