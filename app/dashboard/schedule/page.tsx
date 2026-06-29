import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { jobs } from "@/lib/data";

const days = [
  { label: "Mon", date: "Jun 29" },
  { label: "Tue", date: "Jun 30" },
  { label: "Wed", date: "Jul 1" },
  { label: "Thu", date: "Jul 2" },
  { label: "Fri", date: "Jul 3" },
  { label: "Sat", date: "Jul 4" },
  { label: "Sun", date: "Jul 5" },
];

// Placeholder assignments keyed by day index. A real schedule view would derive
// these from job start/due dates and crew assignments.
const assignments: Record<number, { job: string; tone: string }[]> = {
  0: [
    { job: "Riverside foundation dig", tone: "bg-brand-100 text-brand-800" },
    { job: "Highway 9 trenching", tone: "bg-sky-100 text-sky-800" },
  ],
  1: [{ job: "Riverside foundation dig", tone: "bg-brand-100 text-brand-800" }],
  2: [
    { job: "Highway 9 trenching", tone: "bg-sky-100 text-sky-800" },
    { job: "Mill Road demo prep", tone: "bg-rose-100 text-rose-800" },
  ],
  3: [{ job: "Highway 9 trenching", tone: "bg-sky-100 text-sky-800" }],
  4: [
    { job: "Riverside foundation dig", tone: "bg-brand-100 text-brand-800" },
    { job: "Highway 9 trenching", tone: "bg-sky-100 text-sky-800" },
  ],
  5: [],
  6: [],
};

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Week of Jun 29 – Jul 5, 2026"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {days.map((day, index) => (
            <div key={day.label} className="min-h-[22rem]">
              <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {day.label}
                </p>
                <p className="text-sm font-medium text-slate-900">{day.date}</p>
              </div>
              <div className="space-y-2 p-2">
                {assignments[index]?.length ? (
                  assignments[index].map((item) => (
                    <div
                      key={item.job}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium ${item.tone}`}
                    >
                      {item.job}
                    </div>
                  ))
                ) : (
                  <p className="px-1 py-2 text-xs text-slate-300">No work</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-4 text-sm text-slate-500">
        Week view is a placeholder. Drag-and-drop scheduling of {jobs.length}{" "}
        jobs across crews and equipment is planned for a later iteration.
      </p>
    </div>
  );
}
