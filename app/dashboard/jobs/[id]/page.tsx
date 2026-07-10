import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FilePlus2,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { JobAssignmentsPanel } from "@/components/jobs/job-assignments-panel";
import { JobDetailTabs } from "@/components/jobs/job-detail-tabs";
import { JobFinancialStrip } from "@/components/jobs/job-financial-strip";
import { PortalShare } from "@/components/jobs/portal-share";
import { getJobHub } from "@/lib/actions/job-hub";
import { getCrew } from "@/lib/actions/crew";
import { getEquipment } from "@/lib/actions/equipment";
import { getReportsForJob } from "@/lib/actions/reports";
import { getTimesheetEntries } from "@/lib/actions/timesheets";
import { getQuotes } from "@/lib/actions/quotes";
import { getInvoices } from "@/lib/actions/invoices";
import { formatCurrency, jobColor } from "@/lib/utils";

// Render per-request so the detail reflects live database state.
export const metadata = { title: "Job Details" };

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hub = await getJobHub(params.id);
  if (!hub) notFound();

  const { job, customer, financials, assignments, availableCrew, availableEquipment } =
    hub;

  const [crew, equipment, reports, timesheets, quotes, invoices] =
    await Promise.all([
      getCrew(),
      getEquipment(),
      getReportsForJob(job.id),
      getTimesheetEntries({ jobId: job.id }),
      getQuotes({ jobId: job.id }),
      getInvoices({ jobId: job.id }),
    ]);

  // Prefer active assignment ledger; fall back to live jobId pointers.
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
  const c = jobColor(job.color);

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-9 w-1.5 shrink-0 rounded-full ${c.dot}`} />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {job.name}
              </h2>
              <Badge tone={statusTone(job.status)} label={job.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {job.id} · {job.client} · {job.site}
            </p>
            {customer ? (
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                <UserRound className="h-3.5 w-3.5" />
                {customer.name}
                {customer.phone ? ` · ${customer.phone}` : ""}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/quotes/new?jobId=${job.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Quote
          </Link>
          <Link
            href={`/dashboard/invoices/new?jobId=${job.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Invoice
          </Link>
          <Link
            href={`/dashboard/reports/new?jobId=${job.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <FilePlus2 className="h-4 w-4" />
            Daily Report
          </Link>
          <Link
            href={`/dashboard/jobs/${job.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <Pencil className="h-4 w-4" />
            Edit Job
          </Link>
        </div>
      </div>

      <JobFinancialStrip jobId={job.id} financials={financials} />

      <div className="mb-6">
        <PortalShare jobId={job.id} />
      </div>

      <div className="mb-8">
        <JobAssignmentsPanel
          jobId={job.id}
          assignments={assignments}
          availableCrew={availableCrew}
          availableEquipment={availableEquipment}
        />
      </div>

      {quotes.length > 0 || invoices.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {quotes.length > 0 ? (
            <Card>
              <CardHeader
                title="Quotes"
                description={`${quotes.length} linked`}
                action={
                  <Link
                    href={`/dashboard/quotes/new?jobId=${job.id}`}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    New
                  </Link>
                }
              />
              <ul className="divide-y divide-slate-100">
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">
                        {quote.quoteNumber}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-slate-500">
                          {formatCurrency(quote.total)}
                        </span>
                        <FinanceStatusBadge status={quote.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {invoices.length > 0 ? (
            <Card>
              <CardHeader
                title="Invoices"
                description={`${invoices.length} linked`}
                action={
                  <Link
                    href={`/dashboard/invoices/new?jobId=${job.id}`}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    New
                  </Link>
                }
              />
              <ul className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums text-slate-500">
                          {formatCurrency(invoice.total)}
                        </span>
                        <FinanceStatusBadge status={invoice.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}

      <JobDetailTabs
        job={job}
        crew={jobCrew}
        equipment={jobEquipment}
        reports={reports}
        timesheets={timesheets}
      />
    </div>
  );
}
