"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";

export type AssignmentResourceType = "CREW" | "EQUIPMENT";

export interface JobAssignmentView {
  id: string;
  jobId: string;
  resourceType: AssignmentResourceType;
  resourceId: string;
  resourceName: string;
  resourceDetail: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
}

function isoDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function revalidateJob(jobId: string) {
  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/crew");
  revalidatePath("/dashboard/equipment");
  revalidatePath("/dashboard/schedule");
  revalidatePath("/dashboard");
}

async function nameForResource(
  resourceType: AssignmentResourceType,
  resourceId: string,
): Promise<{ name: string; detail: string }> {
  if (resourceType === "CREW") {
    const member = await prisma.crewMember.findUnique({
      where: { id: resourceId },
    });
    return {
      name: member?.name ?? "Unknown crew",
      detail: member?.role ?? "",
    };
  }
  const machine = await prisma.equipment.findUnique({
    where: { id: resourceId },
  });
  return {
    name: machine?.name ?? "Unknown equipment",
    detail: machine?.assetTag ?? machine?.type ?? "",
  };
}

/** All assignments for a job (active first, then newest). */
export async function getJobAssignments(
  jobId: string,
): Promise<JobAssignmentView[]> {
  try {
    const rows = await prisma.jobAssignment.findMany({
      where: { jobId },
      orderBy: [{ endDate: "asc" }, { startDate: "desc" }],
    });

    const crewIds = rows
      .filter((r) => r.resourceType === "CREW")
      .map((r) => r.resourceId);
    const equipIds = rows
      .filter((r) => r.resourceType === "EQUIPMENT")
      .map((r) => r.resourceId);

    const [crew, equipment] = await Promise.all([
      crewIds.length
        ? prisma.crewMember.findMany({ where: { id: { in: crewIds } } })
        : Promise.resolve([]),
      equipIds.length
        ? prisma.equipment.findMany({ where: { id: { in: equipIds } } })
        : Promise.resolve([]),
    ]);

    const crewMap = new Map(crew.map((c) => [c.id, c]));
    const equipMap = new Map(equipment.map((e) => [e.id, e]));

    return rows.map((row) => {
      const isCrew = row.resourceType === "CREW";
      const member = isCrew ? crewMap.get(row.resourceId) : undefined;
      const machine = !isCrew ? equipMap.get(row.resourceId) : undefined;
      return {
        id: row.id,
        jobId: row.jobId,
        resourceType: row.resourceType as AssignmentResourceType,
        resourceId: row.resourceId,
        resourceName: member?.name ?? machine?.name ?? "Unknown",
        resourceDetail: member?.role ?? machine?.assetTag ?? machine?.type ?? "",
        startDate: isoDate(row.startDate) ?? "",
        endDate: isoDate(row.endDate),
        notes: row.notes,
        isActive: row.endDate === null,
      };
    });
  } catch (error) {
    logActionError("getJobAssignments", error);
    return [];
  }
}

/**
 * Assign crew or equipment to a job.
 * - Closes any open assignment for that resource on any job
 * - Creates a new open assignment
 * - Updates CrewMember.jobId / Equipment.jobId as the live pointer
 */
export async function assignResourceToJob(input: {
  jobId: string;
  resourceType: AssignmentResourceType;
  resourceId: string;
  startDate?: string;
  notes?: string;
}): Promise<JobAssignmentView | null> {
  const startDate = input.startDate
    ? new Date(input.startDate)
    : new Date(new Date().toISOString().slice(0, 10));

  try {
    // Close any open assignment for this resource.
    await prisma.jobAssignment.updateMany({
      where: {
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        endDate: null,
      },
      data: { endDate: startDate },
    });

    const created = await prisma.jobAssignment.create({
      data: {
        jobId: input.jobId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        startDate,
        endDate: null,
        notes: input.notes ?? null,
      },
    });

    if (input.resourceType === "CREW") {
      await prisma.crewMember.update({
        where: { id: input.resourceId },
        data: { jobId: input.jobId, status: "on_site" },
      });
    } else {
      await prisma.equipment.update({
        where: { id: input.resourceId },
        data: { jobId: input.jobId, status: "IN_USE" },
      });
    }

    revalidateJob(input.jobId);
    const names = await nameForResource(input.resourceType, input.resourceId);
    return {
      id: created.id,
      jobId: created.jobId,
      resourceType: input.resourceType,
      resourceId: created.resourceId,
      resourceName: names.name,
      resourceDetail: names.detail,
      startDate: isoDate(created.startDate) ?? "",
      endDate: null,
      notes: created.notes,
      isActive: true,
    };
  } catch (error) {
    logActionError("assignResourceToJob", error);
    throw error;
  }
}

/** End an open assignment and clear the live job pointer when it still matches. */
export async function endAssignment(
  assignmentId: string,
  endDate?: string,
): Promise<void> {
  const end = endDate
    ? new Date(endDate)
    : new Date(new Date().toISOString().slice(0, 10));

  const existing = await prisma.jobAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!existing) return;

  await prisma.jobAssignment.update({
    where: { id: assignmentId },
    data: { endDate: end },
  });

  if (existing.resourceType === "CREW") {
    const member = await prisma.crewMember.findUnique({
      where: { id: existing.resourceId },
    });
    if (member?.jobId === existing.jobId) {
      await prisma.crewMember.update({
        where: { id: existing.resourceId },
        data: { jobId: null, status: "available" },
      });
    }
  } else {
    const machine = await prisma.equipment.findUnique({
      where: { id: existing.resourceId },
    });
    if (machine?.jobId === existing.jobId) {
      await prisma.equipment.update({
        where: { id: existing.resourceId },
        data: { jobId: null, status: "AVAILABLE" },
      });
    }
  }

  revalidateJob(existing.jobId);
}

/** Server-action wrappers for form posts from the job detail page. */
export async function assignCrewForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const resourceId = String(formData.get("resourceId") ?? "").trim();
  if (!resourceId) return;
  await assignResourceToJob({
    jobId,
    resourceType: "CREW",
    resourceId,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
}

export async function assignEquipmentForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const resourceId = String(formData.get("resourceId") ?? "").trim();
  if (!resourceId) return;
  await assignResourceToJob({
    jobId,
    resourceType: "EQUIPMENT",
    resourceId,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
}

export async function endAssignmentForm(
  assignmentId: string,
  _formData?: FormData,
): Promise<void> {
  await endAssignment(assignmentId);
}
