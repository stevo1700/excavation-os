// Plain (non-"use server") module for the catalog item category enum, so it
// can be imported as a value from client components and from validators
// without pulling a "use server" action module (which may only export async
// functions) into client bundles.

export type CatalogCategory =
  "LABOR" | "EQUIPMENT" | "MATERIAL" | "SUBCONTRACT" | "OTHER";

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  "LABOR",
  "EQUIPMENT",
  "MATERIAL",
  "SUBCONTRACT",
  "OTHER",
];
