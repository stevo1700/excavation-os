import { PageHeader } from "@/components/layout/page-header";
import { QuoteForm } from "@/components/finance/quote-form";
import { createQuote, getJobOptions } from "@/lib/actions/quotes";
import { getCustomers } from "@/lib/actions/customers";

export const metadata = { title: "New Quote" };

export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: { jobId?: string };
}) {
  const [jobs, customers] = await Promise.all([
    getJobOptions(),
    getCustomers(),
  ]);

  return (
    <div>
      <PageHeader
        title="New quote"
        description="Build a quote with line items and tax."
      />
      <QuoteForm
        jobs={jobs}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        defaultJobId={searchParams.jobId}
        action={createQuote}
      />
    </div>
  );
}
