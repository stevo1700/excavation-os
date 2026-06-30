-- Phase 7 — Kanban boards. Run in the Neon SQL editor (read-only-from-sandbox,
-- so apply these by hand). Safe to run once.

-- Customers CRM pipeline stage.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "stage" TEXT NOT NULL DEFAULT 'Lead';

-- Schedule board: the day a job is scheduled for.
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "scheduledDate" DATE;

-- Crew board status (the reconciled schema derived status from `active`; the
-- board needs an explicit column with the four board values).
ALTER TABLE "CrewMember" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'available';
