"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import {
  Field,
  Input,
  PrimaryButton,
  SecondaryButton,
  Select,
  Textarea,
} from "@/components/ui/form";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import type { CatalogItemRecord } from "@/lib/actions/catalog-items";

const UNITS = ["each", "hr", "day", "ton", "sqft"];

export function CatalogItemModal({
  open,
  onClose,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Present when editing; absent when creating. */
  item: CatalogItemRecord | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    code: item?.code ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    unit: item?.unit ?? "each",
    unitPrice: String(item?.unitPrice ?? ""),
    category: item?.category ?? "OTHER",
    taxable: item?.taxable ?? true,
    active: item?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = item ? `/api/catalog/items/${item.id}` : "/api/catalog/items";
      const res = await fetch(url, {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          unitPrice: Number.parseFloat(values.unitPrice) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      onSaved();
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
      title={item ? "Edit catalog item" : "New catalog item"}
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="catalog-item-form"
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save"}
          </PrimaryButton>
        </>
      }
    >
      <form id="catalog-item-form" className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="ci-code">
            <Input
              id="ci-code"
              required
              placeholder="e.g. EX-HOUR"
              value={values.code}
              onChange={(e) =>
                setValues((v) => ({ ...v, code: e.target.value }))
              }
            />
          </Field>
          <Field label="Category" htmlFor="ci-category">
            <Select
              id="ci-category"
              value={values.category}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  category: e.target.value as typeof v.category,
                }))
              }
            >
              {CATALOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Name" htmlFor="ci-name">
          <Input
            id="ci-name"
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </Field>

        <Field label="Description" htmlFor="ci-description">
          <Textarea
            id="ci-description"
            rows={2}
            value={values.description}
            onChange={(e) =>
              setValues((v) => ({ ...v, description: e.target.value }))
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unit" htmlFor="ci-unit">
            <Select
              id="ci-unit"
              value={values.unit}
              onChange={(e) =>
                setValues((v) => ({ ...v, unit: e.target.value }))
              }
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unit price" htmlFor="ci-price">
            <Input
              id="ci-price"
              type="number"
              step="0.01"
              min="0"
              required
              value={values.unitPrice}
              onChange={(e) =>
                setValues((v) => ({ ...v, unitPrice: e.target.value }))
              }
            />
          </Field>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.taxable}
              onChange={(e) =>
                setValues((v) => ({ ...v, taxable: e.target.checked }))
              }
            />
            Taxable
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) =>
                setValues((v) => ({ ...v, active: e.target.checked }))
              }
            />
            Active
          </label>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  );
}
