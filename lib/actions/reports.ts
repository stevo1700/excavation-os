"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { jobs as mockJobs } from "@/lib/data";
import {
  dailyReports as mockReports,
  reportsForJob as mockReportsForJob,
} from "@/lib/mock-reports";
import type { DailyReport, Weather } from "@/lib/types";

/** A daily report plus its job name, for the all-reports list view. */
export interface DailyReportListItem extends DailyReport {
  jobName: string;
}

function toUiReport(report: {
  id: string;
  jobId: string;
  date: Date;
  workPerformed: string;
  weather: string | null;
  temperature: number | null;
  crewCount: number | null;
  hoursWorked: number;
  author: { name: string };
}): DailyReport {
  return {
    id: report.id,
    jobId: report.jobId,
    date: report.date.toISOString().slice(0, 10),
    submittedBy: report.author.name,
    summary: report.workPerformed,
    weather: (report.weather as Weather) ?? "Clear",
    tempHigh: report.temperature ?? 80,
    crewCount:
      report.crewCount ?? Math.max(1, Math.round(report.hoursWorked / 8)),
    hoursWorked: report.hoursWorked,
  };
}

/**
 * Daily reports for a job, newest first, in UI shape. Falls back to bundled
 * mock data without a DB.
 */
export async function getReportsForJob(jobId: string): Promise<DailyReport[]> {
  try {
    const rows = await prisma.dailyReport.findMany({
      where: { jobId },
      include: { author: true },
      orderBy: { date: "desc" },
    });
    return rows.map(toUiReport);
  } catch (error) {
    logActionError("getReportsForJob", error);
    return mockReportsForJob(jobId);
  }
}

/** All daily reports across every job, newest first. */
export async function getReports(): Promise<DailyReportListItem[]> {
  try {
    const rows = await prisma.dailyReport.findMany({
      include: { author: true, job: true },
      orderBy: { date: "desc" },
    });
    return rows.map((report) => ({
      ...toUiReport(report),
      jobName: report.job.name,
    }));
  } catch (error) {
    logActionError("getReports", error);
    const jobName = new Map(mockJobs.map((job) => [job.id, job.name]));
    return [...mockReports]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((report) => ({
        ...report,
        jobName: jobName.get(report.jobId) ?? report.jobId,
      }));
  }
}

// Attribute a report to the signed-in Clerk user (creating a matching User row
// on first use), falling back to any existing user when Clerk is unavailable.
async function resolveAuthorId(): Promise<string> {
  try {
    const user = await currentUser();
    if (user) {
      const email =
        user.emailAddresses[0]?.emailAddress ?? `${user.id}@users.noreply`;
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "User";
      const dbUser = await prisma.user.upsert({
        where: { clerkId: user.id },
        update: {},
        create: { clerkId: user.id, name, email, role: "ADMIN" },
      });
      return dbUser.id;
    }
  } catch {
    // fall through to the default below
  }

  const fallback = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) {
    throw new Error("No users available to attribute the report to.");
  }
  return fallback.id;
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** File a daily report against a job, then redirect to the reports list. */
export async function createDailyReport(formData: FormData): Promise<void> {
  const jobId = field(formData, "jobId");

  // Equipment used / issues have no dedicated columns; fold them into the
  // work-performed narrative.
  const sections = [field(formData, "summary")];
  const equipmentUsed = field(formData, "equipmentUsed");
  const issues = field(formData, "issues");
  if (equipmentUsed) sections.push(`Equipment used: ${equipmentUsed}`);
  if (issues) sections.push(`Issues / delays: ${issues}`);

  const hours = Number.parseFloat(field(formData, "hoursWorked"));
  const crew = Number.parseInt(field(formData, "crewCount"), 10);
  const dateValue = field(formData, "date");
  const authorId = await resolveAuthorId();

  await prisma.dailyReport.create({
    data: {
      jobId,
      authorId,
      date: dateValue ? new Date(dateValue) : new Date(),
      weather: field(formData, "weather") || null,
      workPerformed: sections.filter(Boolean).join("\n\n"),
      hoursWorked: Number.isFinite(hours) ? hours : 0,
      crewCount: Number.isFinite(crew) ? crew : null,
      safetyNotes: field(formData, "safetyNotes") || null,
    },
  });

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  redirect("/dashboard/reports");
}
