"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  MapPin,
  Wallet,
} from "lucide-react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FinanceStatusBadge } from "@/components/finance/status-badge";
import { JobAssignmentsPanel } from "@/components/jobs/job-assignments-panel";
import { JobBudgetPanel } from "@/components/jobs/job-budget-panel";
import { JobContractsPanel } from "@/components/jobs/job-contracts-panel";
import { JobFinancialStrip } from "@/components/jobs/job-financial-strip";
import { PortalShare } from "@/components/jobs/portal-share";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { JobBudgetSnapshot } from "@/lib/actions/budget";
import type { CatalogItemRecord } from "@/lib/actions/catalog-items";
import type { BudgetTemplateListItem } from "@/lib/actions/budget-templates";
import type { JobAssignmentView } from "@/lib/actions/assignments";
import type {
  ContractTemplateView,
  JobContractView,
} from "@/lib/actions/contracts";
import type { JobFinancialSnapshot, JobHubCustomer } from "@/lib/actions/job-hub";
import type { JobTaskView } from "@/lib/actions/tasks";
import type { TimesheetEntryView } from "@/lib/actions/timesheets";
import type { CrewMember, DailyReport, Equipment, Job } from "@/lib/types";
import {
  addJobTaskForm,
  deleteJobTaskForm,
  toggleJobTaskForm,
} from "@/lib/actions/tasks";
import { cn, formatCurrency, formatDate, humanize, jobColor } from "@/lib/utils";

type TabKey =
  | "overview"
  | "budget"
  | "schedule"
  | "map"
  | "tasks"
  | "documents";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "map", label: "Map", icon: MapPin },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "documents", label: "Documents", icon: FileText },
];

export function JobWorkspace({
  job,
  customer,
  financials,
  budget,
  catalogItems,
  budgetTemplates,
  quotes,
  invoices,
  assignments,
  availableCrew,
  availableEquipment,
  jobCrew,
  jobEquipment,
  reports,
  timesheets,
  contracts,
  templates,
  tasks,
}: {
  job: Job;
  customer: JobHubCustomer | null;
  financials: JobFinancialSnapshot;
  budget: JobBudgetSnapshot;
  catalogItems: CatalogItemRecord[];
  budgetTemplates: BudgetTemplateListItem[];
  quotes: {
    id: string;
    quoteNumber: string;
    status: string;
    total: number;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
  }[];
  assignments: JobAssignmentView[];
  availableCrew: { id: string; name: string; role: string }[];
  availableEquipment: { id: string; name: string; assetTag: string }[];
  jobCrew: CrewMember[];
  jobEquipment: Equipment[];
  reports: DailyReport[];
  timesheets: TimesheetEntryView[];
  contracts: JobContractView[];
  templates: ContractTemplateView[];
  tasks: JobTaskView[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const c = jobColor(job.color);
  const openTasks = tasks.filter((t) => !t.done).length;
  const mapsQuery = encodeURIComponent(job.site || job.name);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbed = `https://maps.google.com/maps?q=${mapsQuery}&z=14&output=embed`;

  const counts = useMemo(
    () => ({
      budget: budget.lineCount,
      schedule: assignments.filter((a) => a.isActive).length,
      tasks: openTasks,
      documents: quotes.length + invoices.length + contracts.length,
    }),
    [budget.lineCount, assignments, openTasks, quotes.length, invoices.length, contracts.length],
  );

  return (
    <div>
      {/* Compact header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 h-9 w-1.5 shrink-0 rounded-full ${c.dot}`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                {job.name}
              </h2>
              <Badge tone={statusTone(job.status)} label={job.status} />
            </div>
            <p className="mt-1 truncate text-sm text-slate-500">
              {job.client}
              {job.site ? ` · ${job.site}` : ""}
            </p>
            {customer ? (
              <Link
                href={`/dashboard/customers/${customer.id}`}
                className="mt-1 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                {customer.name}
                {customer.phone ? ` · ${customer.phone}` : ""}
              </Link>
            ) : null}
          </div>
        </div>
        <Link
          href={`/dashboard/jobs/${job.id}/edit`}
          className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
        >
          Edit job
        </Link>
      </div>

      {/* Horizontal JobTread-style tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count =
            t.key === "budget"
              ? counts.budget
              : t.key === "schedule"
                ? counts.schedule
                : t.key === "tasks"
                  ? counts.tasks
                  : t.key === "documents"
                    ? counts.documents
                    : undefined;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {count != null && count > 0 ? (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          job={job}
          financials={financials}
          budget={budget}
          jobCrew={jobCrew}
          jobEquipment={jobEquipment}
          reports={reports}
          tasks={tasks}
          quotes={quotes}
          invoices={invoices}
          onJump={setTab}
        />
      ) : null}

      {tab === "budget" ? (
        <JobBudgetPanel
          jobId={job.id}
          budget={budget}
          catalogItems={catalogItems}
          budgetTemplates={budgetTemplates}
          quoteOptions={quotes.map((q) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            status: q.status,
          }))}
        />
      ) : null}

      {tab === "schedule" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Dates" description="Planned job window" />
            <CardBody className="grid gap-3 sm:grid-cols-3 text-sm">
              <DateCell label="Start" value={formatDate(job.startDate)} />
              <DateCell label="Due" value={formatDate(job.dueDate)} />
              <DateCell label="Progress" value={`${job.progress}%`} />
            </CardBody>
          </Card>
          <JobAssignmentsPanel
            jobId={job.id}
            assignments={assignments}
            availableCrew={availableCrew}
            availableEquipment={availableEquipment}
          />
          {timesheets.length > 0 ? (
            <Card>
              <CardHeader
                title="Recent timesheets"
                description={`${timesheets.length} entries`}
              />
              <ul className="divide-y divide-slate-100">
                {timesheets.slice(0, 8).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                  >
                    <span className="text-slate-700">
                      {entry.crewMemberName} · {formatDate(entry.date)}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {entry.hoursWorked}h
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "map" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Site location"
              description={job.site || "No address set — edit the job to add one"}
              action={
                job.site ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    Open in Maps
                  </a>
                ) : null
              }
            />
            <CardBody>
              {job.site ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <iframe
                    title="Job site map"
                    src={mapsEmbed}
                    className="h-[360px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Add a site address on the job to show a map.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "tasks" ? <TasksPanel jobId={job.id} tasks={tasks} /> : null}

      {tab === "documents" ? (
        <div className="space-y-6">
          <JobContractsPanel
            jobId={job.id}
            contracts={contracts}
            templates={templates}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <DocList
              title="Quotes"
              empty="No quotes yet — create one from the Budget tab"
              items={quotes.map((q) => ({
                id: q.id,
                href: `/dashboard/quotes/${q.id}`,
                label: q.quoteNumber,
                meta: formatCurrency(q.total),
                status: q.status,
              }))}
              newHref={`/dashboard/quotes/new?jobId=${job.id}`}
            />
            <DocList
              title="Invoices"
              empty="No invoices yet"
              items={invoices.map((inv) => ({
                id: inv.id,
                href: `/dashboard/invoices/${inv.id}`,
                label: inv.invoiceNumber,
                meta: formatCurrency(inv.total),
                status: inv.status,
              }))}
              newHref={`/dashboard/invoices/new?jobId=${job.id}`}
            />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Client portal
            </h3>
            <PortalShare jobId={job.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OverviewTab({
  job,
  financials,
  budget,
  jobCrew,
  jobEquipment,
  reports,
  tasks,
  quotes,
  invoices,
  onJump,
}: {
  job: Job;
  financials: JobFinancialSnapshot;
  budget: JobBudgetSnapshot;
  jobCrew: CrewMember[];
  jobEquipment: Equipment[];
  reports: DailyReport[];
  tasks: JobTaskView[];
  quotes: { id: string; quoteNumber: string; status: string; total: number }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
  }[];
  onJump: (tab: TabKey) => void;
}) {
  const openTasks = tasks.filter((t) => !t.done);

  return (
    <div className="space-y-6">
      <JobFinancialStrip jobId={job.id} financials={financials} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <JumpCard
          label="Budget lines"
          value={String(budget.lineCount)}
          hint={formatCurrency(budget.budgetTotal)}
          onClick={() => onJump("budget")}
        />
        <JumpCard
          label="Open tasks"
          value={String(openTasks.length)}
          hint={`${tasks.length} total`}
          onClick={() => onJump("tasks")}
        />
        <JumpCard
          label="Crew on job"
          value={String(jobCrew.length)}
          hint={`${jobEquipment.length} machines`}
          onClick={() => onJump("schedule")}
        />
        <JumpCard
          label="Documents"
          value={String(quotes.length + invoices.length)}
          hint={`${quotes.length} quotes · ${invoices.length} invoices`}
          onClick={() => onJump("documents")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Job summary" />
          <CardBody className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Client" value={job.client} />
              <Detail label="Site" value={job.site || "—"} />
              <Detail label="Start" value={formatDate(job.startDate)} />
              <Detail label="Due" value={formatDate(job.dueDate)} />
              <Detail label="Contract" value={formatCurrency(job.value)} />
              <Detail label="Foreman" value={job.foreman} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Progress
              </p>
              <div className="mt-2">
                <ProgressBar value={job.progress} />
              </div>
            </div>
            {job.description ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">
                  {job.description}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Money snapshot"
            description="From budget ledger"
            action={
              <button
                type="button"
                onClick={() => onJump("budget")}
                className="text-xs font-medium text-brand-700"
              >
                Open budget
              </button>
            }
          />
          <CardBody className="space-y-2 text-sm">
            <Row k="Budgeted cost" v={formatCurrency(budget.budgetTotal)} />
            <Row k="Sell price" v={formatCurrency(budget.priceTotal)} />
            <Row
              k="Projected profit"
              v={formatCurrency(budget.profitTotal)}
              tone={
                budget.profitTotal < 0
                  ? "bad"
                  : budget.profitTotal > 0
                    ? "good"
                    : undefined
              }
            />
            <Row k="Quoted" v={formatCurrency(budget.quotedTotal)} />
            <Row k="Invoiced" v={formatCurrency(budget.invoicedTotal)} />
            <Row k="Actual cost" v={formatCurrency(budget.actualTotal)} />
            <Row
              k="Cost variance"
              v={formatCurrency(budget.variance)}
              tone={
                budget.variance > 0
                  ? "bad"
                  : budget.variance < 0
                    ? "good"
                    : undefined
              }
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Open tasks"
            action={
              <button
                type="button"
                onClick={() => onJump("tasks")}
                className="text-xs font-medium text-brand-700"
              >
                All tasks
              </button>
            }
          />
          <CardBody>
            {openTasks.length === 0 ? (
              <p className="text-sm text-slate-400">No open tasks.</p>
            ) : (
              <ul className="space-y-2">
                {openTasks.slice(0, 5).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-slate-800">{t.title}</span>
                    {t.dueDate ? (
                      <span className="text-xs text-slate-400">
                        {formatDate(t.dueDate)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Latest daily reports" />
          <CardBody>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400">No reports yet.</p>
            ) : (
              <ul className="space-y-2">
                {reports.slice(0, 4).map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="font-medium text-slate-800">
                      {formatDate(r.date)} · {r.weather}
                    </p>
                    <p className="line-clamp-2 text-slate-500">{r.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function TasksPanel({
  jobId,
  tasks,
}: {
  jobId: string;
  tasks: JobTaskView[];
}) {
  const add = addJobTaskForm.bind(null, jobId);
  return (
    <div className="space-y-4">
      <form
        action={add}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="min-w-[200px] flex-1 text-xs font-medium text-slate-600">
          New task
          <input
            name="title"
            required
            placeholder="e.g. Call utility locate"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Due
          <input
            name="dueDate"
            type="date"
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 hover:bg-brand-400"
        >
          Add task
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">No tasks yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {tasks.map((task) => {
            const toggle = toggleJobTaskForm.bind(null, task.id);
            const remove = deleteJobTaskForm.bind(null, task.id);
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <form action={toggle} className="flex min-w-0 flex-1 items-center gap-3">
                  <input type="hidden" name="done" value={task.done ? "false" : "true"} />
                  <button
                    type="submit"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                      task.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white",
                    )}
                    aria-label={task.done ? "Mark open" : "Mark done"}
                  >
                    {task.done ? "✓" : ""}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      task.done
                        ? "text-slate-400 line-through"
                        : "font-medium text-slate-900",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.dueDate ? (
                    <span className="text-xs text-slate-400">
                      {formatDate(task.dueDate)}
                    </span>
                  ) : null}
                </form>
                <form action={remove}>
                  <button
                    type="submit"
                    className="text-xs text-slate-400 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DocList({
  title,
  empty,
  items,
  newHref,
}: {
  title: string;
  empty: string;
  items: {
    id: string;
    href: string;
    label: string;
    meta: string;
    status: string;
  }[];
  newHref: string;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        description={`${items.length} on this job`}
        action={
          <Link
            href={newHref}
            className="text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            New
          </Link>
        }
      />
      {items.length === 0 ? (
        <CardBody>
          <p className="text-sm text-slate-400">{empty}</p>
        </CardBody>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-900">{item.label}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-slate-500">{item.meta}</span>
                  <FinanceStatusBadge status={item.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function JumpCard({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-slate-800">{value}</p>
    </div>
  );
}

function DateCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 font-medium text-slate-900">{value}</p>
    </div>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{k}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          tone === "bad"
            ? "text-rose-600"
            : tone === "good"
              ? "text-emerald-600"
              : "text-slate-900",
        )}
      >
        {v}
      </span>
    </div>
  );
}
