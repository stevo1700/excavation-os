import Link from "next/link";
import { Mountain } from "lucide-react";

// Global 404 for routes outside the dashboard shell.
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-surface-900">
        <Mountain className="h-6 w-6" />
      </span>
      <p className="mt-5 text-3xl font-bold tracking-tight text-white">404</p>
      <p className="mt-1 text-sm text-slate-400">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
      >
        Go home
      </Link>
    </main>
  );
}
