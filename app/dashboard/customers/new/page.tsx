import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader
        title="New customer"
        description="Add a customer to the CRM."
      />
      <CustomerForm
        action={createCustomer}
        submitLabel="Create customer"
        cancelHref="/dashboard/customers"
      />
    </div>
  );
}
