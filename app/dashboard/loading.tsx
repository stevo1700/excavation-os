// Shown while any dashboard route streams its server data. A neutral skeleton
// keeps the shell stable and gives immediate feedback on navigation.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="space-y-2">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-slate-100" />
    </div>
  );
}
