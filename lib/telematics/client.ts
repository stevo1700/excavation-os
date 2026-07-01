// AEMP 2.0 (ISO 15143-3) client: authenticates against each OEM's telematics
// platform, fetches the fleet, and normalizes the response into the shape
// TelematicsAsset rows are upserted from. One pattern (fetch a /Fleet
// resource, read EquipmentHeader/Location/CumulativeOperatingHours/
// FuelRemaining/FaultCode), three credential/auth schemes.
//
// OEM base URLs are deployment-specific (each dealer/OEM account is
// provisioned its own AEMP endpoint) and are therefore required env vars with
// no built-in default — a missing one fails fast with a clear message rather
// than silently guessing a host.

import type { Oem } from "./oem-meta";

export interface KomatsuCredentials {
  username: string;
  password: string;
}
export interface CaseCredentials {
  apiKey: string;
}
export interface BobcatCredentials {
  clientId: string;
  clientSecret: string;
}
export type OemCredentials =
  KomatsuCredentials | CaseCredentials | BobcatCredentials;

/** Normalized telematics reading for one machine, ready to upsert. */
export interface NormalizedAsset {
  externalAssetId: string;
  make: string | null;
  model: string | null;
  serial: string | null;
  lat: number | null;
  lng: number | null;
  engineHours: number | null;
  fuelPercent: number | null;
  faultCodes: { code: string; description: string | null }[];
  lastReportedAt: string | null;
}

export class TelematicsSyncError extends Error {}

function requiredEnv(name: string, oem: Oem): string {
  const value = process.env[name];
  if (!value) {
    throw new TelematicsSyncError(
      `${name} is not configured — set it to your ${oem} dealer's AEMP 2.0 base URL before syncing.`,
    );
  }
  return value;
}

async function fetchKomatsuFleet(creds: KomatsuCredentials): Promise<unknown> {
  const baseUrl = requiredEnv("KOMATSU_AEMP_BASE_URL", "KOMATSU");
  const basic = Buffer.from(`${creds.username}:${creds.password}`).toString(
    "base64",
  );
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/Fleet`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) {
    throw new TelematicsSyncError(
      `KOMTRAX AEMP request failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

async function fetchCaseFleet(creds: CaseCredentials): Promise<unknown> {
  const baseUrl = requiredEnv("CASE_AEMP_BASE_URL", "CASE");
  const headerName = process.env.CASE_API_KEY_HEADER || "Api-Key";
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/Fleet`, {
    headers: { [headerName]: creds.apiKey },
  });
  if (!res.ok) {
    throw new TelematicsSyncError(
      `SiteWatch AEMP request failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

const BOBCAT_TOKEN_URL = "https://identity.bobcat.com/connect/token";

async function fetchBobcatFleet(creds: BobcatCredentials): Promise<unknown> {
  const baseUrl = requiredEnv("BOBCAT_AEMP_BASE_URL", "BOBCAT");

  const tokenRes = await fetch(BOBCAT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      scope: "api:aemp",
    }),
  });
  if (!tokenRes.ok) {
    throw new TelematicsSyncError(
      `Machine IQ authorization failed: ${tokenRes.status} ${tokenRes.statusText}`,
    );
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new TelematicsSyncError(
      "Machine IQ authorization response had no access_token.",
    );
  }

  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/Fleet`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (res.status === 404 || res.status === 204) {
    // Some machines require an active Machine IQ subscription; a bare "no
    // content" response is a valid empty state, not an error.
    return { EquipmentFleet: { Equipment: [] } };
  }
  if (!res.ok) {
    throw new TelematicsSyncError(
      `Machine IQ Fleet request failed: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

// --- AEMP 2.0 response normalization -------------------------------------

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Parse one AEMP `Equipment` entry into a NormalizedAsset. Tolerant of missing sections. */
function normalizeEquipment(raw: unknown): NormalizedAsset | null {
  const entry = (raw ?? {}) as Record<string, unknown>;
  const header = (entry.EquipmentHeader ?? {}) as Record<string, unknown>;
  const location = (entry.Location ?? {}) as Record<string, unknown>;
  const hours = (entry.CumulativeOperatingHours ?? {}) as Record<
    string,
    unknown
  >;
  const fuel = (entry.FuelRemaining ?? {}) as Record<string, unknown>;
  const faults = Array.isArray(entry.FaultCode) ? entry.FaultCode : [];

  const externalAssetId =
    asString(header.OEMEquipmentID) ?? asString(header.SerialNumber);
  if (!externalAssetId) return null;

  return {
    externalAssetId,
    make: asString(header.Make),
    model: asString(header.Model),
    serial: asString(header.SerialNumber),
    lat: asNumber(location.Latitude),
    lng: asNumber(location.Longitude),
    engineHours: asNumber(hours.Hours),
    fuelPercent: asNumber(fuel.Percent),
    faultCodes: faults
      .map((f) => {
        const fault = (f ?? {}) as Record<string, unknown>;
        const code = asString(fault.Code);
        return code ? { code, description: asString(fault.Description) } : null;
      })
      .filter(
        (f): f is { code: string; description: string | null } => f !== null,
      ),
    lastReportedAt:
      asString(location.DateTime) ??
      asString(hours.DateTime) ??
      asString(fuel.DateTime),
  };
}

function normalizeFleetResponse(payload: unknown): NormalizedAsset[] {
  const root = (payload ?? {}) as Record<string, unknown>;
  const fleet = (root.EquipmentFleet ?? root) as Record<string, unknown>;
  const equipment = fleet.Equipment;
  const list = Array.isArray(equipment) ? equipment : [];
  return list
    .map(normalizeEquipment)
    .filter((a): a is NormalizedAsset => a !== null);
}

/** Fetch and normalize the fleet for `oem` using `credentials`. Throws {@link TelematicsSyncError} on failure. */
export async function syncOemFleet(
  oem: Oem,
  credentials: OemCredentials,
): Promise<NormalizedAsset[]> {
  const payload =
    oem === "KOMATSU"
      ? await fetchKomatsuFleet(credentials as KomatsuCredentials)
      : oem === "CASE"
        ? await fetchCaseFleet(credentials as CaseCredentials)
        : await fetchBobcatFleet(credentials as BobcatCredentials);

  return normalizeFleetResponse(payload);
}
