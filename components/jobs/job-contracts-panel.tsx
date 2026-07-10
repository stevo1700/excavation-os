import Link from "next/link";
import {
  applyContractTemplateForm,
  deleteJobContractForm,
  updateJobContractStatusForm,
  type JobContractView,
} from "@/lib/actions/contracts";
import type { ContractTemplateView } from "@/lib/actions/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function JobContractsPanel({
  jobId,
  contracts,
  templates,
}: {
  jobId: string;
  contracts: JobContractView[];
  templates: ContractTemplateView[];
}) {
  const apply = applyContractTemplateForm.bind(null, jobId);

  return (
    <Card>
      <CardHeader
        title="Contracts"
        description="Apply a template; placeholders fill from this job"
        action={
          <Link
            href="/dashboard/contracts"
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            Manage templates
          </Link>
        }
      />
      <CardBody className="space-y-4">
        {templates.length > 0 ? (
          <form action={apply} className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-slate-600">
              Apply template
              <select
                name="templateId"
                required
                defaultValue=""
                className="mt-1 block min-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              >
                <option value="" disabled>
                  Select template…
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
            >
              Apply to job
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            No active templates.{" "}
            <Link
              href="/dashboard/contracts/new"
              className="font-medium text-brand-700 hover:text-brand-800"
            >
              Create one
            </Link>
            .
          </p>
        )}

        {contracts.length === 0 ? (
          <p className="text-sm text-slate-400">No contracts on this job yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {contracts.map((c) => {
              const setStatus = updateJobContractStatusForm.bind(null, c.id);
              const remove = deleteJobContractForm.bind(null, c.id);
              return (
                <li key={c.id} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {c.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.templateName ? `From ${c.templateName} · ` : ""}
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        c.status === "SIGNED"
                          ? "green"
                          : c.status === "SENT"
                            ? "blue"
                            : c.status === "VOID"
                              ? "red"
                              : "neutral"
                      }
                      label={c.status}
                    />
                  </div>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    {c.body}
                  </pre>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setStatus} className="flex items-center gap-1.5">
                      <select
                        name="status"
                        defaultValue={c.status}
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="SIGNED">Signed</option>
                        <option value="VOID">Void</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Update
                      </button>
                    </form>
                    <form action={remove}>
                      <button
                        type="submit"
                        className="text-xs text-slate-400 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
