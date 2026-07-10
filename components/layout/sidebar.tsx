"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  FolderOpen,
  HardHat,
  LayoutTemplate,
  LayoutDashboard,
  Menu,
  Mountain,
  Plug,
  Truck,
  Users2,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Wrench },
  { href: "/dashboard/customers", label: "Customers", icon: Users2 },
  { href: "/dashboard/documents", label: "Documents", icon: FolderOpen },
  { href: "/dashboard/catalog", label: "Catalog", icon: BookOpen },
  { href: "/dashboard/budget-templates", label: "Budget templates", icon: LayoutTemplate },
  { href: "/dashboard/equipment", label: "Equipment", icon: Truck },
  { href: "/dashboard/crew", label: "Crew", icon: HardHat },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/timesheets", label: "Timesheets", icon: Clock },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-surface-900">
          <Mountain className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Excavation OS</p>
          <p className="text-xs text-slate-500">Operations</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          // Overview should only match exactly; sub-routes match by prefix.
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-surface-700 text-white"
                  : "text-slate-400 hover:bg-surface-800 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-700/60 px-5 py-4">
        <p className="text-xs text-slate-500">Signed in as</p>
        <p className="text-sm font-medium text-slate-200">Site Manager</p>
      </div>
    </div>
  );
}

/** Persistent sidebar on large screens. */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 bg-surface-900 text-slate-300 lg:block">
      <SidebarNav />
    </aside>
  );
}

/** Hamburger trigger + slide-over drawer for small screens. */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface-900 text-slate-300 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-surface-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
