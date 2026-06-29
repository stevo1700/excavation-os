// Domain types for Excavation OS. This is a standalone client dashboard —
// all data is mocked locally (see lib/data.ts and lib/mock-reports.ts); there
// are no external integrations.

export type JobStatus = "scheduled" | "in_progress" | "on_hold" | "completed";

/**
 * A stable color key assigned to each job. The same key is used everywhere the
 * job appears (schedule, detail, charts) so a job is visually recognizable at a
 * glance. See `jobColor` in lib/utils.ts for the class mapping.
 */
export type JobColor =
  | "amber"
  | "sky"
  | "emerald"
  | "violet"
  | "rose"
  | "cyan"
  | "orange"
  | "indigo"
  | "teal"
  | "fuchsia";

export interface Job {
  id: string;
  name: string;
  client: string;
  site: string;
  status: JobStatus;
  /** Crew lead responsible for the job. */
  foreman: string;
  /** Percentage of work completed, 0–100. */
  progress: number;
  startDate: string;
  dueDate: string;
  /** Contract value in USD. */
  value: number;
  /** Consistent color key for this job across the UI. */
  color: JobColor;
  /** Longer description shown on the job detail page. */
  description: string;
  /** Free-form notes captured against the job. */
  notes: JobNote[];
}

export interface JobNote {
  id: string;
  author: string;
  date: string;
  body: string;
}

export type EquipmentStatus = "available" | "in_use" | "maintenance";

export type EquipmentCategory =
  | "excavator"
  | "bulldozer"
  | "backhoe"
  | "skid_steer"
  | "dump_truck"
  | "compactor"
  | "grader"
  | "loader";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  /** Where the machine currently is — yard or a job site. */
  location: string;
  /** Job id the machine is currently working, if any. */
  assignedJob: string | null;
  hoursLogged: number;
  nextServiceHours: number;
}

export type CrewRole =
  "foreman" | "operator" | "laborer" | "surveyor" | "mechanic";

export type CrewStatus = "on_site" | "available" | "off";

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  status: CrewStatus;
  /** Job id the member is currently assigned to, if any. */
  assignedJob: string | null;
  certifications: string[];
  phone: string;
}

export interface Kpi {
  label: string;
  value: string;
  /** Signed percentage change vs. the previous period, e.g. +12. */
  change: number;
  hint: string;
}

export type ActivityKind =
  | "job_started"
  | "crew_assigned"
  | "equipment_moved"
  | "report_submitted"
  | "job_completed";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Short headline, e.g. "Riverside foundation dig started". */
  title: string;
  /** Supporting detail line. */
  detail: string;
  /** ISO timestamp of when the event occurred. */
  timestamp: string;
  /** Related job id, if any — used to color the entry. */
  jobId: string | null;
}

export interface RevenuePoint {
  /** Short week label, e.g. "Jun 1". */
  week: string;
  /** Revenue billed that week, in USD. */
  revenue: number;
}

export type Weather = "Clear" | "Cloudy" | "Light rain" | "Rain" | "Windy";

export interface DailyReport {
  id: string;
  jobId: string;
  date: string;
  submittedBy: string;
  summary: string;
  weather: Weather;
  /** High temperature in °F. */
  tempHigh: number;
  /** Crew headcount on site that day. */
  crewCount: number;
  /** Hours worked across the crew. */
  hoursWorked: number;
}
