"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SecondaryButton, PrimaryButton } from "@/components/ui/form";
import { StatusPill } from "@/components/integrations/status-pill";
import { CredentialModal } from "@/components/integrations/credential-modal";
import { OEM_META, type Oem } from "@/lib/telematics/oem-meta";
import type { ConnectionSummary } from "@/lib/actions/telematics";

function formatSyncTime(iso: string | null): string {
  if (!iso) return "Never synced";
  return `Last synced ${new Date(iso).toLocaleString()}`;
}

export function OemCard({ connection }: { connection: ConnectionSummary }) {
  const router = useRouter();
  const meta = OEM_META[connection.oem as Oem];
  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(
    connection.lastError,
  );

  async function onDisconnect() {
    await fetch(`/api/integrations/${connection.oem}/disconnect`, {
      method: "POST",
    });
    router.refresh();
  }

  async function onSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/integrations/${connection.oem}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.ok) setSyncError(data.error ?? "Sync failed.");
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  const connected = connection.status !== "DISCONNECTED";

  return (
    <Card>
      <CardHeader
        title={meta.label}
        description={meta.platform}
        action={<StatusPill status={connection.status} />}
      />
      <CardBody className="space-y-3">
        <p className="text-xs text-slate-500">
          {formatSyncTime(connection.lastSyncAt)} · {connection.assetCount}{" "}
          machine{connection.assetCount === 1 ? "" : "s"}
        </p>
        {syncError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {syncError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {connected ? (
            <>
              <PrimaryButton
                type="button"
                onClick={onSync}
                disabled={syncing}
                className="px-3 py-1.5 text-xs"
              >
                {syncing ? "Syncing…" : "Sync now"}
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-3 py-1.5 text-xs"
              >
                Update credentials
              </SecondaryButton>
              <SecondaryButton
                type="button"
                onClick={onDisconnect}
                className="px-3 py-1.5 text-xs"
              >
                Disconnect
              </SecondaryButton>
            </>
          ) : (
            <PrimaryButton
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 text-xs"
            >
              Connect
            </PrimaryButton>
          )}
        </div>
      </CardBody>

      <CredentialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        oem={connection.oem}
        label={meta.label}
        fields={meta.credentialFields}
        onConnected={() => router.refresh()}
      />
    </Card>
  );
}
