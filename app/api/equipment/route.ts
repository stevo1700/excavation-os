import { NextResponse } from "next/server";
import { getEquipment } from "@/lib/actions/equipment";
import type { EquipmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "available",
  "in_use",
  "maintenance",
];

/** GET /api/equipment — the fleet, optionally filtered by ?status=. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status && !EQUIPMENT_STATUSES.includes(status as EquipmentStatus)) {
    return NextResponse.json(
      { error: "Invalid status", allowed: EQUIPMENT_STATUSES },
      { status: 400 },
    );
  }

  const equipment = await getEquipment();
  const data = status
    ? equipment.filter((machine) => machine.status === status)
    : equipment;

  return NextResponse.json(data);
}
