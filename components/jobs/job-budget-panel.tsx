"use client";

import { Fragment, useMemo, useState } from "react";
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
import {
  applyBudgetTemplateForm,
  saveJobBudgetAsTemplate,
  type BudgetTemplateListItem,
} from "@/lib/actions/budget-templates";
import type { CatalogItemRecord } from "@/lib/actions/catalog-items";
import Link from "next/link";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn, formatCurrency, humanize } from "@/lib/utils";

type BudgetView = "estimate" | "costing" | "billing";

/**
 * JobTread-style budget ledger:
 * - Estimate view: build qty × unit cost
 * - Costing view: budgeted vs actual + variance
 * - Billing view: quoted / invoiced vs budget
 */
export function JobBudgetPanel({
  jobId,
  budget,
  catalogItems,
  quoteOptions,
  budgetTemplates = [],
}: {
  jobId: string;
  budget: JobBudgetSnapshot;
  catalogItems: CatalogItemRecord[];
  quoteOptions: { id: string; quoteNumber: string; status: string }[];
  budgetTemplates?: BudgetTemplateListItem[];
}) {
  const [view, setView] = useState<BudgetView>("estimate");
  const addLine = addBudgetLineForm.bind(null, jobId);
  const importQuote = importBudgetFromQuoteForm.bind(null, jobId);
  const makeQuote = createQuoteFromBudgetForm.bind(null, jobId);
  const makeInvoice = createInvoiceFromBudgetForm.bind(null, jobId);
  const applyTemplate = applyBudgetTemplateForm.bind(null, jobId);
  const saveTemplate = saveJobBudgetAsTemplate.bind(null, jobId);

  const over = budget.variance > 0;
  const under = budget.variance < 0;

  const linesByCategory = useMemo(() => {
    const map = new Map<string, typeof budget.lines>();
    for (const line of budget.lines) {
      const list = map.get(line.category) ?? [];
      list.push(line);
      map.set(line.category, list);
    }
    return Array.from(map.entries());
  }, [budget.lines]);

  const views: { key: BudgetView; label: string }[] = [
    { key: "estimate", label: "Estimate" },
    { key: "costing", label: "Job costing" },
    { key: "billing", label: "Billing" },
  ];

  return (
    <div className="space-y-4">
      {/* Totals strip — JobTread costing columns */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Budgeted cost"
          value={formatCurrency(budget.budgetTotal)}
        />
        <SummaryCard
          label="Sell price"
          value={formatCurrency(budget.priceTotal)}
        />
        <SummaryCard
          label="Projected profit"
          value={formatCurrency(budget.profitTotal)}
          tone={budget.profitTotal < 0 ? "over" : budget.profitTotal > 0 ? "under" : "neutral"}
        />
        <SummaryCard
          label="Actual cost"
          value={formatCurrency(budget.actualTotal)}
        />
        <SummaryCard
          label="Cost variance"
          value={formatCurrency(budget.variance)}
          tone={over ? "over" : under ? "under" : "neutral"}
          hint={over ? "over budget" : under ? "under budget" : "on target"}
        />
        <SummaryCard
          label="Invoiced"
          value={formatCurrency(budget.invoicedTotal)}
        />
      </div>

      {/* Apply / save templates */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <form action={applyTemplate} className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-slate-600">
            Apply budget template
            <select
              name="templateId"
              required
              defaultValue=""
              className="mt-1 block min-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            >
              <option value="" disabled>
                {budgetTemplates.length === 0
                  ? "No templates yet"
                  : "Select template…"}
              </option>
              {budgetTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.lineCount} lines)
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Mode
            <select
              name="mode"
              defaultValue="replace"
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            >
              <option value="replace">Replace budget</option>
              <option value="append">Add to budget</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={budgetTemplates.length === 0}
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </form>
        <Link
          href="/dashboard/budget-templates"
          className="pb-2 text-xs font-medium text-brand-700 hover:text-brand-800"
        >
          Manage templates
        </Link>
        {budget.lineCount > 0 ? (
          <form action={saveTemplate} className="ml-auto flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-slate-600">
              Save this budget as template
              <input
                name="name"
                required
                placeholder="e.g. Site dig package"
                className="mt-1 block min-w-[180px] rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Save template
            </button>
          </form>
        ) : null}
      </div>

      {/* View switcher + primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                view === v.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

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
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Create invoice from budget
                </button>
              </form>
            </>
          ) : null}
          {quoteOptions.length > 0 ? (
            <form action={importQuote} className="flex flex-wrap items-end gap-2">
              <select
                name="quoteId"
                required
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                defaultValue=""
              >
                <option value="" disabled>
                  Import quote…
                </option>
                {quoteOptions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quoteNumber} ({q.status})
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[11px] text-slate-500">
                <input type="checkbox" name="force" value="true" />
                Allow draft
              </label>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Import
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader
          title={
            view === "estimate"
              ? "Estimate lines"
              : view === "costing"
                ? "Job costing"
                : "Billing vs budget"
          }
          description={
            view === "estimate"
              ? "Cost → markup → customer price. Quotes use sell price, costing tracks your cost."
              : view === "costing"
                ? "Budgeted cost · actual cost · variance (over = red, under = green)"
                : "What you’ve quoted and invoiced against each budget line"
          }
        />
        <CardBody className="space-y-5">
          {budget.lines.length === 0 ? (
            <p className="text-sm text-slate-400">
              No budget lines yet. Add from the catalog below — then create a
              quote when the estimate is ready.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Cost item</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    {view === "estimate" ? (
                      <>
                        <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Unit cost
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Markup %
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Unit price
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Ext. cost
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Ext. price
                        </th>
                      </>
                    ) : null}
                    {view === "costing" ? (
                      <>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Budgeted
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Actual
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Variance
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          % used
                        </th>
                      </>
                    ) : null}
                    {view === "billing" ? (
                      <>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Budgeted
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Quoted
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Invoiced
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          Left to bill
                        </th>
                      </>
                    ) : null}
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {linesByCategory.map(([category, lines]) => (
                    <Fragment key={category}>
                      <tr className="bg-slate-50/80">
                        <td
                          colSpan={8}
                          className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          {humanize(category.toLowerCase())}
                        </td>
                      </tr>
                      {lines.map((line) => {
                        const updateEstimate = updateBudgetEstimateForm.bind(
                          null,
                          line.id,
                        );
                        const updateActual = updateBudgetActualForm.bind(
                          null,
                          line.id,
                        );
                        const remove = deleteBudgetLineForm.bind(null, line.id);
                        const leftToBill = Math.max(
                          0,
                          line.budgetAmount - line.invoicedAmount,
                        );
                        return (
                          <tr key={line.id} className="align-top">
                            <td className="py-3 pr-3">
                              <p className="font-medium text-slate-900">
                                {line.description}
                              </p>
                              <p className="text-xs text-slate-400">
                                {line.unit}
                                {line.catalogItemId ? " · catalog" : ""}
                              </p>
                            </td>
                            <td className="py-3 pr-3 text-xs text-slate-500">
                              {humanize(line.category.toLowerCase())}
                            </td>

                            {view === "estimate" ? (
                              <td colSpan={6} className="py-3 pr-3">
                                <form
                                  action={updateEstimate}
                                  className="flex flex-wrap items-center justify-end gap-1"
                                >
                                  <input
                                    name="budgetQty"
                                    type="number"
                                    step="0.01"
                                    defaultValue={line.budgetQty}
                                    className="w-14 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                    title="Qty"
                                  />
                                  <input
                                    name="budgetUnitPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={line.budgetUnitPrice}
                                    className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                    title="Unit cost"
                                  />
                                  <input
                                    name="markupPercent"
                                    type="number"
                                    step="0.1"
                                    defaultValue={line.markupPercent}
                                    className="w-14 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                    title="Markup %"
                                  />
                                  <input
                                    name="unitPrice"
                                    type="number"
                                    step="0.01"
                                    defaultValue={line.unitPrice}
                                    className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                    title="Unit price (customer)"
                                  />
                                  <span className="min-w-[3.5rem] text-right text-[11px] tabular-nums text-slate-500">
                                    {formatCurrency(line.budgetAmount)}
                                  </span>
                                  <span className="min-w-[3.5rem] text-right text-[11px] font-semibold tabular-nums text-slate-800">
                                    {formatCurrency(line.priceAmount)}
                                  </span>
                                  <button
                                    type="submit"
                                    className="rounded border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                                  >
                                    Save
                                  </button>
                                </form>
                              </td>
                            ) : null}

                            {view === "costing" ? (
                              <>
                                <td className="py-3 pr-3 text-right tabular-nums text-slate-700">
                                  {formatCurrency(line.budgetAmount)}
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
                                        className="w-14 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
                                      />
                                      <span className="text-xs text-slate-400">
                                        ×
                                      </span>
                                      <input
                                        name="actualUnitPrice"
                                        type="number"
                                        step="0.01"
                                        defaultValue={line.actualUnitPrice}
                                        className="w-16 rounded border border-slate-200 px-1.5 py-1 text-right text-xs"
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
                                  className={cn(
                                    "py-3 pr-3 text-right tabular-nums font-medium",
                                    line.variance > 0
                                      ? "text-rose-600"
                                      : line.variance < 0
                                        ? "text-emerald-600"
                                        : "text-slate-500",
                                  )}
                                >
                                  {formatCurrency(line.variance)}
                                </td>
                                <td className="py-3 pr-3 text-right tabular-nums text-slate-500">
                                  {line.percentUsed == null
                                    ? "—"
                                    : `${line.percentUsed.toFixed(0)}%`}
                                </td>
                              </>
                            ) : null}

                            {view === "billing" ? (
                              <>
                                <td className="py-3 pr-3 text-right tabular-nums text-slate-700">
                                  {formatCurrency(line.budgetAmount)}
                                </td>
                                <td className="py-3 pr-3 text-right tabular-nums text-slate-700">
                                  {formatCurrency(line.quotedAmount)}
                                </td>
                                <td className="py-3 pr-3 text-right tabular-nums text-slate-700">
                                  {formatCurrency(line.invoicedAmount)}
                                </td>
                                <td className="py-3 pr-3 text-right tabular-nums font-medium text-slate-800">
                                  {formatCurrency(leftToBill)}
                                </td>
                              </>
                            ) : null}

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
                    </Fragment>
                  ))}
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
              Add cost item from catalog
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
                    ? "No catalog items — add some under Catalog"
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
              Or ad-hoc line
            </p>
            <label className="sm:col-span-2 text-xs font-medium text-slate-600">
              Description
              <input
                name="description"
                placeholder="e.g. Rock excavation"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Type
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
              Qty
              <input
                name="budgetQty"
                type="number"
                step="0.01"
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Unit cost
              <input
                name="budgetUnitPrice"
                type="number"
                step="0.01"
                defaultValue={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Markup %
              <input
                name="markupPercent"
                type="number"
                step="0.1"
                defaultValue={30}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end sm:col-span-6">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add line
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
          : "border-slate-200";
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
