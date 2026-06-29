import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { equipment } from "@/lib/data";
import { humanize } from "@/lib/utils";

export default function EquipmentPage() {
  return (
    <div>
      <PageHeader
        title="Equipment"
        description={`${equipment.length} machines in the fleet`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equipment.map((machine) => {
          // Flag machines that are within 100 hours of their next service.
          const serviceDue = machine.nextServiceHours - machine.hoursLogged;
          const serviceSoon = serviceDue <= 100;

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
    </div>
  );
}
