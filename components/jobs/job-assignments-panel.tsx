import {
  assignCrewForm,
  assignEquipmentForm,
  endAssignmentForm,
  type JobAssignmentView,
} from "@/lib/actions/assignments";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDate, humanize } from "@/lib/utils";

export function JobAssignmentsPanel({
  jobId,
  assignments,
  availableCrew,
  availableEquipment,
}: {
  jobId: string;
  assignments: JobAssignmentView[];
  availableCrew: { id: string; name: string; role: string }[];
  availableEquipment: { id: string; name: string; assetTag: string }[];
}) {
  const activeCrew = assignments.filter(
    (a) => a.isActive && a.resourceType === "CREW",
  );
  const activeEquip = assignments.filter(
    (a) => a.isActive && a.resourceType === "EQUIPMENT",
  );
  const history = assignments.filter((a) => !a.isActive);

  const assignCrew = assignCrewForm.bind(null, jobId);
  const assignEquip = assignEquipmentForm.bind(null, jobId);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Active crew"
            description={`${activeCrew.length} on this job`}
          />
          <CardBody className="space-y-4">
            <AssignmentList
              rows={activeCrew}
              empty="No crew assigned yet."
              showEnd
            />
            {availableCrew.length > 0 ? (
              <form action={assignCrew} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                <label className="min-w-[12rem] flex-1 text-xs font-medium text-slate-600">
                  Assign crew
                  <select
                    name="resourceId"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select person…
                    </option>
                    {availableCrew.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {humanize(c.role.toLowerCase())}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
                >
                  Assign
                </button>
              </form>
            ) : (
              <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                Everyone is already assigned here, or the roster is empty.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Active equipment"
            description={`${activeEquip.length} on this job`}
          />
          <CardBody className="space-y-4">
            <AssignmentList
              rows={activeEquip}
              empty="No equipment assigned yet."
              showEnd
            />
            {availableEquipment.length > 0 ? (
              <form action={assignEquip} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                <label className="min-w-[12rem] flex-1 text-xs font-medium text-slate-600">
                  Assign equipment
                  <select
                    name="resourceId"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select machine…
                    </option>
                    {availableEquipment.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} · {e.assetTag}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
                >
                  Assign
                </button>
              </form>
            ) : (
              <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                All machines are already on this job, or the fleet is empty.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {history.length > 0 ? (
        <Card>
          <CardHeader
            title="Assignment history"
            description="Closed crew and equipment stints on this job"
          />
          <CardBody>
            <AssignmentList rows={history} empty="" showEnd={false} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function AssignmentList({
  rows,
  empty,
  showEnd,
}: {
  rows: JobAssignmentView[];
  empty: string;
  showEnd: boolean;
}) {
  if (rows.length === 0) {
    return empty ? (
      <p className="text-sm text-slate-400">{empty}</p>
    ) : null;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => {
        const end = endAssignmentForm.bind(null, row.id);
        return (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-900">
                  {row.resourceName}
                </p>
                <Badge
                  tone={row.resourceType === "CREW" ? "blue" : "amber"}
                  label={row.resourceType === "CREW" ? "crew" : "equipment"}
                />
                {row.isActive ? (
                  <Badge tone="green" label="active" />
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {row.resourceDetail ? `${humanize(row.resourceDetail.toLowerCase())} · ` : ""}
                {formatDate(row.startDate)}
                {row.endDate ? ` → ${formatDate(row.endDate)}` : " → present"}
              </p>
            </div>
            {showEnd && row.isActive ? (
              <form action={end}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  End assignment
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
