import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2, Pencil } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { JobDetailTabs } from "@/components/jobs/job-detail-tabs";
import { PortalShare } from "@/components/jobs/portal-share";
import { getJob } from "@/lib/actions/jobs";
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
  const job = await getJob(params.id);
  if (!job) notFound();

  const [crew, equipment, reports, timesheets, quotes, invoices] =
    await Promise.all([
      getCrew(),
      getEquipment(),
      getReportsForJob(job.id),
      getTimesheetEntries({ jobId: job.id }),
      getQuotes({ jobId: job.id }),
      getInvoices({ jobId: job.id }),
    ]);

  const jobCrew = crew.filter((member) => member.assignedJob === job.id);
  const jobEquipment = equipment.filter(
    (machine) => machine.assignedJob === job.id,
  );
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/reports/new?jobId=${job.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <FilePlus2 className="h-4 w-4" />
            File Daily Report
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

      <div className="mb-6">
        <PortalShare jobId={job.id} />
      </div>

      {quotes.length > 0 || invoices.length > 0 ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {quotes.length > 0 ? (
            <Card>
              <CardHeader
                title="Quotes"
                description={`${quotes.length} linked`}
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
