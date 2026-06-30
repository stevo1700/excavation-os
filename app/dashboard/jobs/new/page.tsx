import { PageHeader } from "@/components/layout/page-header";
import { JobForm } from "@/components/jobs/job-form";
import { createJob } from "@/lib/actions/jobs";

export const metadata = { title: "New Job" };

export const dynamic = "force-dynamic";

export default function NewJobPage() {
  return (
    <div>
      <PageHeader
        title="New job"
        description="Set up a new job site and add it to the schedule."
      />

      <JobForm
        action={createJob}
        submitLabel="Create job"
        cancelHref="/dashboard/jobs"
      />
    </div>
  );
}
