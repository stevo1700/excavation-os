import { PageHeader } from "@/components/layout/page-header";
import { ScheduleBoard } from "@/components/schedule/schedule-board";
import { getScheduleBoard } from "@/lib/actions/jobs";

export const metadata = { title: "Schedule" };

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const jobs = await getScheduleBoard();

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Drag jobs onto a day to schedule them"
      />

      <ScheduleBoard jobs={jobs} />
    </div>
  );
}
