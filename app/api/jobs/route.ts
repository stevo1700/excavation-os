import { NextResponse } from "next/server";
import { getJobs } from "@/lib/actions/jobs";
import type { JobStatus } from "@/lib/types";

// Read live data on every request.
export const dynamic = "force-dynamic";

const JOB_STATUSES: JobStatus[] = [
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
];

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
