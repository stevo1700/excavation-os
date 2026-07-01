// Small helpers shared by the write route handlers (POST/PATCH under app/api).
// They keep validation terse and the 400 responses consistently shaped.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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

/** True if `error` is a Prisma unique-constraint violation (e.g. a duplicate asset tag). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * True if `error` is Prisma reporting that a table/column the schema expects
 * doesn't exist in the database (P2021/P2022) — i.e. `prisma generate` ran
 * (the client's TypeScript types match schema.prisma) but the corresponding
 * `prisma db push` / migration was never applied to this DATABASE_URL, so the
 * physical database is still on an older shape.
 */
export function isMissingTableOrColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

/** A clear 503 for {@link isMissingTableOrColumnError}, instead of an opaque 500. */
export function schemaMismatchResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "This feature's database schema hasn't been applied yet. Run `npx prisma db push` against the configured DATABASE_URL, then retry.",
    },
    { status: 503 },
  );
}
