import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { HealthFieldEncryptionContext, HealthFieldName } from "@/lib/health/types";
import { isHealthFieldName } from "@/lib/health/types";

/**
 * Health-data field encryption (Ecuador LOPDP, at-rest).
 *
 * Envelope format: `hde1.<keyId>.<iv>.<tag>.<ciphertext>`
 *   - `hde1`      envelope version, so the format can evolve without ambiguity
 *   - `keyId`     which key in the keyring produced this ciphertext
 *   - iv/tag/ct   base64url (unpadded)
 *
 * AES-256-GCM with a fresh 12-byte IV per field and a 16-byte auth tag. Every
 * ciphertext is bound with associated data to its organization, resource and field
 * name, so a value cannot be moved between rows, tenants or columns.
 *
 * The keyring is read from the server-only `HEALTH_DATA_ENCRYPTION_KEY` env var:
 *
 *   HEALTH_DATA_ENCRYPTION_KEY="v1:<secret>,v2:<secret>"
 *
 * `<secret>` is 32 bytes as base64, base64url or 64 hex chars. Multiple entries are
 * allowed for rotation; the LAST entry encrypts new data while every listed entry can
 * still decrypt its own ciphertexts.
 *
 * Fail-closed: a missing, malformed or unknown key throws. There is no plaintext
 * fallback anywhere in this module, and no error message ever carries field values.
 */

export const HEALTH_ENCRYPTION_ENV_VAR = "HEALTH_DATA_ENCRYPTION_KEY";

const ENVELOPE_VERSION = "hde1";
const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AAD_SEPARATOR = "\u001f";
const MAX_CONTEXT_PART_LENGTH = 200;

const KEY_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/;
const SECRET_PATTERN = /^[A-Za-z0-9+/_-]{43}=?$/;
const HEX_SECRET_PATTERN = /^[0-9a-fA-F]{64}$/;

export type HealthEncryptionErrorCode =
  | "missing_key"
  | "invalid_key"
  | "invalid_context"
  | "invalid_ciphertext"
  | "unknown_key"
  | "decryption_failed";

export class HealthEncryptionError extends Error {
  readonly code: HealthEncryptionErrorCode;

  constructor(code: HealthEncryptionErrorCode, message: string) {
    super(message);
    this.name = "HealthEncryptionError";
    this.code = code;
  }
}

export interface HealthEncryptionKey {
  id: string;
  material: Buffer;
}

export interface HealthKeyring {
  /** Key id used for new ciphertexts (last entry in the env var). */
  activeKeyId: string;
  keys: ReadonlyMap<string, HealthEncryptionKey>;
}

function decodeSecret(secret: string): Buffer {
  const material = HEX_SECRET_PATTERN.test(secret)
    ? Buffer.from(secret, "hex")
    : Buffer.from(secret.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (material.length !== KEY_BYTES) {
    throw new HealthEncryptionError(
      "invalid_key",
      `Health encryption key material must be ${KEY_BYTES} bytes`,
    );
  }

  return material;
}

/**
 * Parses a keyring definition. Pure function so key handling can be tested without
 * touching `process.env`. Throws {@link HealthEncryptionError} on any malformed input.
 */
export function parseHealthKeyring(rawValue: string | undefined): HealthKeyring {
  const trimmed = rawValue?.trim() ?? "";
  if (!trimmed) {
    throw new HealthEncryptionError(
      "missing_key",
      `${HEALTH_ENCRYPTION_ENV_VAR} is not set; refusing to handle health data`,
    );
  }

  const keys = new Map<string, HealthEncryptionKey>();

  for (const entry of trimmed.split(",")) {
    const candidate = entry.trim();
    const separatorIndex = candidate.indexOf(":");
    if (separatorIndex <= 0 || separatorIndex === candidate.length - 1) {
      throw new HealthEncryptionError(
        "invalid_key",
        `${HEALTH_ENCRYPTION_ENV_VAR} entries must look like "<keyId>:<secret>"`,
      );
    }

    const keyId = candidate.slice(0, separatorIndex).trim();
    const secret = candidate.slice(separatorIndex + 1).trim();

    if (!KEY_ID_PATTERN.test(keyId) || keys.has(keyId)) {
      throw new HealthEncryptionError(
        "invalid_key",
        `Invalid or duplicate key id "${keyId}" in ${HEALTH_ENCRYPTION_ENV_VAR}`,
      );
    }

    if (!SECRET_PATTERN.test(secret) && !HEX_SECRET_PATTERN.test(secret)) {
      throw new HealthEncryptionError(
        "invalid_key",
        `Key "${keyId}" is not 32 bytes encoded as base64, base64url or hex`,
      );
    }

    keys.set(keyId, { id: keyId, material: decodeSecret(secret) });
  }

  const activeKeyId = [...keys.keys()].at(-1);
  if (!activeKeyId) {
    throw new HealthEncryptionError(
      "missing_key",
      `${HEALTH_ENCRYPTION_ENV_VAR} contains no usable key`,
    );
  }

  return { activeKeyId, keys };
}

export type HealthKeyringEnv = Readonly<Record<string, string | undefined>>;

export function getHealthKeyring(
  env: HealthKeyringEnv = process.env,
): HealthKeyring {
  return parseHealthKeyring(env[HEALTH_ENCRYPTION_ENV_VAR]);
}

function buildAssociatedData(context: HealthFieldEncryptionContext): Buffer {
  const parts = [
    ENVELOPE_VERSION,
    context.organizationId,
    context.resourceType,
    context.resourceId,
    context.field,
  ];

  for (const part of parts) {
    if (
      typeof part !== "string" ||
      part.length === 0 ||
      part.length > MAX_CONTEXT_PART_LENGTH ||
      part.includes(AAD_SEPARATOR)
    ) {
      throw new HealthEncryptionError(
        "invalid_context",
        "Health encryption context must be non-empty and free of control separators",
      );
    }
  }

  return Buffer.from(parts.join(AAD_SEPARATOR), "utf8");
}

export function encryptHealthField(
  plaintext: string,
  context: HealthFieldEncryptionContext,
  keyring: HealthKeyring = getHealthKeyring(),
): string {
  const associatedData = buildAssociatedData(context);
  const key = keyring.keys.get(keyring.activeKeyId);

  if (!key) {
    throw new HealthEncryptionError(
      "unknown_key",
      `Active health encryption key "${keyring.activeKeyId}" is not in the keyring`,
    );
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key.material, iv);
  cipher.setAAD(associatedData);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENVELOPE_VERSION,
    key.id,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptHealthField(
  envelope: string,
  context: HealthFieldEncryptionContext,
  keyring: HealthKeyring = getHealthKeyring(),
): string {
  const associatedData = buildAssociatedData(context);
  const parts = envelope.split(".");

  if (parts.length !== 5 || parts[0] !== ENVELOPE_VERSION) {
    throw new HealthEncryptionError(
      "invalid_ciphertext",
      "Value is not a health-data ciphertext envelope",
    );
  }

  const [, keyId, ivPart, tagPart, ciphertextPart] = parts;
  const key = keyring.keys.get(keyId);
  if (!key) {
    throw new HealthEncryptionError(
      "unknown_key",
      `Ciphertext was produced with unknown health encryption key "${keyId}"`,
    );
  }

  let plaintext: Buffer;
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key.material,
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAAD(associatedData);
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, "base64url")),
      decipher.final(),
    ]);
  } catch {
    throw new HealthEncryptionError(
      "decryption_failed",
      "Health-data ciphertext failed authentication (wrong key, tampered value or wrong context)",
    );
  }

  return plaintext.toString("utf8");
}

/** Encrypted form of a partial health record. Absent/null fields stay absent/null. */
export type EncryptedHealthRecord = Partial<Record<HealthFieldName, string | null>>;
export type PlainHealthRecord = Partial<Record<HealthFieldName, string | null>>;

function requireHealthField(field: string): HealthFieldName {
  if (!isHealthFieldName(field)) {
    throw new HealthEncryptionError(
      "invalid_context",
      `"${field}" is not a registered health field`,
    );
  }
  return field;
}

export function encryptHealthRecord(
  record: PlainHealthRecord,
  base: Omit<HealthFieldEncryptionContext, "field">,
  keyring: HealthKeyring = getHealthKeyring(),
): EncryptedHealthRecord {
  const encrypted: EncryptedHealthRecord = {};

  for (const [field, value] of Object.entries(record)) {
    const name = requireHealthField(field);
    encrypted[name] =
      value === undefined || value === null
        ? null
        : encryptHealthField(value, { ...base, field: name }, keyring);
  }

  return encrypted;
}

export function decryptHealthRecord(
  record: EncryptedHealthRecord,
  base: Omit<HealthFieldEncryptionContext, "field">,
  keyring: HealthKeyring = getHealthKeyring(),
): PlainHealthRecord {
  const decrypted: PlainHealthRecord = {};

  for (const [field, value] of Object.entries(record)) {
    const name = requireHealthField(field);
    decrypted[name] =
      value === undefined || value === null
        ? null
        : decryptHealthField(value, { ...base, field: name }, keyring);
  }

  return decrypted;
}
