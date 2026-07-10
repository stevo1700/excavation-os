"use server";

import type { JobStatus as PrismaJobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jobs as mockJobs } from "@/lib/data";
import type { Job, JobColor, JobStatus } from "@/lib/types";

const uiStatus: Record<PrismaJobStatus, JobStatus> = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
};

// The schema does not track a progress percentage; approximate it from status.
const progressForStatus: Record<JobStatus, number> = {
  scheduled: 0,
  in_progress: 50,
  on_hold: 25,
  completed: 100,
};

function isoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

type JobWithRelations = Awaited<ReturnType<typeof loadJobs>>[number];

function loadJobs() {
  return prisma.job.findMany({
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
    site: job.site,
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

/** A single job by id, or null if not found. */
export async function getJob(id: string): Promise<Job | null> {
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { foreman: true, notes: { include: { author: true } } },
    });
    return job ? toUiJob(job) : null;
  } catch {
    return mockJobs.find((job) => job.id === id) ?? null;
  }
}
