import { NextResponse } from "next/server";
import { disconnectOem, getConnections } from "@/lib/actions/telematics";
import { isOem } from "@/lib/telematics/oem-meta";

export const dynamic = "force-dynamic";

/** POST /api/integrations/[oem]/disconnect — clear stored credentials, mark DISCONNECTED. */
export async function POST(
  _request: Request,
  { params }: { params: { oem: string } },
) {
  const oemParam = params.oem.toUpperCase();
  if (!isOem(oemParam)) {
    return NextResponse.json({ error: "Unknown OEM." }, { status: 404 });
  }

  await disconnectOem(oemParam);
  const connections = await getConnections();
  const connection = connections.find((c) => c.oem === oemParam);
  return NextResponse.json(connection);
}
