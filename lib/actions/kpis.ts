// Server-side data helper for the dashboard KPIs. This is a plain server module
// (not a "use server" action file) — it's read by the /api/kpis route handler
// and could back the overview page too. Values are real counts/sums from the
// database, with graceful fallbacks so the endpoint never hard-fails.

import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { getJobs } from "./jobs";
import { getEquipment } from "./equipment";
import { getCrew } from "./crew";

export interface KpiSummary {
  /** Jobs currently in progress on site. */
  activeJobs: number;
  /** Sum of invoice payments received since Jan 1 of the current year, in USD. */
  revenueYtd: number;
  equipmentUtilization: {
    inUse: number;
    total: number;
    /** inUse / total as a whole-number percentage (0 when the fleet is empty). */
    percent: number;
  };
  /** Crew members currently on site. */
  crewOnSiteToday: number;
}

/** Total invoice payments received so far this calendar year. */
async function revenueYtd(): Promise<number> {
  try {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const paid = await prisma.invoice.aggregate({
      _sum: { amountPaid: true },
      where: { paidAt: { gte: startOfYear } },
    });
    return paid._sum.amountPaid?.toNumber() ?? 0;
  } catch (error) {
    logActionError("revenueYtd", error);
    return 0;
  }
}

/** Headline KPIs for the overview / the /api/kpis endpoint. */
export async function getKpiSummary(): Promise<KpiSummary> {
  const [jobs, equipment, crew, revenue] = await Promise.all([
    getJobs(),
    getEquipment(),
    getCrew(),
    revenueYtd(),
  ]);

  const inUse = equipment.filter((e) => e.status === "in_use").length;
  const total = equipment.length;

  return {
    activeJobs: jobs.filter((job) => job.status === "in_progress").length,
    revenueYtd: revenue,
    equipmentUtilization: {
      inUse,
      total,
      percent: total ? Math.round((inUse / total) * 100) : 0,
    },
    crewOnSiteToday: crew.filter((member) => member.status === "on_site")
      .length,
  };
}
