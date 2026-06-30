import { NextResponse } from "next/server";
import { getJob, updateJobRecord } from "@/lib/actions/jobs";
import { readJsonObject } from "@/lib/http";
import { validateJobInput } from "@/lib/validators";

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

/** PATCH /api/jobs/[id] — update job fields. 404 if the job doesn't exist. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateJobInput(parsed.body, "update");
  if (validated.error) return validated.error;

  const job = await updateJobRecord(params.id, validated.input);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
