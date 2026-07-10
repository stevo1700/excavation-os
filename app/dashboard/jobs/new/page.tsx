import { PageHeader } from "@/components/layout/page-header";
import { JobForm } from "@/components/jobs/job-form";
import { createJob } from "@/lib/actions/jobs";
import { getCustomer } from "@/lib/actions/customers";
import { getBudgetTemplates } from "@/lib/actions/budget-templates";

export const metadata = { title: "New Job" };
export const dynamic = "force-dynamic";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams?: { customerId?: string };
}) {
  const customerId = searchParams?.customerId;
  let defaults: {
    client?: string;
    siteAddress?: string;
    customerId?: string;
  } = {};

  if (customerId) {
    const customer = await getCustomer(customerId);
    if (customer) {
      defaults = {
        customerId: customer.id,
        client: customer.name,
        siteAddress: customer.address ?? undefined,
      };
    }
  }

  const budgetTemplates = await getBudgetTemplates(true);

  return (
    <div>
      <PageHeader
        title="New job"
        description={
          defaults.client
            ? `Creating job for ${defaults.client}`
            : "Set up a new job site and add it to the schedule."
        }
      />

      <JobForm
        action={createJob}
        defaults={defaults}
        budgetTemplates={budgetTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          lineCount: t.lineCount,
        }))}
        submitLabel="Create job"
        cancelHref={
          customerId
            ? `/dashboard/customers/${customerId}`
            : "/dashboard/jobs"
        }
      />
    </div>
  );
}
