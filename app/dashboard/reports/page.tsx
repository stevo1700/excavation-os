import Link from "next/link";
import { FilePlus2, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getReports } from "@/lib/actions/reports";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reports" };

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div>
      <PageHeader
        title="Daily reports"
        description={`${reports.length} field reports across all jobs`}
        action={
          <Link
            href="/dashboard/reports/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <FilePlus2 className="h-4 w-4" />
            File Report
          </Link>
        }
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports filed yet"
          description="File a daily report to capture site conditions, crew hours, and progress."
          action={
            <Link
              href="/dashboard/reports/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
            >
              <FilePlus2 className="h-4 w-4" />
              File Report
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardBody className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {report.jobName}
                  </p>
                  <span className="text-xs text-slate-500">
                    {formatDate(report.date)} · {report.weather}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm text-slate-600">
                  {report.summary}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>Submitted by {report.submittedBy}</span>
                  <span>{report.crewCount} crew</span>
                  <span>{report.hoursWorked} crew-hours</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
