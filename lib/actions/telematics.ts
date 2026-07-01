"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";
import { decryptCredentials, encryptCredentials } from "@/lib/crypto";
import { syncOemFleet, TelematicsSyncError } from "@/lib/telematics/client";
import { OEM_META, OEMS, type Oem } from "@/lib/telematics/oem-meta";
import type { OemCredentials } from "@/lib/telematics/client";

export interface ConnectionSummary {
  oem: Oem;
  label: string;
  platform: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  assetCount: number;
}

function isoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/** All three OEM connections, credentials always omitted. Falls back to a disconnected stub per OEM if the DB is unreachable. */
export async function getConnections(): Promise<ConnectionSummary[]> {
  try {
    const rows = await prisma.telematicsConnection.findMany({
      include: { _count: { select: { assets: true } } },
    });
    const byOem = new Map(rows.map((row) => [row.oem, row]));

    return OEMS.map((oem) => {
      const row = byOem.get(oem);
      return {
        oem,
        label: OEM_META[oem].label,
        platform: OEM_META[oem].platform,
        status: row?.status ?? "DISCONNECTED",
        lastSyncAt: isoOrNull(row?.lastSyncAt ?? null),
        lastError: row?.lastError ?? null,
        assetCount: row?._count.assets ?? 0,
      };
    });
  } catch (error) {
    logActionError("getConnections", error);
    return OEMS.map((oem) => ({
      oem,
      label: OEM_META[oem].label,
      platform: OEM_META[oem].platform,
      status: "DISCONNECTED",
      lastSyncAt: null,
      lastError: null,
      assetCount: 0,
    }));
  }
}

/** Save (encrypted) credentials for `oem` and mark it connected. */
export async function connectOem(
  oem: Oem,
  credentials: OemCredentials,
): Promise<void> {
  const encrypted = encryptCredentials(JSON.stringify(credentials));
  await prisma.telematicsConnection.upsert({
    where: { oem },
    create: {
      oem,
      status: "CONNECTED",
      encryptedCredentials: encrypted,
    },
    update: {
      status: "CONNECTED",
      encryptedCredentials: encrypted,
      lastError: null,
    },
  });
  revalidatePath("/dashboard/integrations");
}

/** Clear credentials for `oem` and mark it disconnected. */
export async function disconnectOem(oem: Oem): Promise<void> {
  await prisma.telematicsConnection.upsert({
    where: { oem },
    create: { oem, status: "DISCONNECTED", encryptedCredentials: null },
    update: {
      status: "DISCONNECTED",
      encryptedCredentials: null,
      lastError: null,
    },
  });
  revalidatePath("/dashboard/integrations");
}

/** Best-effort match a synced asset to an Equipment row by serial number. */
async function matchAssetTag(serial: string | null): Promise<string | null> {
  if (!serial) return null;
  const equipment = await prisma.equipment.findFirst({
    where: { serialNumber: serial },
    select: { assetTag: true },
  });
  return equipment?.assetTag ?? null;
}

export interface SyncResult {
  ok: boolean;
  assetCount?: number;
  error?: string;
}

/**
 * Sync `oem`'s fleet: decrypt stored credentials, call the OEM's AEMP 2.0
 * endpoint, upsert TelematicsAsset rows, and update lastSyncAt/status. On
 * failure the connection is marked ERROR with a human-readable lastError and
 * the sync result reports ok: false — it does not throw.
 */
export async function syncOem(oem: Oem): Promise<SyncResult> {
  const connection = await prisma.telematicsConnection.findUnique({
    where: { oem },
  });
  if (!connection?.encryptedCredentials) {
    return { ok: false, error: "Not connected." };
  }

  try {
    const credentials = JSON.parse(
      decryptCredentials(connection.encryptedCredentials),
    ) as OemCredentials;
    const assets = await syncOemFleet(oem, credentials);

    // Each asset upsert is independent — a partial failure mid-sync is a
    // normal "try again next sync" outcome, not a data-integrity problem, so
    // these run concurrently rather than inside a $transaction.
    await Promise.all(
      assets.map(async (asset) => {
        const assetTag = await matchAssetTag(asset.serial);
        const shared = {
          make: asset.make,
          model: asset.model,
          serial: asset.serial,
          assetTag,
          lat: asset.lat,
          lng: asset.lng,
          engineHours: asset.engineHours,
          fuelPercent: asset.fuelPercent,
          faultCodes: asset.faultCodes,
          lastReportedAt: asset.lastReportedAt
            ? new Date(asset.lastReportedAt)
            : null,
        };
        await prisma.telematicsAsset.upsert({
          where: {
            oem_externalAssetId: {
              oem,
              externalAssetId: asset.externalAssetId,
            },
          },
          create: {
            connectionId: connection.id,
            oem,
            externalAssetId: asset.externalAssetId,
            ...shared,
          },
          update: shared,
        });
      }),
    );

    await prisma.telematicsConnection.update({
      where: { oem },
      data: { lastSyncAt: new Date(), lastError: null, status: "CONNECTED" },
    });
    revalidatePath("/dashboard/integrations");
    return { ok: true, assetCount: assets.length };
  } catch (error) {
    const message =
      error instanceof TelematicsSyncError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Sync failed.";
    logActionError(`syncOem:${oem}`, error);
    await prisma.telematicsConnection.update({
      where: { oem },
      data: { status: "ERROR", lastError: message },
    });
    revalidatePath("/dashboard/integrations");
    return { ok: false, error: message };
  }
}

export interface SyncedAssetRow {
  id: string;
  oem: Oem;
  make: string | null;
  model: string | null;
  serial: string | null;
  assetTag: string | null;
  equipmentId: string | null;
  engineHours: number | null;
  fuelPercent: number | null;
  faultCount: number;
  lastReportedAt: string | null;
}

/** All synced machines across all OEMs, newest-reported first. */
export async function getSyncedAssets(): Promise<SyncedAssetRow[]> {
  try {
    const rows = await prisma.telematicsAsset.findMany({
      orderBy: { lastReportedAt: "desc" },
    });
    const tags = rows.map((r) => r.assetTag).filter((t): t is string => !!t);
    const equipment = tags.length
      ? await prisma.equipment.findMany({
          where: { assetTag: { in: tags } },
          select: { id: true, assetTag: true },
        })
      : [];
    const equipmentByTag = new Map(equipment.map((e) => [e.assetTag, e.id]));

    return rows.map((row) => ({
      id: row.id,
      oem: row.oem as Oem,
      make: row.make,
      model: row.model,
      serial: row.serial,
      assetTag: row.assetTag,
      equipmentId: row.assetTag
        ? (equipmentByTag.get(row.assetTag) ?? null)
        : null,
      engineHours: row.engineHours,
      fuelPercent: row.fuelPercent,
      faultCount: Array.isArray(row.faultCodes) ? row.faultCodes.length : 0,
      lastReportedAt: isoOrNull(row.lastReportedAt),
    }));
  } catch (error) {
    logActionError("getSyncedAssets", error);
    return [];
  }
}
