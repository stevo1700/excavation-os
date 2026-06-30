import clsx, { type ClassValue } from "clsx";
import type { JobColor } from "./types";

/** Compose conditional class names. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact money for tight spaces, e.g. $1.8M. */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

/** Turn a snake_case enum value into a readable label, e.g. "in_progress" → "In progress". */
export function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Relative "time ago" label for activity timestamps, computed against a fixed
 * reference date so the mocked feed reads consistently in the demo.
 */
const NOW_REFERENCE = new Date("2026-06-29T16:00:00");

export function timeAgo(iso: string, now: Date = NOW_REFERENCE): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

/** Tailwind class bundles for each job color key. */
const jobColorMap: Record<
  JobColor,
  { bg: string; text: string; border: string; dot: string; hex: string }
> = {
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-300",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  sky: {
    bg: "bg-sky-100",
    text: "text-sky-800",
    border: "border-sky-300",
    dot: "bg-sky-500",
    hex: "#0ea5e9",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  violet: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-300",
    dot: "bg-violet-500",
    hex: "#8b5cf6",
  },
  rose: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-300",
    dot: "bg-rose-500",
    hex: "#f43f5e",
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-800",
    border: "border-cyan-300",
    dot: "bg-cyan-500",
    hex: "#06b6d4",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-300",
    dot: "bg-orange-500",
    hex: "#f97316",
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-300",
    dot: "bg-indigo-500",
    hex: "#6366f1",
  },
  teal: {
    bg: "bg-teal-100",
    text: "text-teal-800",
    border: "border-teal-300",
    dot: "bg-teal-500",
    hex: "#14b8a6",
  },
  fuchsia: {
    bg: "bg-fuchsia-100",
    text: "text-fuchsia-800",
    border: "border-fuchsia-300",
    dot: "bg-fuchsia-500",
    hex: "#d946ef",
  },
};

export function jobColor(color: JobColor) {
  return jobColorMap[color];
}
