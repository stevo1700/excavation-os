-- Phase 4 — Operations layer schema additions.
--
-- Run this in the Neon SQL editor (the sandbox cannot reach Postgres on TCP
-- 5432, so prisma db push / migrate are not used). Safe to run once.

-- 1. Allow soft-deleting a job by setting its status to CANCELLED.
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- 2. Timesheet entries — hours a crew member logged against a job on a day.
CREATE TABLE IF NOT EXISTS "TimesheetEntry" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "crewMemberId" TEXT NOT NULL REFERENCES "CrewMember"("id") ON DELETE CASCADE,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "hoursWorked" DECIMAL(5,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Client portal tokens — random slug shared with a client for read-only access.
CREATE TABLE IF NOT EXISTS "ClientPortalToken" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "ClientPortalToken_token_idx" ON "ClientPortalToken"("token");
