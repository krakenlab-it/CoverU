import { createHash, randomBytes } from "crypto";

const API_KEY_PREFIX_LENGTH = 8;

export function getApiKeyPepper(): string {
  return process.env.API_KEY_PEPPER ?? "";
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256")
    .update(getApiKeyPepper() + rawKey)
    .digest("hex");
}

export function extractKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, API_KEY_PREFIX_LENGTH);
}

export function generateApiKey(): { rawKey: string; prefix: string; hash: string } {
  const suffix = randomBytes(24).toString("hex");
  const rawKey = `cov_${suffix}`;
  return {
    rawKey,
    prefix: extractKeyPrefix(rawKey),
    hash: hashApiKey(rawKey),
  };
}

export function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const computed = hashApiKey(rawKey);
  return timingSafeEqual(computed, storedHash);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

