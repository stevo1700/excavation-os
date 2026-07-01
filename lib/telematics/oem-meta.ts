// Static metadata for the three supported OEM telematics integrations. Drives
// both the credential modal (field labels/types) and the sync client
// (lib/telematics/client.ts).

import type { OemCredentials } from "./client";

export type Oem = "KOMATSU" | "CASE" | "BOBCAT";

export const OEMS: Oem[] = ["KOMATSU", "CASE", "BOBCAT"];

export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password";
}

export interface OemMeta {
  oem: Oem;
  label: string;
  /** Human description of the underlying platform, shown in the UI. */
  platform: string;
  credentialFields: CredentialField[];
}

export const OEM_META: Record<Oem, OemMeta> = {
  KOMATSU: {
    oem: "KOMATSU",
    label: "Komatsu",
    platform: "KOMTRAX AEMP 2.0",
    credentialFields: [
      { key: "username", label: "Username", type: "text" },
      { key: "password", label: "Password", type: "password" },
    ],
  },
  CASE: {
    oem: "CASE",
    label: "Case",
    platform: "SiteWatch AEMP 2.0",
    credentialFields: [{ key: "apiKey", label: "API key", type: "password" }],
  },
  BOBCAT: {
    oem: "BOBCAT",
    label: "Bobcat",
    platform: "Machine IQ",
    credentialFields: [
      { key: "clientId", label: "Client ID", type: "text" },
      { key: "clientSecret", label: "Client secret", type: "password" },
    ],
  },
};

export function isOem(value: string): value is Oem {
  return (OEMS as string[]).includes(value.toUpperCase());
}

/** Validate that every credential field OEM_META declares for `oem` is present and non-empty. */
export function validateCredentials(
  oem: Oem,
  input: Record<string, unknown>,
): { credentials: OemCredentials } | { error: string } {
  const fields = OEM_META[oem].credentialFields;
  const credentials: Record<string, string> = {};
  for (const field of fields) {
    const value = input[field.key];
    if (typeof value !== "string" || value.trim().length === 0) {
      return { error: `\`${field.key}\` is required.` };
    }
    credentials[field.key] = value.trim();
  }
  return { credentials: credentials as unknown as OemCredentials };
}
