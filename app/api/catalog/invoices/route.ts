import { NextResponse } from "next/server";
import { createInvoiceRecord, getInvoices } from "@/lib/actions/invoices";
import { readJsonObject } from "@/lib/http";
import { validateInvoiceInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/invoices — invoices, optional ?status= and ?customerId=. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invoices = await getInvoices({
    status: searchParams.get("status") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    jobId: searchParams.get("jobId") ?? undefined,
  });
  return NextResponse.json(invoices);
}

/** POST /api/catalog/invoices — create an invoice. Requires `jobId`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateInvoiceInput(parsed.body, "create");
  if (validated.error) return validated.error;

  const invoice = await createInvoiceRecord(validated.input);
  return NextResponse.json(invoice, { status: 201 });
}
