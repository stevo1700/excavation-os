"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeTotals, parseLineItems } from "@/lib/finance";
import type { LineItem } from "@/lib/types";

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  jobName: string;
  customerName: string | null;
  status: string;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

export interface QuoteDetail {
  id: string;
  quoteNumber: string;
  status: string;
  jobId: string;
  jobName: string;
  customerName: string | null;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
}

export interface JobOption {
  id: string;
  name: string;
  customerId: string | null;
}

export interface QuoteOption {
  id: string;
  quoteNumber: string;
  jobId: string;
}

export interface QuoteFilters {
  jobId?: string;
  customerId?: string;
  status?: string;
}

function isoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Quotes (newest first), optionally filtered. Empty list if DB unreachable. */
export async function getQuotes(
  filters: QuoteFilters = {},
): Promise<QuoteListItem[]> {
  try {
    const rows = await prisma.quote.findMany({
      where: {
        jobId: filters.jobId,
        customerId: filters.customerId,
        status: filters.status,
      },
      include: { job: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      jobName: quote.job.name,
      customerName: quote.customer?.name ?? null,
      status: quote.status,
      total: quote.total.toNumber(),
      validUntil: isoDate(quote.validUntil),
      createdAt: quote.createdAt.toISOString().slice(0, 10),
    }));
  } catch {
    return [];
  }
}

/** A single quote with job + customer, or null. */
export async function getQuote(id: string): Promise<QuoteDetail | null> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: { job: true, customer: true },
    });
    if (!quote) return null;
    return {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      jobId: quote.jobId,
      jobName: quote.job.name,
      customerName: quote.customer?.name ?? null,
      lineItems: parseLineItems(quote.lineItems),
      subtotal: quote.subtotal.toNumber(),
      taxRate: quote.taxRate.toNumber(),
      taxAmount: quote.taxAmount.toNumber(),
      total: quote.total.toNumber(),
      notes: quote.notes,
      validUntil: isoDate(quote.validUntil),
      createdAt: quote.createdAt.toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

/** Non-cancelled jobs as {id, name, customerId} options for finance forms. */
export async function getJobOptions(): Promise<JobOption[]> {
  try {
    return await prisma.job.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { id: true, name: true, customerId: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

/** Quotes as options for linking from an invoice. */
export async function getQuoteOptions(): Promise<QuoteOption[]> {
  try {
    return await prisma.quote.findMany({
      select: { id: true, quoteNumber: true, jobId: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

// Next sequential document number, e.g. QUO-2026-0007.
async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Create a quote with auto-numbered id and computed totals. */
export async function createQuote(formData: FormData): Promise<void> {
  const items = parseLineItems(formData.get("lineItems"));
  const totals = computeTotals(
    items,
    Number.parseFloat(field(formData, "taxRate")),
  );
  const validUntil = field(formData, "validUntil");
  const customerId = field(formData, "customerId");

  await prisma.quote.create({
    data: {
      jobId: field(formData, "jobId"),
      customerId: customerId || null,
      quoteNumber: await nextQuoteNumber(),
      status: "DRAFT",
      lineItems: items as unknown as Prisma.InputJsonValue,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: field(formData, "notes") || null,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });

  revalidatePath("/dashboard/quotes");
  redirect("/dashboard/quotes");
}

/** Update only the status of a quote. */
export async function updateQuoteStatus(
  id: string,
  status: string,
): Promise<void> {
  await prisma.quote.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${id}`);
}
