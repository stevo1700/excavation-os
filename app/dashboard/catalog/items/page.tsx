import { PageHeader } from "@/components/layout/page-header";
import { CatalogItemsLibrary } from "@/components/catalog/catalog-items-library";
import { getCatalogItems } from "@/lib/actions/catalog-items";

export const metadata = { title: "Catalog Items" };

export const dynamic = "force-dynamic";

export default async function CatalogItemsPage() {
  const items = await getCatalogItems();

  return (
    <div>
      <PageHeader
        title="Catalog items"
        description={`${items.length} reusable line items for quotes and invoices`}
      />
      <CatalogItemsLibrary items={items} />
    </div>
  );
}
