import { PageHeader } from "@/components/layout/page-header";
import { NewJobModal } from "@/components/dashboard/new-job-modal";
import { JobsList } from "@/components/dashboard/jobs-list";
import { getJobs } from "@/lib/actions/jobs";

// Render per-request so the list reflects live database state.
export const metadata = { title: "Jobs" };

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div>
      <PageHeader
        title="Jobs"
        description={`${jobs.length} jobs across all sites`}
        action={<NewJobModal />}
      />

      <JobsList jobs={jobs} />
    </div>
  );
}
