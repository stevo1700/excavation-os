"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { LineItemsEditor } from "@/components/line-items-editor";
import type { JobOption, QuoteOption } from "@/lib/actions/quotes";
import type { CustomerOption } from "@/components/finance/quote-form";

export function InvoiceForm({
  jobs,
  customers,
  quotes,
  action,
}: {
  jobs: JobOption[];
  customers: CustomerOption[];
  quotes: QuoteOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [customerId, setCustomerId] = useState(jobs[0]?.customerId ?? "");

  function onJobChange(value: string) {
    setJobId(value);
    const job = jobs.find((j) => j.id === value);
    setCustomerId(job?.customerId ?? "");
  }

  // Only offer quotes belonging to the selected job.
  const jobQuotes = quotes.filter((quote) => quote.jobId === jobId);

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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Due date" htmlFor="dueDate">
          <Input id="dueDate" name="dueDate" type="date" />
        </Field>
        <Field label="Linked quote (optional)" htmlFor="quoteId">
          <Select id="quoteId" name="quoteId" defaultValue="">
            <option value="">— None —</option>
            {jobQuotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.quoteNumber}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Line items</p>
        <LineItemsEditor />
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Payment terms, remittance details…"
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
        >
          Create invoice
        </button>
        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
