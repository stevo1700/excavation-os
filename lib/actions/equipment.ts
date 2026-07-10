"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { nextAssetTag } from "@/lib/asset-tag";
import { generateQrSvg, qrUrlForTag } from "@/lib/qr";
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

// Shared DB-row → UI mapper. Service-hours fields aren't tracked in the DB (it
// uses service dates), so they're surfaced as 0 and hidden in the UI.
function toUiEquipment(machine: {
  id: string;
  name: string;
  type: string;
  status: string;
  jobId: string | null;
  assetTag: string;
  job: { address: string | null } | null;
}): Equipment {
  return {
    id: machine.id,
    name: machine.name,
    category: machine.type as EquipmentCategory,
    status: toUiStatus(machine.status),
    location: machine.job?.address ?? "Yard",
    assignedJob: machine.jobId,
    assetTag: machine.assetTag,
    hoursLogged: 0,
    nextServiceHours: 0,
  };
}

/**
 * All equipment, in UI shape. Falls back to the bundled mock fleet when no
 * database is reachable.
 */
export async function getEquipment(): Promise<Equipment[]> {
  try {
    const rows = await prisma.equipment.findMany({
      include: { job: true },
      orderBy: { name: "asc" },
    });
    return rows.map(toUiEquipment);
  } catch (error) {
    logActionError("getEquipment", error);
    return [];
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

// --- JSON write API (used by the REST route handlers) -------------------------

/** Fields accepted when creating or updating equipment over the JSON API. */
export interface EquipmentWriteInput {
  name?: string;
  /** Machine category, stored as the DB `type` column. */
  type?: string;
  status?: EquipmentStatus;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  serialNumber?: string | null;
  jobId?: string | null;
  notes?: string | null;
  /** Short tag like "EX-310". Auto-generated from `type` when omitted on create. */
  assetTag?: string;
}

/**
 * Create an equipment record from a JSON payload, returned in UI shape.
 * `assetTag` is auto-generated from `type` when not supplied; the QR code
 * (qrUrl/qrSvg) is always (re)generated to match the resulting tag.
 */
export async function createEquipmentRecord(
  input: EquipmentWriteInput,
): Promise<Equipment> {
  const type = input.type ?? "";
  const assetTag = input.assetTag ?? (await nextAssetTag(type));
  const qrUrl = qrUrlForTag(assetTag);
  const qrSvg = await generateQrSvg(qrUrl);

  const machine = await prisma.equipment.create({
    data: {
      name: input.name ?? "",
      type,
      status: input.status ? dbStatus[input.status] : "AVAILABLE",
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      serialNumber: input.serialNumber ?? null,
      jobId: input.jobId ?? null,
      notes: input.notes ?? null,
      assetTag,
      qrUrl,
      qrSvg,
    },
    include: { job: true },
  });
  revalidatePath("/dashboard/equipment");
  return toUiEquipment(machine);
}

/**
 * Apply a partial update to an equipment record, returned in UI shape, or null
 * if no record with that id exists. The QR code is regenerated whenever
 * `assetTag` changes; other field changes leave it untouched.
 */
export async function updateEquipmentRecord(
  id: string,
  input: EquipmentWriteInput,
): Promise<Equipment | null> {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) return null;

  const tagChanged =
    input.assetTag !== undefined && input.assetTag !== existing.assetTag;
  let qr: { qrUrl: string; qrSvg: string } | undefined;
  if (tagChanged) {
    const qrUrl = qrUrlForTag(input.assetTag as string);
    qr = { qrUrl, qrSvg: await generateQrSvg(qrUrl) };
  }

  const machine = await prisma.equipment.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.status !== undefined ? { status: dbStatus[input.status] } : {}),
      ...(input.make !== undefined ? { make: input.make } : {}),
      ...(input.model !== undefined ? { model: input.model } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.serialNumber !== undefined
        ? { serialNumber: input.serialNumber }
        : {}),
      ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.assetTag !== undefined ? { assetTag: input.assetTag } : {}),
      ...(qr ?? {}),
    },
    include: { job: true },
  });
  revalidatePath("/dashboard/equipment");
  return toUiEquipment(machine);
}
