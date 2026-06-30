"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, HardHat } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import {
  KanbanBoard,
  type KanbanColumnDef,
} from "@/components/kanban/kanban-board";
import {
  updateJobScheduleDate,
  type ScheduleJobCard,
} from "@/lib/actions/jobs";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ScheduleBoard({ jobs }: { jobs: ScheduleJobCard[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const todayIso = isoDate(new Date());

  const { columns, label } = useMemo(() => {
    const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
    const days: KanbanColumnDef[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const id = isoDate(date);
      return {
        id,
        title: DAYS[i],
        subtitle: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
        accent: id === todayIso,
      };
    });
    const weekEnd = addDays(weekStart, 6);
    return {
      columns: [
        { id: "unscheduled", title: "Unscheduled" } as KanbanColumnDef,
        ...days,
      ],
      label: `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`,
    };
  }, [weekOffset, todayIso]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <KanbanBoard
        columns={columns}
        items={jobs}
        onMove={(id, columnId) =>
          updateJobScheduleDate(
            id,
            columnId === "unscheduled" ? null : columnId,
          )
        }
        renderCard={(job) => (
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="text-sm font-semibold leading-tight text-slate-900 hover:text-brand-700"
              >
                {job.name}
              </Link>
              <Badge tone={statusTone(job.status)} label={job.status} />
            </div>
            <p className="truncate text-xs text-slate-500">{job.site}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <HardHat className="h-3.5 w-3.5" />
              {job.crewCount} crew
            </p>
          </div>
        )}
      />
    </div>
  );
}
