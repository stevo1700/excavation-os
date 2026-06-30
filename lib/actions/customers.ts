"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export interface CustomerListItem {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  jobCount: number;
  totalValue: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  jobs: { id: string; name: string; status: string; value: number }[];
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
    amountPaid: number;
  }[];
  summary: {
    totalJobs: number;
    totalValue: number;
    totalInvoiced: number;
    totalPaid: number;
  };
}

/** All customers ordered by name, with job count + contract value. */
export async function getCustomers(): Promise<CustomerListItem[]> {
  try {
    const rows = await prisma.customer.findMany({
      include: { jobs: { select: { contractValue: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map((customer) => ({
      id: customer.id,
      name: customer.name,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      jobCount: customer.jobs.length,
      totalValue: customer.jobs.reduce(
        (sum, job) => sum + job.contractValue,
        0,
      ),
    }));
  } catch (error) {
    logActionError("getCustomers", error);
    return [];
  }
}

/** A single customer with related jobs, quotes, and invoices. */
export async function getCustomer(id: string): Promise<CustomerDetail | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        jobs: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer) return null;

    const jobs = customer.jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: statusLabel(job.status),
      value: job.contractValue,
    }));
    const invoices = customer.invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      total: invoice.total.toNumber(),
      amountPaid: invoice.amountPaid.toNumber(),
    }));

    return {
      id: customer.id,
      name: customer.name,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      jobs,
      quotes: customer.quotes.map((quote) => ({
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        total: quote.total.toNumber(),
      })),
      invoices,
      summary: {
        totalJobs: jobs.length,
        totalValue: jobs.reduce((sum, job) => sum + job.value, 0),
        totalInvoiced: invoices.reduce((sum, inv) => sum + inv.total, 0),
        totalPaid: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
      },
    };
  } catch (error) {
    logActionError("getCustomer", error);
    return null;
  }
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseCustomerForm(formData: FormData) {
  return {
    name: field(formData, "name"),
    contactName: field(formData, "contactName") || null,
    email: field(formData, "email") || null,
    phone: field(formData, "phone") || null,
    address: field(formData, "address") || null,
    notes: field(formData, "notes") || null,
  };
}

/** Create a customer, then redirect to the customers list. */
export async function createCustomer(formData: FormData): Promise<void> {
  await prisma.customer.create({ data: parseCustomerForm(formData) });
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

/** Update a customer, then redirect to its detail page. */
export async function updateCustomer(
  id: string,
  formData: FormData,
): Promise<void> {
  await prisma.customer.update({
    where: { id },
    data: parseCustomerForm(formData),
  });
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  redirect(`/dashboard/customers/${id}`);
}

/** Delete a customer, but only when no jobs are linked to it. */
export async function deleteCustomer(id: string): Promise<void> {
  const jobCount = await prisma.job.count({ where: { customerId: id } });
  if (jobCount > 0) {
    throw new Error("Cannot delete a customer with linked jobs.");
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}
