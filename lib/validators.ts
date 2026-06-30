// Request-body validation for the write route handlers. Each validator returns
// either a typed input object or a ready-to-return 400 response, so the route
// handlers stay thin and the 400 messages stay consistent.

import type { NextResponse } from "next/server";
import {
  badRequest,
  isFiniteNumber,
  isNonEmptyString,
  isOptionalDateString,
  isOptionalString,
} from "@/lib/http";
import type { JobWriteInput } from "@/lib/actions/jobs";
import type { EquipmentWriteInput } from "@/lib/actions/equipment";
import type { CrewUpdateInput, NewCrewMember } from "@/lib/actions/crew";
import type {
  CrewRole,
  CrewStatus,
  EquipmentStatus,
  JobStatus,
} from "@/lib/types";

export const JOB_STATUSES: JobStatus[] = [
  "scheduled",
  "in_progress",
  "on_hold",
  "completed",
];
export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "available",
  "in_use",
  "maintenance",
];
export const CREW_ROLES: CrewRole[] = [
  "foreman",
  "operator",
  "laborer",
  "surveyor",
  "mechanic",
];
export const CREW_STATUSES: CrewStatus[] = ["on_site", "available", "off"];

type Body = Record<string, unknown>;
type Result<T> =
  { input: T; error?: never } | { input?: never; error: NextResponse };

// --- jobs ---------------------------------------------------------------------

export function validateJobInput(
  body: Body,
  mode: "create" | "update",
): Result<JobWriteInput> {
  if (mode === "create") {
    if (!isNonEmptyString(body.name)) {
      return { error: badRequest("`name` is required.") };
    }
    if (!isNonEmptyString(body.client)) {
      return { error: badRequest("`client` is required.") };
    }
  } else {
    if (body.name !== undefined && !isNonEmptyString(body.name)) {
      return { error: badRequest("`name` must be a non-empty string.") };
    }
    if (body.client !== undefined && !isNonEmptyString(body.client)) {
      return { error: badRequest("`client` must be a non-empty string.") };
    }
  }

  if (
    body.status !== undefined &&
    !JOB_STATUSES.includes(body.status as JobStatus)
  ) {
    return {
      error: badRequest("Invalid `status`.", { allowed: JOB_STATUSES }),
    };
  }
  if (body.value !== undefined && !isFiniteNumber(body.value)) {
    return { error: badRequest("`value` must be a number.") };
  }
  for (const key of ["startDate", "dueDate", "scheduledDate"] as const) {
    if (!isOptionalDateString(body[key])) {
      return { error: badRequest(`\`${key}\` must be a valid date string.`) };
    }
  }
  for (const key of ["address", "city", "state", "description"] as const) {
    if (!isOptionalString(body[key])) {
      return { error: badRequest(`\`${key}\` must be a string.`) };
    }
  }

  const input: JobWriteInput = {};
  if (body.name !== undefined) input.name = (body.name as string).trim();
  if (body.client !== undefined) input.client = (body.client as string).trim();
  if (body.status !== undefined) input.status = body.status as JobStatus;
  if (body.value !== undefined) input.value = body.value as number;
  if (body.startDate !== undefined) {
    input.startDate = body.startDate as string | null;
  }
  if (body.dueDate !== undefined) input.dueDate = body.dueDate as string | null;
  if (body.scheduledDate !== undefined) {
    input.scheduledDate = body.scheduledDate as string | null;
  }
  if (body.address !== undefined) input.address = body.address as string | null;
  if (body.city !== undefined) input.city = body.city as string | null;
  if (body.state !== undefined) input.state = body.state as string | null;
  if (body.description !== undefined) {
    input.description = body.description as string | null;
  }
  return { input };
}

// --- equipment ----------------------------------------------------------------

export function validateEquipmentInput(
  body: Body,
  mode: "create" | "update",
): Result<EquipmentWriteInput> {
  // Accept `type` or its `category` alias.
  const type = body.type ?? body.category;

  if (mode === "create") {
    if (!isNonEmptyString(body.name)) {
      return { error: badRequest("`name` is required.") };
    }
    if (!isNonEmptyString(type)) {
      return { error: badRequest("`type` (or `category`) is required.") };
    }
  } else {
    if (body.name !== undefined && !isNonEmptyString(body.name)) {
      return { error: badRequest("`name` must be a non-empty string.") };
    }
    if (type !== undefined && !isNonEmptyString(type)) {
      return { error: badRequest("`type` must be a non-empty string.") };
    }
  }

  if (
    body.status !== undefined &&
    !EQUIPMENT_STATUSES.includes(body.status as EquipmentStatus)
  ) {
    return {
      error: badRequest("Invalid `status`.", { allowed: EQUIPMENT_STATUSES }),
    };
  }
  if (
    body.year !== undefined &&
    body.year !== null &&
    !isFiniteNumber(body.year)
  ) {
    return { error: badRequest("`year` must be a number.") };
  }
  for (const key of [
    "make",
    "model",
    "serialNumber",
    "jobId",
    "notes",
  ] as const) {
    if (!isOptionalString(body[key])) {
      return { error: badRequest(`\`${key}\` must be a string.`) };
    }
  }

  const input: EquipmentWriteInput = {};
  if (body.name !== undefined) input.name = (body.name as string).trim();
  if (type !== undefined) input.type = (type as string).trim();
  if (body.status !== undefined) input.status = body.status as EquipmentStatus;
  if (body.year !== undefined) input.year = body.year as number | null;
  if (body.make !== undefined) input.make = body.make as string | null;
  if (body.model !== undefined) input.model = body.model as string | null;
  if (body.serialNumber !== undefined) {
    input.serialNumber = body.serialNumber as string | null;
  }
  if (body.jobId !== undefined) input.jobId = body.jobId as string | null;
  if (body.notes !== undefined) input.notes = body.notes as string | null;
  return { input };
}

// --- crew ---------------------------------------------------------------------

export function validateCrewCreate(body: Body): Result<NewCrewMember> {
  if (!isNonEmptyString(body.name)) {
    return { error: badRequest("`name` is required.") };
  }
  if (
    !isNonEmptyString(body.role) ||
    !CREW_ROLES.includes(body.role as CrewRole)
  ) {
    return {
      error: badRequest("`role` is required.", { allowed: CREW_ROLES }),
    };
  }
  if (
    body.status !== undefined &&
    !CREW_STATUSES.includes(body.status as CrewStatus)
  ) {
    return {
      error: badRequest("Invalid `status`.", { allowed: CREW_STATUSES }),
    };
  }
  if (body.phone !== undefined && typeof body.phone !== "string") {
    return { error: badRequest("`phone` must be a string.") };
  }
  if (!isOptionalString(body.jobId)) {
    return { error: badRequest("`jobId` must be a string.") };
  }

  const input: NewCrewMember = {
    name: (body.name as string).trim(),
    role: body.role as CrewRole,
  };
  if (body.phone !== undefined) input.phone = body.phone as string;
  if (body.status !== undefined) input.status = body.status as CrewStatus;
  if (body.jobId !== undefined) input.jobId = body.jobId as string | null;
  return { input };
}

export function validateCrewUpdate(body: Body): Result<CrewUpdateInput> {
  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    return { error: badRequest("`name` must be a non-empty string.") };
  }
  if (body.role !== undefined && !CREW_ROLES.includes(body.role as CrewRole)) {
    return { error: badRequest("Invalid `role`.", { allowed: CREW_ROLES }) };
  }
  if (
    body.status !== undefined &&
    !CREW_STATUSES.includes(body.status as CrewStatus)
  ) {
    return {
      error: badRequest("Invalid `status`.", { allowed: CREW_STATUSES }),
    };
  }
  if (!isOptionalString(body.phone)) {
    return { error: badRequest("`phone` must be a string.") };
  }
  if (!isOptionalString(body.jobId)) {
    return { error: badRequest("`jobId` must be a string.") };
  }

  const input: CrewUpdateInput = {};
  if (body.name !== undefined) input.name = (body.name as string).trim();
  if (body.role !== undefined) input.role = body.role as CrewRole;
  if (body.status !== undefined) input.status = body.status as CrewStatus;
  if (body.phone !== undefined) input.phone = body.phone as string | null;
  if (body.jobId !== undefined) input.jobId = body.jobId as string | null;
  return { input };
}
