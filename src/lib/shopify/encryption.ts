import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key) throw new Error("APP_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return buf;
}

// Used for Shopify access tokens at rest — anyone with DB read access should
// not be able to use a leaked row to call the merchant's store directly.
export function encrypt(plaintext: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(payload: string) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
