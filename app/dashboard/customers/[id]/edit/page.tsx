import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import {
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/lib/actions/customers";

export const metadata = { title: "Edit Customer" };

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const updateAction = updateCustomer.bind(null, customer.id);
  const deleteAction = deleteCustomer.bind(null, customer.id);
  const hasJobs = customer.jobs.length > 0;

  return (
    <div>
      <PageHeader title={`Edit · ${customer.name}`} />

      <CustomerForm
        action={updateAction}
        defaults={{
          name: customer.name,
          contactName: customer.contactName ?? undefined,
          company: customer.company ?? undefined,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
          address: customer.address ?? undefined,
          notes: customer.notes ?? undefined,
        }}
        submitLabel="Save changes"
        cancelHref={`/dashboard/customers/${customer.id}`}
      />

      <div className="mt-8 max-w-2xl border-t border-slate-200 pt-6">
        <p className="text-sm font-medium text-slate-700">Danger zone</p>
        {hasJobs ? (
          <p className="mt-1 text-xs text-slate-500">
            This customer has linked jobs and can&apos;t be deleted. Reassign or
            remove those jobs first.
          </p>
        ) : (
          <form action={deleteAction} className="mt-3">
            <button
              type="submit"
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              Delete customer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
