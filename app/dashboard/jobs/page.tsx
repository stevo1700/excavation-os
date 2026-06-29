import { Badge, statusTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { jobs } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function JobsPage() {
  return (
    <div>
      <PageHeader
        title="Jobs"
        description={`${jobs.length} jobs across all sites`}
        action={
          <button
            type="button"
            className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            New job
          </button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Foreman</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{job.name}</p>
                    <p className="text-xs text-slate-500">
                      {job.id} · {job.site}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{job.client}</td>
                  <td className="px-5 py-3 text-slate-700">{job.foreman}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(job.status)} label={job.status} />
                  </td>
                  <td className="px-5 py-3">
                    <ProgressBar value={job.progress} />
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {formatDate(job.dueDate)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                    {formatCurrency(job.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
