import Link from "next/link";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerBoard } from "@/components/customers/customer-board";
import { getCustomerBoard } from "@/lib/actions/customers";

export const metadata = { title: "Customers" };

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomerBoard();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Drag customers through the sales pipeline"
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

      <CustomerBoard customers={customers} />
    </div>
  );
}
