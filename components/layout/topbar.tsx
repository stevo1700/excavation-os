import { Bell, Search } from "lucide-react";
import { MobileSidebar } from "@/components/layout/sidebar";

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 md:flex">
          <Search className="h-4 w-4" />
          <span>Search jobs, crew, equipment…</span>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-surface-900">
          SM
        </span>
      </div>
    </header>
  );
}
