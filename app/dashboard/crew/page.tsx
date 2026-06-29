import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { crew } from "@/lib/data";
import { humanize } from "@/lib/utils";

export default function CrewPage() {
  return (
    <div>
      <PageHeader title="Crew" description={`${crew.length} crew members`} />

      <Card className="overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {crew.map((member) => {
            const initials = member.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2);

            return (
              <li
                key={member.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-800 text-xs font-semibold text-brand-300">
                  {initials}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">
                    {humanize(member.role)} · {member.phone}
                  </p>
                </div>

                <div className="hidden min-w-0 flex-1 sm:block">
                  <p className="truncate text-xs text-slate-500">
                    {member.certifications.join(" · ")}
                  </p>
                </div>

                <div className="w-28 text-right text-xs text-slate-500">
                  {member.assignedJob ?? "Unassigned"}
                </div>

                <Badge tone={statusTone(member.status)} label={member.status} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
