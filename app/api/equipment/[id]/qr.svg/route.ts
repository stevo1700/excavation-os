import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrSvg, qrUrlForTag } from "@/lib/qr";

export const dynamic = "force-dynamic";

/**
 * GET /api/equipment/[id]/qr.svg — the equipment's QR code as an SVG image.
 * Serves the stored qrSvg when present; otherwise generates one on the fly
 * (e.g. for rows that predate qrSvg being populated). 404 if the equipment
 * doesn't exist. Public — read-only, no auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const machine = await prisma.equipment.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!machine) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  const name = machine.name ?? machine.id;
  const url = `https://excavation-os.up.railway.app/equipment/${machine.id}`;

  const svg = await generateQrSvg(url);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
