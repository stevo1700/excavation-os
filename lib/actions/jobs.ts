"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import type { Job, JobColor, JobStatus } from "@/lib/types";

// The DB stores status as a free-text enum whose exact values weren't
// introspectable; map tolerantly onto the UI's status union.
function toUiStatus(status: string): JobStatus {
  const s = status.toLowerCase();
  if (s.includes("progress") || s === "active") return "in_progress";
  if (s.includes("hold")) return "on_hold";
  if (s.includes("complete") || s.includes("done")) return "completed";
  return "scheduled";
}

const progressForStatus: Record<JobStatus, number> = {
  scheduled: 0,
  in_progress: 50,
  on_hold: 25,
  completed: 100,
};

// The DB has no per-job color column, so derive a stable one from the id.
const JOB_COLORS: JobColor[] = [
  "amber",
  "sky",
  "emerald",
  "violet",
  "rose",
  "cyan",
  "orange",
  "indigo",
  "teal",
  "fuchsia",
];

function colorForId(id: string): JobColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return JOB_COLORS[hash % JOB_COLORS.length];
}

function isoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

type JobWithRelations = Awaited<ReturnType<typeof loadJobs>>[number];

function loadJobs() {
  return prisma.job.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { notes: true },
    orderBy: { createdAt: "desc" },
  });
}

function toUiJob(job: JobWithRelations): Job {
  const status = toUiStatus(job.status);
  const site =
    [job.address, job.city, job.state].filter(Boolean).join(", ") || "—";
  return {
    id: job.id,
    name: job.name,
    client: job.client,
    site,
    status,
    // The DB has no foreman link; the field is kept for the UI but unassigned.
    foreman: "Unassigned",
    progress: progressForStatus[status],
    startDate: isoDate(job.startDate),
    dueDate: isoDate(job.endDate),
    value: job.contractValue,
    color: colorForId(job.id),
    description: job.description ?? "",
    notes: [...job.notes]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((note) => ({
        id: note.id,
        author: note.authorName ?? "—",
        date: isoDate(note.createdAt),
        body: note.content,
      })),
  };
}

/** All jobs, in UI shape. Falls back to bundled mock data without a DB. */
export async function getJobs(): Promise<Job[]> {
  try {
    const rows = await loadJobs();
    return rows.map(toUiJob);
  } catch (error) {
    logActionError("getJobs", error);
    return [];
  }
}

/** A single (non-cancelled) job by id, or null if not found. */
export async function getJob(id: string): Promise<Job | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { notes: true },
    });
    if (!job || job.status === "CANCELLED") return null;
    return toUiJob(job);
  } catch (error) {
    logActionError("getJob", error);
    return null;
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
  const value = Number.parseInt(field(formData, "value"), 10);
  return {
    name: field(formData, "name"),
    client: field(formData, "client"),
    address: field(formData, "siteAddress") || null,
    status: field(formData, "status") || "ACTIVE",
    startDate: parseDate(field(formData, "startDate")),
    endDate: parseDate(field(formData, "estCompletion")),
    contractValue: Number.isFinite(value) ? value : 0,
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

// --- schedule board -----------------------------------------------------------

/** A job card for the weekly schedule Kanban. */
export interface ScheduleJobCard {
  id: string;
  /** "unscheduled" or an ISO date (YYYY-MM-DD) matching a day column. */
  columnId: string;
  name: string;
  site: string;
  status: JobStatus;
  scheduledDate: string | null;
  crewCount: number;
}

/** All non-cancelled jobs shaped for the schedule board. */
export async function getScheduleBoard(): Promise<ScheduleJobCard[]> {
  try {
    const rows = await prisma.job.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { _count: { select: { crew: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map((job) => {
      const scheduledDate = job.scheduledDate
        ? job.scheduledDate.toISOString().slice(0, 10)
        : null;
      return {
        id: job.id,
        columnId: scheduledDate ?? "unscheduled",
        name: job.name,
        site:
          [job.address, job.city, job.state].filter(Boolean).join(", ") || "—",
        status: toUiStatus(job.status),
        scheduledDate,
        crewCount: job._count.crew,
      };
    });
  } catch (error) {
    logActionError("getScheduleBoard", error);
    return [];
  }
}

/** Schedule (or unschedule, when date is null) a job onto a day. */
export async function updateJobScheduleDate(
  jobId: string,
  date: string | null,
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { scheduledDate: date ? new Date(date) : null },
  });
  revalidatePath("/dashboard/schedule");
}

// --- JSON write API (used by the REST route handlers) -------------------------

// UI status union → the DB's free-text status token. `toUiStatus` maps these
// back, so a value written here round-trips to the same UI status.
const dbJobStatus: Record<JobStatus, string> = {
  scheduled: "SCHEDULED",
  in_progress: "ACTIVE",
  on_hold: "ON_HOLD",
  completed: "COMPLETED",
};

/** Fields accepted when creating or updating a job over the JSON API. */
export interface JobWriteInput {
  name?: string;
  client?: string;
  status?: JobStatus;
  /** Contract value in USD. */
  value?: number;
  startDate?: string | null;
  dueDate?: string | null;
  scheduledDate?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  description?: string | null;
}

function parseDateInput(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

/** Create a job from a JSON payload and return it in UI shape. */
export async function createJobRecord(input: JobWriteInput): Promise<Job> {
  const job = await prisma.job.create({
    data: {
      name: input.name ?? "",
      client: input.client ?? "",
      status: input.status ? dbJobStatus[input.status] : "ACTIVE",
      contractValue: input.value ?? 0,
      startDate: parseDateInput(input.startDate),
      endDate: parseDateInput(input.dueDate),
      scheduledDate: parseDateInput(input.scheduledDate),
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      description: input.description ?? null,
    },
    include: { notes: true },
  });
  revalidatePath("/dashboard/jobs");
  return toUiJob(job);
}

/**
 * Apply a partial update to a job and return it in UI shape, or null if no job
 * with that id exists.
 */
export async function updateJobRecord(
  id: string,
  input: JobWriteInput,
): Promise<Job | null> {
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) return null;

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.client !== undefined ? { client: input.client } : {}),
      ...(input.status !== undefined
        ? { status: dbJobStatus[input.status] }
        : {}),
      ...(input.value !== undefined ? { contractValue: input.value } : {}),
      ...(input.startDate !== undefined
        ? { startDate: parseDateInput(input.startDate) }
        : {}),
      ...(input.dueDate !== undefined
        ? { endDate: parseDateInput(input.dueDate) }
        : {}),
      ...(input.scheduledDate !== undefined
        ? { scheduledDate: parseDateInput(input.scheduledDate) }
        : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    },
    include: { notes: true },
  });
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${id}`);
  return toUiJob(job);
}
