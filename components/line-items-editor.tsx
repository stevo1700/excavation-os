"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { computeTotals } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import type { LineItem } from "@/lib/types";

interface Row {
  description: string;
  quantity: string;
  unitPrice: string;
}

const controlClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function toRows(items?: LineItem[]): Row[] {
  if (items && items.length > 0) {
    return items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    }));
  }
  return [{ description: "", quantity: "1", unitPrice: "0" }];
}

/**
 * Reusable, fully-controlled line items editor. Serializes its rows to a hidden
 * `lineItems` input and exposes a `taxRate` percent input, so it drops straight
 * into any server-action form with no client-side fetch.
 */
export function LineItemsEditor({
  defaultItems,
  defaultTaxRatePercent = 0,
}: {
  defaultItems?: LineItem[];
  defaultTaxRatePercent?: number;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(defaultItems));
  const [taxPercent, setTaxPercent] = useState(String(defaultTaxRatePercent));

  function updateRow(index: number, key: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "0" },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  const items: LineItem[] = rows.map((row) => {
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    return {
      description: row.description,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
    };
  });

  const totals = computeTotals(items, Number(taxPercent) || 0);

  return (
    <div className="space-y-3">
      <input type="hidden" name="lineItems" value={JSON.stringify(items)} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-2 pr-2">Description</th>
              <th className="w-20 px-2 pb-2">Qty</th>
              <th className="w-32 px-2 pb-2">Unit price</th>
              <th className="w-28 px-2 pb-2 text-right">Line total</th>
              <th className="w-10 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="py-1 pr-2">
                  <input
                    aria-label="Description"
                    className={controlClasses}
                    value={row.description}
                    onChange={(e) =>
                      updateRow(index, "description", e.target.value)
                    }
                    placeholder="e.g. Mass excavation"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    aria-label="Quantity"
                    type="number"
                    min={0}
                    step="any"
                    className={controlClasses}
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    aria-label="Unit price"
                    type="number"
                    min={0}
                    step="any"
                    className={controlClasses}
                    value={row.unitPrice}
                    onChange={(e) =>
                      updateRow(index, "unitPrice", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1 text-right tabular-nums text-slate-700">
                  {formatCurrency(items[index].lineTotal)}
                </td>
                <td className="py-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    aria-label="Remove line"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Plus className="h-4 w-4" />
        Add line
      </button>

      <div className="flex justify-end">
        <dl className="w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="tabular-nums text-slate-900">
              {formatCurrency(totals.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-500">
              Tax
              <span className="flex items-center gap-1">
                <input
                  name="taxRate"
                  type="number"
                  min={0}
                  step="any"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right text-xs"
                  aria-label="Tax rate percent"
                />
                <span className="text-slate-400">%</span>
              </span>
            </dt>
            <dd className="tabular-nums text-slate-900">
              {formatCurrency(totals.taxAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
            <dt className="font-semibold text-slate-700">Total</dt>
            <dd className="font-semibold tabular-nums text-slate-900">
              {formatCurrency(totals.total)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
