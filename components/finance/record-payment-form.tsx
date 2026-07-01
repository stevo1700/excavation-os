"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, PrimaryButton, Select } from "@/components/ui/form";

const METHODS = ["CASH", "CHECK", "CARD", "TRANSFER", "OTHER"];

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CARD");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalog/invoices/${invoiceId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount) || 0,
          method,
          reference: reference || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to record payment.");
        return;
      }
      setAmount("");
      setReference("");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <Field label="Amount" htmlFor="pay-amount">
        <Input
          id="pay-amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Method" htmlFor="pay-method">
        <Select
          id="pay-method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Reference (optional)" htmlFor="pay-ref">
        <Input
          id="pay-ref"
          placeholder="Check #, txn id…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </Field>
      <div className="flex items-end">
        <PrimaryButton
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? "Recording…" : "Record payment"}
        </PrimaryButton>
      </div>
      {error ? (
        <p className="text-sm text-rose-600 sm:col-span-4">{error}</p>
      ) : null}
    </form>
  );
}
