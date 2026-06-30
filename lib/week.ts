// Helpers for the optional ?week= filter on /api/schedule. A week is identified
// either as an ISO week ("2026-W27") or any ISO date ("2026-06-30") that falls
// within it. Ranges are Monday→Sunday and compared as YYYY-MM-DD strings, which
// sort chronologically, so no timezone math is needed at the call site.

export interface WeekRange {
  /** Monday, YYYY-MM-DD. */
  start: string;
  /** Sunday, YYYY-MM-DD. */
  end: string;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monday (UTC) of ISO week `week` in `year`. */
function isoWeekMonday(year: number, week: number): Date {
  // ISO 8601: week 1 is the week containing Jan 4th.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7; // Mon=1 … Sun=7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

/** Monday (UTC) of the week containing `date`. */
function mondayOf(date: Date): Date {
  const dow = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (dow - 1));
  return monday;
}

/**
 * Resolve a `?week=` value to a Monday→Sunday range, or null if it isn't a
 * recognized ISO week or ISO date.
 */
export function parseWeek(value: string): WeekRange | null {
  const trimmed = value.trim();

  const isoWeek = /^(\d{4})-W(\d{2})$/.exec(trimmed);
  let monday: Date | null = null;

  if (isoWeek) {
    const year = Number(isoWeek[1]);
    const week = Number(isoWeek[2]);
    if (week >= 1 && week <= 53) monday = isoWeekMonday(year, week);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00Z`);
    if (!Number.isNaN(date.getTime())) monday = mondayOf(date);
  }

  if (!monday) return null;

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: ymd(monday), end: ymd(sunday) };
}
