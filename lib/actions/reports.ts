"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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
  summary: string;
  weather: string | null;
  hoursWorked: number;
  submittedBy: { name: string };
}): DailyReport {
  return {
    id: report.id,
    jobId: report.jobId,
    date: report.date.toISOString().slice(0, 10),
    submittedBy: report.submittedBy.name,
    summary: report.summary,
    weather: (report.weather as Weather) ?? "Clear",
    // Temperature/headcount are not modeled in the schema; derive for display.
    tempHigh: 80,
    crewCount: Math.max(1, Math.round(report.hoursWorked / 8)),
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
      include: { submittedBy: true },
      orderBy: { date: "desc" },
    });
    return rows.map(toUiReport);
  } catch {
    return mockReportsForJob(jobId);
  }
}

/** All daily reports across every job, newest first. */
export async function getReports(): Promise<DailyReportListItem[]> {
  try {
    const rows = await prisma.dailyReport.findMany({
      include: { submittedBy: true, job: true },
      orderBy: { date: "desc" },
    });
    return rows.map((report) => ({
      ...toUiReport(report),
      jobName: report.job.name,
    }));
  } catch {
    const jobName = new Map(mockJobs.map((job) => [job.id, job.name]));
    return [...mockReports]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((report) => ({
        ...report,
        jobName: jobName.get(report.jobId) ?? report.jobId,
      }));
  }
}

// --- submitter resolution -----------------------------------------------------

// Attribute a report to the signed-in Clerk user (creating a matching User row
// on first use), falling back to any existing user when Clerk is unavailable.
async function resolveSubmitterId(): Promise<string> {
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
  const workPerformed = field(formData, "summary");

  // The schema stores a single summary; fold the richer form fields into it.
  const sections = [workPerformed];
  const equipmentUsed = field(formData, "equipmentUsed");
  const issues = field(formData, "issues");
  const safety = field(formData, "safetyNotes");
  const crewCount = field(formData, "crewCount");
  if (equipmentUsed) sections.push(`Equipment used: ${equipmentUsed}`);
  if (issues) sections.push(`Issues / delays: ${issues}`);
  if (safety) sections.push(`Safety: ${safety}`);
  if (crewCount) sections.push(`Crew on site: ${crewCount}`);

  const hours = Number.parseInt(field(formData, "hoursWorked"), 10);
  const dateValue = field(formData, "date");
  const submittedById = await resolveSubmitterId();

  await prisma.dailyReport.create({
    data: {
      jobId,
      submittedById,
      date: dateValue ? new Date(dateValue) : new Date(),
      weather: field(formData, "weather") || null,
      summary: sections.filter(Boolean).join("\n\n"),
      hoursWorked: Number.isFinite(hours) ? hours : 0,
    },
  });

  revalidatePath("/dashboard/reports");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  redirect("/dashboard/reports");
}
