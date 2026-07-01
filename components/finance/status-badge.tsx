import { cn } from "@/lib/utils";

// Color mapping for quote/invoice text statuses.
const tones: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-sky-100 text-sky-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-800",
  DECLINED: "bg-rose-100 text-rose-700",
  EXPIRED: "bg-rose-100 text-rose-700",
  OVERDUE: "bg-amber-100 text-amber-800",
  VOID: "bg-slate-200 text-slate-500",
};

export function FinanceStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
