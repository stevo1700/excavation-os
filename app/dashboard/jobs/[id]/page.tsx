import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { JobWorkspace } from "@/components/jobs/job-workspace";
import { getJobHub } from "@/lib/actions/job-hub";
import { getCrew } from "@/lib/actions/crew";
import { getEquipment } from "@/lib/actions/equipment";
import { getReportsForJob } from "@/lib/actions/reports";
import { getTimesheetEntries } from "@/lib/actions/timesheets";
import { getQuotes } from "@/lib/actions/quotes";
import { getInvoices } from "@/lib/actions/invoices";
import { getCatalogItems } from "@/lib/actions/catalog-items";
import {
  getContractTemplates,
  getJobContracts,
} from "@/lib/actions/contracts";
import { getJobTasks } from "@/lib/actions/tasks";
import { getBudgetTemplates } from "@/lib/actions/budget-templates";

export const metadata = { title: "Job Details" };
export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hub = await getJobHub(params.id);
  if (!hub) notFound();

  const {
    job,
    customer,
    financials,
    assignments,
    availableCrew,
    availableEquipment,
    budget,
  } = hub;

  const [
    crew,
    equipment,
    reports,
    timesheets,
    quotes,
    invoices,
    catalogItems,
    contractTemplates,
    jobContracts,
    tasks,
    budgetTemplates,
  ] = await Promise.all([
    getCrew(),
    getEquipment(),
    getReportsForJob(job.id),
    getTimesheetEntries({ jobId: job.id }),
    getQuotes({ jobId: job.id }),
    getInvoices({ jobId: job.id }),
    getCatalogItems({ activeOnly: true }),
    getContractTemplates(true),
    getJobContracts(job.id),
    getJobTasks(job.id),
    getBudgetTemplates(true),
  ]);

  const activeCrewIds = new Set(
    assignments
      .filter((a) => a.isActive && a.resourceType === "CREW")
      .map((a) => a.resourceId),
  );
  const activeEquipIds = new Set(
    assignments
      .filter((a) => a.isActive && a.resourceType === "EQUIPMENT")
      .map((a) => a.resourceId),
  );

  const jobCrew =
    activeCrewIds.size > 0
      ? crew.filter((member) => activeCrewIds.has(member.id))
      : crew.filter((member) => member.assignedJob === job.id);
  const jobEquipment =
    activeEquipIds.size > 0
      ? equipment.filter((machine) => activeEquipIds.has(machine.id))
      : equipment.filter((machine) => machine.assignedJob === job.id);

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <JobWorkspace
        job={job}
        customer={customer}
        financials={financials}
        budget={budget}
        catalogItems={catalogItems}
        budgetTemplates={budgetTemplates}
        quotes={quotes.map((q) => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          status: q.status,
          total: q.total,
        }))}
        invoices={invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          total: inv.total,
        }))}
        assignments={assignments}
        availableCrew={availableCrew}
        availableEquipment={availableEquipment}
        jobCrew={jobCrew}
        jobEquipment={jobEquipment}
        reports={reports}
        timesheets={timesheets}
        contracts={jobContracts}
        templates={contractTemplates}
        tasks={tasks}
      />
    </div>
  );
}
