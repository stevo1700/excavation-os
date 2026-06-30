"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { computeTotals, parseLineItems } from "@/lib/finance";
import type { LineItem } from "@/lib/types";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  jobName: string;
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

/** A single invoice with job + customer + quote, or null. */
export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { job: true, customer: true, quote: true },
    });
    if (!invoice) return null;
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      jobId: invoice.jobId,
      jobName: invoice.job.name,
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
    };
  } catch {
    return null;
  }
}

// Next sequential document number, e.g. INV-2026-0007.
async function nextInvoiceNumber(): Promise<string> {
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
  redirect("/dashboard/invoices");
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
