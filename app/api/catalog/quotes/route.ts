import { NextResponse } from "next/server";
import { createQuoteRecord, getQuotes } from "@/lib/actions/quotes";
import {
  isMissingTableOrColumnError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateQuoteInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/quotes — quotes, optional ?status= and ?customerId=. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quotes = await getQuotes({
    status: searchParams.get("status") ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    jobId: searchParams.get("jobId") ?? undefined,
  });
  return NextResponse.json(quotes);
}

/** POST /api/catalog/quotes — create a quote. Requires `jobId`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateQuoteInput(parsed.body, "create");
  if (validated.error) return validated.error;

  try {
    const quote = await createQuoteRecord(validated.input);
    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
