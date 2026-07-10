import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ContractTemplateForm } from "@/components/contracts/contract-template-form";
import {
  deleteContractTemplate,
  getContractTemplate,
  updateContractTemplate,
} from "@/lib/actions/contracts";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Contract template" };
export const dynamic = "force-dynamic";

export default async function ContractTemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const template = await getContractTemplate(params.id);
  if (!template) notFound();

  const update = updateContractTemplate.bind(null, template.id);
  const remove = deleteContractTemplate.bind(null, template.id);

  return (
    <div>
      <Link
        href="/dashboard/contracts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to templates
      </Link>

      <div className="mb-4">
        <Badge
          tone={template.active ? "green" : "neutral"}
          label={template.active ? "Active" : "Inactive"}
        />
      </div>
      <PageHeader
        title={template.name}
        description="Edit template body and placeholders"
      />

      <ContractTemplateForm
        action={update}
        defaults={{
          name: template.name,
          description: template.description ?? undefined,
          body: template.body,
          active: template.active,
        }}
        submitLabel="Save template"
        cancelHref="/dashboard/contracts"
      />

      <div className="mt-8 max-w-3xl border-t border-slate-200 pt-6">
        <p className="text-sm font-medium text-slate-700">Danger zone</p>
        <p className="mt-1 text-xs text-slate-500">
          Deleting removes the template. Contracts already applied to jobs keep
          their filled text.
        </p>
        <form action={remove} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
          >
            Delete template
          </button>
        </form>
      </div>
    </div>
  );
}
