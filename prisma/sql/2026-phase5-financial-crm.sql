-- Phase 5 — Financial layer + CRM schema additions.
--
-- Run this in the Neon SQL editor (the sandbox cannot reach Postgres on TCP
-- 5432). Safe to run once; re-running is guarded where it matters.

-- 1. Customer CRM table.
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Link jobs to customers (nullable so existing jobs aren't broken).
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "customerId" TEXT
  REFERENCES "Customer"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "Job_customerId_idx" ON "Job"("customerId");

-- 3. Quotes.
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "quoteNumber" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | SENT | ACCEPTED | DECLINED
  "lineItems" JSONB NOT NULL DEFAULT '[]',
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "validUntil" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoices.
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "quoteId" TEXT REFERENCES "Quote"("id") ON DELETE SET NULL,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | SENT | PAID | OVERDUE | VOID
  "lineItems" JSONB NOT NULL DEFAULT '[]',
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "dueDate" DATE,
  "paidAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed 5 customers (only when the table is empty), matching existing job
--    clients so the CRM isn't empty.
INSERT INTO "Customer" ("name", "contactName", "email", "phone", "address")
SELECT * FROM (
  VALUES
    ('Hollis Development', 'Dana Hollis', 'dana@hollisdev.com', '555-0110', '900 Market St, Suite 400'),
    ('County Public Works', 'Reggie Munoz', 'rmunoz@countypw.gov', '555-0120', '14 Civic Center Plaza'),
    ('Northpoint Logistics', 'Priya Shah', 'pshah@northpoint.co', '555-0130', '780 Industrial Blvd'),
    ('Harbor Authority', 'Glen Powell', 'gpowell@harborauth.org', '555-0140', 'Pier 4 Administration'),
    ('Meridian Real Estate', 'Tess Caldwell', 'tess@meridianre.com', '555-0150', '1 Innovation Way')
) AS seed(name, "contactName", email, phone, address)
WHERE NOT EXISTS (SELECT 1 FROM "Customer");

-- 6. Backfill Job.customerId by matching the existing client name.
UPDATE "Job" j
SET "customerId" = c."id"
FROM "Customer" c
WHERE j."client" = c."name" AND j."customerId" IS NULL;
