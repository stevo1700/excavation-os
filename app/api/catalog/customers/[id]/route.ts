import { NextResponse } from "next/server";
import { getCustomer, updateCustomerRecord } from "@/lib/actions/customers";
import {
  isMissingTableOrColumnError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateCustomerInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/customers/[id] — a single customer with linked jobs/quotes/invoices, or 404. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const customer = await getCustomer(params.id);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

/** PATCH /api/catalog/customers/[id] — update customer fields. 404 if unknown. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCustomerInput(parsed.body, "update");
  if (validated.error) return validated.error;

  try {
    const customer = await updateCustomerRecord(params.id, validated.input);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(customer);
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
