import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-xs font-medium text-slate-600"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClasses, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(controlClasses, props.className)} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClasses, props.className)} />;
}

/** Primary / secondary buttons shared by modal footers. */
export function PrimaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode },
) {
  const { children, className, ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode },
) {
  const { children, className, ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50",
        className,
      )}
    >
      {children}
    </button>
  );
}
