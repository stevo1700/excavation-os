"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Create a shareable client-portal token for a job and return the raw token.
 * The token is a random slug; anyone with the link can view (no auth).
 */
export async function generatePortalToken(jobId: string): Promise<string> {
  const token = crypto.randomUUID();
  await prisma.clientPortalToken.create({ data: { jobId, token } });
  revalidatePath(`/dashboard/jobs/${jobId}`);
  return token;
}

export interface PortalReport {
  id: string;
  date: string;
  weather: string | null;
  summary: string;
  crewCount: number;
}

export interface PortalData {
  job: {
    id: string;
    name: string;
    client: string;
    status: string;
    siteAddress: string;
    startDate: string | null;
    estCompletion: string | null;
  };
  reports: PortalReport[];
  totalHours: number;
}

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/**
 * Read-only job data for a client portal token. Returns null when the token is
 * unknown, expired, or the database is unreachable.
 */
export async function getPortalData(token: string): Promise<PortalData | null> {
  try {
    const record = await prisma.clientPortalToken.findUnique({
      where: { token },
      include: {
        job: {
          include: {
            dailyReports: { orderBy: { date: "desc" } },
            timesheetEntries: true,
          },
        },
      },
    });

    if (!record) return null;
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      return null;
    }

    const job = record.job;
    const totalHours = job.timesheetEntries.reduce(
      (sum, entry) => sum + entry.hoursWorked.toNumber(),
      0,
    );

    return {
      job: {
        id: job.id,
        name: job.name,
        client: job.client,
        status: statusLabel(job.status),
        siteAddress:
          [job.address, job.city, job.state].filter(Boolean).join(", ") || "—",
        startDate: isoOrNull(job.startDate),
        estCompletion: isoOrNull(job.endDate),
      },
      reports: job.dailyReports.map((report) => ({
        id: report.id,
        date: report.date.toISOString().slice(0, 10),
        weather: report.weather,
        summary: report.workPerformed,
        crewCount:
          report.crewCount ?? Math.max(1, Math.round(report.hoursWorked / 8)),
      })),
      totalHours,
    };
  } catch {
    return null;
  }
}
