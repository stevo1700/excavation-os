import { NextResponse } from "next/server";
import { createJobRecord, getJobs } from "@/lib/actions/jobs";
import { readJsonObject } from "@/lib/http";
import { JOB_STATUSES, validateJobInput } from "@/lib/validators";
import type { JobStatus } from "@/lib/types";

// Read/write live data on every request.
export const dynamic = "force-dynamic";

/** GET /api/jobs — all jobs, optionally filtered by ?status=. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status && !JOB_STATUSES.includes(status as JobStatus)) {
    return NextResponse.json(
      { error: "Invalid status", allowed: JOB_STATUSES },
      { status: 400 },
    );
  }

  const jobs = await getJobs();
  const data = status ? jobs.filter((job) => job.status === status) : jobs;

  return NextResponse.json(data);
}

/** POST /api/jobs — create a job. Requires `name` and `client`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateJobInput(parsed.body, "create");
  if (validated.error) return validated.error;

  const job = await createJobRecord(validated.input);
  return NextResponse.json(job, { status: 201 });
}
