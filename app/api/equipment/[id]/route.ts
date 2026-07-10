import { NextResponse } from "next/server";
import { updateEquipmentRecord } from "@/lib/actions/equipment";
import { isUniqueConstraintError, readJsonObject } from "@/lib/http";
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

  try {
    const updated = await updateEquipmentRecord(params.id, validated.input);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
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
