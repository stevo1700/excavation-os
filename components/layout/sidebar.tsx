"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  HardHat,
  LayoutDashboard,
  Mountain,
  Truck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Wrench },
  { href: "/dashboard/equipment", label: "Equipment", icon: Truck },
  { href: "/dashboard/crew", label: "Crew", icon: HardHat },
  { href: "/dashboard/schedule", label: "Schedule", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-surface-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-surface-900">
          <Mountain className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Excavation OS</p>
          <p className="text-xs text-slate-500">Operations</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
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
    </aside>
  );
}
