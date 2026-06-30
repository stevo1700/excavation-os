import { PageHeader } from "@/components/layout/page-header";
import { AddCrewModal } from "@/components/dashboard/add-crew-modal";
import { CrewBoard } from "@/components/crew/crew-board";
import { getCrewBoard } from "@/lib/actions/crew";

export const metadata = { title: "Crew" };

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const crew = await getCrewBoard();

  return (
    <div>
      <PageHeader
        title="Crew"
        description="Drag crew between availability columns"
        action={<AddCrewModal />}
      />

      <CrewBoard crew={crew} />
    </div>
  );
}
