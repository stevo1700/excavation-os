import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { JobDetailTabs } from "@/components/jobs/job-detail-tabs";
import { getJob } from "@/lib/actions/jobs";
import { getCrew } from "@/lib/actions/crew";
import { getEquipment } from "@/lib/actions/equipment";
import { getReportsForJob } from "@/lib/actions/reports";
import { jobColor } from "@/lib/utils";

// Render per-request so the detail reflects live database state.
export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const [crew, equipment, reports] = await Promise.all([
    getCrew(),
    getEquipment(),
    getReportsForJob(job.id),
  ]);

  const jobCrew = crew.filter((member) => member.assignedJob === job.id);
  const jobEquipment = equipment.filter(
    (machine) => machine.assignedJob === job.id,
  );
  const c = jobColor(job.color);

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-9 w-1.5 shrink-0 rounded-full ${c.dot}`} />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {job.name}
              </h2>
              <Badge tone={statusTone(job.status)} label={job.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {job.id} · {job.client} · {job.site}
            </p>
          </div>
        </div>
      </div>

      <JobDetailTabs
        job={job}
        crew={jobCrew}
        equipment={jobEquipment}
        reports={reports}
      />
    </div>
  );
}
