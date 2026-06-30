"use server";

import { prisma } from "@/lib/prisma";
import { reportsForJob as mockReportsForJob } from "@/lib/mock-reports";
import type { DailyReport, Weather } from "@/lib/types";

/**
 * Daily reports for a job, newest first, in UI shape. Falls back to bundled
 * mock data without a DB. Headcount/temperature are not modeled in the schema,
 * so they are derived for display.
 */
export async function getReportsForJob(jobId: string): Promise<DailyReport[]> {
  try {
    const rows = await prisma.dailyReport.findMany({
      where: { jobId },
      include: { submittedBy: true },
      orderBy: { date: "desc" },
    });

    return rows.map((report) => ({
      id: report.id,
      jobId: report.jobId,
      date: report.date.toISOString().slice(0, 10),
      submittedBy: report.submittedBy.name,
      summary: report.summary,
      weather: (report.weather as Weather) ?? "Clear",
      tempHigh: 80,
      crewCount: Math.max(1, Math.round(report.hoursWorked / 8)),
      hoursWorked: report.hoursWorked,
    }));
  } catch {
    return mockReportsForJob(jobId);
  }
}
