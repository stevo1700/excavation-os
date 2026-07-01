"use server";

import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";

export interface CatalogOverview {
  /** Total value of quotes not yet accepted/declined/expired (DRAFT + SENT). */
  openQuotesValue: number;
  /** Total outstanding invoice balance (SENT + PARTIAL, not yet fully paid). */
  outstandingInvoices: number;
  /** Payments received since the 1st of this month. */
  receivedThisMonth: number;
  customerCount: number;
}

/** Headline figures for the /dashboard/catalog overview. Zeros on any failure. */
export async function getCatalogOverview(): Promise<CatalogOverview> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [openQuotes, outstanding, received, customerCount] =
      await Promise.all([
        prisma.quote.aggregate({
          _sum: { total: true },
          where: { status: { in: ["DRAFT", "SENT"] } },
        }),
        prisma.invoice.aggregate({
          _sum: { total: true },
          where: { status: { in: ["SENT", "PARTIAL", "OVERDUE"] } },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { paidAt: { gte: startOfMonth } },
        }),
        prisma.customer.count(),
      ]);

    return {
      openQuotesValue: openQuotes._sum.total?.toNumber() ?? 0,
      outstandingInvoices: outstanding._sum.total?.toNumber() ?? 0,
      receivedThisMonth: received._sum.amount?.toNumber() ?? 0,
      customerCount,
    };
  } catch (error) {
    logActionError("getCatalogOverview", error);
    return {
      openQuotesValue: 0,
      outstandingInvoices: 0,
      receivedThisMonth: 0,
      customerCount: 0,
    };
  }
}
