import {
  CheckCircle2,
  FileText,
  PlayCircle,
  Truck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { ActivityItem, ActivityKind } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const kindMeta: Record<ActivityKind, { icon: LucideIcon; tint: string }> = {
  job_started: { icon: PlayCircle, tint: "bg-sky-100 text-sky-700" },
  job_completed: {
    icon: CheckCircle2,
    tint: "bg-emerald-100 text-emerald-700",
  },
  crew_assigned: { icon: UserPlus, tint: "bg-violet-100 text-violet-700" },
  equipment_moved: { icon: Truck, tint: "bg-amber-100 text-amber-700" },
  report_submitted: { icon: FileText, tint: "bg-slate-100 text-slate-600" },
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="space-y-1">
      {items.map((item, index) => {
        const meta = kindMeta[item.kind];
        const Icon = meta.icon;
        const last = index === items.length - 1;

        return (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  meta.tint,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {!last ? <span className="w-px flex-1 bg-slate-200" /> : null}
            </div>

            <div className={cn("min-w-0 pb-5", last && "pb-0")}>
              <p className="text-sm font-medium leading-snug text-slate-900">
                {item.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
              <p className="mt-1 text-xs text-slate-400">
                {timeAgo(item.timestamp)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
