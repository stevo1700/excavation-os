import Link from "next/link";
import { Field, Input, Textarea } from "@/components/ui/form";

export interface ContractTemplateDefaults {
  name?: string;
  description?: string;
  body?: string;
  active?: boolean;
}

const PLACEHOLDER_HELP = `Placeholders (auto-filled when applied to a job):
{{job_name}}  {{client}}  {{site}}  {{value}}  {{date}}  {{status}}`;

export function ContractTemplateForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ContractTemplateDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-3xl space-y-5">
      <Field label="Template name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults.name}
          placeholder="e.g. Standard excavation agreement"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Input
          id="description"
          name="description"
          defaultValue={defaults.description}
          placeholder="When to use this template"
        />
      </Field>

      <Field label="Contract body" htmlFor="body">
        <Textarea
          id="body"
          name="body"
          required
          rows={16}
          defaultValue={
            defaults.body ??
            `AGREEMENT

This agreement is between the Contractor and {{client}} for the project known as {{job_name}}.

Site: {{site}}
Contract value: ${"{{value}}"} USD
Date: {{date}}

1. Scope of work
[Describe the work]

2. Payment terms
[Net 30 / progress / progress billing]

3. Schedule
Work will proceed as agreed. Status: {{status}}

Signatures
Contractor: _____________________
Client: _________________________`
          }
          className="font-mono text-sm"
        />
      </Field>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 whitespace-pre-wrap">
        {PLACEHOLDER_HELP}
      </p>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="hidden" name="active" value="false" />
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={defaults.active ?? true}
          className="rounded border-slate-300"
        />
        Active (available to apply on jobs)
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
