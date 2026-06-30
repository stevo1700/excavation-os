import { NextResponse } from "next/server";
import { updateEquipmentRecord } from "@/lib/actions/equipment";
import { readJsonObject } from "@/lib/http";
import { validateEquipmentInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/equipment/[id] — update equipment fields. 404 if the machine
 * doesn't exist.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateEquipmentInput(parsed.body, "update");
  if (validated.error) return validated.error;

  const machine = await updateEquipmentRecord(params.id, validated.input);
  if (!machine) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  return NextResponse.json(machine);
}
