"use server";

import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { getJob } from "@/lib/actions/jobs";
import { getJobAssignments, type JobAssignmentView } from "@/lib/actions/assignments";
import { getJobBudget, type JobBudgetSnapshot } from "@/lib/actions/budget";
import type { Job } from "@/lib/types";

export interface JobFinancialSnapshot {
  contractValue: number;
  budgetTotal: number;
  actualTotal: number;
  budgetVariance: number;
  quotedTotal: number;
  invoicedTotal: number;
  paidTotal: number;
  outstanding: number;
  laborHours: number;
  activeCrew: number;
  activeEquipment: number;
  reportCount: number;
  quoteCount: number;
  invoiceCount: number;
}

export interface JobHubCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface JobHubData {
  job: Job;
  customer: JobHubCustomer | null;
  financials: JobFinancialSnapshot;
  assignments: JobAssignmentView[];
  availableCrew: { id: string; name: string; role: string }[];
  availableEquipment: { id: string; name: string; assetTag: string }[];
  budget: JobBudgetSnapshot;
}

function money(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

/** Full job hub payload: detail + money + assignment ledger + assignable people/machines. */
export async function getJobHub(jobId: string): Promise<JobHubData | null> {
  const job = await getJob(jobId);
  if (!job) return null;

  try {
    const [
      dbJob,
      quotes,
      invoices,
      timesheets,
      reportsCount,
      assignments,
      budget,
      crewPool,
      equipPool,
    ] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId },
        include: { customer: true },
      }),
      prisma.quote.findMany({ where: { jobId } }),
      prisma.invoice.findMany({ where: { jobId } }),
      prisma.timesheetEntry.findMany({ where: { jobId } }),
      prisma.dailyReport.count({ where: { jobId } }),
      getJobAssignments(jobId),
      getJobBudget(jobId),
      prisma.crewMember.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      prisma.equipment.findMany({ orderBy: { name: "asc" } }),
    ]);

    const quotedTotal = quotes
      .filter((q) => {
        const s = q.status.toUpperCase();
        return s !== "REJECTED" && s !== "CANCELLED" && s !== "EXPIRED";
      })
      .reduce((sum, q) => sum + money(q.total), 0);

    // Prefer approved/sent quotes for "quoted" if any; else all non-rejected
    const approvedQuotes = quotes.filter((q) =>
      ["APPROVED", "ACCEPTED", "SENT"].includes(q.status.toUpperCase()),
    );
    const quoted =
      approvedQuotes.length > 0
        ? approvedQuotes.reduce((sum, q) => sum + money(q.total), 0)
        : quotedTotal;

    const invoicedTotal = invoices.reduce((sum, inv) => sum + money(inv.total), 0);
    const paidTotal = invoices.reduce((sum, inv) => sum + money(inv.amountPaid), 0);
    const outstanding = Math.max(0, invoicedTotal - paidTotal);

    const laborHours = timesheets.reduce(
      (sum, entry) => sum + money(entry.hoursWorked),
      0,
    );

    const activeCrew = assignments.filter(
      (a) => a.isActive && a.resourceType === "CREW",
    ).length;
    const activeEquipment = assignments.filter(
      (a) => a.isActive && a.resourceType === "EQUIPMENT",
    ).length;

    // People/machines not already on an open assignment for this job
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

    return {
      job,
      customer: dbJob?.customer
        ? {
            id: dbJob.customer.id,
            name: dbJob.customer.name,
            phone: dbJob.customer.phone,
            email: dbJob.customer.email,
          }
        : null,
      financials: {
        contractValue: job.value,
        budgetTotal: budget.budgetTotal,
        actualTotal: budget.actualTotal,
        budgetVariance: budget.variance,
        quotedTotal: quoted,
        invoicedTotal,
        paidTotal,
        outstanding,
        laborHours,
        activeCrew,
        activeEquipment,
        reportCount: reportsCount,
        quoteCount: quotes.length,
        invoiceCount: invoices.length,
      },
      assignments,
      availableCrew: crewPool
        .filter((c) => !activeCrewIds.has(c.id))
        .map((c) => ({ id: c.id, name: c.name, role: c.role })),
      budget,
      availableEquipment: equipPool
        .filter((e) => !activeEquipIds.has(e.id))
        .map((e) => ({
          id: e.id,
          name: e.name,
          assetTag: e.assetTag,
        })),
    };
  } catch (error) {
    logActionError("getJobHub", error);
    return {
      job,
      customer: null,
      financials: {
        contractValue: job.value,
        budgetTotal: 0,
        actualTotal: 0,
        budgetVariance: 0,
        quotedTotal: 0,
        invoicedTotal: 0,
        paidTotal: 0,
        outstanding: 0,
        laborHours: 0,
        activeCrew: 0,
        activeEquipment: 0,
        reportCount: 0,
        quoteCount: 0,
        invoiceCount: 0,
      },
      assignments: [],
      availableCrew: [],
      availableEquipment: [],
      budget: {
        lines: [],
        byCategory: [],
        budgetTotal: 0,
        actualTotal: 0,
        quotedTotal: 0,
        invoicedTotal: 0,
        variance: 0,
        percentUsed: null,
        lineCount: 0,
      },
    };
  }
}

