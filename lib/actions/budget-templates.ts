"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import type { CatalogCategory } from "@/lib/catalog-categories";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";

export interface BudgetTemplateLineView {
  id: string;
  description: string;
  category: CatalogCategory;
  catalogItemId: string | null;
  unit: string;
  qty: number;
  unitCost: number;
  markupPercent: number;
  unitPrice: number;
  extCost: number;
  extPrice: number;
  sortOrder: number;
}

export interface BudgetTemplateView {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  lineCount: number;
  costTotal: number;
  priceTotal: number;
  lines: BudgetTemplateLineView[];
  updatedAt: string;
}

export interface BudgetTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  lineCount: number;
  costTotal: number;
  priceTotal: number;
  updatedAt: string;
}

function money(v: { toNumber(): number } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : v.toNumber();
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

function priceFromCost(unitCost: number, markupPercent: number): number {
  return round2(unitCost * (1 + markupPercent / 100));
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function lineView(row: {
  id: string;
  description: string;
  category: string;
  catalogItemId: string | null;
  unit: string;
  qty: { toNumber(): number } | number;
  unitCost: { toNumber(): number } | number;
  markupPercent: { toNumber(): number } | number;
  unitPrice: { toNumber(): number } | number;
  sortOrder: number;
}): BudgetTemplateLineView {
  const qty = money(row.qty);
  const unitCost = money(row.unitCost);
  let unitPrice = money(row.unitPrice);
  const markup = money(row.markupPercent);
  if (unitPrice <= 0 && unitCost > 0) {
    unitPrice = priceFromCost(unitCost, markup > 0 ? markup : 30);
  }
  return {
    id: row.id,
    description: row.description,
    category: asCategory(row.category),
    catalogItemId: row.catalogItemId,
    unit: row.unit,
    qty,
    unitCost,
    markupPercent: markup,
    unitPrice,
    extCost: round2(qty * unitCost),
    extPrice: round2(qty * unitPrice),
    sortOrder: row.sortOrder,
  };
}

export async function getBudgetTemplates(
  activeOnly = false,
): Promise<BudgetTemplateListItem[]> {
  try {
    const rows = await prisma.budgetTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: { lines: true },
      orderBy: { name: "asc" },
    });
    return rows.map((t) => {
      const lines = t.lines.map(lineView);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        active: t.active,
        lineCount: lines.length,
        costTotal: round2(lines.reduce((s, l) => s + l.extCost, 0)),
        priceTotal: round2(lines.reduce((s, l) => s + l.extPrice, 0)),
        updatedAt: t.updatedAt.toISOString(),
      };
    });
  } catch (error) {
    logActionError("getBudgetTemplates", error);
    return [];
  }
}

export async function getBudgetTemplate(
  id: string,
): Promise<BudgetTemplateView | null> {
  try {
    const t = await prisma.budgetTemplate.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: "asc" } } },
    });
    if (!t) return null;
    const lines = t.lines.map(lineView);
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      active: t.active,
      lineCount: lines.length,
      costTotal: round2(lines.reduce((s, l) => s + l.extCost, 0)),
      priceTotal: round2(lines.reduce((s, l) => s + l.extPrice, 0)),
      lines,
      updatedAt: t.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function createBudgetTemplate(formData: FormData): Promise<void> {
  const name = field(formData, "name");
  if (!name) throw new Error("Name is required.");

  const created = await prisma.budgetTemplate.create({
    data: {
      name,
      description: field(formData, "description") || null,
      active: formData.getAll("active").includes("true"),
    },
  });

  revalidatePath("/dashboard/budget-templates");
  revalidatePath("/dashboard/catalog");
  redirect(`/dashboard/budget-templates/${created.id}`);
}

export async function updateBudgetTemplate(
  id: string,
  formData: FormData,
): Promise<void> {
  const name = field(formData, "name");
  if (!name) throw new Error("Name is required.");

  await prisma.budgetTemplate.update({
    where: { id },
    data: {
      name,
      description: field(formData, "description") || null,
      active: formData.getAll("active").includes("true"),
    },
  });

  revalidatePath("/dashboard/budget-templates");
  revalidatePath(`/dashboard/budget-templates/${id}`);
  redirect(`/dashboard/budget-templates/${id}`);
}

export async function deleteBudgetTemplate(id: string): Promise<void> {
  await prisma.budgetTemplate.delete({ where: { id } });
  revalidatePath("/dashboard/budget-templates");
  redirect("/dashboard/budget-templates");
}

export async function addBudgetTemplateLineForm(
  templateId: string,
  formData: FormData,
): Promise<void> {
  const catalogItemId = field(formData, "catalogItemId");
  const max = await prisma.budgetTemplateLine.aggregate({
    where: { templateId },
    _max: { sortOrder: true },
  });
  const sortOrder = (max._max.sortOrder ?? -1) + 1;

  if (catalogItemId) {
    const item = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
    });
    if (!item) return;
    const qty = Number(formData.get("qty")) || 1;
    const unitCost = money(item.unitPrice);
    const markup =
      formData.get("markupPercent") != null &&
      String(formData.get("markupPercent")) !== ""
        ? Number(formData.get("markupPercent")) || 0
        : 30;
    const unitPrice = priceFromCost(unitCost, markup);
    await prisma.budgetTemplateLine.create({
      data: {
        templateId,
        description: item.name,
        category: item.category,
        catalogItemId: item.id,
        unit: item.unit,
        qty,
        unitCost,
        markupPercent: markup,
        unitPrice,
        sortOrder,
      },
    });
  } else {
    const description = field(formData, "description");
    if (!description) return;
    const qty = Number(formData.get("qty")) || 1;
    const unitCost = Number(formData.get("unitCost")) || 0;
    const markup = Number(formData.get("markupPercent")) || 30;
    const unitPrice = priceFromCost(unitCost, markup);
    await prisma.budgetTemplateLine.create({
      data: {
        templateId,
        description,
        category: asCategory(field(formData, "category") || "OTHER"),
        unit: field(formData, "unit") || "each",
        qty,
        unitCost,
        markupPercent: markup,
        unitPrice,
        sortOrder,
      },
    });
  }

  revalidatePath(`/dashboard/budget-templates/${templateId}`);
}

export async function deleteBudgetTemplateLineForm(
  lineId: string,
  _formData?: FormData,
): Promise<void> {
  const line = await prisma.budgetTemplateLine.delete({ where: { id: lineId } });
  revalidatePath(`/dashboard/budget-templates/${line.templateId}`);
}

/**
 * Apply a budget template onto a job.
 * mode=replace clears existing budget lines first; append adds after them.
 */
export async function applyBudgetTemplate(input: {
  jobId: string;
  templateId: string;
  mode?: "replace" | "append";
}): Promise<void> {
  const template = await prisma.budgetTemplate.findUnique({
    where: { id: input.templateId },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template || !template.active) {
    throw new Error("Budget template not found or inactive.");
  }
  if (template.lines.length === 0) {
    throw new Error("Template has no lines.");
  }

  const mode = input.mode ?? "replace";
  if (mode === "replace") {
    await prisma.jobBudgetLine.deleteMany({ where: { jobId: input.jobId } });
  }

  const maxSort =
    mode === "append"
      ? (
          await prisma.jobBudgetLine.aggregate({
            where: { jobId: input.jobId },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1
      : -1;

  await prisma.jobBudgetLine.createMany({
    data: template.lines.map((line, i) => {
      const qty = money(line.qty);
      const unitCost = money(line.unitCost);
      let unitPrice = money(line.unitPrice);
      const markup = money(line.markupPercent);
      if (unitPrice <= 0) {
        unitPrice = priceFromCost(unitCost, markup > 0 ? markup : 30);
      }
      return {
        jobId: input.jobId,
        description: line.description,
        category: line.category,
        catalogItemId: line.catalogItemId,
        unit: line.unit,
        budgetQty: qty,
        budgetUnitPrice: unitCost,
        budgetAmount: round2(qty * unitCost),
        markupPercent: markup,
        unitPrice,
        priceAmount: round2(qty * unitPrice),
        actualQty: 0,
        actualUnitPrice: 0,
        actualAmount: 0,
        sortOrder: maxSort + 1 + i,
      };
    }),
  });

  revalidatePath(`/dashboard/jobs/${input.jobId}`);
  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard");
}

export async function applyBudgetTemplateForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const templateId = field(formData, "templateId");
  if (!templateId) return;
  const mode =
    formData.get("mode") === "append" ? ("append" as const) : ("replace" as const);
  try {
    await applyBudgetTemplate({ jobId, templateId, mode });
  } catch (error) {
    logActionError("applyBudgetTemplateForm", error);
    throw error;
  }
}

/** Save the job's current budget lines as a new template. */
export async function saveJobBudgetAsTemplate(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const name = field(formData, "name") || "Job budget template";
  const lines = await prisma.jobBudgetLine.findMany({
    where: { jobId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (lines.length === 0) {
    throw new Error("Add budget lines before saving a template.");
  }

  const created = await prisma.budgetTemplate.create({
    data: {
      name,
      description: field(formData, "description") || `Saved from job ${jobId}`,
      active: true,
      lines: {
        create: lines.map((line, i) => ({
          description: line.description,
          category: line.category,
          catalogItemId: line.catalogItemId,
          unit: line.unit,
          qty: line.budgetQty,
          unitCost: line.budgetUnitPrice,
          markupPercent: line.markupPercent,
          unitPrice: line.unitPrice,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/dashboard/budget-templates");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  redirect(`/dashboard/budget-templates/${created.id}`);
}
