import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Pencil, Phone, User } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { CustomerTabs } from "@/components/customers/customer-tabs";
import { getCustomer } from "@/lib/actions/customers";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Customer Details" };

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const { summary } = customer;

  return (
    <div>
      <Link
        href="/dashboard/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <PageHeader
        title={customer.name}
        description={
          [customer.contactName, customer.company]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        action={
          <Link
            href={`/dashboard/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total jobs" value={String(summary.totalJobs)} />
        <SummaryCard
          label="Contract value"
          value={formatCurrency(summary.totalValue)}
        />
        <SummaryCard
          label="Total invoiced"
          value={formatCurrency(summary.totalInvoiced)}
        />
        <SummaryCard
          label="Total paid"
          value={formatCurrency(summary.totalPaid)}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardBody className="space-y-2.5 text-sm">
            <ContactRow icon={User} value={customer.contactName} />
            <ContactRow icon={Mail} value={customer.email} />
            <ContactRow icon={Phone} value={customer.phone} />
            <ContactRow icon={MapPin} value={customer.address} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardBody>
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">
              {customer.notes ?? "No notes recorded."}
            </p>
          </CardBody>
        </Card>
      </div>

      <CustomerTabs
        jobs={customer.jobs}
        quotes={customer.quotes}
        invoices={customer.invoices}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
}: {
  icon: typeof User;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5 text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span>{value ?? "—"}</span>
    </div>
  );
}
