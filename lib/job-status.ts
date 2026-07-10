/**
 * Canonical job lifecycle statuses.
 * Stored in DB as UPPER_SNAKE (e.g. ESTIMATING). UI uses lower_snake.
 */

export type JobStatus =
  | "estimating"
  | "quoting"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "on_hold"
  | "completed";

export const JOB_STATUS_OPTIONS: { value: string; label: string; ui: JobStatus }[] = [
  { value: "ESTIMATING", label: "Estimating", ui: "estimating" },
  { value: "QUOTING", label: "Quoting", ui: "quoting" },
  { value: "QUOTED", label: "Quoted", ui: "quoted" },
  { value: "SCHEDULED", label: "Scheduled", ui: "scheduled" },
  { value: "ACTIVE", label: "In progress", ui: "in_progress" },
  { value: "ON_HOLD", label: "On hold", ui: "on_hold" },
  { value: "COMPLETE", label: "Complete", ui: "completed" },
];

export const progressForStatus: Record<JobStatus, number> = {
  estimating: 0,
  quoting: 5,
  quoted: 10,
  scheduled: 15,
  in_progress: 50,
  on_hold: 25,
  completed: 100,
};

/** DB / form token → UI status */
export function toUiStatus(status: string): JobStatus {
  const s = status.toLowerCase().replace(/-/g, "_");
  if (s.includes("estimat")) return "estimating";
  if (s === "quoting" || s === "quote") return "quoting";
  if (s === "quoted") return "quoted";
  if (s.includes("progress") || s === "active") return "in_progress";
  if (s.includes("hold")) return "on_hold";
  if (s.includes("complete") || s.includes("done")) return "completed";
  if (s.includes("schedul")) return "scheduled";
  // legacy COMPLETED token
  if (s === "completed") return "completed";
  return "estimating";
}

/** UI status → DB token */
export function toDbStatus(status: JobStatus | string): string {
  const s = status.toLowerCase().replace(/-/g, "_") as JobStatus | string;
  const map: Record<string, string> = {
    estimating: "ESTIMATING",
    quoting: "QUOTING",
    quoted: "QUOTED",
    scheduled: "SCHEDULED",
    in_progress: "ACTIVE",
    on_hold: "ON_HOLD",
    completed: "COMPLETE",
  };
  if (map[s]) return map[s];
  // already a DB token?
  const upper = status.toUpperCase();
  if (
    [
      "ESTIMATING",
      "QUOTING",
      "QUOTED",
      "SCHEDULED",
      "ACTIVE",
      "ON_HOLD",
      "COMPLETE",
      "COMPLETED",
      "CANCELLED",
    ].includes(upper)
  ) {
    return upper === "COMPLETED" ? "COMPLETE" : upper;
  }
  return "ESTIMATING";
}
