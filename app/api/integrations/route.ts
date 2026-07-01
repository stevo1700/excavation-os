import { NextResponse } from "next/server";
import { getConnections } from "@/lib/actions/telematics";

export const dynamic = "force-dynamic";

/** GET /api/integrations — all OEM connections. Credentials are never included. */
export async function GET() {
  const connections = await getConnections();
  return NextResponse.json(connections);
}
