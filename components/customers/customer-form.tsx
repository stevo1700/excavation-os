import Link from "next/link";
import { Field, Input, Textarea } from "@/components/ui/form";

export interface CustomerFormDefaults {
  name?: string;
  contactName?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

/** Shared create/edit customer form driven by a server action. */
export function CustomerForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: CustomerFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-2xl space-y-5">
      <Field label="Customer name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults.name}
          placeholder="e.g. Hollis Development"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact name" htmlFor="contactName">
          <Input
            id="contactName"
            name="contactName"
            defaultValue={defaults.contactName}
            placeholder="e.g. Dana Hollis"
          />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input
            id="company"
            name="company"
            defaultValue={defaults.company}
            placeholder="e.g. Hollis Development LLC"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={defaults.phone} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email}
          />
        </Field>
        <Field label="Address" htmlFor="address">
          <Input id="address" name="address" defaultValue={defaults.address} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaults.notes}
          placeholder="Billing terms, key contacts, history…"
        />
      </Field>

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
