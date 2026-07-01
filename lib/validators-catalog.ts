// Request-body validation for the /api/catalog/* write routes. Mirrors the
// pattern in lib/validators.ts (jobs/equipment/crew): each validator returns
// either a typed input or a ready-to-return 400 response.

import type { NextResponse } from "next/server";
import {
  badRequest,
  isFiniteNumber,
  isNonEmptyString,
  isOptionalDateString,
  isOptionalString,
} from "@/lib/http";
import { CATALOG_CATEGORIES } from "@/lib/catalog-categories";
import type { CatalogItemInput } from "@/lib/actions/catalog-items";
import type { CustomerWriteInput } from "@/lib/actions/customers";
import type { LineItemInput, QuoteWriteInput } from "@/lib/actions/quotes";
import type { InvoiceWriteInput, PaymentInput } from "@/lib/actions/invoices";

type Body = Record<string, unknown>;
type Result<T> =
  { input: T; error?: never } | { input?: never; error: NextResponse };

export const PAYMENT_METHODS = ["CASH", "CHECK", "CARD", "TRANSFER", "OTHER"];

// --- customers ------------------------------------------------------------

export function validateCustomerInput(
  body: Body,
  mode: "create" | "update",
): Result<CustomerWriteInput> {
  if (mode === "create" && !isNonEmptyString(body.name)) {
    return { error: badRequest("`name` is required.") };
  }
  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    return { error: badRequest("`name` must be a non-empty string.") };
  }
  for (const key of [
    "contactName",
    "company",
    "email",
    "phone",
    "address",
    "notes",
  ] as const) {
    if (!isOptionalString(body[key])) {
      return { error: badRequest(`\`${key}\` must be a string.`) };
    }
  }

  const input: CustomerWriteInput = {};
  if (body.name !== undefined) input.name = (body.name as string).trim();
  for (const key of [
    "contactName",
    "company",
    "email",
    "phone",
    "address",
    "notes",
  ] as const) {
    if (body[key] !== undefined) input[key] = body[key] as string | null;
  }
  return { input };
}

// --- catalog items ----------------------------------------------------------

export function validateCatalogItemInput(
  body: Body,
  mode: "create" | "update",
): Result<CatalogItemInput> {
  if (mode === "create") {
    if (!isNonEmptyString(body.code)) {
      return { error: badRequest("`code` is required.") };
    }
    if (!isNonEmptyString(body.name)) {
      return { error: badRequest("`name` is required.") };
    }
    if (!isNonEmptyString(body.unit)) {
      return { error: badRequest("`unit` is required.") };
    }
  } else {
    if (body.code !== undefined && !isNonEmptyString(body.code)) {
      return { error: badRequest("`code` must be a non-empty string.") };
    }
    if (body.name !== undefined && !isNonEmptyString(body.name)) {
      return { error: badRequest("`name` must be a non-empty string.") };
    }
    if (body.unit !== undefined && !isNonEmptyString(body.unit)) {
      return { error: badRequest("`unit` must be a non-empty string.") };
    }
  }
  if (
    body.category !== undefined &&
    !CATALOG_CATEGORIES.includes(body.category as never)
  ) {
    return {
      error: badRequest("Invalid `category`.", { allowed: CATALOG_CATEGORIES }),
    };
  }
  if (body.unitPrice !== undefined && !isFiniteNumber(body.unitPrice)) {
    return { error: badRequest("`unitPrice` must be a number.") };
  }
  if (body.taxable !== undefined && typeof body.taxable !== "boolean") {
    return { error: badRequest("`taxable` must be a boolean.") };
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return { error: badRequest("`active` must be a boolean.") };
  }
  if (!isOptionalString(body.description)) {
    return { error: badRequest("`description` must be a string.") };
  }

  const input: CatalogItemInput = {};
  if (body.code !== undefined) input.code = (body.code as string).trim();
  if (body.name !== undefined) input.name = (body.name as string).trim();
  if (body.unit !== undefined) input.unit = (body.unit as string).trim();
  if (body.description !== undefined) {
    input.description = body.description as string | null;
  }
  if (body.unitPrice !== undefined) input.unitPrice = body.unitPrice as number;
  if (body.category !== undefined) {
    input.category = body.category as CatalogItemInput["category"];
  }
  if (body.taxable !== undefined) input.taxable = body.taxable as boolean;
  if (body.active !== undefined) input.active = body.active as boolean;
  return { input };
}

// --- shared: line items ------------------------------------------------------

function validateLineItems(value: unknown): Result<LineItemInput[]> {
  if (value === undefined) return { input: [] };
  if (!Array.isArray(value)) {
    return { error: badRequest("`lineItems` must be an array.") };
  }
  const items: LineItemInput[] = [];
  for (const [index, raw] of value.entries()) {
    const item = (raw ?? {}) as Record<string, unknown>;
    if (!isFiniteNumber(item.quantity)) {
      return {
        error: badRequest(`lineItems[${index}].quantity must be a number.`),
      };
    }
    if (item.unitPrice !== undefined && !isFiniteNumber(item.unitPrice)) {
      return {
        error: badRequest(`lineItems[${index}].unitPrice must be a number.`),
      };
    }
    if (
      item.catalogItemId !== undefined &&
      typeof item.catalogItemId !== "string"
    ) {
      return {
        error: badRequest(
          `lineItems[${index}].catalogItemId must be a string.`,
        ),
      };
    }
    if (
      item.description !== undefined &&
      typeof item.description !== "string"
    ) {
      return {
        error: badRequest(`lineItems[${index}].description must be a string.`),
      };
    }
    items.push({
      quantity: item.quantity as number,
      unitPrice: item.unitPrice as number | undefined,
      catalogItemId: item.catalogItemId as string | undefined,
      description: item.description as string | undefined,
    });
  }
  return { input: items };
}

// --- quotes -----------------------------------------------------------------

export function validateQuoteInput(
  body: Body,
  mode: "create" | "update",
): Result<QuoteWriteInput> {
  if (mode === "create" && !isNonEmptyString(body.jobId)) {
    return { error: badRequest("`jobId` is required.") };
  }
  if (body.jobId !== undefined && !isNonEmptyString(body.jobId)) {
    return { error: badRequest("`jobId` must be a non-empty string.") };
  }
  if (!isOptionalString(body.title)) {
    return { error: badRequest("`title` must be a string.") };
  }
  if (!isOptionalString(body.customerId)) {
    return { error: badRequest("`customerId` must be a string.") };
  }
  if (!isOptionalString(body.notes)) {
    return { error: badRequest("`notes` must be a string.") };
  }
  if (!isOptionalDateString(body.validUntil)) {
    return { error: badRequest("`validUntil` must be a valid date string.") };
  }
  if (
    body.taxRatePercent !== undefined &&
    !isFiniteNumber(body.taxRatePercent)
  ) {
    return { error: badRequest("`taxRatePercent` must be a number.") };
  }
  if (body.status !== undefined && !isNonEmptyString(body.status)) {
    return { error: badRequest("`status` must be a non-empty string.") };
  }

  const lineItems = validateLineItems(body.lineItems);
  if (lineItems.error) return { error: lineItems.error };

  const input: QuoteWriteInput = { lineItems: lineItems.input };
  if (body.jobId !== undefined) input.jobId = body.jobId as string;
  if (body.title !== undefined) input.title = body.title as string | null;
  if (body.customerId !== undefined)
    input.customerId = body.customerId as string | null;
  if (body.status !== undefined)
    input.status = (body.status as string).toUpperCase();
  if (body.taxRatePercent !== undefined) {
    input.taxRatePercent = body.taxRatePercent as number;
  }
  if (body.notes !== undefined) input.notes = body.notes as string | null;
  if (body.validUntil !== undefined) {
    input.validUntil = body.validUntil as string | null;
  }
  return { input };
}

// --- invoices ---------------------------------------------------------------

export function validateInvoiceInput(
  body: Body,
  mode: "create" | "update",
): Result<InvoiceWriteInput> {
  if (mode === "create" && !isNonEmptyString(body.jobId)) {
    return { error: badRequest("`jobId` is required.") };
  }
  if (body.jobId !== undefined && !isNonEmptyString(body.jobId)) {
    return { error: badRequest("`jobId` must be a non-empty string.") };
  }
  if (!isOptionalString(body.customerId)) {
    return { error: badRequest("`customerId` must be a string.") };
  }
  if (!isOptionalString(body.quoteId)) {
    return { error: badRequest("`quoteId` must be a string.") };
  }
  if (!isOptionalString(body.notes)) {
    return { error: badRequest("`notes` must be a string.") };
  }
  if (!isOptionalDateString(body.dueDate)) {
    return { error: badRequest("`dueDate` must be a valid date string.") };
  }
  if (
    body.taxRatePercent !== undefined &&
    !isFiniteNumber(body.taxRatePercent)
  ) {
    return { error: badRequest("`taxRatePercent` must be a number.") };
  }
  if (body.status !== undefined && !isNonEmptyString(body.status)) {
    return { error: badRequest("`status` must be a non-empty string.") };
  }

  const lineItems = validateLineItems(body.lineItems);
  if (lineItems.error) return { error: lineItems.error };

  const input: InvoiceWriteInput = { lineItems: lineItems.input };
  if (body.jobId !== undefined) input.jobId = body.jobId as string;
  if (body.customerId !== undefined)
    input.customerId = body.customerId as string | null;
  if (body.quoteId !== undefined) input.quoteId = body.quoteId as string | null;
  if (body.status !== undefined)
    input.status = (body.status as string).toUpperCase();
  if (body.taxRatePercent !== undefined) {
    input.taxRatePercent = body.taxRatePercent as number;
  }
  if (body.notes !== undefined) input.notes = body.notes as string | null;
  if (body.dueDate !== undefined) input.dueDate = body.dueDate as string | null;
  return { input };
}

// --- payments -----------------------------------------------------------------

export function validatePaymentInput(body: Body): Result<PaymentInput> {
  if (!isFiniteNumber(body.amount) || (body.amount as number) <= 0) {
    return { error: badRequest("`amount` must be a positive number.") };
  }
  if (
    body.method !== undefined &&
    !PAYMENT_METHODS.includes(String(body.method).toUpperCase())
  ) {
    return {
      error: badRequest("Invalid `method`.", { allowed: PAYMENT_METHODS }),
    };
  }
  if (!isOptionalString(body.reference)) {
    return { error: badRequest("`reference` must be a string.") };
  }
  if (!isOptionalString(body.notes)) {
    return { error: badRequest("`notes` must be a string.") };
  }

  const input: PaymentInput = { amount: body.amount as number };
  if (body.method !== undefined)
    input.method = String(body.method).toUpperCase();
  if (body.reference !== undefined)
    input.reference = body.reference as string | null;
  if (body.notes !== undefined) input.notes = body.notes as string | null;
  return { input };
}
