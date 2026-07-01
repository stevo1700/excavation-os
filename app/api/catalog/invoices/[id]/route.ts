import { NextResponse } from "next/server";
import { getInvoice, updateInvoiceRecord } from "@/lib/actions/invoices";
import {
  isMissingTableOrColumnError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateInvoiceInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/invoices/[id] — a single invoice with payment history, or 404. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const invoice = await getInvoice(params.id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

/** PATCH /api/catalog/invoices/[id] — update invoice fields. 404 if unknown. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateInvoiceInput(parsed.body, "update");
  if (validated.error) return validated.error;

  try {
    const invoice = await updateInvoiceRecord(params.id, validated.input);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
