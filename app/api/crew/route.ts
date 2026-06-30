import { NextResponse } from "next/server";
import { createCrewMember, getCrew } from "@/lib/actions/crew";
import { readJsonObject } from "@/lib/http";
import { validateCrewCreate } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/crew — the full crew roster. */
export async function GET() {
  const crew = await getCrew();
  return NextResponse.json(crew);
}

/** POST /api/crew — create a crew member. Requires `name` and `role`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCrewCreate(parsed.body);
  if (validated.error) return validated.error;

  const member = await createCrewMember(validated.input);
  return NextResponse.json(member, { status: 201 });
}
