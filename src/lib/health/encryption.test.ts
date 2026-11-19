import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import {
  HealthEncryptionError,
  decryptHealthField,
  decryptHealthRecord,
  encryptHealthField,
  encryptHealthRecord,
  getHealthKeyring,
  parseHealthKeyring,
  type HealthKeyring,
} from "@/lib/health/encryption";
import type { HealthFieldEncryptionContext } from "@/lib/health/types";

const CONTEXT: HealthFieldEncryptionContext = {
  organizationId: "7f1c59a4-4b2f-4a3e-9c1d-2b6f8e0a1c33",
  resourceType: "client_file",
  resourceId: "3a9b7c11-58de-4c62-b0f4-9e21d7a5c801",
  field: "medical_notes",
};

function keyringFrom(entries: Record<string, string>): HealthKeyring {
  return parseHealthKeyring(
    Object.entries(entries)
      .map(([id, secret]) => `${id}:${secret}`)
      .join(","),
  );
}

const KEY_ONE = randomBytes(32).toString("base64");
const KEY_TWO = randomBytes(32).toString("base64");

describe("parseHealthKeyring", () => {
  it("parses a single base64 key and marks it active", () => {
    const keyring = keyringFrom({ v1: KEY_ONE });

    expect(keyring.activeKeyId).toBe("v1");
    expect(keyring.keys.get("v1")?.material).toHaveLength(32);
  });

  it("marks the last key as active for rotation", () => {
    const keyring = keyringFrom({ v1: KEY_ONE, v2: KEY_TWO });

    expect(keyring.activeKeyId).toBe("v2");
    expect([...keyring.keys.keys()]).toEqual(["v1", "v2"]);
  });

  it("accepts 64-character hex secrets", () => {
    const keyring = keyringFrom({ hex1: randomBytes(32).toString("hex") });

    expect(keyring.keys.get("hex1")?.material).toHaveLength(32);
  });

  it.each([
    ["", "missing_key"],
    ["   ", "missing_key"],
    ["v1", "invalid_key"],
    [":secret", "invalid_key"],
    ["v1:", "invalid_key"],
    ["v1:not-a-real-secret", "invalid_key"],
    ["v1:short", "invalid_key"],
    [`V1!bad:${KEY_ONE}`, "invalid_key"],
    [`v1:${KEY_ONE},v1:${KEY_TWO}`, "invalid_key"],
  ])("rejects malformed keyring %j with %s", (raw, code) => {
    expect(() => parseHealthKeyring(raw)).toThrow(HealthEncryptionError);
    try {
      parseHealthKeyring(raw);
    } catch (error) {
      expect((error as HealthEncryptionError).code).toBe(code);
    }
  });

  it("fails closed when the env var is absent", () => {
    expect(() => getHealthKeyring({})).toThrow(HealthEncryptionError);
    expect(() =>
      getHealthKeyring({ HEALTH_DATA_ENCRYPTION_KEY: "" }),
    ).toThrow(/refusing to handle health data/);
  });

  it("never echoes key material in the error message", () => {
    const secret = randomBytes(32).toString("base64");
    try {
      parseHealthKeyring(`v1:${secret},v1:${secret}`);
      throw new Error("expected failure");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
});

describe("encryptHealthField / decryptHealthField", () => {
  const keyring = keyringFrom({ v1: KEY_ONE });

  it("round-trips plaintext", () => {
    const envelope = encryptHealthField("Penicilina", CONTEXT, keyring);

    expect(envelope.startsWith("hde1.v1.")).toBe(true);
    expect(envelope).not.toContain("Penicilina");
    expect(decryptHealthField(envelope, CONTEXT, keyring)).toBe("Penicilina");
  });

  it("uses a fresh IV so identical plaintext yields different ciphertext", () => {
    const a = encryptHealthField("Asma", CONTEXT, keyring);
    const b = encryptHealthField("Asma", CONTEXT, keyring);

    expect(a).not.toBe(b);
    expect(decryptHealthField(a, CONTEXT, keyring)).toBe("Asma");
    expect(decryptHealthField(b, CONTEXT, keyring)).toBe("Asma");
  });

  it("round-trips UTF-8 and empty strings", () => {
    const text = "Alergia a mariscos 🦐 — control 2026";
    expect(
      decryptHealthField(encryptHealthField(text, CONTEXT, keyring), CONTEXT, keyring),
    ).toBe(text);
    expect(
      decryptHealthField(encryptHealthField("", CONTEXT, keyring), CONTEXT, keyring),
    ).toBe("");
  });

  it.each([
    ["organization", { organizationId: "11111111-1111-4111-8111-111111111111" }],
    ["resource", { resourceId: "22222222-2222-4222-8222-222222222222" }],
    ["field", { field: "medications" as const }],
    ["resource type", { resourceType: "application" as const }],
  ])("rejects a ciphertext moved to a different %s", (_label, override) => {
    const envelope = encryptHealthField("Diabetes tipo 2", CONTEXT, keyring);

    expect(() =>
      decryptHealthField(envelope, { ...CONTEXT, ...override }, keyring),
    ).toThrow(/failed authentication/);
  });

  it("rejects a tampered ciphertext", () => {
    const envelope = encryptHealthField("HIV negativo", CONTEXT, keyring);
    const parts = envelope.split(".");
    const tampered = [...parts.slice(0, 4), `${parts[4].slice(0, -2)}AA`].join(".");

    expect(() => decryptHealthField(tampered, CONTEXT, keyring)).toThrow(
      HealthEncryptionError,
    );
  });

  it("rejects malformed envelopes without leaking input", () => {
    for (const bad of ["", "plaintext", "hde2.v1.a.b.c", "hde1.v1.a.b"]) {
      expect(() => decryptHealthField(bad, CONTEXT, keyring)).toThrow(
        /not a health-data ciphertext envelope/,
      );
    }
  });

  it("rejects an unknown key id", () => {
    const envelope = encryptHealthField("x", CONTEXT, keyringFrom({ v9: KEY_ONE }));

    expect(() => decryptHealthField(envelope, CONTEXT, keyring)).toThrow(
      /unknown health encryption key/,
    );
  });

  it("rejects a truncated authentication tag", () => {
    const envelope = encryptHealthField("HIV negativo", CONTEXT, keyring);
    const [version, keyId, iv, tag, ciphertext] = envelope.split(".");
    const truncatedTag = Buffer.from(tag, "base64url")
      .subarray(0, 4)
      .toString("base64url");

    const forged = [version, keyId, iv, truncatedTag, ciphertext].join(".");

    expect(truncatedTag).not.toBe(tag);
    expect(() => decryptHealthField(forged, CONTEXT, keyring)).toThrow(
      HealthEncryptionError,
    );
    expect(() => decryptHealthField(forged, CONTEXT, keyring)).toThrow(
      /16-byte authentication tag/,
    );
  });

  it("rejects an authentication tag that is too long", () => {
    const envelope = encryptHealthField("HIV negativo", CONTEXT, keyring);
    const [version, keyId, iv, tag, ciphertext] = envelope.split(".");
    const paddedTag = Buffer.concat([
      Buffer.from(tag, "base64url"),
      Buffer.alloc(4, 0),
    ]).toString("base64url");

    expect(() =>
      decryptHealthField(
        [version, keyId, iv, paddedTag, ciphertext].join("."),
        CONTEXT,
        keyring,
      ),
    ).toThrow(/16-byte authentication tag/);
  });

  it.each([
    ["too short", 8],
    ["too long", 16],
    ["empty", 0],
  ])("rejects a %s IV", (_label, bytes) => {
    const envelope = encryptHealthField("HIV negativo", CONTEXT, keyring);
    const [version, keyId, , tag, ciphertext] = envelope.split(".");

    expect(() =>
      decryptHealthField(
        [version, keyId, randomBytes(bytes).toString("base64url"), tag, ciphertext].join("."),
        CONTEXT,
        keyring,
      ),
    ).toThrow(/12-byte IV/);
  });

  it("decrypts old ciphertexts after key rotation", () => {
    const oldKeyring = keyringFrom({ v1: KEY_ONE });
    const rotated = keyringFrom({ v1: KEY_ONE, v2: KEY_TWO });

    const oldEnvelope = encryptHealthField("Alergia leve", CONTEXT, oldKeyring);
    const newEnvelope = encryptHealthField("Alergia leve", CONTEXT, rotated);

    expect(newEnvelope.startsWith("hde1.v2.")).toBe(true);
    expect(decryptHealthField(oldEnvelope, CONTEXT, rotated)).toBe("Alergia leve");
    expect(decryptHealthField(newEnvelope, CONTEXT, rotated)).toBe("Alergia leve");
  });

  it("refuses to encrypt or decrypt a malformed context", () => {
    const separator = String.fromCharCode(31);

    expect(() =>
      encryptHealthField("x", { ...CONTEXT, organizationId: "" }, keyring),
    ).toThrow(/must be non-empty/);
    expect(() =>
      encryptHealthField("x", { ...CONTEXT, resourceId: `a${separator}b` }, keyring),
    ).toThrow(/control separators/);
  });

  it("reads the keyring from the server-only env var", () => {
    const keyringFromEnv = getHealthKeyring({
      HEALTH_DATA_ENCRYPTION_KEY: `v1:${KEY_ONE}`,
    });
    const envelope = encryptHealthField("Control", CONTEXT, keyringFromEnv);

    expect(decryptHealthField(envelope, CONTEXT, keyringFromEnv)).toBe("Control");
  });
});

describe("encryptHealthRecord / decryptHealthRecord", () => {
  const keyring = keyringFrom({ v1: KEY_ONE });
  const base = {
    organizationId: CONTEXT.organizationId,
    resourceType: CONTEXT.resourceType,
    resourceId: CONTEXT.resourceId,
  } as const;

  it("encrypts every present field and preserves null/undefined", () => {
    const encrypted = encryptHealthRecord(
      { medical_notes: "Control anual", medications: null, allergies: "Ninguna" },
      base,
      keyring,
    );

    expect(Object.keys(encrypted).sort()).toEqual([
      "allergies",
      "medical_notes",
      "medications",
    ]);
    expect(encrypted.medications).toBeNull();
    expect(encrypted.medical_notes).not.toContain("Control anual");
    expect(
      decryptHealthRecord(encrypted, base, keyring),
    ).toEqual({ medical_notes: "Control anual", medications: null, allergies: "Ninguna" });
  });

  it("returns an empty record when there is nothing to encrypt", () => {
    expect(encryptHealthRecord({}, base, keyring)).toEqual({});
    expect(decryptHealthRecord({}, base, keyring)).toEqual({});
  });

  it("rejects an unregistered field name", () => {
    const bad = { not_a_health_field: "x" } as unknown as Parameters<
      typeof encryptHealthRecord
    >[0];

    expect(() => encryptHealthRecord(bad, base, keyring)).toThrow(
      /not a registered health field/,
    );
  });
});
