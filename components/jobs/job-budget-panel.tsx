import {
  addBudgetLineForm,
  createInvoiceFromBudgetForm,
  createQuoteFromBudgetForm,
  deleteBudgetLineForm,
  importBudgetFromQuoteForm,
  updateBudgetActualForm,
  updateBudgetEstimateForm,
  type JobBudgetSnapshot,
} from "@/lib/actions/budget";
import type { CatalogItemRecord } from "@/lib/actions/catalog-items";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatCurrency, humanize } from "@/lib/utils";

export function JobBudgetPanel({
  jobId,
  budget,
  catalogItems,
  quoteOptions,
}: {
  jobId: string;
  budget: JobBudgetSnapshot;
  catalogItems: CatalogItemRecord[];
  quoteOptions: { id: string; quoteNumber: string; status: string }[];
}) {
  const addLine = addBudgetLineForm.bind(null, jobId);
  const importQuote = importBudgetFromQuoteForm.bind(null, jobId);
  const makeQuote = createQuoteFromBudgetForm.bind(null, jobId);
  const makeInvoice = createInvoiceFromBudgetForm.bind(null, jobId);
  const over = budget.variance > 0;
  const under = budget.variance < 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Budget" value={formatCurrency(budget.budgetTotal)} />
        <SummaryCard label="Quoted" value={formatCurrency(budget.quotedTotal)} />
        <SummaryCard
          label="Invoiced"
          value={formatCurrency(budget.invoicedTotal)}
        />
        <SummaryCard label="Actual" value={formatCurrency(budget.actualTotal)} />
        <SummaryCard
          label="Variance"
          value={formatCurrency(budget.variance)}
          tone={over ? "over" : under ? "under" : "neutral"}
          hint={over ? "over budget" : under ? "under budget" : "on target"}
        />
        <SummaryCard
          label="% used"
          value={
            budget.percentUsed == null
              ? "—"
              : `${budget.percentUsed.toFixed(0)}%`
          }
          tone={
            budget.percentUsed != null && budget.percentUsed > 100
              ? "over"
              : budget.percentUsed != null && budget.percentUsed >= 90
                ? "warn"
                : "neutral"
          }
        />
      </div>

      {budget.byCategory.length > 0 ? (
        <Card>
          <CardHeader
            title="By category"
            description="Estimate vs actual cost rollup"
          />
          <CardBody className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 font-medium text-right">Budget</th>
                  <th className="px-5 py-2.5 font-medium text-right">Actual</th>
                  <th className="px-5 py-2.5 font-medium text-right">Variance</th>
                  <th className="px-5 py-2.5 font-medium text-right">% used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budget.byCategory.map((row) => (
                  <tr key={row.category}>
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {humanize(row.category.toLowerCase())}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">
                      {formatCurrency(row.budgetAmount)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">
                      {formatCurrency(row.actualAmount)}
                    </td>
                    <td
                      className={`px-5 py-2.5 text-right tabular-nums font-medium ${
                        row.variance > 0
                          ? "text-rose-600"
                          : row.variance < 0
                            ? "text-emerald-600"
                            : "text-slate-600"
                      }`}
                    >
                      {formatCurrency(row.variance)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-500">
                      {row.percentUsed == null
                        ? "—"
                        : `${row.percentUsed.toFixed(0)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Budget lines"
          description={
            budget.lineCount === 0
              ? "Catalog → budget lines → quote → invoice"
              : `${budget.lineCount} line${budget.lineCount === 1 ? "" : "s"} · edit estimate or actuals`
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              {budget.lineCount > 0 ? (
                <>
                  <form action={makeQuote}>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-surface-900 hover:bg-brand-400"
                    >
                      Create quote from budget
                    </button>
                  </form>
                  <form action={makeInvoice}>
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Create invoice from budget
                    </button>
                  </form>
                </>
              ) : null}
              {quoteOptions.length > 0 ? (
                <form
                  action={importQuote}
                  className="flex flex-wrap items-end gap-2"
                >
                  <label className="text-xs font-medium text-slate-600">
                    Import quote
                    <select
                      name="quoteId"
                      required
                      className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select…
                      </option>
                      {quoteOptions.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.quoteNumber} ({q.status})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-500">
                    <input type="checkbox" name="force" value="true" />
                    Allow non-approved
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Import
                  </button>
                </form>
              ) : null}
            </div>
          }
        />
        <CardBody className="space-y-5">
          {budget.lines.length === 0 ? (
            <p className="text-sm text-slate-400">
              Pick a catalog item below or type a custom line to start the
              estimate.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Description</th>
                    <th className="pb-2 pr-3 font-medium">Cat</th>
                    <th className="pb-2 pr-3 font-medium text-right">Estimate</th>
                    <th className="pb-2 pr-3 font-medium text-right">Quoted</th>
                    <th className="pb-2 pr-3 font-medium text-right">Invoiced</th>
                    <th className="pb-2 pr-3 font-medium text-right">Actual</th>
                    <th className="pb-2 pr-3 font-medium text-right">Var</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budget.lines.map((line) => {
                    const updateEstimate = updateBudgetEstimateForm.bind(
                      null,
                      line.id,
                    );
                    const updateActual = updateBudgetActualForm.bind(
                      null,
                      line.id,
                    );
                    const remove = deleteBudgetLineForm.bind(null, line.id);
                    return (
                      <tr key={line.id} className="align-top">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-slate-900">
                            {line.description}
                          </p>
                          <p className="text-xs text-slate-400">
                            {line.unit}
                            {line.catalogItemId ? " · from catalog" : ""}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-xs text-slate-500">
                          {humanize(line.category.toLowerCase())}
                        </td>
                        <td className="py-3 pr-3">
                          <form
                            action={updateEstimate}
                            className="flex flex-col items-end gap-1"
                          >
                            <div className="flex items-center gap-1">
                              <input
                                name="budgetQty"
                                type="number"
                                step="0.01"
                                defaultValue={line.budgetQty}
                                className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                aria-label="Budget qty"
                              />
                              <span className="text-xs text-slate-400">×</span>
                              <input
                                name="budgetUnitPrice"
                                type="number"
                                step="0.01"
                                defaultValue={line.budgetUnitPrice}
                                className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                aria-label="Budget unit price"
                              />
                              <button
                                type="submit"
                                className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Save
                              </button>
                            </div>
                            <span className="text-xs tabular-nums text-slate-700">
                              {formatCurrency(line.budgetAmount)}
                            </span>
                          </form>
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums text-slate-500">
                          {formatCurrency(line.quotedAmount)}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums text-slate-500">
                          {formatCurrency(line.invoicedAmount)}
                        </td>
                        <td className="py-3 pr-3">
                          <form
                            action={updateActual}
                            className="flex flex-col items-end gap-1"
                          >
                            <div className="flex items-center gap-1">
                              <input
                                name="actualQty"
                                type="number"
                                step="0.01"
                                defaultValue={line.actualQty}
                                className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                aria-label="Actual qty"
                              />
                              <span className="text-xs text-slate-400">×</span>
                              <input
                                name="actualUnitPrice"
                                type="number"
                                step="0.01"
                                defaultValue={line.actualUnitPrice}
                                className="w-20 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                aria-label="Actual unit price"
                              />
                              <button
                                type="submit"
                                className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Save
                              </button>
                            </div>
                            <span className="text-xs tabular-nums text-slate-700">
                              {formatCurrency(line.actualAmount)}
                            </span>
                          </form>
                        </td>
                        <td
                          className={`py-3 pr-3 text-right tabular-nums font-medium ${
                            line.variance > 0
                              ? "text-rose-600"
                              : line.variance < 0
                                ? "text-emerald-600"
                                : "text-slate-500"
                          }`}
                        >
                          {formatCurrency(line.variance)}
                        </td>
                        <td className="py-3">
                          <form action={remove}>
                            <button
                              type="submit"
                              className="text-xs text-slate-400 hover:text-rose-600"
                            >
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add from catalog */}
          <form
            action={addLine}
            className="grid gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-6"
          >
            <p className="sm:col-span-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Add from catalog
            </p>
            <label className="sm:col-span-3 text-xs font-medium text-slate-600">
              Catalog item
              <select
                name="catalogItemId"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">
                  {catalogItems.length === 0
                    ? "No catalog items yet — add in Catalog"
                    : "Select item…"}
                </option>
                {catalogItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name} ({formatCurrency(item.unitPrice)}/
                    {item.unit})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Qty
              <input
                name="budgetQty"
                type="number"
                step="0.01"
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={catalogItems.length === 0}
                className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to budget
              </button>
            </div>
          </form>

          {/* Custom line */}
          <form
            action={addLine}
            className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-6"
          >
            <p className="sm:col-span-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Or custom line
            </p>
            <label className="sm:col-span-2 text-xs font-medium text-slate-600">
              Description
              <input
                name="description"
                placeholder="e.g. Excavation labor"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Category
              <select
                name="category"
                defaultValue="LABOR"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              >
                {CATALOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanize(c.toLowerCase())}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Budget qty
              <input
                name="budgetQty"
                type="number"
                step="0.01"
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Unit price
              <input
                name="budgetUnitPrice"
                type="number"
                step="0.01"
                defaultValue={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add custom
              </button>
            </div>
            <input type="hidden" name="unit" value="each" />
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "over" | "under" | "warn";
}) {
  const border =
    tone === "over"
      ? "border-rose-200 ring-1 ring-rose-50"
      : tone === "under"
        ? "border-emerald-200 ring-1 ring-emerald-50"
        : tone === "warn"
          ? "border-amber-200 ring-1 ring-amber-50"
          : "border-surface-600/40";
  const valueColor =
    tone === "over"
      ? "text-rose-700"
      : tone === "under"
        ? "text-emerald-700"
        : tone === "warn"
          ? "text-amber-800"
          : "text-slate-900";

  return (
    <div className={`rounded-xl border bg-white px-4 py-3 shadow-sm ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueColor}`}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
