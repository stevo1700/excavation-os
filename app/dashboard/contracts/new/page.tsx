import { PageHeader } from "@/components/layout/page-header";
import { ContractTemplateForm } from "@/components/contracts/contract-template-form";
import { createContractTemplate } from "@/lib/actions/contracts";

export const metadata = { title: "New contract template" };
export const dynamic = "force-dynamic";

export default function NewContractTemplatePage() {
  return (
    <div>
      <PageHeader
        title="New contract template"
        description="Write the agreement once. Placeholders fill when you apply it to a job."
      />
      <ContractTemplateForm
        action={createContractTemplate}
        submitLabel="Create template"
        cancelHref="/dashboard/contracts"
      />
    </div>
  );
}
