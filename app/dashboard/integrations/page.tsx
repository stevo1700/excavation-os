import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { OemCard } from "@/components/integrations/oem-card";
import { SyncedAssetsTable } from "@/components/integrations/synced-assets-table";
import { getConnections, getSyncedAssets } from "@/lib/actions/telematics";

export const metadata = { title: "Integrations" };

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [connections, assets] = await Promise.all([
    getConnections(),
    getSyncedAssets(),
  ]);

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect OEM telematics (AEMP 2.0 / ISO 15143-3) to pull machine location, hours, fuel, and fault codes."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <OemCard key={connection.oem} connection={connection} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Synced machines"
          description="Latest telematics reading per machine across all connected OEMs"
        />
        <SyncedAssetsTable assets={assets} />
      </Card>
    </div>
  );
}
