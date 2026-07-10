"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { isApprovedQuoteStatus, parseLineItems } from "@/lib/finance";
import type { CatalogCategory } from "@/lib/catalog-categories";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";

export interface BudgetLineView {
  id: string;
  jobId: string;
  description: string;
  category: CatalogCategory;
  catalogItemId: string | null;
  unit: string;
  budgetQty: number;
  budgetUnitPrice: number;
  budgetAmount: number;
  actualQty: number;
  actualUnitPrice: number;
  actualAmount: number;
  quotedAmount: number;
  invoicedAmount: number;
  /** actual - budget (positive = over budget) */
  variance: number;
  /** actual / budget * 100 when budget > 0 */
  percentUsed: number | null;
  notes: string | null;
  sortOrder: number;
}

export interface BudgetCategoryRollup {
  category: CatalogCategory;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  percentUsed: number | null;
  lineCount: number;
}

export interface JobBudgetSnapshot {
  lines: BudgetLineView[];
  byCategory: BudgetCategoryRollup[];
  budgetTotal: number;
  actualTotal: number;
  quotedTotal: number;
  invoicedTotal: number;
  variance: number;
  percentUsed: number | null;
  lineCount: number;
}

function money(
  value: { toNumber(): number } | number | null | undefined,
): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function asCategory(raw: string | null | undefined): CatalogCategory {
  const upper = (raw ?? "OTHER").toUpperCase();
  return (CATALOG_CATEGORIES as string[]).includes(upper)
    ? (upper as CatalogCategory)
    : "OTHER";
}

function toView(row: {
  id: string;
  jobId: string;
  description: string;
  category: string;
  catalogItemId: string | null;
  unit: string;
  budgetQty: { toNumber(): number } | number;
  budgetUnitPrice: { toNumber(): number } | number;
  budgetAmount: { toNumber(): number } | number;
  actualQty: { toNumber(): number } | number;
  actualUnitPrice: { toNumber(): number } | number;
  actualAmount: { toNumber(): number } | number;
  quotedAmount?: { toNumber(): number } | number | null;
  invoicedAmount?: { toNumber(): number } | number | null;
  notes: string | null;
  sortOrder: number;
}): BudgetLineView {
  const budgetAmount = money(row.budgetAmount);
  const actualAmount = money(row.actualAmount);
  return {
    id: row.id,
    jobId: row.jobId,
    description: row.description,
    category: asCategory(row.category),
    catalogItemId: row.catalogItemId,
    unit: row.unit,
    budgetQty: money(row.budgetQty),
    budgetUnitPrice: money(row.budgetUnitPrice),
    budgetAmount,
    actualQty: money(row.actualQty),
    actualUnitPrice: money(row.actualUnitPrice),
    actualAmount,
    quotedAmount: money(row.quotedAmount),
    invoicedAmount: money(row.invoicedAmount),
    variance: round2(actualAmount - budgetAmount),
    percentUsed:
      budgetAmount > 0 ? round2((actualAmount / budgetAmount) * 100) : null,
    notes: row.notes,
    sortOrder: row.sortOrder,
  };
}

function rollup(lines: BudgetLineView[]): JobBudgetSnapshot {
  const byCat = new Map<CatalogCategory, BudgetCategoryRollup>();
  for (const cat of CATALOG_CATEGORIES) {
    byCat.set(cat, {
      category: cat,
      budgetAmount: 0,
      actualAmount: 0,
      variance: 0,
      percentUsed: null,
      lineCount: 0,
    });
  }
  for (const line of lines) {
    const bucket = byCat.get(line.category)!;
    bucket.budgetAmount = round2(bucket.budgetAmount + line.budgetAmount);
    bucket.actualAmount = round2(bucket.actualAmount + line.actualAmount);
    bucket.lineCount += 1;
  }
  const byCategory = CATALOG_CATEGORIES.map((cat) => {
    const b = byCat.get(cat)!;
    b.variance = round2(b.actualAmount - b.budgetAmount);
    b.percentUsed =
      b.budgetAmount > 0
        ? round2((b.actualAmount / b.budgetAmount) * 100)
        : null;
    return b;
  }).filter((b) => b.lineCount > 0 || b.budgetAmount > 0 || b.actualAmount > 0);

  const budgetTotal = round2(lines.reduce((s, l) => s + l.budgetAmount, 0));
  const actualTotal = round2(lines.reduce((s, l) => s + l.actualAmount, 0));
  const quotedTotal = round2(lines.reduce((s, l) => s + l.quotedAmount, 0));
  const invoicedTotal = round2(lines.reduce((s, l) => s + l.invoicedAmount, 0));
  return {
    lines,
    byCategory,
    budgetTotal,
    actualTotal,
    quotedTotal,
    invoicedTotal,
    variance: round2(actualTotal - budgetTotal),
    percentUsed:
      budgetTotal > 0 ? round2((actualTotal / budgetTotal) * 100) : null,
    lineCount: lines.length,
  };
}

function revalidateJob(jobId: string) {
  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/invoices");
}

/** Full budget snapshot for a job. */
export async function getJobBudget(jobId: string): Promise<JobBudgetSnapshot> {
  try {
    const rows = await prisma.jobBudgetLine.findMany({
      where: { jobId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return rollup(rows.map(toView));
  } catch (error) {
    logActionError("getJobBudget", error);
    return {
      lines: [],
      byCategory: [],
      budgetTotal: 0,
      actualTotal: 0,
      quotedTotal: 0,
      invoicedTotal: 0,
      variance: 0,
      percentUsed: null,
      lineCount: 0,
    };
  }
}

export async function addBudgetLine(input: {
  jobId: string;
  description: string;
  category?: string;
  catalogItemId?: string | null;
  unit?: string;
  budgetQty?: number;
  budgetUnitPrice?: number;
  actualQty?: number;
  actualUnitPrice?: number;
  notes?: string;
}): Promise<BudgetLineView> {
  const budgetQty = input.budgetQty ?? 1;
  const budgetUnitPrice = input.budgetUnitPrice ?? 0;
  const actualQty = input.actualQty ?? 0;
  const actualUnitPrice = input.actualUnitPrice ?? 0;
  const maxSort = await prisma.jobBudgetLine.aggregate({
    where: { jobId: input.jobId },
    _max: { sortOrder: true },
  });

  const created = await prisma.jobBudgetLine.create({
    data: {
      jobId: input.jobId,
      description: input.description.trim() || "Untitled",
      category: asCategory(input.category),
      catalogItemId: input.catalogItemId ?? null,
      unit: input.unit?.trim() || "each",
      budgetQty,
      budgetUnitPrice,
      budgetAmount: round2(budgetQty * budgetUnitPrice),
      actualQty,
      actualUnitPrice,
      actualAmount: round2(actualQty * actualUnitPrice),
      notes: input.notes?.trim() || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateJob(input.jobId);
  return toView(created);
}

/** Add a budget line from a catalog item (qty optional, defaults 1). */
export async function addBudgetLineFromCatalog(
  jobId: string,
  catalogItemId: string,
  qty = 1,
): Promise<BudgetLineView> {
  const item = await prisma.catalogItem.findUnique({
    where: { id: catalogItemId },
  });
  if (!item || !item.active) {
    throw new Error("Catalog item not found or inactive.");
  }
  return addBudgetLine({
    jobId,
    description: item.name,
    category: item.category,
    catalogItemId: item.id,
    unit: item.unit,
    budgetQty: qty,
    budgetUnitPrice: money(item.unitPrice),
  });
}

export async function updateBudgetLine(
  id: string,
  input: {
    description?: string;
    category?: string;
    unit?: string;
    budgetQty?: number;
    budgetUnitPrice?: number;
    actualQty?: number;
    actualUnitPrice?: number;
    notes?: string | null;
  },
): Promise<BudgetLineView | null> {
  const existing = await prisma.jobBudgetLine.findUnique({ where: { id } });
  if (!existing) return null;

  const budgetQty =
    input.budgetQty !== undefined ? input.budgetQty : money(existing.budgetQty);
  const budgetUnitPrice =
    input.budgetUnitPrice !== undefined
      ? input.budgetUnitPrice
      : money(existing.budgetUnitPrice);
  const actualQty =
    input.actualQty !== undefined ? input.actualQty : money(existing.actualQty);
  const actualUnitPrice =
    input.actualUnitPrice !== undefined
      ? input.actualUnitPrice
      : money(existing.actualUnitPrice);

  const updated = await prisma.jobBudgetLine.update({
    where: { id },
    data: {
      ...(input.description !== undefined
        ? { description: input.description.trim() || existing.description }
        : {}),
      ...(input.category !== undefined
        ? { category: asCategory(input.category) }
        : {}),
      ...(input.unit !== undefined ? { unit: input.unit.trim() || "each" } : {}),
      budgetQty,
      budgetUnitPrice,
      budgetAmount: round2(budgetQty * budgetUnitPrice),
      actualQty,
      actualUnitPrice,
      actualAmount: round2(actualQty * actualUnitPrice),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  revalidateJob(existing.jobId);
  return toView(updated);
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const existing = await prisma.jobBudgetLine.findUnique({ where: { id } });
  if (!existing) return;
  await prisma.jobBudgetLine.delete({ where: { id } });
  revalidateJob(existing.jobId);
}

/**
 * Replace (or append) budget lines from a quote's line items.
 * Secondary path — primary is catalog → budget → quote.
 */
export async function importBudgetFromQuote(input: {
  jobId: string;
  quoteId: string;
  mode?: "replace" | "append";
  force?: boolean;
}): Promise<JobBudgetSnapshot> {
  const quote = await prisma.quote.findUnique({
    where: { id: input.quoteId },
    include: {
      lineItemRows: { include: { catalogItem: true } },
    },
  });
  if (!quote || quote.jobId !== input.jobId) {
    throw new Error("Quote not found on this job.");
  }
  if (!input.force && !isApprovedQuoteStatus(quote.status)) {
    throw new Error(
      "Only approved/accepted quotes can set the budget. Approve the quote first, or force import.",
    );
  }

  const mode = input.mode ?? "replace";
  if (mode === "replace") {
    await prisma.jobBudgetLine.deleteMany({ where: { jobId: input.jobId } });
  }

  type Draft = {
    description: string;
    category: CatalogCategory;
    unit: string;
    qty: number;
    unitPrice: number;
    catalogItemId: string | null;
  };
  let drafts: Draft[] = [];

  if (quote.lineItemRows.length > 0) {
    drafts = quote.lineItemRows.map((row) => ({
      description: row.description,
      category: asCategory(row.catalogItem?.category),
      unit: row.catalogItem?.unit ?? "each",
      qty: money(row.quantity),
      unitPrice: money(row.unitPrice),
      catalogItemId: row.catalogItemId,
    }));
  } else {
    drafts = parseLineItems(quote.lineItems).map((item) => ({
      description: item.description || "Line item",
      category: "OTHER" as CatalogCategory,
      unit: "each",
      qty: item.quantity,
      unitPrice: item.unitPrice,
      catalogItemId: null,
    }));
  }

  const startSort =
    mode === "append"
      ? ((
          await prisma.jobBudgetLine.aggregate({
            where: { jobId: input.jobId },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1) + 1
      : 0;

  if (drafts.length > 0) {
    await prisma.jobBudgetLine.createMany({
      data: drafts.map((d, i) => ({
        jobId: input.jobId,
        description: d.description,
        category: d.category,
        catalogItemId: d.catalogItemId,
        unit: d.unit,
        budgetQty: d.qty,
        budgetUnitPrice: d.unitPrice,
        budgetAmount: round2(d.qty * d.unitPrice),
        actualQty: 0,
        actualUnitPrice: 0,
        actualAmount: 0,
        sortOrder: startSort + i,
        sourceQuoteId: quote.id,
      })),
    });
  }

  revalidateJob(input.jobId);
  return getJobBudget(input.jobId);
}

// --- form actions ------------------------------------------------------------

export async function addBudgetLineForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const catalogItemId = String(formData.get("catalogItemId") ?? "").trim();
  if (catalogItemId) {
    const qty = Number(formData.get("budgetQty")) || 1;
    await addBudgetLineFromCatalog(jobId, catalogItemId, qty);
    return;
  }

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  await addBudgetLine({
    jobId,
    description,
    category: String(formData.get("category") ?? "OTHER"),
    unit: String(formData.get("unit") ?? "each"),
    budgetQty: Number(formData.get("budgetQty")) || 1,
    budgetUnitPrice: Number(formData.get("budgetUnitPrice")) || 0,
    actualQty: Number(formData.get("actualQty")) || 0,
    actualUnitPrice: Number(formData.get("actualUnitPrice")) || 0,
  });
}

export async function updateBudgetActualForm(
  lineId: string,
  formData: FormData,
): Promise<void> {
  await updateBudgetLine(lineId, {
    actualQty: Number(formData.get("actualQty")) || 0,
    actualUnitPrice: Number(formData.get("actualUnitPrice")) || 0,
  });
}

export async function updateBudgetEstimateForm(
  lineId: string,
  formData: FormData,
): Promise<void> {
  await updateBudgetLine(lineId, {
    budgetQty: Number(formData.get("budgetQty")) || 0,
    budgetUnitPrice: Number(formData.get("budgetUnitPrice")) || 0,
  });
}

export async function deleteBudgetLineForm(
  lineId: string,
  _formData?: FormData,
): Promise<void> {
  await deleteBudgetLine(lineId);
}

export async function importBudgetFromQuoteForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return;
  const force =
    formData.get("force") === "on" || formData.get("force") === "true";
  try {
    await importBudgetFromQuote({ jobId, quoteId, mode: "replace", force });
  } catch (error) {
    logActionError("importBudgetFromQuoteForm", error);
    throw error;
  }
}

/**
 * Build a DRAFT quote from the job's budget lines.
 * Links each quote line to its budgetLineId and stamps quotedAmount on the budget.
 */
export async function createQuoteFromBudget(jobId: string): Promise<string> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found.");

  const lines = await prisma.jobBudgetLine.findMany({
    where: { jobId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (lines.length === 0) {
    throw new Error("Add budget lines before creating a quote.");
  }

  const items = lines.map((line) => ({
    description: line.description,
    quantity: money(line.budgetQty),
    unitPrice: money(line.budgetUnitPrice),
    lineTotal: money(line.budgetAmount),
  }));
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));

  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;
  const count = await prisma.quote.count({
    where: { quoteNumber: { startsWith: prefix } },
  });
  const quoteNumber = `${prefix}${String(count + 1).padStart(4, "0")}`;

  const quote = await prisma.quote.create({
    data: {
      title: `Budget quote — ${job.name}`,
      jobId,
      customerId: job.customerId,
      quoteNumber,
      status: "DRAFT",
      lineItems: items as unknown as object,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      notes: "Generated from job budget lines.",
    },
  });

  await prisma.quoteLineItem.createMany({
    data: lines.map((line, i) => ({
      quoteId: quote.id,
      catalogItemId: line.catalogItemId,
      budgetLineId: line.id,
      description: line.description,
      quantity: line.budgetQty,
      unitPrice: line.budgetUnitPrice,
      amount: line.budgetAmount,
      sortOrder: i,
    })),
  });

  // Stamp quoted amount on each budget line (replace with this quote's amounts)
  await Promise.all(
    lines.map((line) =>
      prisma.jobBudgetLine.update({
        where: { id: line.id },
        data: { quotedAmount: line.budgetAmount },
      }),
    ),
  );

  // Move job toward quoting if still estimating
  if (["ESTIMATING", "estimating"].includes(job.status)) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "QUOTING" },
    });
  }

  revalidateJob(jobId);
  revalidatePath(`/dashboard/quotes/${quote.id}`);
  return quote.id;
}

export async function createQuoteFromBudgetForm(
  jobId: string,
  _formData?: FormData,
): Promise<void> {
  const { redirect } = await import("next/navigation");
  const quoteId = await createQuoteFromBudget(jobId);
  redirect(`/dashboard/quotes/${quoteId}`);
}

/**
 * Build a DRAFT invoice from the job's budget lines.
 * Links invoice lines to budgetLineId and stamps invoicedAmount.
 */
export async function createInvoiceFromBudget(jobId: string): Promise<string> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found.");

  const lines = await prisma.jobBudgetLine.findMany({
    where: { jobId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (lines.length === 0) {
    throw new Error("Add budget lines before creating an invoice.");
  }

  const items = lines.map((line) => ({
    description: line.description,
    quantity: money(line.budgetQty),
    unitPrice: money(line.budgetUnitPrice),
    lineTotal: money(line.budgetAmount),
  }));
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));

  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  const invoiceNumber = `${prefix}${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      jobId,
      customerId: job.customerId,
      invoiceNumber,
      status: "DRAFT",
      lineItems: items as unknown as object,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      amountPaid: 0,
      notes: "Generated from job budget lines.",
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: lines.map((line, i) => ({
      invoiceId: invoice.id,
      catalogItemId: line.catalogItemId,
      budgetLineId: line.id,
      description: line.description,
      quantity: line.budgetQty,
      unitPrice: line.budgetUnitPrice,
      amount: line.budgetAmount,
      sortOrder: i,
    })),
  });

  await Promise.all(
    lines.map((line) =>
      prisma.jobBudgetLine.update({
        where: { id: line.id },
        data: { invoicedAmount: line.budgetAmount },
      }),
    ),
  );

  revalidateJob(jobId);
  revalidatePath(`/dashboard/invoices/${invoice.id}`);
  return invoice.id;
}

export async function createInvoiceFromBudgetForm(
  jobId: string,
  _formData?: FormData,
): Promise<void> {
  const { redirect } = await import("next/navigation");
  const invoiceId = await createInvoiceFromBudget(jobId);
  redirect(`/dashboard/invoices/${invoiceId}`);
}
