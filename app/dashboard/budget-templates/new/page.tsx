import { PageHeader } from "@/components/layout/page-header";
import { Field, Input, Textarea } from "@/components/ui/form";
import Link from "next/link";
import { createBudgetTemplate } from "@/lib/actions/budget-templates";

export const metadata = { title: "New budget template" };
export const dynamic = "force-dynamic";

export default function NewBudgetTemplatePage() {
  return (
    <div>
      <PageHeader
        title="New budget template"
        description="Name it, then add catalog lines on the next screen."
      />
      <form action={createBudgetTemplate} className="max-w-xl space-y-5">
        <Field label="Template name" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. Standard site dig"
          />
        </Field>
        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="When to use this template"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked
            className="rounded border-slate-300"
          />
          Active (available on jobs)
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
          >
            Create & add lines
          </button>
          <Link
            href="/dashboard/budget-templates"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
