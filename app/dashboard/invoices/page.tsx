import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { InvoicesList } from "@/components/finance/invoices-list";
import { getInvoices } from "@/lib/actions/invoices";

export const metadata = { title: "Invoices" };

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices.length} invoices`}
        action={
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        }
      />

      <InvoicesList invoices={invoices} />
    </div>
  );
}
