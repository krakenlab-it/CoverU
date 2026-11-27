import { describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { createHealthAccessRecorder, HealthAccessLogError } from "@/lib/health/access-log";
import {
  encryptHealthRecord,
  parseHealthKeyring,
} from "@/lib/health/encryption";
import { viewHealthFields } from "@/lib/health/view";
import type { HealthAccessEvent } from "@/lib/health/types";

const ORG_ID = "7f1c59a4-4b2f-4a3e-9c1d-2b6f8e0a1c33";
const RESOURCE_ID = "3a9b7c11-58de-4c62-b0f4-9e21d7a5c801";
const USER_ID = "9b2f4d51-0a1c-4e77-8f3a-6d5b9c2e4a10";

const keyring = parseHealthKeyring(`v1:${randomBytes(32).toString("base64")}`);

const context = {
  organizationId: ORG_ID,
  resourceType: "client_file" as const,
  resourceId: RESOURCE_ID,
};

const event: Omit<HealthAccessEvent, "fieldsAccessed" | "accessKind"> = {
  organizationId: ORG_ID,
  actor: { kind: "user", userId: USER_ID, role: "member" },
  resourceType: "client_file",
  resourceId: RESOURCE_ID,
  subjectUserId: null,
  purpose: "Revisión de expediente",
  requestContext: { requestId: "req_abc", ipAddress: "203.0.113.7", userAgent: "vitest" },
};

function recorderWithSpy() {
  const rows: Array<{ fields_accessed: string[]; access_kind: string }> = [];
  const warn = vi.fn();
  const recorder = createHealthAccessRecorder({
    client: {
      async insertHealthAccessLogRow(row) {
        rows.push({ fields_accessed: row.fields_accessed, access_kind: row.access_kind });
        return { error: null };
      },
    },
    logger: { warn },
  });
  return { recorder, rows, warn };
}

describe("viewHealthFields", () => {
  it("logs the access before returning decrypted values", async () => {
    const { recorder, rows } = recorderWithSpy();
    const order: string[] = [];
    const spyingRecorder = {
      async record(e: HealthAccessEvent) {
        order.push("log");
        await recorder.record(e);
      },
    };

    const result = await viewHealthFields(spyingRecorder, {
      event,
      context,
      keyring,
      encrypted: { medical_notes: "hde1.v1.a.b.c" },
    }).catch((error: unknown) => error);

    // Ciphertext is deliberately invalid, so decryption fails *after* logging.
    expect(result).toBeInstanceOf(Error);
    expect(order).toEqual(["log"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].fields_accessed).toEqual(["medical_notes"]);
  });

  it("decrypts only after the row is stored, and never logs values", async () => {
    const encrypted = encryptHealthRecord(
      { medical_notes: "Control prenatal", allergies: null },
      context,
      keyring,
    );

    const { recorder, rows, warn } = recorderWithSpy();
    const result = await viewHealthFields(recorder, { event, context, keyring, encrypted });

    expect(rows).toEqual([{ fields_accessed: ["medical_notes"], access_kind: "view" }]);
    expect(result.record).toEqual({ medical_notes: "Control prenatal", allergies: null });
    expect(result.fieldsDecrypted).toEqual(["medical_notes"]);
    expect(result.organizationId).toBe(ORG_ID);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("Control prenatal");
  });

  it("honours an explicit access kind", async () => {
    const encrypted = encryptHealthRecord({ medications: "Losartán" }, context, keyring);
    const { recorder, rows } = recorderWithSpy();

    const result = await viewHealthFields(recorder, {
      event: { ...event, accessKind: "export" },
      context,
      keyring,
      encrypted,
    });

    expect(result.accessKind).toBe("export");
    expect(rows[0].access_kind).toBe("export");
  });

  it("returns no plaintext when the access log write fails", async () => {
    const encrypted = encryptHealthRecord({ lab_results: "Glucosa 92" }, context, keyring);
    const recorder = createHealthAccessRecorder({ client: null });

    await expect(
      viewHealthFields(recorder, { event, context, keyring, encrypted }),
    ).rejects.toBeInstanceOf(HealthAccessLogError);
  });

  it("rejects an event and context describing different resources", async () => {
    const { recorder } = recorderWithSpy();

    await expect(
      viewHealthFields(recorder, {
        event: { ...event, resourceId: "11111111-1111-4111-8111-111111111111" },
        context,
        keyring,
        encrypted: { medical_notes: "hde1.v1.a.b.c" },
      }),
    ).rejects.toThrow(/same resource/);
  });

  it("rejects a request with nothing to log", async () => {
    const { recorder } = recorderWithSpy();

    await expect(
      viewHealthFields(recorder, {
        event,
        context,
        keyring,
        encrypted: { medical_notes: null },
      }),
    ).rejects.toThrow(/no ciphertext/);
  });

  it("fails closed when the encryption key is missing", async () => {
    const encrypted = encryptHealthRecord({ medical_notes: "x" }, context, keyring);
    const { recorder, rows } = recorderWithSpy();

    await expect(
      viewHealthFields(recorder, {
        event,
        context,
        encrypted,
        keyring: parseHealthKeyring(`v2:${randomBytes(32).toString("base64")}`),
      }),
    ).rejects.toThrow(/unknown health encryption key/);

    // The attempt is still audited: an unreadable record is an access attempt.
    expect(rows).toHaveLength(1);
  });
});
