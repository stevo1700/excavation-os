import Link from "next/link";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getTimesheetEntries } from "@/lib/actions/timesheets";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Timesheets" };

export const dynamic = "force-dynamic";

export default async function TimesheetsPage() {
  const entries = await getTimesheetEntries();
  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);

  return (
    <div>
      <PageHeader
        title="Timesheets"
        description={`${entries.length} entries · ${totalHours} hours logged`}
        action={
          <Link
            href="/dashboard/timesheets/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <Clock className="h-4 w-4" />
            Log Hours
          </Link>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No hours logged yet"
          description="Log crew hours against a job to start building timesheets."
          action={
            <Link
              href="/dashboard/timesheets/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
            >
              <Clock className="h-4 w-4" />
              Log Hours
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Crew member</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3 text-right">Hours</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {entry.crewMemberName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {entry.jobName}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">
                      {entry.hoursWorked}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {entry.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
