import Link from "next/link";
import { FileText, FileSignature } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentsHub } from "@/components/documents/documents-hub";
import { getDocumentHub } from "@/lib/actions/documents";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const { documents, templates } = await getDocumentHub();

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Quotes, invoices, and contracts — live on the jobs they belong to. This is the company feed."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/contracts"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileSignature className="h-4 w-4" />
              Templates
            </Link>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
            >
              <FileText className="h-4 w-4" />
              Open a job
            </Link>
          </div>
        }
      />

      <DocumentsHub documents={documents} templates={templates} />
    </div>
  );
}
