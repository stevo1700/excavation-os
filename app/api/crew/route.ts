import { NextResponse } from "next/server";
import { getCrew } from "@/lib/actions/crew";

export const dynamic = "force-dynamic";

/** GET /api/crew — the full crew roster. */
export async function GET() {
  const crew = await getCrew();
  return NextResponse.json(crew);
}
