import { randomUUID } from "crypto";
import { extractKeyPrefix, generateApiKey, hashApiKey } from "@/lib/api/api-key";

export interface DemoApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  created_at: string;
  client_name: string;
}

export interface DemoRateLimitOverride {
  rate_limit_requests: number;
  rate_limit_window_ms: number;
  updated_at: string;
}

const INITIAL_DEMO_KEYS: DemoApiKeyRecord[] = [
  {
    id: "f0000000-0000-4000-8000-000000000001",
    name: "[DEMO] Clave de prueba",
    key_prefix: "cov_demo",
    key_hash:
      "ea6954bbf586cef38e6fd81705d98c79eb93e3dff36a205d630b3667073d3fba",
    status: "active",
    last_used_at: null,
    created_at: "2025-01-01T00:00:00Z",
    client_name: "[DEMO] Integración de prueba",
  },
];

let demoApiKeys: DemoApiKeyRecord[] = [...INITIAL_DEMO_KEYS];
const demoRateLimitOverrides = new Map<string, DemoRateLimitOverride>();

export function resetDemoSettingsStore(): void {
  demoApiKeys = [...INITIAL_DEMO_KEYS];
  demoRateLimitOverrides.clear();
}

export function listDemoApiKeys(): DemoApiKeyRecord[] {
  return demoApiKeys.map((key) => ({ ...key }));
}

export function createDemoApiKey(name: string): {
  record: DemoApiKeyRecord;
  rawKey: string;
} {
  const { rawKey, prefix, hash } = generateApiKey();
  const record: DemoApiKeyRecord = {
    id: randomUUID(),
    name: `[DEMO] ${name}`,
    key_prefix: prefix,
    key_hash: hash,
    status: "active",
    last_used_at: null,
    created_at: new Date().toISOString(),
    client_name: "[DEMO] Cliente API",
  };
  demoApiKeys = [record, ...demoApiKeys];
  return { record, rawKey };
}

export function revokeDemoApiKey(keyId: string): boolean {
  const index = demoApiKeys.findIndex((key) => key.id === keyId);
  if (index === -1) return false;
  if (demoApiKeys[index].status === "revoked") return true;
  demoApiKeys = demoApiKeys.map((key, i) =>
    i === index ? { ...key, status: "revoked" as const } : key,
  );
  return true;
}

export function getDemoRateLimitOverride(
  organizationId: string,
): DemoRateLimitOverride | null {
  const override = demoRateLimitOverrides.get(organizationId);
  return override ? { ...override } : null;
}

export function setDemoRateLimitOverride(
  organizationId: string,
  requests: number,
  windowMs: number,
): DemoRateLimitOverride {
  const override: DemoRateLimitOverride = {
    rate_limit_requests: requests,
    rate_limit_window_ms: windowMs,
    updated_at: new Date().toISOString(),
  };
  demoRateLimitOverrides.set(organizationId, override);
  return override;
}

/** Verify demo key without exposing stored hashes in logs */
export function demoKeyMatchesHash(rawKey: string, storedHash: string): boolean {
  return hashApiKey(rawKey) === storedHash;
}

export function maskPrefix(prefix: string): string {
  return `${extractKeyPrefix(prefix)}…`;
}
