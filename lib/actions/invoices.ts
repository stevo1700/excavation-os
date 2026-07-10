"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { computeTotals, parseLineItems } from "@/lib/finance";
import { resolveLineItems, type LineItemInput } from "@/lib/actions/quotes";
import type { LineItem } from "@/lib/types";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  jobName: string;
  customerId: string | null;
  customerName: string | null;
  status: string;
  total: number;
  amountPaid: number;
  dueDate: string | null;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  status: string;
  jobId: string;
  jobName: string;
  customerId: string | null;
  customerName: string | null;
  quoteId: string | null;
  quoteNumber: string | null;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: string;
  notes: string | null;
}

export interface FinancialSummary {
  outstanding: number;
  paidThisMonth: number;
  activeQuotes: number;
}

export interface InvoiceFilters {
  jobId?: string;
  customerId?: string;
  status?: string;
}

function isoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Invoices (newest first), optionally filtered. Empty list if DB unreachable. */
export async function getInvoices(
  filters: InvoiceFilters = {},
): Promise<InvoiceListItem[]> {
  try {
    const rows = await prisma.invoice.findMany({
      where: {
        jobId: filters.jobId,
        customerId: filters.customerId,
        status: filters.status,
      },
      include: { job: true, customer: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      jobName: invoice.job.name,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name ?? null,
      status: invoice.status,
      total: invoice.total.toNumber(),
      amountPaid: invoice.amountPaid.toNumber(),
      dueDate: isoDate(invoice.dueDate),
    }));
  } catch (error) {
    logActionError("getInvoices", error);
    return [];
  }
}

/** A single invoice with job + customer + quote + payment history, or null. */
export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        job: true,
        customer: true,
        quote: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
    if (!invoice) return null;
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      jobId: invoice.jobId,
      jobName: invoice.job.name,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name ?? null,
      quoteId: invoice.quoteId,
      quoteNumber: invoice.quote?.quoteNumber ?? null,
      lineItems: parseLineItems(invoice.lineItems),
      subtotal: invoice.subtotal.toNumber(),
      taxRate: invoice.taxRate.toNumber(),
      taxAmount: invoice.taxAmount.toNumber(),
      total: invoice.total.toNumber(),
      amountPaid: invoice.amountPaid.toNumber(),
      dueDate: isoDate(invoice.dueDate),
      paidAt: isoDate(invoice.paidAt),
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString().slice(0, 10),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        amount: p.amount.toNumber(),
        method: p.method,
        reference: p.reference,
        paidAt: p.paidAt.toISOString(),
        notes: p.notes,
      })),
    };
  } catch {
    return null;
  }
}

// Next sequential document number, e.g. INV-2026-0007.
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/** Create an invoice with auto-numbered id and computed totals. */
export async function createInvoice(formData: FormData): Promise<void> {
  const items = parseLineItems(formData.get("lineItems"));
  const totals = computeTotals(
    items,
    Number.parseFloat(field(formData, "taxRate")),
  );
  const dueDate = field(formData, "dueDate");
  const customerId = field(formData, "customerId");
  const quoteId = field(formData, "quoteId");

  await prisma.invoice.create({
    data: {
      jobId: field(formData, "jobId"),
      customerId: customerId || null,
      quoteId: quoteId || null,
      invoiceNumber: await nextInvoiceNumber(),
      status: "DRAFT",
      lineItems: items as unknown as Prisma.InputJsonValue,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: field(formData, "notes") || null,
    },
  });

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/documents");
}

/** Copy a quote's line items into a new draft invoice, then open it. */
export async function createInvoiceFromQuote(quoteId: string): Promise<void> {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found.");

  const invoice = await prisma.invoice.create({
    data: {
      jobId: quote.jobId,
      customerId: quote.customerId,
      quoteId: quote.id,
      invoiceNumber: await nextInvoiceNumber(),
      status: "DRAFT",
      lineItems: parseLineItems(
        quote.lineItems,
      ) as unknown as Prisma.InputJsonValue,
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
    },
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  redirect(`/dashboard/invoices/${invoice.id}`);
}

/** Mark an invoice fully paid. */
export async function markInvoicePaid(id: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Invoice not found.");
  await prisma.invoice.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date(), amountPaid: invoice.total },
  });
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
}

/** Update only the status of an invoice. */
export async function updateInvoiceStatus(
  id: string,
  status: string,
): Promise<void> {
  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
}

// --- JSON write API (used by /api/catalog/invoices) ----------------------------

function toLineItemJson(
  resolved: Awaited<ReturnType<typeof resolveLineItems>>,
): LineItem[] {
  return resolved.map((r) => ({
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    lineTotal: r.amount,
  }));
}

/** Fields accepted when creating or updating an invoice over the JSON API. */
export interface InvoiceWriteInput {
  jobId?: string;
  customerId?: string | null;
  quoteId?: string | null;
  status?: string;
  taxRatePercent?: number;
  dueDate?: string | null;
  notes?: string | null;
  lineItems?: LineItemInput[];
}

async function toInvoiceDetail(id: string): Promise<InvoiceDetail> {
  const detail = await getInvoice(id);
  if (!detail) throw new Error("Invoice vanished immediately after write.");
  return detail;
}

/** Create an invoice from a JSON payload (with normalized line items). */
export async function createInvoiceRecord(
  input: InvoiceWriteInput,
): Promise<InvoiceDetail> {
  const resolved = await resolveLineItems(input.lineItems ?? []);
  const totals = computeTotals(
    toLineItemJson(resolved),
    input.taxRatePercent ?? 0,
  );

  const invoice = await prisma.invoice.create({
    data: {
      jobId: input.jobId ?? "",
      customerId: input.customerId ?? null,
      quoteId: input.quoteId ?? null,
      invoiceNumber: await nextInvoiceNumber(),
      status: input.status ?? "DRAFT",
      lineItems: toLineItemJson(resolved) as unknown as Prisma.InputJsonValue,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes ?? null,
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
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/catalog");
  return toInvoiceDetail(invoice.id);
}

/** Apply a partial update to an invoice (JSON API), or null if it doesn't exist. */
export async function updateInvoiceRecord(
  id: string,
  input: InvoiceWriteInput,
): Promise<InvoiceDetail | null> {
  const existing = await prisma.invoice.findUnique({ where: { id } });
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

  await prisma.invoice.update({
    where: { id },
    data: {
      ...(input.jobId !== undefined ? { jobId: input.jobId } : {}),
      ...(input.customerId !== undefined
        ? { customerId: input.customerId }
        : {}),
      ...(input.quoteId !== undefined ? { quoteId: input.quoteId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...lineItemFields,
    },
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return toInvoiceDetail(id);
}

// --- Payments --------------------------------------------------------------

export interface PaymentInput {
  amount: number;
  method?: string;
  reference?: string | null;
  notes?: string | null;
}

export interface RecordPaymentResult {
  ok: boolean;
  invoice?: InvoiceDetail;
  error?: string;
}

/**
 * Record a payment against an invoice: creates the Payment row, recomputes
 * amountPaid as the sum of all payments, and sets status to PARTIAL or PAID
 * accordingly (PAID also stamps paidAt). Returns an error result rather than
 * throwing for an unknown invoice, so the route handler can map it to 404.
 */
export async function recordPayment(
  invoiceId: string,
  input: PaymentInput,
): Promise<RecordPaymentResult> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { ok: false, error: "Invoice not found." };

  await prisma.payment.create({
    data: {
      invoiceId,
      amount: input.amount,
      method: input.method ?? "OTHER",
      reference: input.reference ?? null,
      notes: input.notes ?? null,
    },
  });

  const sum = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });
  const amountPaid = sum._sum.amount?.toNumber() ?? 0;
  const total = invoice.total.toNumber();
  const status =
    amountPaid >= total ? "PAID" : amountPaid > 0 ? "PARTIAL" : invoice.status;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid,
      status,
      paidAt: status === "PAID" ? new Date() : invoice.paidAt,
    },
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  return { ok: true, invoice: await toInvoiceDetail(invoiceId) };
}

/** Headline financial figures for the overview. Returns zeros on any failure. */
export async function getFinancialSummary(): Promise<FinancialSummary> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [outstanding, paid, activeQuotes] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: ["SENT", "OVERDUE"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { amountPaid: true },
        where: { paidAt: { gte: startOfMonth } },
      }),
      prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    ]);

    return {
      outstanding: outstanding._sum.total?.toNumber() ?? 0,
      paidThisMonth: paid._sum.amountPaid?.toNumber() ?? 0,
      activeQuotes,
    };
  } catch (error) {
    logActionError("getFinancialSummary", error);
    return { outstanding: 0, paidThisMonth: 0, activeQuotes: 0 };
  }
}
