import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QuotesList } from "@/components/finance/quotes-list";
import { getQuotes } from "@/lib/actions/quotes";

export const metadata = { title: "Quotes" };

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div>
      <PageHeader
        title="Quotes"
        description={`${quotes.length} quotes`}
        action={
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <FilePlus2 className="h-4 w-4" />
            New Quote
          </Link>
        }
      />

      <QuotesList quotes={quotes} />
    </div>
  );
}
