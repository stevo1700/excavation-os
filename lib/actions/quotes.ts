"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import {
  computeTotals,
  isApprovedQuoteStatus,
  parseLineItems,
} from "@/lib/finance";
import type { LineItem } from "@/lib/types";

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  title: string | null;
  jobName: string;
  customerId: string | null;
  customerName: string | null;
  status: string;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

export interface QuoteDetail {
  id: string;
  quoteNumber: string;
  title: string | null;
  status: string;
  jobId: string;
  jobName: string;
  customerId: string | null;
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
      title: quote.title,
      jobName: quote.job.name,
      customerId: quote.customerId,
      customerName: quote.customer?.name ?? null,
      status: quote.status,
      total: quote.total.toNumber(),
      validUntil: isoDate(quote.validUntil),
      createdAt: quote.createdAt.toISOString().slice(0, 10),
    }));
  } catch (error) {
    logActionError("getQuotes", error);
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
      title: quote.title,
      status: quote.status,
      jobId: quote.jobId,
      jobName: quote.job.name,
      customerId: quote.customerId,
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
      title: field(formData, "title") || null,
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
  redirect("/dashboard/documents");
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

// --- JSON write API (used by /api/catalog/quotes) ------------------------------

/** One line item as accepted by the catalog quote/invoice write API. */
export interface LineItemInput {
  catalogItemId?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
}

/** A resolved line item, ready to persist as a normalized row. */
export interface ResolvedLineItem {
  catalogItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Resolve line-item input against the catalog: entries with a catalogItemId
 * inherit description/unitPrice from that CatalogItem unless overridden.
 * Unknown catalogItemIds are treated as ad-hoc (id dropped, values as given).
 */
export async function resolveLineItems(
  items: LineItemInput[],
): Promise<ResolvedLineItem[]> {
  const catalogIds = [
    ...new Set(
      items.map((i) => i.catalogItemId).filter((id): id is string => !!id),
    ),
  ];
  const catalogItems = catalogIds.length
    ? await prisma.catalogItem.findMany({ where: { id: { in: catalogIds } } })
    : [];
  const byId = new Map(catalogItems.map((c) => [c.id, c]));

  return items.map((item) => {
    const catalogItem = item.catalogItemId
      ? byId.get(item.catalogItemId)
      : undefined;
    const description = item.description ?? catalogItem?.name ?? "";
    const unitPrice =
      item.unitPrice ?? (catalogItem ? catalogItem.unitPrice.toNumber() : 0);
    const quantity = item.quantity;
    return {
      catalogItemId: catalogItem?.id ?? null,
      description,
      quantity,
      unitPrice,
      amount: Math.round(quantity * unitPrice * 100) / 100,
    };
  });
}

function toLineItemJson(resolved: ResolvedLineItem[]): LineItem[] {
  return resolved.map((r) => ({
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    lineTotal: r.amount,
  }));
}

/** Fields accepted when creating or updating a quote over the JSON API. */
export interface QuoteWriteInput {
  title?: string | null;
  jobId?: string;
  customerId?: string | null;
  status?: string;
  taxRatePercent?: number;
  notes?: string | null;
  validUntil?: string | null;
  lineItems?: LineItemInput[];
}

/** Create a quote from a JSON payload (with normalized line items), returned in detail shape. */
export async function createQuoteRecord(
  input: QuoteWriteInput,
): Promise<QuoteDetail> {
  const resolved = await resolveLineItems(input.lineItems ?? []);
  const totals = computeTotals(
    toLineItemJson(resolved),
    input.taxRatePercent ?? 0,
  );

  const quote = await prisma.quote.create({
    data: {
      title: input.title ?? null,
      jobId: input.jobId ?? "",
      customerId: input.customerId ?? null,
      quoteNumber: await nextQuoteNumber(),
      status: input.status ?? "DRAFT",
      lineItems: toLineItemJson(resolved) as unknown as Prisma.InputJsonValue,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      notes: input.notes ?? null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      lineItemRows: {
        create: resolved.map((item, index) => ({
          catalogItemId: item.catalogItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: index,
        })),
      },
    },
    include: { job: true, customer: true },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/catalog");
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    status: quote.status,
    jobId: quote.jobId,
    jobName: quote.job.name,
    customerId: quote.customerId,
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
}

/** Apply a partial update to a quote (JSON API), or null if it doesn't exist. */
export async function updateQuoteRecord(
  id: string,
  input: QuoteWriteInput,
): Promise<QuoteDetail | null> {
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) return null;

  let lineItemFields: Record<string, unknown> = {};
  if (input.lineItems) {
    const resolved = await resolveLineItems(input.lineItems);
    const totals = computeTotals(
      toLineItemJson(resolved),
      input.taxRatePercent ?? existing.taxRate.toNumber() * 100,
    );
    lineItemFields = {
      lineItems: toLineItemJson(resolved) as unknown as Prisma.InputJsonValue,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      lineItemRows: {
        deleteMany: {},
        create: resolved.map((item, index) => ({
          catalogItemId: item.catalogItemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: index,
        })),
      },
    };
  }

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
      ...(input.customerId !== undefined
        ? { customerId: input.customerId }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.validUntil !== undefined
        ? { validUntil: input.validUntil ? new Date(input.validUntil) : null }
        : {}),
      ...lineItemFields,
    },
    include: { job: true, customer: true },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${id}`);
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    status: quote.status,
    jobId: quote.jobId,
    jobName: quote.job.name,
    customerId: quote.customerId,
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
}

export interface ConvertResult {
  ok: boolean;
  invoiceId?: string;
  error?: string;
}

/**
 * Convert an approved quote to a draft invoice: copies both the JSON line
 * items (for the existing UI) and the normalized QuoteLineItem rows (into
 * InvoiceLineItem). Only quotes with status ACCEPTED/APPROVED convert; others
 * return an error rather than throwing, so the route handler can map it to a
 * 400 cleanly.
 */
export async function convertQuoteToInvoiceRecord(
  quoteId: string,
): Promise<ConvertResult> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { lineItemRows: true },
  });
  if (!quote) return { ok: false, error: "Quote not found." };
  if (!isApprovedQuoteStatus(quote.status)) {
    return {
      ok: false,
      error: "Only an approved (ACCEPTED/APPROVED) quote can be converted.",
    };
  }

  const { nextInvoiceNumber } = await import("./invoices");
  const invoice = await prisma.invoice.create({
    data: {
      jobId: quote.jobId,
      customerId: quote.customerId,
      quoteId: quote.id,
      invoiceNumber: await nextInvoiceNumber(),
      status: "DRAFT",
      lineItems: quote.lineItems as Prisma.InputJsonValue,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      lineItemRows: {
        create: quote.lineItemRows.map((row) => ({
          catalogItemId: row.catalogItemId,
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          amount: row.amount,
          sortOrder: row.sortOrder,
        })),
      },
    },
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/dashboard/catalog");
  return { ok: true, invoiceId: invoice.id };
}
