import { NextResponse } from "next/server";
import { recordPayment } from "@/lib/actions/invoices";
import { readJsonObject } from "@/lib/http";
import { validatePaymentInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/**
 * POST /api/catalog/invoices/[id]/payment — record a payment; auto-sets the
 * invoice status to PARTIAL or PAID based on the running total against the
 * invoice total. 404 if the invoice doesn't exist.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validatePaymentInput(parsed.body);
  if (validated.error) return validated.error;

  const result = await recordPayment(params.id, validated.input);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result.invoice, { status: 201 });
}
