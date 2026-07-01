import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";

// Public QR-scan landing page: /e/<assetTag> looks up the tagged machine and
// redirects to its dashboard detail page. Not under /dashboard, so it's
// reachable without signing in first — a scan should always resolve, even if
// the destination then prompts for auth.
export const dynamic = "force-dynamic";

export default async function EquipmentTagPage({
  params,
}: {
  params: { tag: string };
}) {
  const machine = await prisma.equipment.findUnique({
    where: { assetTag: params.tag },
    select: { id: true },
  });

  if (!machine) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-surface-900 px-6 text-center">
        <SearchX className="h-10 w-10 text-slate-500" />
        <h1 className="mt-4 text-lg font-semibold text-white">
          Equipment not found
        </h1>
        <p className="mt-1 max-w-sm text-sm text-slate-400">
          No equipment is tagged &ldquo;{params.tag}&rdquo;. Double-check the
          tag or QR code and try again.
        </p>
      </main>
    );
  }

  redirect(`/dashboard/equipment/${machine.id}`);
}
