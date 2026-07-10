"use server";

import { revalidatePath } from "next/cache";
import type { EquipmentStatus as PrismaEquipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { equipment as mockEquipment } from "@/lib/data";
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
} from "@/lib/types";

// Map the Prisma enum back to the string union the UI renders.
const uiStatus: Record<PrismaEquipmentStatus, EquipmentStatus> = {
  AVAILABLE: "available",
  IN_USE: "in_use",
  MAINTENANCE: "maintenance",
};

const dbStatus: Record<EquipmentStatus, PrismaEquipmentStatus> = {
  available: "AVAILABLE",
  in_use: "IN_USE",
  maintenance: "MAINTENANCE",
};

/**
 * All equipment, in UI shape. Falls back to the bundled mock fleet when no
 * database is reachable (e.g. during `next build` or local dev without a DB),
 * so the dashboard always renders.
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    const rows = await prisma.equipment.findMany({
      include: { job: true },
      orderBy: { id: "asc" },
    });

    // The schema tracks fewer fields than the UI; location/service hours are
    // derived from what the DB stores.
    return rows.map((machine) => ({
      id: machine.id,
      name: machine.name,
      category: machine.category as EquipmentCategory,
      status: uiStatus[machine.status],
      location: machine.job?.site ?? "Main yard",
      assignedJob: machine.jobId,
      hoursLogged: machine.hoursLogged,
      nextServiceHours: machine.hoursLogged + 200,
    }));
  } catch {
    return mockEquipment;
  }
}

/** Update a machine's status. Accepts the UI status union. */
export async function updateEquipmentStatus(
  id: string,
  status: EquipmentStatus,
): Promise<void> {
  await prisma.equipment.update({
    where: { id },
    data: { status: dbStatus[status] },
  });
  revalidatePath("/dashboard/equipment");
}
