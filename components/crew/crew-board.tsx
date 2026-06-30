"use client";

import { Phone } from "lucide-react";
import {
  KanbanBoard,
  type KanbanColumnDef,
} from "@/components/kanban/kanban-board";
import { updateCrewStatus, type CrewCard } from "@/lib/actions/crew";
import { humanize } from "@/lib/utils";

const columns: KanbanColumnDef[] = [
  { id: "available", title: "Available" },
  { id: "on_job", title: "On Job" },
  { id: "on_leave", title: "On Leave" },
  { id: "inactive", title: "Inactive" },
];

export function CrewBoard({ crew }: { crew: CrewCard[] }) {
  return (
    <KanbanBoard
      columns={columns}
      items={crew}
      onMove={(id, status) => updateCrewStatus(id, status)}
      renderCard={(member) => (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold leading-tight text-slate-900">
              {member.name}
            </p>
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {humanize(member.role)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            {member.phone ? (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {member.phone}
              </span>
            ) : (
              <span />
            )}
            <span className="text-slate-400">
              {member.certCount} cert{member.certCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}
    />
  );
}
