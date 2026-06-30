import { formatCurrency } from "@/lib/utils";
import type { LineItem } from "@/lib/types";

/** Read-only line items table for quote/invoice detail views. */
export function LineItemsTable({ items }: { items: LineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No line items.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2 text-right">Qty</th>
            <th className="px-4 py-2 text-right">Unit price</th>
            <th className="px-4 py-2 text-right">Line total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2 text-slate-700">
                {item.description || "—"}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                {item.quantity}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-900">
                {formatCurrency(item.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
