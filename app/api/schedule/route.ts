import { NextResponse } from "next/server";
import { getScheduleBoard } from "@/lib/actions/jobs";
import { parseWeek } from "@/lib/week";

export const dynamic = "force-dynamic";

/**
 * GET /api/schedule — scheduled job cards.
 *
 * Without a filter, returns every card (including unscheduled jobs). With
 * ?week= (an ISO week like "2026-W27" or any ISO date within the week), returns
 * only jobs scheduled in that Monday→Sunday range, plus the resolved range.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get("week");

  const range = week ? parseWeek(week) : null;
  if (week && !range) {
    return NextResponse.json(
      {
        error: "Invalid week. Use an ISO week (2026-W27) or date (2026-06-30).",
      },
      { status: 400 },
    );
  }

  const board = await getScheduleBoard();
  const entries = range
    ? board.filter(
        (card) =>
          card.scheduledDate !== null &&
          card.scheduledDate >= range.start &&
          card.scheduledDate <= range.end,
      )
    : board;

  return NextResponse.json({
    weekStart: range?.start ?? null,
    weekEnd: range?.end ?? null,
    entries,
  });
}
