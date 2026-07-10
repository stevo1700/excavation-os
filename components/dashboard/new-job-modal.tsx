"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Input,
  PrimaryButton,
  SecondaryButton,
  Select,
  Textarea,
} from "@/components/ui/form";
import { JOB_STATUS_OPTIONS } from "@/lib/job-status";
import { createJobFromModal } from "@/lib/actions/jobs";

export interface NewJobTemplateOption {
  id: string;
  name: string;
  lineCount: number;
}

/** New job modal — persists to the database. */
export function NewJobModal({
  budgetTemplates = [],
}: {
  budgetTemplates?: NewJobTemplateOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
      >
        <Plus className="h-4 w-4" />
        New job
      </button>

      <Modal
        open={open}
        onClose={close}
        title="New job"
        description="Create a job. Optionally load a budget template, then quote from the budget."
        footer={
          <>
            <SecondaryButton type="button" onClick={close} disabled={pending}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" form="new-job-form" disabled={pending}>
              {pending ? "Creating…" : "Create job"}
            </PrimaryButton>
          </>
        }
      >
        <form
          id="new-job-form"
          className="space-y-4"
          action={(formData) => {
            setError(null);
            const templateId = String(
              formData.get("budgetTemplateId") ?? "",
            ).trim();
            startTransition(async () => {
              try {
                const id = await createJobFromModal(formData);
                close();
                router.push(
                  templateId
                    ? `/dashboard/jobs/${id}?tab=budget`
                    : `/dashboard/jobs/${id}`,
                );
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not create job.",
                );
              }
            });
          }}
        >
          <Field label="Job name" htmlFor="modal-job-name">
            <Input
              id="modal-job-name"
              name="name"
              required
              placeholder="e.g. Riverside foundation dig"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="modal-job-client">
              <Input
                id="modal-job-client"
                name="client"
                required
                placeholder="e.g. Hollis Development"
              />
            </Field>
            <Field label="Site address" htmlFor="modal-job-site">
              <Input
                id="modal-job-site"
                name="siteAddress"
                required
                placeholder="e.g. 418 Riverside Dr"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status" htmlFor="modal-job-status">
              <Select
                id="modal-job-status"
                name="status"
                defaultValue="ESTIMATING"
              >
                {JOB_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start date" htmlFor="modal-job-start">
              <Input id="modal-job-start" name="startDate" type="date" />
            </Field>
            <Field label="Est. completion" htmlFor="modal-job-due">
              <Input id="modal-job-due" name="estCompletion" type="date" />
            </Field>
          </div>

          <Field label="Contract value (USD)" htmlFor="modal-job-value">
            <Input
              id="modal-job-value"
              name="value"
              type="number"
              min={0}
              placeholder="248000"
            />
          </Field>

          <Field label="Budget template (optional)" htmlFor="modal-job-template">
            <Select
              id="modal-job-template"
              name="budgetTemplateId"
              defaultValue=""
            >
              <option value="">None — empty budget</option>
              {budgetTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.lineCount} lines)
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Description" htmlFor="modal-job-desc">
            <Textarea
              id="modal-job-desc"
              name="description"
              rows={3}
              placeholder="Scope of work, site conditions, special requirements…"
            />
          </Field>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </form>
      </Modal>
    </>
  );
}
