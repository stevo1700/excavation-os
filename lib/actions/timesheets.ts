"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** A timesheet entry flattened for display (crew + job names resolved). */
export interface TimesheetEntryView {
  id: string;
  date: string;
  crewMemberId: string;
  crewMemberName: string;
  jobId: string;
  jobName: string;
  hoursWorked: number;
  notes: string | null;
}

export interface TimesheetFilters {
  jobId?: string;
  crewMemberId?: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  from?: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  to?: string;
}

/**
 * Timesheet entries, newest first, optionally filtered by job, crew member, or
 * date range. Returns an empty list if the database is unreachable.
 */
export async function getTimesheetEntries(
  filters: TimesheetFilters = {},
): Promise<TimesheetEntryView[]> {
  try {
    const where: Prisma.TimesheetEntryWhereInput = {};
    if (filters.jobId) where.jobId = filters.jobId;
    if (filters.crewMemberId) where.crewMemberId = filters.crewMemberId;
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) where.date.gte = new Date(filters.from);
      if (filters.to) where.date.lte = new Date(filters.to);
    }

    const rows = await prisma.timesheetEntry.findMany({
      where,
      include: { crewMember: true, job: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return rows.map((entry) => ({
      id: entry.id,
      date: entry.date.toISOString().slice(0, 10),
      crewMemberId: entry.crewMemberId,
      crewMemberName: entry.crewMember.name,
      jobId: entry.jobId,
      jobName: entry.job.name,
      hoursWorked: entry.hoursWorked.toNumber(),
      notes: entry.notes,
    }));
  } catch {
    return [];
  }
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Log a timesheet entry, then redirect to the timesheets list. */
export async function createTimesheetEntry(formData: FormData): Promise<void> {
  const hours = Number.parseFloat(field(formData, "hoursWorked"));

  await prisma.timesheetEntry.create({
    data: {
      crewMemberId: field(formData, "crewMemberId"),
      jobId: field(formData, "jobId"),
      date: new Date(field(formData, "date")),
      hoursWorked: Number.isFinite(hours) ? hours : 0,
      notes: field(formData, "notes") || null,
    },
  });

  revalidatePath("/dashboard/timesheets");
  redirect("/dashboard/timesheets");
}
