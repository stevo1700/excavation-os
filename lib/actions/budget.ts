"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
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
  unit: string;
  budgetQty: number;
  budgetUnitPrice: number;
  budgetAmount: number;
  actualQty: number;
  actualUnitPrice: number;
  actualAmount: number;
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
  variance: number;
  percentUsed: number | null;
  lineCount: number;
}

function money(value: { toNumber(): number } | number | null | undefined): number {
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
  unit: string;
  budgetQty: { toNumber(): number } | number;
  budgetUnitPrice: { toNumber(): number } | number;
  budgetAmount: { toNumber(): number } | number;
  actualQty: { toNumber(): number } | number;
  actualUnitPrice: { toNumber(): number } | number;
  actualAmount: { toNumber(): number } | number;
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
    unit: row.unit,
    budgetQty: money(row.budgetQty),
    budgetUnitPrice: money(row.budgetUnitPrice),
    budgetAmount,
    actualQty: money(row.actualQty),
    actualUnitPrice: money(row.actualUnitPrice),
    actualAmount,
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

  const budgetTotal = round2(
    lines.reduce((s, l) => s + l.budgetAmount, 0),
  );
  const actualTotal = round2(
    lines.reduce((s, l) => s + l.actualAmount, 0),
  );
  return {
    lines,
    byCategory,
    budgetTotal,
    actualTotal,
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
}

/** Full budget vs actual snapshot for a job. */
export async function getJobBudget(
  jobId: string,
): Promise<JobBudgetSnapshot> {
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
 * Only ACCEPTED/APPROVED quotes by default; pass force for others.
 * Does not overwrite actuals on existing matching descriptions when append=false —
 * full replace clears all budget lines for the job first.
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

  // Prefer normalized catalog rows; fall back to legacy JSON line items.
  type Draft = {
    description: string;
    category: CatalogCategory;
    unit: string;
    qty: number;
    unitPrice: number;
  };
  let drafts: Draft[] = [];

  if (quote.lineItemRows.length > 0) {
    drafts = quote.lineItemRows.map((row) => ({
      description: row.description,
      category: asCategory(row.catalogItem?.category),
      unit: row.catalogItem?.unit ?? "each",
      qty: money(row.quantity),
      unitPrice: money(row.unitPrice),
    }));
  } else {
    drafts = parseLineItems(quote.lineItems).map((item) => ({
      description: item.description || "Line item",
      category: "OTHER" as CatalogCategory,
      unit: "each",
      qty: item.quantity,
      unitPrice: item.unitPrice,
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

export async function updateBudgetLineForm(
  lineId: string,
  formData: FormData,
): Promise<void> {
  await updateBudgetLine(lineId, {
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? "OTHER"),
    unit: String(formData.get("unit") ?? "each"),
    budgetQty: Number(formData.get("budgetQty")) || 0,
    budgetUnitPrice: Number(formData.get("budgetUnitPrice")) || 0,
    actualQty: Number(formData.get("actualQty")) || 0,
    actualUnitPrice: Number(formData.get("actualUnitPrice")) || 0,
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
  const force = formData.get("force") === "on" || formData.get("force") === "true";
  try {
    await importBudgetFromQuote({ jobId, quoteId, mode: "replace", force });
  } catch (error) {
    logActionError("importBudgetFromQuoteForm", error);
    // Surface as a soft no-op for form posts; UI shows empty if import failed.
    throw error;
  }
}
