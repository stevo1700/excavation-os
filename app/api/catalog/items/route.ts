import { NextResponse } from "next/server";
import {
  createCatalogItemRecord,
  getCatalogItems,
} from "@/lib/actions/catalog-items";
import {
  isMissingTableOrColumnError,
  isUniqueConstraintError,
  readJsonObject,
  schemaMismatchResponse,
} from "@/lib/http";
import { validateCatalogItemInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/items — catalog items, optional ?search= and ?category=. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const items = await getCatalogItems({
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    activeOnly: searchParams.get("activeOnly") === "true",
  });
  return NextResponse.json(items);
}

/** POST /api/catalog/items — create a catalog item. Requires `code`, `name`, `unit`. */
export async function POST(request: Request) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCatalogItemInput(parsed.body, "create");
  if (validated.error) return validated.error;

  try {
    const item = await createCatalogItemRecord(validated.input);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "`code` is already in use." },
        { status: 400 },
      );
    }
    if (isMissingTableOrColumnError(error)) return schemaMismatchResponse();
    throw error;
  }
}
