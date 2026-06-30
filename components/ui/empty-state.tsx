import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

/** Friendly, consistent empty placeholder for lists and tables. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      {Icon ? <Icon className="mx-auto h-8 w-8 text-slate-300" /> : null}
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
