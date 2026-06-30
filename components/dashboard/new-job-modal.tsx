"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Input,
  PrimaryButton,
  SecondaryButton,
  Textarea,
} from "@/components/ui/form";

/**
 * "New job" trigger + modal. UI only — submitting just closes the dialog; no
 * data is persisted in this mock build.
 */
export function NewJobModal() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
        description="Set up a new job site. This is a demo form — nothing is saved."
        footer={
          <>
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <PrimaryButton onClick={close}>Create job</PrimaryButton>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <Field label="Job name" htmlFor="job-name">
            <Input id="job-name" placeholder="e.g. Riverside foundation dig" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="job-client">
              <Input id="job-client" placeholder="e.g. Hollis Development" />
            </Field>
            <Field label="Site address" htmlFor="job-site">
              <Input id="job-site" placeholder="e.g. 418 Riverside Dr" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Start date" htmlFor="job-start">
              <Input id="job-start" type="date" />
            </Field>
            <Field label="Est. completion" htmlFor="job-due">
              <Input id="job-due" type="date" />
            </Field>
            <Field label="Value (USD)" htmlFor="job-value">
              <Input
                id="job-value"
                type="number"
                min={0}
                placeholder="248000"
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="job-desc">
            <Textarea
              id="job-desc"
              rows={3}
              placeholder="Scope of work, site conditions, special requirements…"
            />
          </Field>
          {/* Allow Enter-to-submit without a visible submit button. */}
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </>
  );
}
