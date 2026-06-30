import { PageHeader } from "@/components/layout/page-header";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { crew, equipment, jobs } from "@/lib/data";
import { jobColor } from "@/lib/utils";

export default function SchedulePage() {
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
