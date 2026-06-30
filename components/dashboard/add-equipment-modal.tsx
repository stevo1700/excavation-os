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

/** "Add equipment" trigger + modal. UI only. */
export function AddEquipmentModal() {
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
        Add equipment
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Add equipment"
        description="Register a machine in the fleet. Demo form — nothing is saved."
        footer={
          <>
            <SecondaryButton onClick={close}>Cancel</SecondaryButton>
            <PrimaryButton onClick={close}>Add machine</PrimaryButton>
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
          <Field label="Name" htmlFor="eq-name">
            <Input id="eq-name" placeholder="e.g. CAT 320 Excavator" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asset ID" htmlFor="eq-id">
              <Input id="eq-id" placeholder="e.g. EX-223" />
            </Field>
            <Field label="Category" htmlFor="eq-category">
              <Select id="eq-category" defaultValue="excavator">
                <option value="excavator">Excavator</option>
                <option value="bulldozer">Bulldozer</option>
                <option value="backhoe">Backhoe</option>
                <option value="skid_steer">Skid steer</option>
                <option value="dump_truck">Dump truck</option>
                <option value="loader">Loader</option>
                <option value="grader">Grader</option>
                <option value="compactor">Compactor</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current location" htmlFor="eq-location">
              <Input id="eq-location" placeholder="e.g. Main yard" />
            </Field>
            <Field label="Status" htmlFor="eq-status">
              <Select id="eq-status" defaultValue="available">
                <option value="available">Available</option>
                <option value="in_use">In use</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hours logged" htmlFor="eq-hours">
              <Input id="eq-hours" type="number" min={0} placeholder="0" />
            </Field>
            <Field label="Next service (hrs)" htmlFor="eq-service">
              <Input id="eq-service" type="number" min={0} placeholder="250" />
            </Field>
          </div>
          <button type="submit" className="hidden" aria-hidden />
        </form>
      </Modal>
    </>
  );
}
