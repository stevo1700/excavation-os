import { NextResponse } from "next/server";
import { getJob } from "@/lib/actions/jobs";

export const dynamic = "force-dynamic";

/** GET /api/jobs/[id] — a single job, or 404 if not found. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const job = await getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
