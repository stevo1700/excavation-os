export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-500">{clamped}%</span>
    </div>
  );
}
