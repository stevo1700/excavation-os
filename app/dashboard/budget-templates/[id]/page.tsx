import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  addBudgetTemplateLineForm,
  deleteBudgetTemplate,
  deleteBudgetTemplateLineForm,
  getBudgetTemplate,
  updateBudgetTemplate,
} from "@/lib/actions/budget-templates";
import { getCatalogItems } from "@/lib/actions/catalog-items";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import { formatCurrency, humanize } from "@/lib/utils";

export const metadata = { title: "Budget template" };
export const dynamic = "force-dynamic";

export default async function BudgetTemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [template, catalogItems] = await Promise.all([
    getBudgetTemplate(params.id),
    getCatalogItems({ activeOnly: true }),
  ]);
  if (!template) notFound();

  const update = updateBudgetTemplate.bind(null, template.id);
  const remove = deleteBudgetTemplate.bind(null, template.id);
  const addLine = addBudgetTemplateLineForm.bind(null, template.id);

  return (
    <div>
      <Link
        href="/dashboard/budget-templates"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to templates
      </Link>

      <div className="mb-4">
        <Badge
          tone={template.active ? "green" : "neutral"}
          label={template.active ? "Active" : "Inactive"}
        />
      </div>

      <PageHeader
        title={template.name}
        description={`${template.lineCount} lines · cost ${formatCurrency(template.costTotal)} · sell ${formatCurrency(template.priceTotal)}`}
      />

      <form action={update} className="mb-8 max-w-2xl space-y-4">
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" required defaultValue={template.name} />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={template.description ?? ""}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={template.active}
            className="rounded border-slate-300"
          />
          Active
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
        >
          Save template
        </button>
      </form>

      <Card className="mb-8">
        <CardHeader
          title="Template lines"
          description="These become budget lines when applied to a job"
        />
        <CardBody className="space-y-4">
          {template.lines.length === 0 ? (
            <p className="text-sm text-slate-400">No lines yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Item</th>
                    <th className="pb-2 pr-3 font-medium">Type</th>
                    <th className="pb-2 pr-3 font-medium text-right">Qty</th>
                    <th className="pb-2 pr-3 font-medium text-right">Cost</th>
                    <th className="pb-2 pr-3 font-medium text-right">Markup</th>
                    <th className="pb-2 pr-3 font-medium text-right">Price</th>
                    <th className="pb-2 pr-3 font-medium text-right">Ext cost</th>
                    <th className="pb-2 pr-3 font-medium text-right">Ext price</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {template.lines.map((line) => {
                    const del = deleteBudgetTemplateLineForm.bind(null, line.id);
                    return (
                      <tr key={line.id}>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">
                          {line.description}
                          <p className="text-xs text-slate-400">{line.unit}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">
                          {humanize(line.category.toLowerCase())}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {line.qty}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatCurrency(line.unitCost)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {line.markupPercent}%
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatCurrency(line.unitPrice)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatCurrency(line.extCost)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums font-medium">
                          {formatCurrency(line.extPrice)}
                        </td>
                        <td className="py-2.5">
                          <form action={del}>
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
                <option value="">Select…</option>
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
                name="qty"
                type="number"
                step="0.01"
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Markup %
              <input
                name="markupPercent"
                type="number"
                step="0.1"
                defaultValue={30}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
              >
                Add
              </button>
            </div>
          </form>

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
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Type
              <Select name="category" defaultValue="LABOR">
                {CATALOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {humanize(c.toLowerCase())}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Qty
              <input
                name="qty"
                type="number"
                step="0.01"
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Unit cost
              <input
                name="unitCost"
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
                Add custom
              </button>
            </div>
            <input type="hidden" name="unit" value="each" />
          </form>
        </CardBody>
      </Card>

      <div className="max-w-2xl border-t border-slate-200 pt-6">
        <p className="text-sm font-medium text-slate-700">Danger zone</p>
        <form action={remove} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            Delete template
          </button>
        </form>
      </div>
    </div>
  );
}
