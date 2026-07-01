import Link from "next/link";
import { OEM_META, type Oem } from "@/lib/telematics/oem-meta";
import type { SyncedAssetRow } from "@/lib/actions/telematics";

export function SyncedAssetsTable({ assets }: { assets: SyncedAssetRow[] }) {
  if (assets.length === 0) {
    return (
      <p className="px-5 py-6 text-sm text-slate-400">
        No machines synced yet. Connect an OEM above and hit &ldquo;Sync
        now&rdquo; — some machines (e.g. Bobcat without an active Machine IQ
        subscription) may report zero results, which is expected.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">OEM</th>
            <th className="px-5 py-3 font-medium">Make / model</th>
            <th className="px-5 py-3 font-medium">Serial</th>
            <th className="px-5 py-3 font-medium">Asset tag</th>
            <th className="px-5 py-3 text-right font-medium">Engine hrs</th>
            <th className="px-5 py-3 text-right font-medium">Fuel %</th>
            <th className="px-5 py-3 font-medium">Last reported</th>
            <th className="px-5 py-3 text-right font-medium">Faults</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-slate-50/60">
              <td className="px-5 py-3 text-slate-700">
                {OEM_META[asset.oem as Oem]?.label ?? asset.oem}
              </td>
              <td className="px-5 py-3 text-slate-900">
                {[asset.make, asset.model].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="px-5 py-3 text-slate-500">
                {asset.serial ?? "—"}
              </td>
              <td className="px-5 py-3">
                {asset.assetTag && asset.equipmentId ? (
                  <Link
                    href={`/dashboard/equipment`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {asset.assetTag}
                  </Link>
                ) : (
                  <span className="text-slate-400">
                    {asset.assetTag ?? "Unmatched"}
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {asset.engineHours?.toLocaleString() ?? "—"}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {asset.fuelPercent ?? "—"}
              </td>
              <td className="px-5 py-3 text-slate-500">
                {asset.lastReportedAt
                  ? new Date(asset.lastReportedAt).toLocaleString()
                  : "—"}
              </td>
              <td className="px-5 py-3 text-right">
                {asset.faultCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    {asset.faultCount}
                  </span>
                ) : (
                  <span className="text-slate-300">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
