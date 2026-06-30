import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { JobDetailTabs } from "@/components/jobs/job-detail-tabs";
import { crew, equipment, jobs } from "@/lib/data";
import { reportsForJob } from "@/lib/mock-reports";
import { jobColor } from "@/lib/utils";

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((item) => item.id === params.id);
  if (!job) notFound();

  const jobCrew = crew.filter((member) => member.assignedJob === job.id);
  const jobEquipment = equipment.filter(
    (machine) => machine.assignedJob === job.id,
  );
  const reports = reportsForJob(job.id);
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
