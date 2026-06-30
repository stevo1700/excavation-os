"use server";

import { revalidatePath } from "next/cache";
import type { CrewStatus as PrismaCrewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { crew as mockCrew } from "@/lib/data";
import type { CrewMember, CrewRole, CrewStatus } from "@/lib/types";

const uiStatus: Record<PrismaCrewStatus, CrewStatus> = {
  ON_SITE: "on_site",
  AVAILABLE: "available",
  OFF: "off",
};

const dbStatus: Record<CrewStatus, PrismaCrewStatus> = {
  on_site: "ON_SITE",
  available: "AVAILABLE",
  off: "OFF",
};

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
    const rows = await prisma.crewMember.findMany({ orderBy: { id: "asc" } });

    // Certifications are not modeled in the DB yet; surfaced as empty here.
    return rows.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role as CrewRole,
      status: uiStatus[member.status],
      assignedJob: member.jobId,
      certifications: [],
      phone: member.phone ?? "",
    }));
  } catch {
    return mockCrew;
  }
}

/** Create a new crew member. */
export async function createCrewMember(
  data: NewCrewMember,
): Promise<CrewMember> {
  const created = await prisma.crewMember.create({
    data: {
      name: data.name,
      role: data.role,
      phone: data.phone,
      status: dbStatus[data.status ?? "available"],
      jobId: data.jobId ?? null,
    },
  });

  revalidatePath("/dashboard/crew");

  return {
    id: created.id,
    name: created.name,
    role: created.role as CrewRole,
    status: uiStatus[created.status],
    assignedJob: created.jobId,
    certifications: [],
    phone: created.phone ?? "",
  };
}
