import { NextResponse } from "next/server";
import {
  getCatalogItem,
  updateCatalogItemRecord,
} from "@/lib/actions/catalog-items";
import { isUniqueConstraintError, readJsonObject } from "@/lib/http";
import { validateCatalogItemInput } from "@/lib/validators-catalog";

export const dynamic = "force-dynamic";

/** GET /api/catalog/items/[id] — a single catalog item, or 404. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const item = await getCatalogItem(params.id);
  if (!item) {
    return NextResponse.json(
      { error: "Catalog item not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(item);
}

/** PATCH /api/catalog/items/[id] — update catalog item fields. 404 if unknown. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCatalogItemInput(parsed.body, "update");
  if (validated.error) return validated.error;

  try {
    const item = await updateCatalogItemRecord(params.id, validated.input);
    if (!item) {
      return NextResponse.json(
        { error: "Catalog item not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "`code` is already in use." },
        { status: 400 },
      );
    }
    throw error;
  }
}
