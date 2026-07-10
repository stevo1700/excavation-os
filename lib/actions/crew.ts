"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import type { CrewMember, CrewRole, CrewStatus } from "@/lib/types";

// The DB has no crew status column for the roster view — derive one from
// `active` + assignment.
function deriveStatus(active: boolean, jobId: string | null): CrewStatus {
  if (!active) return "off";
  return jobId ? "on_site" : "available";
}

// Shared DB-row → UI mapper.
function toUiCrew(member: {
  id: string;
  name: string;
  role: string;
  active: boolean;
  jobId: string | null;
  certifications: string[];
  phone: string | null;
}): CrewMember {
  return {
    id: member.id,
    name: member.name,
    role: member.role.toLowerCase() as CrewRole,
    status: deriveStatus(member.active, member.jobId),
    assignedJob: member.jobId,
    certifications: member.certifications,
    phone: member.phone ?? "",
  };
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
    return rows.map(toUiCrew);
  } catch (error) {
    logActionError("getCrew", error);
    return [];
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
  return toUiCrew(created);
}

// --- JSON write API (used by the REST route handlers) -------------------------

/** Fields accepted when updating a crew member over the JSON API. */
export interface CrewUpdateInput {
  name?: string;
  role?: CrewRole;
  status?: CrewStatus;
  phone?: string | null;
  jobId?: string | null;
}

/**
 * Apply a partial update to a crew member, returned in UI shape, or null if no
 * member with that id exists.
 */
export async function updateCrewMember(
  id: string,
  input: CrewUpdateInput,
): Promise<CrewMember | null> {
  const existing = await prisma.crewMember.findUnique({ where: { id } });
  if (!existing) return null;

  const data: Prisma.CrewMemberUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.jobId !== undefined) data.jobId = input.jobId;
  if (input.status !== undefined) {
    // Keep both representations in sync: the status board reads the `status`
    // column, while getCrew derives status from `active` + assignment.
    data.status = input.status;
    data.active = input.status !== "off";
  }

  const member = await prisma.crewMember.update({ where: { id }, data });
  revalidatePath("/dashboard/crew");
  return toUiCrew(member);
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
