"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Input,
  PrimaryButton,
  SecondaryButton,
  Select,
} from "@/components/ui/form";

/** "Add crew member" trigger + modal. UI only. */
export function AddCrewModal() {
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
        Add crew member
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Add crew member"
        description="Add a person to the crew roster. Demo form — nothing is saved."
        footer={
          <>
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <PrimaryButton onClick={close}>Add member</PrimaryButton>
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
          <Field label="Full name" htmlFor="cr-name">
            <Input id="cr-name" placeholder="e.g. Maria Delgado" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="cr-role">
              <Select id="cr-role" defaultValue="operator">
                <option value="foreman">Foreman</option>
                <option value="operator">Operator</option>
                <option value="laborer">Laborer</option>
                <option value="surveyor">Surveyor</option>
                <option value="mechanic">Mechanic</option>
              </Select>
            </Field>
            <Field label="Phone" htmlFor="cr-phone">
              <Input id="cr-phone" type="tel" placeholder="555-0100" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="cr-status">
              <Select id="cr-status" defaultValue="available">
                <option value="available">Available</option>
                <option value="on_site">On site</option>
                <option value="off">Off</option>
              </Select>
            </Field>
            <Field label="Current assignment" htmlFor="cr-job">
              <Input id="cr-job" placeholder="e.g. JOB-1042 (optional)" />
            </Field>
          </div>

          <Field label="Certifications" htmlFor="cr-certs">
            <Input
              id="cr-certs"
              placeholder="Comma-separated, e.g. OSHA 30, Excavator"
            />
          </Field>
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </>
  );
}
