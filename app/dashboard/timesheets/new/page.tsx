import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { getJobs } from "@/lib/actions/jobs";
import { getCrew } from "@/lib/actions/crew";
import { createTimesheetEntry } from "@/lib/actions/timesheets";

export const dynamic = "force-dynamic";

export default async function NewTimesheetPage({
  searchParams,
}: {
  searchParams: { jobId?: string; crewMemberId?: string };
}) {
  const [jobs, crew] = await Promise.all([getJobs(), getCrew()]);

  return (
    <div>
      <PageHeader
        title="Log hours"
        description="Record hours a crew member worked on a job."
      />

      <form action={createTimesheetEntry} className="max-w-2xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Crew member" htmlFor="crewMemberId">
            <Select
              id="crewMemberId"
              name="crewMemberId"
              required
              defaultValue={searchParams.crewMemberId ?? crew[0]?.id ?? ""}
            >
              {crew.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Job" htmlFor="jobId">
            <Select
              id="jobId"
              name="jobId"
              required
              defaultValue={searchParams.jobId ?? jobs[0]?.id ?? ""}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" required />
          </Field>
          <Field label="Hours worked" htmlFor="hoursWorked">
            <Input
              id="hoursWorked"
              name="hoursWorked"
              type="number"
              min={0}
              step={0.25}
              required
              placeholder="8"
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="notes">
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional — task, location, anything worth noting…"
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            Log hours
          </button>
          <Link
            href="/dashboard/timesheets"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
