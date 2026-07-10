import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge, statusTone } from "@/components/ui/badge";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  UtilizationChart,
  type UtilizationSlice,
} from "@/components/dashboard/utilization-chart";
import { NewJobModal } from "@/components/dashboard/new-job-modal";
import { AddEquipmentModal } from "@/components/dashboard/add-equipment-modal";
import { AddCrewModal } from "@/components/dashboard/add-crew-modal";
import { getDashboardData } from "@/lib/actions/dashboard";
import { getBudgetTemplates } from "@/lib/actions/budget-templates";
import { formatCurrency, formatDate, jobColor } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const [{ jobs, equipment, crew, activity, kpis, weeklyRevenue }, budgetTemplates] =
    await Promise.all([getDashboardData(), getBudgetTemplates(true)]);

  const activeJobs = jobs.filter((job) => job.status === "in_progress");

  const utilization: UtilizationSlice[] = [
    {
      label: "In use",
      value: equipment.filter((e) => e.status === "in_use").length,
      color: "#f59e0b",
    },
    {
      label: "Available",
      value: equipment.filter((e) => e.status === "available").length,
      color: "#10b981",
    },
    {
      label: "Maintenance",
      value: equipment.filter((e) => e.status === "maintenance").length,
      color: "#f43f5e",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Operations overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A snapshot across jobs, fleet, and crew — week of{" "}
            {formatDate(new Date().toISOString())}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddCrewModal />
          <AddEquipmentModal />
          <NewJobModal
            budgetTemplates={budgetTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              lineCount: t.lineCount,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly revenue"
            description="Estimated from active job run-rates, trailing eight weeks"
          />
          <CardBody>
            <RevenueChart data={weeklyRevenue} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fleet utilization" />
          <CardBody>
            <UtilizationChart data={utilization} />
          </CardBody>
        </Card>
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
          <CardBody className="space-y-1">
            {activeJobs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No active jobs — create one to get started.
              </p>
            ) : (
              activeJobs.map((job) => {
                const c = jobColor(job.color);
                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`h-8 w-1.5 shrink-0 rounded-full ${c.dot}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {job.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {job.client} · {job.foreman}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <ProgressBar value={job.progress} />
                    </div>
                  </Link>
                );
              })
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardBody>
            <ActivityFeed items={activity} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Pipeline value"
          description="Signed contracts by status"
        />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["in_progress", "scheduled", "on_hold", "completed"] as const).map(
            (status) => {
              const matching = jobs.filter((job) => job.status === status);
              const total = matching.reduce((sum, job) => sum + job.value, 0);
              return (
                <div
                  key={status}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone={statusTone(status)} label={status} />
                    <span className="text-xs text-slate-400">
                      {matching.length} jobs
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tabular-nums text-slate-900">
                    {formatCurrency(total)}
                  </p>
                </div>
              );
            },
          )}
        </CardBody>
      </Card>
    </div>
  );
}
