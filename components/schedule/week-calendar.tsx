"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, HardHat, Truck } from "lucide-react";
import type { CrewMember, Equipment, Job } from "@/lib/types";
import { cn, jobColor } from "@/lib/utils";

// The demo is anchored to this reference week so the default ("current") view
// always lands on populated data rather than whatever today happens to be.
const REFERENCE_DATE = "2026-06-29";

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const day = date.getDay(); // 0 = Sun, 1 = Mon …
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(date, diff);
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const rangeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

interface DayAssignment {
  job: Job;
  crew: CrewMember[];
  equipment: Equipment[];
}

export function WeekCalendar({
  jobs,
  crew,
  equipment,
}: {
  jobs: Job[];
  crew: CrewMember[];
  equipment: Equipment[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseMonday = useMemo(() => startOfWeek(parseISO(REFERENCE_DATE)), []);

  const monday = useMemo(
    () => addDays(baseMonday, weekOffset * 7),
    [baseMonday, weekOffset],
  );

  // Crew and equipment grouped by the job they're assigned to.
  const crewByJob = useMemo(() => {
    const map = new Map<string, CrewMember[]>();
    for (const member of crew) {
      if (!member.assignedJob) continue;
      const list = map.get(member.assignedJob) ?? [];
      list.push(member);
      map.set(member.assignedJob, list);
    }
    return map;
  }, [crew]);

  const equipmentByJob = useMemo(() => {
    const map = new Map<string, Equipment[]>();
    for (const machine of equipment) {
      if (!machine.assignedJob) continue;
      const list = map.get(machine.assignedJob) ?? [];
      list.push(machine);
      map.set(machine.assignedJob, list);
    }
    return map;
  }, [equipment]);

  const days = useMemo(() => {
    return dayLabels.map((label, index) => {
      const date = addDays(monday, index);
      const isWeekend = index >= 5;
      const assignments: DayAssignment[] = isWeekend
        ? []
        : jobs
            .filter((job) => {
              if (job.status === "scheduled" && job.progress === 0) {
                // Scheduled jobs only appear on/after their start date.
                return (
                  date >= parseISO(job.startDate) &&
                  date <= parseISO(job.dueDate)
                );
              }
              if (job.status === "on_hold") return false;
              return (
                date >= parseISO(job.startDate) && date <= parseISO(job.dueDate)
              );
            })
            .map((job) => ({
              job,
              crew: crewByJob.get(job.id) ?? [],
              equipment: equipmentByJob.get(job.id) ?? [],
            }));

      return { label, date, isWeekend, assignments };
    });
  }, [monday, jobs, crewByJob, equipmentByJob]);

  const sunday = addDays(monday, 6);
  const today = parseISO(REFERENCE_DATE);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-900">
          Week of {rangeFormatter.format(monday)} –{" "}
          {rangeFormatter.format(sunday)}, {monday.getFullYear()}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:opacity-40"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-0 lg:divide-x lg:divide-slate-100 lg:overflow-hidden lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm">
        {days.map((day) => {
          const isToday = day.date.getTime() === today.getTime();
          return (
            <div
              key={day.label}
              className={cn(
                "rounded-xl border border-slate-200 bg-white shadow-sm lg:rounded-none lg:border-0 lg:border-none lg:shadow-none",
                day.isWeekend && "bg-slate-50/60",
              )}
            >
              <div
                className={cn(
                  "flex items-baseline justify-between gap-2 border-b border-slate-100 px-3 py-2.5",
                  isToday && "bg-brand-50",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {day.label}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isToday ? "text-brand-700" : "text-slate-900",
                  )}
                >
                  {rangeFormatter.format(day.date)}
                </p>
              </div>

              <div className="min-h-[6rem] space-y-2 p-2 lg:min-h-[24rem]">
                {day.assignments.length ? (
                  day.assignments.map(({ job, crew, equipment }) => {
                    const c = jobColor(job.color);
                    return (
                      <div
                        key={job.id}
                        className={cn(
                          "rounded-md border-l-2 p-2",
                          c.bg,
                          c.border,
                        )}
                      >
                        <p
                          className={cn(
                            "truncate text-xs font-semibold",
                            c.text,
                          )}
                        >
                          {job.name}
                        </p>
                        {crew.length ? (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                            <HardHat className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {crew
                                .map((m) => m.name.split(" ")[0])
                                .slice(0, 2)
                                .join(", ")}
                              {crew.length > 2 ? ` +${crew.length - 2}` : ""}
                            </span>
                          </p>
                        ) : null}
                        {equipment.length ? (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-600">
                            <Truck className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {equipment.map((e) => e.id).join(", ")}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <p className="px-1 py-2 text-xs text-slate-300">
                    No work scheduled
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
