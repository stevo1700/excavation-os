import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/http";
import { connectOem, getConnections } from "@/lib/actions/telematics";
import { isOem, validateCredentials } from "@/lib/telematics/oem-meta";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/[oem]/connect — validate, encrypt, and save
 * credentials for an OEM; marks the connection CONNECTED.
 */
export async function POST(
  request: Request,
  { params }: { params: { oem: string } },
) {
  const oemParam = params.oem.toUpperCase();
  if (!isOem(oemParam)) {
    return NextResponse.json({ error: "Unknown OEM." }, { status: 404 });
  }

  const parsed = await readJsonObject(request);
  if (parsed.error) return parsed.error;

  const validated = validateCredentials(oemParam, parsed.body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  await connectOem(oemParam, validated.credentials);
  const connections = await getConnections();
  const connection = connections.find((c) => c.oem === oemParam);
  return NextResponse.json(connection);
}
