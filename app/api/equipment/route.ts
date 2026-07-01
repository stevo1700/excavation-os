import { NextResponse } from "next/server";
import { createEquipmentRecord, getEquipment } from "@/lib/actions/equipment";
import { isUniqueConstraintError, readJsonObject } from "@/lib/http";
import { EQUIPMENT_STATUSES, validateEquipmentInput } from "@/lib/validators";
import type { EquipmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

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

/** POST /api/equipment — create a machine. Requires `name` and `type`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateEquipmentInput(parsed.body, "create");
  if (validated.error) return validated.error;

  try {
    const machine = await createEquipmentRecord(validated.input);
    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "`assetTag` is already in use." },
        { status: 400 },
      );
    }
    throw error;
  }
}
