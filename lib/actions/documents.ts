"use server";

import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { getContractTemplates } from "@/lib/actions/contracts";

export type DocKind = "quote" | "invoice" | "contract";

export interface DocumentListItem {
  id: string;
  kind: DocKind;
  label: string;
  status: string;
  total: number | null;
  jobId: string;
  jobName: string;
  customerName: string | null;
  createdAt: string;
  href: string;
}

function money(v: { toNumber(): number } | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : v.toNumber();
}

/** Company-wide document feed: quotes, invoices, job contracts. */
export async function getAllDocuments(): Promise<DocumentListItem[]> {
  try {
    const [quotes, invoices, contracts] = await Promise.all([
      prisma.quote.findMany({
        include: { job: true, customer: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.invoice.findMany({
        include: { job: true, customer: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.jobContract.findMany({
        include: { job: true, template: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const items: DocumentListItem[] = [
      ...quotes.map((q) => ({
        id: q.id,
        kind: "quote" as const,
        label: q.quoteNumber + (q.title ? ` · ${q.title}` : ""),
        status: q.status,
        total: money(q.total),
        jobId: q.jobId,
        jobName: q.job.name,
        customerName: q.customer?.name ?? null,
        createdAt: q.createdAt.toISOString(),
        href: `/dashboard/quotes/${q.id}`,
      })),
      ...invoices.map((inv) => ({
        id: inv.id,
        kind: "invoice" as const,
        label: inv.invoiceNumber,
        status: inv.status,
        total: money(inv.total),
        jobId: inv.jobId,
        jobName: inv.job.name,
        customerName: inv.customer?.name ?? null,
        createdAt: inv.createdAt.toISOString(),
        href: `/dashboard/invoices/${inv.id}`,
      })),
      ...contracts.map((c) => ({
        id: c.id,
        kind: "contract" as const,
        label: c.title,
        status: c.status,
        total: null,
        jobId: c.jobId,
        jobName: c.job.name,
        customerName: null,
        createdAt: c.createdAt.toISOString(),
        href: `/dashboard/jobs/${c.jobId}`,
      })),
    ];

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return items;
  } catch (error) {
    logActionError("getAllDocuments", error);
    return [];
  }
}

export async function getDocumentHub() {
  const [documents, templates] = await Promise.all([
    getAllDocuments(),
    getContractTemplates(),
  ]);
  return { documents, templates };
}
