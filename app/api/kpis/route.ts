import { NextResponse } from "next/server";
import { getKpiSummary } from "@/lib/actions/kpis";

export const dynamic = "force-dynamic";

/**
 * GET /api/kpis — headline metrics: active jobs, revenue YTD, equipment
 * utilization %, and crew on site today.
 */
export async function GET() {
  const kpis = await getKpiSummary();
  return NextResponse.json(kpis);
}
