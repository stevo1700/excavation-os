import { cn, humanize } from "@/lib/utils";

type Tone = "neutral" | "amber" | "green" | "blue" | "red";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  amber: "bg-brand-100 text-brand-800",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky-100 text-sky-700",
  red: "bg-rose-100 text-rose-700",
};

export function Badge({
  tone = "neutral",
  label,
}: {
  tone?: Tone;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneStyles[tone],
      )}
    >
      {humanize(label)}
    </span>
  );
}

/** Map a domain status string to a badge tone, so callers don't repeat the mapping. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "in_progress":
    case "in_use":
    case "on_site":
      return "blue";
    case "completed":
    case "available":
      return "green";
    case "scheduled":
      return "amber";
    case "on_hold":
    case "maintenance":
      return "red";
    default:
      return "neutral";
  }
}
