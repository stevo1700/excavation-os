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
import { getJobs } from "@/lib/actions/jobs";
import { getEquipment } from "@/lib/actions/equipment";
import { getKpiSummary } from "@/lib/actions/kpis";
import { getActivity } from "@/lib/actions/activity";
import { getFinancialSummary } from "@/lib/actions/invoices";
import { weeklyRevenue } from "@/lib/data";
import type { Kpi } from "@/lib/types";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";
import { jobColor } from "@/lib/utils";

// Render per-request so the overview reflects live database state.
export const metadata = { title: "Overview" };

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const [kpiSummary, jobs, equipment, activity, finance] = await Promise.all([
    getKpiSummary(),
    getJobs(),
    getEquipment(),
    getActivity(),
    getFinancialSummary(),
  ]);

  const activeJobs = jobs.filter((job) => job.status === "in_progress");
  const inUse = equipment.filter((e) => e.status === "in_use").length;

  // KPI cards are sourced from the shared getKpiSummary() helper — the same
  // data the GET /api/kpis endpoint returns — rather than computed inline, so
  // the dashboard and the API can never drift. The trend percentages are still
  // illustrative (a true trend needs historical snapshots we don't store yet).
  const { equipmentUtilization } = kpiSummary;
  const kpis: Kpi[] = [
    {
      label: "Active jobs",
      value: String(kpiSummary.activeJobs),
      change: 14,
      hint: "in progress on site",
    },
    {
      label: "Equipment in use",
      value: `${equipmentUtilization.inUse} of ${equipmentUtilization.total}`,
      change: 9,
      hint: `${equipmentUtilization.percent}% fleet utilization`,
    },
    {
      label: "Crew on site",
      value: String(kpiSummary.crewOnSiteToday),
      change: 12,
      hint: "on site today",
    },
    {
      label: "Revenue YTD",
      value: formatCompactCurrency(kpiSummary.revenueYtd),
      change: 6,
      hint: "payments received this year",
    },
  ];

  const utilization: UtilizationSlice[] = [
    {
      label: "In use",
      value: inUse,
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
            {formatDate("2026-06-29")}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddCrewModal />
          <AddEquipmentModal />
          <NewJobModal />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FinancialCard
          label="Outstanding"
          value={formatCompactCurrency(finance.outstanding)}
          hint="sent + overdue invoices"
        />
        <FinancialCard
          label="Paid this month"
          value={formatCompactCurrency(finance.paidThisMonth)}
          hint="payments received"
        />
        <FinancialCard
          label="Active quotes"
          value={String(finance.activeQuotes)}
          hint="draft + sent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly revenue"
            description="Billed across all active jobs, trailing eight weeks"
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
            {activeJobs.map((job) => {
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
            })}
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

function FinancialCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
