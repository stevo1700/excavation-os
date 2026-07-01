import { NextResponse } from "next/server";
import { syncOem } from "@/lib/actions/telematics";
import { isOem } from "@/lib/telematics/oem-meta";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/[oem]/sync — call the OEM's AEMP 2.0 /Fleet
 * endpoint with the stored (decrypted) credentials, upsert TelematicsAssets,
 * and update lastSyncAt on success or status=ERROR + lastError on failure.
 * Always returns 200 with { ok, assetCount? , error? } — a sync failure is an
 * expected, handled outcome, not a server error.
 */
export async function POST(
  _request: Request,
  { params }: { params: { oem: string } },
) {
  const oemParam = params.oem.toUpperCase();
  if (!isOem(oemParam)) {
    return NextResponse.json({ error: "Unknown OEM." }, { status: 404 });
  }

  const result = await syncOem(oemParam);
  return NextResponse.json(result);
}
