import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold tracking-tight text-white">
          Excavation<span className="text-brand-500">OS</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Authentication is currently disabled for testing.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
      >
        Go to dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
