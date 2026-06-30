"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { crew as mockCrew } from "@/lib/data";
import type { CrewMember, CrewRole, CrewStatus } from "@/lib/types";

// The DB has no crew status column — derive one from `active` + assignment.
function deriveStatus(active: boolean, jobId: string | null): CrewStatus {
  if (!active) return "off";
  return jobId ? "on_site" : "available";
}

/** Input accepted by {@link createCrewMember}. */
export interface NewCrewMember {
  name: string;
  role: CrewRole;
  phone?: string;
  status?: CrewStatus;
  jobId?: string | null;
}

/**
 * The full crew roster, in UI shape. Falls back to bundled mock data when no
 * database is reachable so the dashboard always renders.
 */
export async function getCrew(): Promise<CrewMember[]> {
  try {
    const rows = await prisma.crewMember.findMany({ orderBy: { name: "asc" } });

    return rows.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role.toLowerCase() as CrewRole,
      status: deriveStatus(member.active, member.jobId),
      assignedJob: member.jobId,
      certifications: member.certifications,
      phone: member.phone ?? "",
    }));
  } catch (error) {
    logActionError("getCrew", error);
    return mockCrew;
  }
}

/** Create a new crew member. */
export async function createCrewMember(
  data: NewCrewMember,
): Promise<CrewMember> {
  const active = data.status !== "off";
  const created = await prisma.crewMember.create({
    data: {
      name: data.name,
      role: data.role,
      phone: data.phone,
      jobId: data.jobId ?? null,
      active,
    },
  });

  revalidatePath("/dashboard/crew");

  return {
    id: created.id,
    name: created.name,
    role: created.role.toLowerCase() as CrewRole,
    status: deriveStatus(created.active, created.jobId),
    assignedJob: created.jobId,
    certifications: created.certifications,
    phone: created.phone ?? "",
  };
}

// --- crew status board --------------------------------------------------------

/** A crew card for the status Kanban (columnId === status). */
export interface CrewCard {
  id: string;
  columnId: string;
  name: string;
  role: string;
  phone: string | null;
  certCount: number;
}

/** All crew shaped for the status board. Empty list if DB unreachable. */
export async function getCrewBoard(): Promise<CrewCard[]> {
  try {
    const rows = await prisma.crewMember.findMany({ orderBy: { name: "asc" } });
    return rows.map((member) => ({
      id: member.id,
      columnId: member.status,
      name: member.name,
      role: member.role,
      phone: member.phone,
      certCount: member.certifications.length,
    }));
  } catch (error) {
    logActionError("getCrewBoard", error);
    return [];
  }
}

/** Move a crew member to a new status column. */
export async function updateCrewStatus(
  id: string,
  status: string,
): Promise<void> {
  await prisma.crewMember.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/crew");
}
