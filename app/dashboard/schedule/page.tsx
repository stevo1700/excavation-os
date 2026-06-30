import { PageHeader } from "@/components/layout/page-header";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { getJobs } from "@/lib/actions/jobs";
import { getCrew } from "@/lib/actions/crew";
import { getEquipment } from "@/lib/actions/equipment";
import { jobColor } from "@/lib/utils";

// Render per-request so the schedule reflects live database state.
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const [jobs, crew, equipment] = await Promise.all([
    getJobs(),
    getCrew(),
    getEquipment(),
  ]);

  const legendJobs = jobs.filter(
    (job) => job.status === "in_progress" || job.status === "scheduled",
  );

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Crew and equipment assignments across the week"
      />

      <WeekCalendar jobs={jobs} crew={crew} equipment={equipment} />

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Legend</span>
        {legendJobs.map((job) => (
          <span key={job.id} className="inline-flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${jobColor(job.color).dot}`}
            />
            {job.name}
          </span>
        ))}
      </div>
    </div>
  );
}
