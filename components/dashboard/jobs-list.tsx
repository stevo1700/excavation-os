"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, User } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import type { Job, JobStatus } from "@/lib/types";
import { formatCurrency, formatDate, jobColor } from "@/lib/utils";

const statuses: JobStatus[] = [
  "in_progress",
  "scheduled",
  "on_hold",
  "completed",
];

export function JobsList({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState("all");

  const options: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: jobs.length },
      ...statuses.map((status) => ({
        value: status,
        label: status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
        count: jobs.filter((job) => job.status === status).length,
      })),
    ],
    [jobs],
  );

  const visible =
    filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  return (
    <>
      <FilterBar
        options={options}
        value={filter}
        onChange={setFilter}
        className="mb-5"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((job) => {
          const c = jobColor(job.color);
          return (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className={`h-1.5 w-full rounded-t-xl ${c.dot}`} />
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {job.name}
                      </p>
                      <p className="text-xs text-slate-500">{job.id}</p>
                    </div>
                    <Badge tone={statusTone(job.status)} label={job.status} />
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {job.client} · {job.foreman}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{job.site}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>Due {formatDate(job.dueDate)}</span>
                    </div>
                  </dl>

                  <ProgressBar value={job.progress} />

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatCurrency(job.value)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:text-brand-700">
                      View
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
