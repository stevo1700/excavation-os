"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { equipment as mockEquipment } from "@/lib/data";
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
} from "@/lib/types";

function toUiStatus(status: string): EquipmentStatus {
  const s = status.toLowerCase();
  if (s.includes("use")) return "in_use";
  if (s.includes("maint") || s.includes("repair") || s.includes("service")) {
    return "maintenance";
  }
  return "available";
}

const dbStatus: Record<EquipmentStatus, string> = {
  available: "AVAILABLE",
  in_use: "IN_USE",
  maintenance: "MAINTENANCE",
};

/**
 * All equipment, in UI shape. Falls back to the bundled mock fleet when no
 * database is reachable. Service-hours fields aren't tracked in the DB (it uses
 * service dates), so they're surfaced as 0 and hidden in the UI.
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    const rows = await prisma.equipment.findMany({
      include: { job: true },
      orderBy: { name: "asc" },
    });

    return rows.map((machine) => ({
      id: machine.id,
      name: machine.name,
      category: machine.type as EquipmentCategory,
      status: toUiStatus(machine.status),
      location: machine.job?.address ?? "Yard",
      assignedJob: machine.jobId,
      hoursLogged: 0,
      nextServiceHours: 0,
    }));
  } catch (error) {
    logActionError("getEquipment", error);
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
