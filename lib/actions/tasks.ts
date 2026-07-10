"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";

export interface JobTaskView {
  id: string;
  jobId: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  sortOrder: number;
}

function isoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function getJobTasks(jobId: string): Promise<JobTaskView[]> {
  try {
    const rows = await prisma.jobTask.findMany({
      where: { jobId },
      orderBy: [{ done: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      jobId: r.jobId,
      title: r.title,
      done: r.done,
      dueDate: isoDate(r.dueDate),
      sortOrder: r.sortOrder,
    }));
  } catch (error) {
    logActionError("getJobTasks", error);
    return [];
  }
}

export async function addJobTaskForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const due = String(formData.get("dueDate") ?? "").trim();
  const max = await prisma.jobTask.aggregate({
    where: { jobId },
    _max: { sortOrder: true },
  });
  await prisma.jobTask.create({
    data: {
      jobId,
      title,
      dueDate: due ? new Date(due) : null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function toggleJobTaskForm(
  taskId: string,
  formData: FormData,
): Promise<void> {
  const done = formData.get("done") === "true";
  const row = await prisma.jobTask.update({
    where: { id: taskId },
    data: { done },
  });
  revalidatePath(`/dashboard/jobs/${row.jobId}`);
}

export async function deleteJobTaskForm(
  taskId: string,
  _formData?: FormData,
): Promise<void> {
  const row = await prisma.jobTask.delete({ where: { id: taskId } });
  revalidatePath(`/dashboard/jobs/${row.jobId}`);
}
