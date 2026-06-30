"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Catches unexpected render/data errors within the dashboard and offers a retry
// instead of a blank crash.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-rose-500" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">
        Something went wrong
      </h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        This page hit an unexpected error. Try again — if it keeps happening the
        error has been logged for review.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
      >
        Try again
      </button>
    </div>
  );
}
