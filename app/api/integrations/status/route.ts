import { NextResponse } from "next/server";
import { getConnections } from "@/lib/actions/telematics";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/status — lightweight poll for the integrations page:
 * just status/lastSyncAt/lastError per OEM (same underlying data as
 * GET /api/integrations, kept as a separate endpoint per spec for a cheap
 * polling target).
 */
export async function GET() {
  const connections = await getConnections();
  return NextResponse.json(
    connections.map((c) => ({
      oem: c.oem,
      status: c.status,
      lastSyncAt: c.lastSyncAt,
      lastError: c.lastError,
    })),
  );
}
