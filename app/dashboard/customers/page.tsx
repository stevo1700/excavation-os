import Link from "next/link";
import { UserPlus, Users2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCustomers } from "@/lib/actions/customers";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
        action={
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
          >
            <UserPlus className="h-4 w-4" />
            New Customer
          </Link>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No customers yet"
          description="Add your first customer to start tracking jobs, quotes, and invoices against them."
          action={
            <Link
              href="/dashboard/customers/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-surface-900 transition-colors hover:bg-brand-400"
            >
              <UserPlus className="h-4 w-4" />
              New Customer
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 text-right">Jobs</th>
                  <th className="px-5 py-3 text-right">Contract value</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {customer.contactName ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {customer.email ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {customer.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                      {customer.jobCount}
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                      {formatCurrency(customer.totalValue)}
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
