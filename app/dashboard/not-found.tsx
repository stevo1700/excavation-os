import Link from "next/link";
import { SearchX } from "lucide-react";

// Rendered for notFound() within the dashboard (e.g. a job/customer/quote/
// invoice id that doesn't exist), inside the sidebar shell.
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <SearchX className="h-10 w-10 text-slate-300" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Not found</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        We couldn&apos;t find what you were looking for. It may have been
        removed or the link is out of date.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
      >
        Back to overview
      </Link>
    </div>
  );
}
