"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { LineItemsEditor } from "@/components/line-items-editor";
import type { JobOption } from "@/lib/actions/quotes";

export interface CustomerOption {
  id: string;
  name: string;
}

export function QuoteForm({
  jobs,
  customers,
  defaultJobId,
  action,
}: {
  jobs: JobOption[];
  customers: CustomerOption[];
  defaultJobId?: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const initialJob =
    jobs.find((j) => j.id === defaultJobId) ?? jobs[0];
  const [jobId, setJobId] = useState(initialJob?.id ?? "");
  const [customerId, setCustomerId] = useState(initialJob?.customerId ?? "");

  function onJobChange(value: string) {
    setJobId(value);
    const job = jobs.find((j) => j.id === value);
    setCustomerId(job?.customerId ?? "");
  }

  return (
    <form action={action} className="max-w-3xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Job" htmlFor="jobId">
          <Select
            id="jobId"
            name="jobId"
            required
            value={jobId}
            onChange={(e) => onJobChange(e.target.value)}
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Customer" htmlFor="customerId">
          <Select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— None —</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Valid until" htmlFor="validUntil" className="sm:max-w-xs">
        <Input id="validUntil" name="validUntil" type="date" />
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Line items</p>
        <LineItemsEditor />
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Terms, exclusions, assumptions…"
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
        >
          Create quote
        </button>
        <Link
          href="/dashboard/quotes"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
