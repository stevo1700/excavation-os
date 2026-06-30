"use client";

import { useMemo, useState } from "react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { FilterBar, type FilterOption } from "@/components/ui/filter-bar";
import type { Equipment, EquipmentStatus } from "@/lib/types";
import { humanize } from "@/lib/utils";

const statuses: EquipmentStatus[] = ["in_use", "available", "maintenance"];

export function EquipmentList({
  equipment,
  jobNames,
}: {
  equipment: Equipment[];
  jobNames: Record<string, string>;
}) {
  const [filter, setFilter] = useState("all");

  const options: FilterOption[] = useMemo(
    () => [
      { value: "all", label: "All", count: equipment.length },
      ...statuses.map((status) => ({
        value: status,
        label: humanize(status),
        count: equipment.filter((machine) => machine.status === status).length,
      })),
    ],
    [equipment],
  );

  const visible =
    filter === "all"
      ? equipment
      : equipment.filter((machine) => machine.status === filter);

  return (
    <>
      <FilterBar
        options={options}
        value={filter}
        onChange={setFilter}
        className="mb-5"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((machine) => {
          // Flag machines that are within 100 hours of their next service.
          const serviceDue = machine.nextServiceHours - machine.hoursLogged;
          const serviceSoon = serviceDue <= 100;
          const assignment = machine.assignedJob
            ? (jobNames[machine.assignedJob] ?? machine.assignedJob)
            : null;

          return (
            <Card key={machine.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
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
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="text-slate-700">{machine.location}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Assignment</dt>
                    <dd className="truncate text-right text-slate-700">
                      {assignment ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Hours logged</dt>
                    <dd className="tabular-nums text-slate-700">
                      {machine.hoursLogged.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Next service</dt>
                    <dd
                      className={
                        serviceSoon
                          ? "font-medium text-rose-600"
                          : "tabular-nums text-slate-700"
                      }
                    >
                      {serviceDue <= 0
                        ? "Overdue"
                        : `in ${serviceDue.toLocaleString()} hrs`}
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
