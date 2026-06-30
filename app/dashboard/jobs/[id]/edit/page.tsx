import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { JobForm, type JobFormDefaults } from "@/components/jobs/job-form";
import { deleteJob, getJob, updateJob } from "@/lib/actions/jobs";
import type { JobStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Map the UI status union back to the Prisma enum value for the status select.
const uiToPrismaStatus: Record<JobStatus, string> = {
  scheduled: "QUOTED",
  in_progress: "ACTIVE",
  on_hold: "ON_HOLD",
  completed: "COMPLETE",
};

export default async function EditJobPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const defaults: JobFormDefaults = {
    name: job.name,
    client: job.client,
    siteAddress: job.site,
    status: uiToPrismaStatus[job.status],
    startDate: job.startDate || undefined,
    estCompletion: job.dueDate || undefined,
    value: job.value,
    description: job.description,
  };

  const updateAction = updateJob.bind(null, job.id);
  const deleteAction = deleteJob.bind(null, job.id);

  return (
    <div>
      <PageHeader title={`Edit · ${job.name}`} description={job.id} />

      <JobForm
        action={updateAction}
        defaults={defaults}
        submitLabel="Save changes"
        cancelHref={`/dashboard/jobs/${job.id}`}
      />

      <div className="mt-8 max-w-2xl border-t border-slate-200 pt-6">
        <p className="text-sm font-medium text-slate-700">Danger zone</p>
        <p className="mt-1 text-xs text-slate-500">
          Cancelling a job removes it from active lists. This can&apos;t be
          undone from the dashboard.
        </p>
        <form action={deleteAction} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
          >
            Cancel this job
          </button>
        </form>
      </div>
    </div>
  );
}
