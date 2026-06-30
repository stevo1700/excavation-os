// Small helpers shared by the write route handlers (POST/PATCH under app/api).
// They keep validation terse and the 400 responses consistently shaped.

import { NextResponse } from "next/server";

/** A 400 with a descriptive message (and optional extra fields, e.g. `allowed`). */
export function badRequest(
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status: 400 });
}

/**
 * Parse a request body that must be a JSON object. Returns either the parsed
 * object or a ready-to-return 400 response (invalid JSON / not an object).
 */
export async function readJsonObject(
  request: Request,
): Promise<
  | { body: Record<string, unknown>; error?: never }
  | { body?: never; error: NextResponse }
> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return { error: badRequest("Invalid JSON body.") };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: badRequest("Request body must be a JSON object.") };
  }
  return { body: parsed as Record<string, unknown> };
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** True if value is a string, null, or absent (a valid optional free-text field). */
export function isOptionalString(
  value: unknown,
): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

/** True if value is undefined OR a string parseable as a date. */
export function isOptionalDateString(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false;
  return !Number.isNaN(new Date(value).getTime());
}
