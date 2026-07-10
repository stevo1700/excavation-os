import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CatalogItemsLibrary } from "@/components/catalog/catalog-items-library";
import { getCatalogItems } from "@/lib/actions/catalog-items";

export const metadata = { title: "Catalog" };

export const dynamic = "force-dynamic";

/**
 * Cost catalog only — labor rates, equipment rates, materials, and other
 * unit costs. Not a quotes/invoices hub; those live under their own nav items.
 */
export default async function CatalogPage() {
  const items = await getCatalogItems();

  const labor = items.filter((i) => i.category === "LABOR").length;
  const equipment = items.filter((i) => i.category === "EQUIPMENT").length;
  const material = items.filter((i) => i.category === "MATERIAL").length;
  const other = items.filter(
    (i) => i.category === "SUBCONTRACT" || i.category === "OTHER",
  ).length;

  return (
    <div>
      <PageHeader
        title="Catalog"
        description="Labor, equipment, materials, and other cost items. Use these to build job budgets."
        action={
          <Link
            href="/dashboard/budget-templates"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Budget templates
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Labor" value={labor} hint="crew rates & hours" />
        <Stat label="Equipment" value={equipment} hint="machine rates" />
        <Stat label="Materials" value={material} hint="dirt, rock, supply" />
        <Stat label="Other costs" value={other} hint="subs & misc" />
      </div>

      <CatalogItemsLibrary items={items} />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
