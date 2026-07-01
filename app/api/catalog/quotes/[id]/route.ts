import { NextResponse } from "next/server";
import { getQuote, updateQuoteRecord } from "@/lib/actions/quotes";
import {
  isMissingTableOrColumnError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateQuoteInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/quotes/[id] — a single quote, or 404. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const quote = await getQuote(params.id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  return NextResponse.json(quote);
}

/** PATCH /api/catalog/quotes/[id] — update quote fields. 404 if unknown. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateQuoteInput(parsed.body, "update");
  if (validated.error) return validated.error;

  try {
    const quote = await updateQuoteRecord(params.id, validated.input);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json(quote);
  } catch (error) {
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
