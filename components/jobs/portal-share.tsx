"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { generatePortalToken } from "@/lib/actions/portal";

// React 18.3 here predates useActionState/useFormState, so we invoke the server
// action directly from the click handler (still a server action — no fetch) and
// track pending state manually.
export function PortalShare({ jobId }: { jobId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);
    try {
      setToken(await generatePortalToken(jobId));
    } catch {
      setError("Could not create the link.");
    } finally {
      setPending(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = token ? `${origin}/portal/${token}` : null;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        <Share2 className="h-4 w-4" />
        {pending ? "Generating…" : "Share with client"}
      </button>

      {url ? (
        <div className="mt-2">
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
          />
          <p className="mt-1 text-xs text-slate-400">
            Anyone with this link can view a read-only summary of the job.
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
