"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { jobs as mockJobs } from "@/lib/data";
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
    return mockJobs;
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
