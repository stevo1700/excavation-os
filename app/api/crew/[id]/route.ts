import { NextResponse } from "next/server";
import { updateCrewMember } from "@/lib/actions/crew";
import { readJsonObject } from "@/lib/http";
import { validateCrewUpdate } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/crew/[id] — update crew member fields. 404 if the member doesn't
 * exist.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCrewUpdate(parsed.body);
  if (validated.error) return validated.error;

  const member = await updateCrewMember(params.id, validated.input);
  if (!member) {
    return NextResponse.json(
      { error: "Crew member not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(member);
}
