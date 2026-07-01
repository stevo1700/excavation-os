"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Input,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui/form";
import type { CredentialField } from "@/lib/telematics/oem-meta";

export function CredentialModal({
  open,
  onClose,
  oem,
  label,
  fields,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  oem: string;
  label: string;
  fields: CredentialField[];
  onConnected: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${oem}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to connect.");
        return;
      }
      setValues({});
      onConnected();
      onClose();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Connect ${label}`}
      description="Credentials are encrypted (AES-256-GCM) before they're stored and are never returned to the browser."
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="credential-form"
            disabled={submitting}
          >
            {submitting ? "Connecting…" : "Connect"}
          </PrimaryButton>
        </>
      }
    >
      <form id="credential-form" className="space-y-4" onSubmit={onSubmit}>
        {fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            htmlFor={`cred-${field.key}`}
          >
            <Input
              id={`cred-${field.key}`}
              type={field.type}
              required
              autoComplete="off"
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </Field>
        ))}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  );
}
