import { describe, expect, it, vi } from "vitest";
import {
  HealthAccessLogError,
  createHealthAccessRecorder,
  healthAccessEventSchema,
  toHealthAccessLogRow,
  type HealthAccessLogInsertClient,
  type HealthDataAccessLogRow,
} from "@/lib/health/access-log";
import type { HealthAccessEvent } from "@/lib/health/types";

const ORG_ID = "7f1c59a4-4b2f-4a3e-9c1d-2b6f8e0a1c33";
const RESOURCE_ID = "3a9b7c11-58de-4c62-b0f4-9e21d7a5c801";
const USER_ID = "9b2f4d51-0a1c-4e77-8f3a-6d5b9c2e4a10";
const KEY_ID = "0c8e3a72-6f5b-4d19-90ae-1b7c4e2d8f55";
const SUBJECT_ID = "5d6e7f80-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

const baseEvent: HealthAccessEvent = {
  organizationId: ORG_ID,
  actor: { kind: "user", userId: USER_ID, role: "owner" },
  resourceType: "client_file",
  resourceId: RESOURCE_ID,
  subjectUserId: SUBJECT_ID,
  fieldsAccessed: ["medical_notes", "allergies"],
  accessKind: "view",
  purpose: "Atención al cliente",
  requestContext: {
    requestId: "req_123",
    ipAddress: "203.0.113.10",
    userAgent: "Mozilla/5.0",
  },
};

function createClient(overrides: { error?: { message: string } | null } = {}) {
  const insertHealthAccessLogRow = vi.fn(
    async (row: HealthDataAccessLogRow): Promise<{ error: { message: string } | null }> => {
      void row;
      return { error: overrides.error ?? null };
    },
  );
  const client: HealthAccessLogInsertClient = { insertHealthAccessLogRow };
  return { client, insertHealthAccessLogRow };
}

describe("healthAccessEventSchema", () => {
  it("accepts a well-formed user view", () => {
    expect(healthAccessEventSchema.safeParse(baseEvent).success).toBe(true);
  });

  it.each([
    ["unknown resource type", { resourceType: "prescription" }],
    ["unknown access kind", { accessKind: "download" }],
    ["unregistered health field", { fieldsAccessed: ["blood_type"] }],
    ["non-uuid organization", { organizationId: "org-1" }],
    ["non-uuid resource", { resourceId: "file-1" }],
    ["missing actor", { actor: undefined }],
    ["actor without its identifier", { actor: { kind: "user" } }],
    ["api_client actor without a key id", { actor: { kind: "api_client" } }],
    [
      "user actor carrying an api key id",
      { actor: { kind: "user", userId: USER_ID, apiKeyId: KEY_ID } },
    ],
    ["service actor without a label", { actor: { kind: "service" } }],
  ])("rejects %s", (_label, override) => {
    expect(
      healthAccessEventSchema.safeParse({ ...baseEvent, ...override }).success,
    ).toBe(false);
  });

  it("rejects extra properties so values cannot be smuggled in", () => {
    const withValue = { ...baseEvent, medical_notes: "HIV positivo" };

    expect(healthAccessEventSchema.safeParse(withValue).success).toBe(false);
  });
});

describe("toHealthAccessLogRow", () => {
  it("maps who, what and when into the table row", () => {
    const row = toHealthAccessLogRow(baseEvent);

    expect(row).toEqual({
      organization_id: ORG_ID,
      actor_kind: "user",
      actor_user_id: USER_ID,
      actor_api_key_id: null,
      actor_label: null,
      actor_role: "owner",
      resource_type: "client_file",
      resource_id: RESOURCE_ID,
      subject_user_id: SUBJECT_ID,
      fields_accessed: ["allergies", "medical_notes"],
      access_kind: "view",
      purpose: "Atención al cliente",
      request_id: "req_123",
      ip_address: "203.0.113.10",
      user_agent: "Mozilla/5.0",
    });
  });

  it("deduplicates and sorts field names", () => {
    const row = toHealthAccessLogRow({
      ...baseEvent,
      fieldsAccessed: ["medications", "allergies", "medications"],
    });

    expect(row.fields_accessed).toEqual(["allergies", "medications"]);
  });

  it("keeps identifiers in the column that matches the actor kind", () => {
    expect(
      toHealthAccessLogRow({
        ...baseEvent,
        actor: { kind: "api_client", apiKeyId: KEY_ID, label: "Portal socio" },
      }),
    ).toMatchObject({
      actor_kind: "api_client",
      actor_user_id: null,
      actor_api_key_id: KEY_ID,
      actor_label: "Portal socio",
      actor_role: null,
    });

    expect(
      toHealthAccessLogRow({
        ...baseEvent,
        actor: { kind: "service", label: "coverage-agent" },
      }),
    ).toMatchObject({
      actor_kind: "service",
      actor_user_id: null,
      actor_api_key_id: null,
      actor_label: "coverage-agent",
      actor_role: null,
    });
  });

  it("defaults optional context to null", () => {
    const row = toHealthAccessLogRow({
      organizationId: ORG_ID,
      actor: { kind: "system", label: "retention-job" },
      resourceType: "health_profile",
      resourceId: RESOURCE_ID,
      fieldsAccessed: [],
      accessKind: "list",
    });

    expect(row.subject_user_id).toBeNull();
    expect(row.purpose).toBeNull();
    expect(row.request_id).toBeNull();
    expect(row.ip_address).toBeNull();
    expect(row.user_agent).toBeNull();
  });

  it("throws a typed error listing the offending path without echoing values", () => {
    const invalid = { ...baseEvent, fieldsAccessed: ["blood_type"] } as unknown as HealthAccessEvent;

    try {
      toHealthAccessLogRow(invalid);
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(HealthAccessLogError);
      expect((error as HealthAccessLogError).code).toBe("invalid_event");
      expect((error as Error).message).toContain("fieldsAccessed.0");
    }
  });
});

describe("createHealthAccessRecorder", () => {
  it("inserts exactly one row per recorded access", async () => {
    const { client, insertHealthAccessLogRow } = createClient();
    const recorder = createHealthAccessRecorder({ client });

    await recorder.record(baseEvent);

    expect(insertHealthAccessLogRow).toHaveBeenCalledTimes(1);
    expect(insertHealthAccessLogRow.mock.calls[0][0]).toMatchObject({
      organization_id: ORG_ID,
      actor_user_id: USER_ID,
      resource_id: RESOURCE_ID,
      access_kind: "view",
    });
  });

  it("records list and export accesses with their kind", async () => {
    const { client, insertHealthAccessLogRow } = createClient();
    const recorder = createHealthAccessRecorder({ client });

    await recorder.record({ ...baseEvent, accessKind: "list", fieldsAccessed: [] });
    await recorder.record({ ...baseEvent, accessKind: "export" });

    expect(
      insertHealthAccessLogRow.mock.calls.map(([row]) => row.access_kind),
    ).toEqual(["list", "export"]);
  });

  it("records the requested fields, never their values", async () => {
    const { client, insertHealthAccessLogRow } = createClient();
    const recorder = createHealthAccessRecorder({ client });

    await recorder.record(baseEvent);

    const serialized = JSON.stringify(insertHealthAccessLogRow.mock.calls[0][0]);
    expect(serialized).not.toMatch(/Penicilina|control anual/i);
    expect(serialized).toContain("medical_notes");
  });

  it("rejects an invalid event before touching the database", async () => {
    const { client, insertHealthAccessLogRow } = createClient();
    const recorder = createHealthAccessRecorder({ client });

    await expect(
      recorder.record({ ...baseEvent, resourceType: "prescription" } as unknown as HealthAccessEvent),
    ).rejects.toBeInstanceOf(HealthAccessLogError);
    expect(insertHealthAccessLogRow).not.toHaveBeenCalled();
  });

  it("fails closed and warns without payload when the store is missing", async () => {
    const warn = vi.fn();
    const recorder = createHealthAccessRecorder({ client: null, logger: { warn } });

    await expect(recorder.record(baseEvent)).rejects.toMatchObject({
      code: "write_failed",
    });
    expect(warn).toHaveBeenCalledWith(
      "health_access_log_unavailable",
      expect.objectContaining({ resourceId: RESOURCE_ID }),
    );
  });

  it("fails closed when the insert errors", async () => {
    const warn = vi.fn();
    const { client } = createClient({ error: { message: "RLS denied" } });
    const recorder = createHealthAccessRecorder({ client, logger: { warn } });

    await expect(recorder.record(baseEvent)).rejects.toMatchObject({
      code: "write_failed",
    });
    expect(warn).toHaveBeenCalledWith(
      "health_access_log_write_failed",
      expect.objectContaining({ resourceId: RESOURCE_ID }),
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain("RLS denied");
  });
});
