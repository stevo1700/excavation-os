"use server";

import { prisma } from "@/lib/prisma";
import { activity as mockActivity } from "@/lib/data";
import type { ActivityItem, ActivityKind } from "@/lib/types";

/**
 * Recent activity events, newest first, in UI shape. Falls back to bundled mock
 * data without a DB. The seed stores "title — detail" in `description`; it is
 * split back apart here.
 */
export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  try {
    const rows = await prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((event) => {
      const [title, ...rest] = event.description.split(" — ");
      return {
        id: event.id,
        kind: event.type as ActivityKind,
        title,
        detail: rest.join(" — "),
        timestamp: event.createdAt.toISOString(),
        jobId: event.jobId,
      };
    });
  } catch {
    return mockActivity.slice(0, limit);
  }
}
