import { PageHeader } from "@/components/layout/page-header";
import { AddEquipmentModal } from "@/components/dashboard/add-equipment-modal";
import { EquipmentList } from "@/components/dashboard/equipment-list";
import { getEquipment } from "@/lib/actions/equipment";
import { getJobs } from "@/lib/actions/jobs";

// Render per-request so the fleet reflects live database state.
export const metadata = { title: "Equipment" };

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const [equipment, jobs] = await Promise.all([getEquipment(), getJobs()]);
  const jobNames = Object.fromEntries(jobs.map((job) => [job.id, job.name]));

  return (
    <div>
      <PageHeader
        title="Equipment"
        description={`${equipment.length} machines in the fleet`}
        action={<AddEquipmentModal />}
      />

      <EquipmentList equipment={equipment} jobNames={jobNames} />
    </div>
  );
}
