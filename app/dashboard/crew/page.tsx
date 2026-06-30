import { PageHeader } from "@/components/layout/page-header";
import { AddCrewModal } from "@/components/dashboard/add-crew-modal";
import { CrewList } from "@/components/dashboard/crew-list";
import { getCrew } from "@/lib/actions/crew";
import { getJobs } from "@/lib/actions/jobs";

// Render per-request so the roster reflects live database state.
export const metadata = { title: "Crew" };

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const [crew, jobs] = await Promise.all([getCrew(), getJobs()]);
  const jobNames = Object.fromEntries(jobs.map((job) => [job.id, job.name]));

  return (
    <div>
      <PageHeader
        title="Crew"
        description={`${crew.length} crew members`}
        action={<AddCrewModal />}
      />

      <CrewList crew={crew} jobNames={jobNames} />
    </div>
  );
}
