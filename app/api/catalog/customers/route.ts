import { NextResponse } from "next/server";
import { createCustomerRecord, getCustomers } from "@/lib/actions/customers";
import {
  isMissingTableOrColumnError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateCustomerInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/customers — all customers. */
export async function GET() {
  const customers = await getCustomers();
  return NextResponse.json(customers);
}

/** POST /api/catalog/customers — create a customer. Requires `name`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCustomerInput(parsed.body, "create");
  if (validated.error) return validated.error;

  try {
    const customer = await createCustomerRecord(validated.input);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
