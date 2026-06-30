// Shared, framework-agnostic helpers for quote/invoice money math. Kept out of
// the "use server" action files so both the server actions and the client line
// items editor can import them.

import type { LineItem } from "@/lib/types";

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Coerce arbitrary JSON / form input into a clean LineItem array. */
export function parseLineItems(raw: unknown): LineItem[] {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];

  return data.map((entry) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      description: String(item.description ?? ""),
      quantity,
      unitPrice,
      lineTotal: round(quantity * unitPrice, 2),
    };
  });
}

export interface MoneyTotals {
  subtotal: number;
  /** Stored as a fraction, e.g. 0.0825 for 8.25%. */
  taxRate: number;
  taxAmount: number;
  total: number;
}

/** Compute subtotal/tax/total from line items and a tax rate given as a percent. */
export function computeTotals(
  items: LineItem[],
  taxRatePercent: number,
): MoneyTotals {
  const subtotal = round(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    2,
  );
  const taxRate = round((Number(taxRatePercent) || 0) / 100, 4);
  const taxAmount = round(subtotal * taxRate, 2);
  const total = round(subtotal + taxAmount, 2);
  return { subtotal, taxRate, taxAmount, total };
}
