"use client";

import { useState } from "react";
import { CloudRain, CloudSun, Sun, Wind, type LucideIcon } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type {
  CrewMember,
  DailyReport,
  Equipment,
  Job,
  Weather,
} from "@/lib/types";
import type { TimesheetEntryView } from "@/lib/actions/timesheets";
import { cn, formatCurrency, formatDate, humanize } from "@/lib/utils";

type TabKey =
  "overview" | "equipment" | "crew" | "reports" | "timesheets" | "notes";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "equipment", label: "Equipment" },
  { key: "crew", label: "Crew" },
  { key: "reports", label: "Daily Reports" },
  { key: "timesheets", label: "Timesheets" },
  { key: "notes", label: "Notes" },
];

const weatherIcon: Record<Weather, LucideIcon> = {
  Clear: Sun,
  Cloudy: CloudSun,
  "Light rain": CloudRain,
  Rain: CloudRain,
  Windy: Wind,
};

export function JobDetailTabs({
  job,
  crew,
  equipment,
  reports,
  timesheets,
}: {
  job: Job;
  crew: CrewMember[];
  equipment: Equipment[];
  reports: DailyReport[];
  timesheets: TimesheetEntryView[];
}) {
  const [active, setActive] = useState<TabKey>("overview");

  return (
    <div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const count =
            tab.key === "equipment"
              ? equipment.length
              : tab.key === "crew"
                ? crew.length
                : tab.key === "reports"
                  ? reports.length
                  : tab.key === "timesheets"
                    ? timesheets.length
                    : tab.key === "notes"
                      ? job.notes.length
                      : undefined;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {typeof count === "number" ? (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-xs tabular-nums text-slate-500">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {active === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardBody className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Scope of work
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {job.description}
                </p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Progress</span>
                  <span className="tabular-nums text-slate-500">
                    {job.progress}% complete
                  </span>
                </div>
                <ProgressBar value={job.progress} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3 text-sm">
              <Detail label="Client" value={job.client} />
              <Detail label="Site" value={job.site} />
              <Detail label="Foreman" value={job.foreman} />
              <Detail label="Start" value={formatDate(job.startDate)} />
              <Detail label="Est. completion" value={formatDate(job.dueDate)} />
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-500">Contract value</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatCurrency(job.value)}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {active === "equipment" ? (
        <EmptyOr count={equipment.length} noun="equipment assigned">
          <div className="grid gap-3 sm:grid-cols-2">
            {equipment.map((machine) => (
              <Card key={machine.id}>
                <CardBody className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {machine.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {machine.id} · {humanize(machine.category)}
                    </p>
                  </div>
                  <Badge
                    tone={statusTone(machine.status)}
                    label={machine.status}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        </EmptyOr>
      ) : null}

      {active === "crew" ? (
        <EmptyOr count={crew.length} noun="crew assigned">
          <div className="grid gap-3 sm:grid-cols-2">
            {crew.map((member) => {
              const initials = member.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2);
              return (
                <Card key={member.id}>
                  <CardBody className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-800 text-xs font-semibold text-brand-300">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {humanize(member.role)} · {member.phone}
                      </p>
                    </div>
                    <Badge
                      tone={statusTone(member.status)}
                      label={member.status}
                    />
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </EmptyOr>
      ) : null}

      {active === "reports" ? (
        <EmptyOr count={reports.length} noun="reports filed">
          <div className="space-y-3">
            {reports.map((report) => {
              const Icon = weatherIcon[report.weather];
              return (
                <Card key={report.id}>
                  <CardBody className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(report.date)}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Icon className="h-4 w-4" />
                        {report.weather} · {report.tempHigh}°F
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{report.summary}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Submitted by {report.submittedBy}</span>
                      <span>{report.crewCount} crew</span>
                      <span>{report.hoursWorked} crew-hours</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </EmptyOr>
      ) : null}

      {active === "timesheets" ? (
        <EmptyOr count={timesheets.length} noun="hours logged">
          <div className="space-y-2">
            {timesheets.map((entry) => (
              <Card key={entry.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {entry.crewMemberName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(entry.date)}
                      {entry.notes ? ` · ${entry.notes}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {entry.hoursWorked} hrs
                  </span>
                </CardBody>
              </Card>
            ))}
          </div>
        </EmptyOr>
      ) : null}

      {active === "notes" ? (
        <EmptyOr count={job.notes.length} noun="notes recorded">
          <div className="space-y-3">
            {job.notes.map((note) => (
              <Card key={note.id}>
                <CardBody className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {note.author}
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatDate(note.date)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{note.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </EmptyOr>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

function EmptyOr({
  count,
  noun,
  children,
}: {
  count: number;
  noun: string;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-slate-400">
          No {noun} for this job.
        </CardBody>
      </Card>
    );
  }
  return <>{children}</>;
}
