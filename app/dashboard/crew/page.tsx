"use client";

import { useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import { AddCrewModal } from "@/components/dashboard/add-crew-modal";
import { crew, jobs } from "@/lib/data";
import type { CrewStatus } from "@/lib/types";
import { humanize } from "@/lib/utils";

const jobNameById = new Map(jobs.map((job) => [job.id, job.name]));

const statuses: CrewStatus[] = ["on_site", "available", "off"];

export default function CrewPage() {
  const [filter, setFilter] = useState("all");

  const options: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: crew.length },
      ...statuses.map((status) => ({
        value: status,
        label: humanize(status),
        count: crew.filter((member) => member.status === status).length,
      })),
    ],
    [],
  );

  const visible =
    filter === "all" ? crew : crew.filter((member) => member.status === filter);

  return (
    <div>
      <PageHeader
        title="Crew"
        description={`${crew.length} crew members`}
        action={<AddCrewModal />}
      />

      <FilterBar
        options={options}
        value={filter}
        onChange={setFilter}
        className="mb-5"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((member) => {
          const initials = member.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2);
          const assignment = member.assignedJob
            ? (jobNameById.get(member.assignedJob) ?? member.assignedJob)
            : "Unassigned";

          return (
            <Card key={member.id} className="h-full">
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-800 text-sm font-semibold text-brand-300">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {humanize(member.role)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    tone={statusTone(member.status)}
                    label={member.status}
                  />
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Assignment</dt>
                    <dd className="truncate text-right font-medium text-slate-700">
                      {assignment}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {member.phone}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  {member.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
