import Link from "next/link";
import { FileSignature, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getContractTemplates } from "@/lib/actions/contracts";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Contract templates" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const templates = await getContractTemplates();

  return (
    <div>
      <PageHeader
        title="Contract templates"
        description="Reusable agreements. Apply one to a job to fill in client, site, and value."
        action={
          <Link
            href="/dashboard/contracts/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            New template
          </Link>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No contract templates yet"
          description="Create a template with placeholders like {{client}} and {{job_name}}, then apply it from any job."
          action={
            <Link
              href="/dashboard/contracts/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
            >
              Create first template
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/dashboard/contracts/${t.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <Badge
                      tone={t.active ? "green" : "neutral"}
                      label={t.active ? "Active" : "Inactive"}
                    />
                  </div>
                  {t.description ? (
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {t.description}
                    </p>
                  ) : null}
                  <p className="line-clamp-3 text-xs text-slate-400 whitespace-pre-wrap">
                    {t.body.slice(0, 180)}
                    {t.body.length > 180 ? "…" : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    Updated {formatDate(t.updatedAt)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
