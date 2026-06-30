import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { getJobs } from "@/lib/actions/jobs";
import { createDailyReport } from "@/lib/actions/reports";

export const metadata = { title: "File Report" };

export const dynamic = "force-dynamic";

const weatherOptions = ["Clear", "Cloudy", "Light rain", "Rain", "Windy"];

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: { jobId?: string };
}) {
  const jobs = await getJobs();
  const selectedJobId = searchParams.jobId ?? jobs[0]?.id ?? "";

  return (
    <div>
      <PageHeader
        title="File daily report"
        description="Log the day's work, conditions, and crew hours for a job."
      />

      <form action={createDailyReport} className="max-w-2xl space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Job" htmlFor="jobId">
            <Select
              id="jobId"
              name="jobId"
              required
              defaultValue={selectedJobId}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="date">
            <Input id="date" name="date" type="date" required />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Weather" htmlFor="weather">
            <Select id="weather" name="weather" defaultValue="Clear">
              {weatherOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Crew on site" htmlFor="crewCount">
            <Input id="crewCount" name="crewCount" type="number" min={0} />
          </Field>
          <Field label="Hours logged" htmlFor="hoursWorked">
            <Input
              id="hoursWorked"
              name="hoursWorked"
              type="number"
              min={0}
              required
            />
          </Field>
        </div>

        <Field label="Work performed" htmlFor="summary">
          <Textarea
            id="summary"
            name="summary"
            rows={4}
            required
            placeholder="What got done on site today…"
          />
        </Field>

        <Field label="Equipment used" htmlFor="equipmentUsed">
          <Textarea
            id="equipmentUsed"
            name="equipmentUsed"
            rows={2}
            placeholder="Machines and attachments on site…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Safety notes" htmlFor="safetyNotes">
            <Textarea
              id="safetyNotes"
              name="safetyNotes"
              rows={3}
              placeholder="Toolbox talks, incidents, hazards…"
            />
          </Field>
          <Field label="Issues / delays" htmlFor="issues">
            <Textarea
              id="issues"
              name="issues"
              rows={3}
              placeholder="Weather, deliveries, blockers…"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            File report
          </button>
          <Link
            href="/dashboard/reports"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
