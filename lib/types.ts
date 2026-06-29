// Domain types for Excavation OS. This is a standalone client dashboard —
// all data is mocked locally (see lib/data.ts); there are no external
// integrations.

export type JobStatus = "scheduled" | "in_progress" | "on_hold" | "completed";

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
}

export type EquipmentStatus = "available" | "in_use" | "maintenance";

export type EquipmentCategory =
  | "excavator"
  | "bulldozer"
  | "backhoe"
  | "skid_steer"
  | "dump_truck"
  | "compactor";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  /** Where the machine currently is — yard or a job site. */
  location: string;
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
