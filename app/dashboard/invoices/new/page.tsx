import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";
import { createInvoice } from "@/lib/actions/invoices";
import { getJobOptions, getQuoteOptions } from "@/lib/actions/quotes";
import { getCustomers } from "@/lib/actions/customers";

export const metadata = { title: "New Invoice" };

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [jobs, customers, quotes] = await Promise.all([
    getJobOptions(),
    getCustomers(),
    getQuoteOptions(),
  ]);

  return (
    <div>
      <PageHeader
        title="New invoice"
        description="Bill a customer for a job with line items and tax."
      />
      <InvoiceForm
        jobs={jobs}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        quotes={quotes}
        action={createInvoice}
      />
    </div>
  );
}
