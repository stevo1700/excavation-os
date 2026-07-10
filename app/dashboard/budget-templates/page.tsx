import Link from "next/link";
import { LayoutTemplate, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBudgetTemplates } from "@/lib/actions/budget-templates";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Budget templates" };
export const dynamic = "force-dynamic";

export default async function BudgetTemplatesPage() {
  const templates = await getBudgetTemplates();

  return (
    <div>
      <PageHeader
        title="Budget templates"
        description="Reusable estimate assemblies. Apply one to a job to load all cost lines at once."
        action={
          <Link
            href="/dashboard/budget-templates/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
          >
            <Plus className="h-4 w-4" />
            New template
          </Link>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No budget templates yet"
          description="Build a template with labor, equipment, and materials — then apply it from any job’s Budget tab."
          action={
            <Link
              href="/dashboard/budget-templates/new"
              className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900"
            >
              Create first template
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/dashboard/budget-templates/${t.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <Badge
                      tone={t.active ? "green" : "neutral"}
                      label={t.active ? "Active" : "Off"}
                    />
                  </div>
                  {t.description ? (
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {t.description}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">
                        Lines
                      </p>
                      <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
                        {t.lineCount}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">
                        Cost
                      </p>
                      <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
                        {formatCurrency(t.costTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-slate-400">
                        Sell
                      </p>
                      <p className="mt-0.5 font-semibold tabular-nums text-slate-800">
                        {formatCurrency(t.priceTotal)}
                      </p>
                    </div>
                  </div>
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
