import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { crew, equipment, jobs, kpis } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const activeJobs = jobs
    .filter((job) => job.status === "in_progress")
    .slice(0, 4);

  const utilization = {
    inUse: equipment.filter((e) => e.status === "in_use").length,
    total: equipment.length,
  };

  const onSite = crew.filter((c) => c.status === "on_site").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Operations overview
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          A snapshot across jobs, fleet, and crew — refreshed for the week of{" "}
          {formatDate("2026-06-29")}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Active jobs"
            description="Currently in progress on site"
            action={
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <CardBody className="space-y-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {job.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {job.client} · {job.foreman}
                  </p>
                </div>
                <ProgressBar value={job.progress} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="At a glance" />
          <CardBody className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Equipment in use</span>
              <span className="font-medium text-slate-900">
                {utilization.inUse} / {utilization.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Crew on site</span>
              <span className="font-medium text-slate-900">{onSite}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Scheduled jobs</span>
              <span className="font-medium text-slate-900">
                {jobs.filter((j) => j.status === "scheduled").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">On hold</span>
              <Badge tone={statusTone("on_hold")} label="on_hold" />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
