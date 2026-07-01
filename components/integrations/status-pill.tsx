import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  CONNECTED: "bg-emerald-100 text-emerald-700",
  DISCONNECTED: "bg-slate-100 text-slate-600",
  ERROR: "bg-rose-100 text-rose-700",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? styles.DISCONNECTED,
      )}
    >
      {status}
    </span>
  );
}
