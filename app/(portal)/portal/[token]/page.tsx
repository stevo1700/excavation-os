import { Mountain } from "lucide-react";
import { getPortalData } from "@/lib/actions/portal";
import { formatDate } from "@/lib/utils";

// Public, read-only client view — no Clerk auth (see middleware).
export const dynamic = "force-dynamic";

export default async function ClientPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getPortalData(params.token);

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-4 text-center">
        <Mountain className="h-10 w-10 text-brand-500" />
        <h1 className="mt-4 text-xl font-semibold text-white">
          This link is not valid
        </h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          The client link you followed has expired or doesn&apos;t exist. Please
          ask your contractor for an updated link.
        </p>
      </main>
    );
  }

  const { job, reports, totalHours } = data;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-surface-900 px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-surface-900">
            <Mountain className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">
              Excavation<span className="text-brand-500">OS</span>
            </p>
            <p className="text-xs text-slate-500">Client portal</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {job.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{job.client}</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              {job.status}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Site address" value={job.siteAddress} />
            <Detail label="Total hours logged" value={`${totalHours} hrs`} />
            <Detail
              label="Start date"
              value={job.startDate ? formatDate(job.startDate) : "—"}
            />
            <Detail
              label="Est. completion"
              value={job.estCompletion ? formatDate(job.estCompletion) : "—"}
            />
          </dl>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Daily reports
          </h2>
          {reports.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
              No reports have been filed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(report.date)}
                    </p>
                    {report.weather ? (
                      <span className="text-xs text-slate-500">
                        {report.weather}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                    {report.summary}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {report.crewCount} crew on site
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="pt-2 text-center text-xs text-slate-400">
          Read-only summary shared by your contractor.
        </p>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  );
}
