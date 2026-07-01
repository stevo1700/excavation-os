// AES-256-GCM helpers for at-rest encryption of telematics OEM credentials.
// Ciphertext is the only thing ever persisted or logged; decryptCredentials()
// is called exclusively inside the /sync route handler, immediately before
// making the outbound OEM request, and its return value must never be sent to
// the client or written to a log.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended nonce length for GCM

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not set.");
  }
  // Derive a fixed-length 256-bit key from whatever string is configured, so
  // ENCRYPTION_KEY doesn't have to be a raw 32-byte value.
  return scryptSync(secret, "excavation-os-telematics", 32);
}

/** Encrypt `plain` (e.g. a JSON string of credentials) into a storable ciphertext. */
export function encryptCredentials(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext, each base64.
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

/** Decrypt a ciphertext produced by {@link encryptCredentials}. */
export function decryptCredentials(cipherText: string): string {
  const [ivB64, authTagB64, dataB64] = cipherText.split(".");
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error("Malformed credential ciphertext.");
  }
  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
