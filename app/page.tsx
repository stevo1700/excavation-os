import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HardHat,
  Mountain,
  Truck,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Wrench,
    title: "Job tracking",
    body: "Every dig, grade, and trench in one place — status, progress, and contract value at a glance.",
  },
  {
    icon: Truck,
    title: "Fleet visibility",
    body: "Know where each machine is, how many hours it has logged, and what's due for service.",
  },
  {
    icon: HardHat,
    title: "Crew management",
    body: "Assign foremen and operators to sites and keep certifications current.",
  },
  {
    icon: CalendarDays,
    title: "Weekly scheduling",
    body: "Plan the week across crews and equipment so nothing sits idle.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-900 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-surface-900">
            <Mountain className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold">Excavation OS</span>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
        >
          Open dashboard
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20">
        <p className="mb-4 inline-flex items-center rounded-full bg-surface-700 px-3 py-1 text-xs font-medium text-brand-300">
          Standalone client dashboard
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Run every job site from one{" "}
          <span className="text-brand-400">operations dashboard</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-400">
          Excavation OS gives earthworks contractors a single view of jobs,
          equipment, crew, and scheduling — no spreadsheets, no integrations to
          wire up, just the operating picture you need.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-slate-500">
            Demo data included — no setup required.
          </span>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-surface-700/60 bg-surface-800 p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-700 text-brand-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-400">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t border-surface-700/60 px-6 py-6 text-sm text-slate-500">
        Excavation OS — standalone scaffold. Built with Next.js.
      </footer>
    </main>
  );
}
