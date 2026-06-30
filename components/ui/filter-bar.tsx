"use client";

import { cn } from "@/lib/utils";

export interface FilterOption {
  /** Stable value, e.g. "all" or a status enum. */
  value: string;
  label: string;
  /** Optional count shown as a trailing badge. */
  count?: number;
}

/**
 * Row of pill buttons for filtering a list by a single value. Controlled —
 * the parent owns the active value and re-renders on change.
 */
export function FilterBar({
  options,
  value,
  onChange,
  className,
}: {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-brand-500 bg-brand-500 text-surface-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active
                    ? "bg-surface-900/10 text-surface-900"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
