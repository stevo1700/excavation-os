import { NextResponse } from "next/server";
import { convertQuoteToInvoiceRecord } from "@/lib/actions/quotes";
import { getInvoice } from "@/lib/actions/invoices";
import {
  isMissingTableOrColumnError,
  schemaMismatchResponse,
} from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/catalog/quotes/[id]/convert — convert an approved quote to a
 * draft invoice, copying its line items (both JSON and normalized rows) and
 * linking quoteId. 400 if the quote isn't approved or doesn't exist.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const result = await convertQuoteToInvoiceRecord(params.id);
    if (!result.ok || !result.invoiceId) {
      const notFound = result.error === "Quote not found.";
      return NextResponse.json(
        { error: result.error },
        { status: notFound ? 404 : 400 },
      );
    }
    const invoice = await getInvoice(result.invoiceId);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
