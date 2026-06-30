"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JobStatus as PrismaJobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jobs as mockJobs } from "@/lib/data";
import type { Job, JobColor, JobStatus } from "@/lib/types";

const uiStatus: Record<PrismaJobStatus, JobStatus> = {
  QUOTED: "scheduled",
  ACTIVE: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETE: "completed",
  // Cancelled jobs are soft-deleted and filtered out of queries; this entry
  // only exists to keep the mapping exhaustive.
  CANCELLED: "completed",
};

// The schema does not track a progress percentage; approximate it from status.
const progressForStatus: Record<JobStatus, number> = {
  scheduled: 0,
  in_progress: 50,
  on_hold: 25,
  completed: 100,
};

const JOB_STATUSES: PrismaJobStatus[] = [
  "QUOTED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETE",
  "CANCELLED",
];

function isoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

type JobWithRelations = Awaited<ReturnType<typeof loadJobs>>[number];

function loadJobs() {
  return prisma.job.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { foreman: true, notes: { include: { author: true } } },
    orderBy: { id: "asc" },
  });
}

function toUiJob(job: JobWithRelations): Job {
  const status = uiStatus[job.status];
  return {
    id: job.id,
    name: job.name,
    client: job.client,
    site: job.siteAddress,
    status,
    foreman: job.foreman?.name ?? "Unassigned",
    progress: progressForStatus[status],
    startDate: isoDate(job.startDate),
    dueDate: isoDate(job.estCompletion),
    value: job.value,
    color: job.color as JobColor,
    description: job.description ?? "",
    notes: job.notes
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((note) => ({
        id: note.id,
        author: note.author.name,
        date: isoDate(note.createdAt),
        body: note.body,
      })),
  };
}

/** All jobs, in UI shape. Falls back to bundled mock data without a DB. */
export async function getJobs(): Promise<Job[]> {
  try {
    const rows = await loadJobs();
    return rows.map(toUiJob);
  } catch {
    return mockJobs;
  }
}

/** A single (non-cancelled) job by id, or null if not found. */
export async function getJob(id: string): Promise<Job | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { foreman: true, notes: { include: { author: true } } },
    });
    if (!job || job.status === "CANCELLED") return null;
    return toUiJob(job);
  } catch {
    return mockJobs.find((job) => job.id === id) ?? null;
  }
}

// --- form parsing -------------------------------------------------------------

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseDate(value: string): Date | null {
  return value ? new Date(value) : null;
}

function parseJobForm(formData: FormData) {
  const statusRaw = field(formData, "status");
  const status = JOB_STATUSES.includes(statusRaw as PrismaJobStatus)
    ? (statusRaw as PrismaJobStatus)
    : "QUOTED";
  const value = Number.parseInt(field(formData, "value"), 10);

  return {
    name: field(formData, "name"),
    client: field(formData, "client"),
    siteAddress: field(formData, "siteAddress"),
    status,
    startDate: parseDate(field(formData, "startDate")),
    estCompletion: parseDate(field(formData, "estCompletion")),
    value: Number.isFinite(value) ? value : 0,
    description: field(formData, "description") || null,
  };
}

// --- mutations ----------------------------------------------------------------

/** Create a new job, then redirect to the jobs list. */
export async function createJob(formData: FormData): Promise<void> {
  await prisma.job.create({ data: parseJobForm(formData) });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}

/** Update an existing job, then redirect to its detail page. */
export async function updateJob(id: string, formData: FormData): Promise<void> {
  await prisma.job.update({ where: { id }, data: parseJobForm(formData) });
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${id}`);
  redirect(`/dashboard/jobs/${id}`);
}

/** Soft-delete a job by marking it CANCELLED, then redirect to the jobs list. */
export async function deleteJob(id: string): Promise<void> {
  await prisma.job.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard/jobs");
  redirect("/dashboard/jobs");
}
