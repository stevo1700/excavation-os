import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { JOB_STATUS_OPTIONS } from "@/lib/job-status";

export interface JobFormDefaults {
  name?: string;
  client?: string;
  siteAddress?: string;
  /** Prisma / DB status token, e.g. "ESTIMATING". */
  status?: string;
  startDate?: string;
  estCompletion?: string;
  value?: number;
  description?: string;
  customerId?: string;
}

/**
 * Shared create/edit job form. Renders a native form whose submit invokes the
 * provided server action — no client-side state required.
 */
export function JobForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: JobFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      {defaults.customerId ? (
        <input type="hidden" name="customerId" value={defaults.customerId} />
      ) : null}
      <Field label="Job name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults.name}
          placeholder="e.g. Riverside foundation dig"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Client" htmlFor="client">
          <Input
            id="client"
            name="client"
            required
            defaultValue={defaults.client}
            placeholder="e.g. Hollis Development"
          />
        </Field>
        <Field label="Site address" htmlFor="siteAddress">
          <Input
            id="siteAddress"
            name="siteAddress"
            required
            defaultValue={defaults.siteAddress}
            placeholder="e.g. 418 Riverside Dr"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Status" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "ESTIMATING"}
          >
            {JOB_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date" htmlFor="startDate">
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaults.startDate}
          />
        </Field>
        <Field label="Est. completion" htmlFor="estCompletion">
          <Input
            id="estCompletion"
            name="estCompletion"
            type="date"
            defaultValue={defaults.estCompletion}
          />
        </Field>
      </div>

      <Field label="Contract value (USD)" htmlFor="value">
        <Input
          id="value"
          name="value"
          type="number"
          min={0}
          defaultValue={defaults.value}
          placeholder="248000"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults.description}
          placeholder="Scope of work, site conditions, key milestones…"
        />
      </Field>

      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Tip: start in <strong>Estimating</strong>, build the budget on the job
        page, then move to <strong>Quoting</strong> and create a quote from the
        budget.
      </p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
