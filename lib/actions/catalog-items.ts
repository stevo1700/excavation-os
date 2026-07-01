"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import type { CatalogCategory } from "@/lib/catalog-categories";

export type { CatalogCategory };

export interface CatalogItemRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  category: CatalogCategory;
  taxable: boolean;
  active: boolean;
}

export interface CatalogItemFilters {
  search?: string;
  category?: string;
  activeOnly?: boolean;
}

function toRecord(item: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: { toNumber(): number };
  category: string;
  taxable: boolean;
  active: boolean;
}): CatalogItemRecord {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    unit: item.unit,
    unitPrice: item.unitPrice.toNumber(),
    category: item.category as CatalogCategory,
    taxable: item.taxable,
    active: item.active,
  };
}

/** Catalog items, optionally filtered by free-text search and/or category. */
export async function getCatalogItems(
  filters: CatalogItemFilters = {},
): Promise<CatalogItemRecord[]> {
  try {
    const rows = await prisma.catalogItem.findMany({
      where: {
        active: filters.activeOnly ? true : undefined,
        category: filters.category,
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { code: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { code: "asc" },
    });
    return rows.map(toRecord);
  } catch (error) {
    logActionError("getCatalogItems", error);
    return [];
  }
}

export async function getCatalogItem(
  id: string,
): Promise<CatalogItemRecord | null> {
  try {
    const item = await prisma.catalogItem.findUnique({ where: { id } });
    return item ? toRecord(item) : null;
  } catch {
    return null;
  }
}

export interface CatalogItemInput {
  code?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  unitPrice?: number;
  category?: CatalogCategory;
  taxable?: boolean;
  active?: boolean;
}

export async function createCatalogItemRecord(
  input: CatalogItemInput,
): Promise<CatalogItemRecord> {
  const item = await prisma.catalogItem.create({
    data: {
      code: input.code ?? "",
      name: input.name ?? "",
      description: input.description ?? null,
      unit: input.unit ?? "each",
      unitPrice: input.unitPrice ?? 0,
      category: input.category ?? "OTHER",
      taxable: input.taxable ?? true,
      active: input.active ?? true,
    },
  });
  revalidatePath("/dashboard/catalog/items");
  return toRecord(item);
}

export async function updateCatalogItemRecord(
  id: string,
  input: CatalogItemInput,
): Promise<CatalogItemRecord | null> {
  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) return null;

  const item = await prisma.catalogItem.update({
    where: { id },
    data: {
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.taxable !== undefined ? { taxable: input.taxable } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  revalidatePath("/dashboard/catalog/items");
  return toRecord(item);
}
