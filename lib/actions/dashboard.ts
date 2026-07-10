"use server";

import { getJobs } from "./jobs";
import { getEquipment } from "./equipment";
import { getCrew } from "./crew";
import { getActivity } from "./activity";
import { weeklyRevenue as mockRevenue } from "@/lib/data";
import type { Job, Kpi, RevenuePoint } from "@/lib/types";

// ---------------------------------------------------------------------------
// Dashboard data – all live / DB-backed with transparent mock fallback.
// ---------------------------------------------------------------------------

export interface DashboardData {
  jobs: Job[];
  equipment: Awaited<ReturnType<typeof getEquipment>>;
  crew: Awaited<ReturnType<typeof getCrew>>;
  activity: Awaited<ReturnType<typeof getActivity>>;
  kpis: Kpi[];
  weeklyRevenue: RevenuePoint[];
}

/**
 * Compute KPIs from the actual job / equipment / crew arrays so every number
 * is live, not a hardcoded string like "5" or "7 of 10".
 */
function computeKpis(
  jobs: Job[],
  equipment: Awaited<ReturnType<typeof getEquipment>>,
  crew: Awaited<ReturnType<typeof getCrew>>,
): Kpi[] {
  // --- Active jobs ----------------------------------------------------------
  const activeCount = jobs.filter((j) => j.status === "in_progress").length;

  // --- Fleet utilisation ----------------------------------------------------
  const inUse = equipment.filter((e) => e.status === "in_use").length;
  const fleetTotal = equipment.length;

  // --- Crew on site ---------------------------------------------------------
  const onSite = crew.filter((c) => c.status === "on_site").length;
  const crewTotal = crew.length;

  // --- This week revenue (best-effort approximation) ------------------------
  // Spread each active job's value evenly over its duration, then sum the
  // share that falls in the current week. When job dates are missing or the
  // calculation yields zero we fall back to dividing the active pipeline by
  // the number of active jobs as a rough weekly run-rate.
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  let weeklyRevenue = 0;

  for (const job of jobs) {
    if (job.status !== "in_progress" && job.status !== "completed") continue;

    const start = new Date(job.startDate);
    const end = new Date(job.dueDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
      continue;

    const totalDays = (end.getTime() - start.getTime()) / 86_400_000;
    if (totalDays <= 0) continue;

    // Overlap between the job window and [weekAgo, now]
    const overlapStart = start > weekAgo ? start : weekAgo;
    const overlapEnd = end < now ? end : now;
    const overlapDays =
      (overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000;

    if (overlapDays > 0) {
      weeklyRevenue += (job.value / totalDays) * overlapDays;
    }
  }

  // Fallback: if no date-based calculation produced a value, use the active
  // pipeline average (still derived from live data).
  if (weeklyRevenue === 0) {
    const activeJobs = jobs.filter((j) => j.status === "in_progress");
    const totalActive = activeJobs.reduce((sum, j) => sum + j.value, 0);
    weeklyRevenue = activeJobs.length > 0 ? totalActive / activeJobs.length : 0;
  }

  const weeklyLabel =
    weeklyRevenue >= 1_000_000
      ? `$${(weeklyRevenue / 1_000_000).toFixed(1)}M`
      : weeklyRevenue >= 1_000
        ? `$${Math.round(weeklyRevenue / 1_000)}K`
        : `$${Math.round(weeklyRevenue)}`;

  return [
    {
      label: "Active jobs",
      value: String(activeCount),
      change: 0,
      hint: "currently in progress",
    },
    {
      label: "Equipment in use",
      value: `${inUse} of ${fleetTotal}`,
      change: 0,
      hint: fleetTotal > 0
        ? `fleet utilisation`
        : "no equipment",
    },
    {
      label: "Crew on site",
      value: String(onSite),
      change: 0,
      hint: crewTotal > 0 ? `of ${crewTotal} total` : "no crew",
    },
    {
      label: "This week revenue",
      value: weeklyLabel,
      change: 0,
      hint: "estimated run-rate",
    },
  ];
}

// ---------------------------------------------------------------------------
// Weekly revenue — DB-backed approximation, mock fallback.
// ---------------------------------------------------------------------------

/**
 * Build a trailing-8-week revenue series from job data. Each active or recently
 * completed job's value is spread evenly across its duration, then summed by
 * calendar week. When the DB returns no jobs (or dates are missing) the bundled
 * mock data is used instead.
 */
function computeWeeklyRevenue(jobs: Job[]): RevenuePoint[] | null {
  if (jobs.length === 0) return null;

  const now = new Date();
  // 8 weeks back, snapped to the Monday of that week for clean buckets.
  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  // Build buckets: one per week (Mon–Sun)
  const buckets: { start: Date; label: string; total: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const mon = new Date(eightWeeksAgo);
    mon.setDate(mon.getDate() + i * 7);
    // label: "Jun 16"
    const label = mon.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.push({ start: mon, label, total: 0 });
  }

  let anyMatch = false;

  for (const job of jobs) {
    if (!job.startDate || !job.dueDate) continue;
    const start = new Date(job.startDate);
    const end = new Date(job.dueDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start)
      continue;

    const totalDays = (end.getTime() - start.getTime()) / 86_400_000;
    if (totalDays <= 0) continue;
    const dailyValue = job.value / totalDays;

    for (const bucket of buckets) {
      const bucketEnd = new Date(bucket.start);
      bucketEnd.setDate(bucketEnd.getDate() + 7);

      const overlapStart = start > bucket.start ? start : bucket.start;
      const overlapEnd = end < bucketEnd ? end : bucketEnd;
      const overlapDays =
        (overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000;

      if (overlapDays > 0) {
        bucket.total += dailyValue * overlapDays;
        anyMatch = true;
      }
    }
  }

  if (!anyMatch) return null;

  return buckets.map((b) => ({
    week: b.label,
    revenue: Math.round(b.total),
  }));
}

// ---------------------------------------------------------------------------
// Public action
// ---------------------------------------------------------------------------

/**
 * Fetch all dashboard data in one call. KPIs and weekly revenue are derived
 * from the live job/equipment/crew arrays returned by the DB (or the bundled
 * mock data when no database is reachable).
 */
export async function getDashboardData(): Promise<DashboardData> {
  const [jobs, equipment, crew, activity] = await Promise.all([
    getJobs(),
    getEquipment(),
    getCrew(),
    getActivity(8),
  ]);

  const kpis = computeKpis(jobs, equipment, crew);
  const revenue = computeWeeklyRevenue(jobs) ?? mockRevenue;

  return { jobs, equipment, crew, activity, kpis, weeklyRevenue: revenue };
}
