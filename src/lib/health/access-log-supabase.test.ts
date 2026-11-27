import { describe, expect, it, vi } from "vitest";
import {
  HEALTH_ACCESS_LOG_TABLE,
  createServerHealthAccessRecorder,
  createSupabaseHealthAccessLogClient,
  type HealthAccessLogSupabaseClient,
} from "@/lib/health/access-log-supabase";
import type { HealthDataAccessLogRow } from "@/lib/health/access-log";
import type { HealthAccessEvent } from "@/lib/health/types";

const ROW: HealthDataAccessLogRow = {
  organization_id: "7f1c59a4-4b2f-4a3e-9c1d-2b6f8e0a1c33",
  actor_kind: "user",
  actor_user_id: "9b2f4d51-0a1c-4e77-8f3a-6d5b9c2e4a10",
  actor_api_key_id: null,
  actor_label: null,
  actor_role: "owner",
  resource_type: "client_file",
  resource_id: "3a9b7c11-58de-4c62-b0f4-9e21d7a5c801",
  subject_user_id: null,
  fields_accessed: ["medical_notes"],
  access_kind: "view",
  purpose: null,
  request_id: null,
  ip_address: null,
  user_agent: null,
};

function fakeClient(error: { message: string } | null = null) {
  const insert = vi.fn(() => Promise.resolve({ error }));
  const from = vi.fn(() => ({ insert }));
  const client: HealthAccessLogSupabaseClient = { from };
  return { client, from, insert };
}

describe("createSupabaseHealthAccessLogClient", () => {
  it("inserts into the append-only table", async () => {
    const { client, from, insert } = fakeClient();

    const result = await createSupabaseHealthAccessLogClient(
      client,
    ).insertHealthAccessLogRow(ROW);

    expect(result.error).toBeNull();
    expect(from).toHaveBeenCalledWith(HEALTH_ACCESS_LOG_TABLE);
    expect(insert).toHaveBeenCalledWith(ROW);
  });

  it("maps a Supabase error to the narrow error shape", async () => {
    const { client } = fakeClient({ message: "permission denied" });

    const result = await createSupabaseHealthAccessLogClient(
      client,
    ).insertHealthAccessLogRow(ROW);

    expect(result.error).toEqual({ message: "permission denied" });
  });
});

describe("createServerHealthAccessRecorder", () => {
  const event: HealthAccessEvent = {
    organizationId: ROW.organization_id,
    actor: { kind: "user", userId: ROW.actor_user_id ?? "", role: "owner" },
    resourceType: "client_file",
    resourceId: ROW.resource_id,
    fieldsAccessed: ["medical_notes"],
    accessKind: "view",
  };

  it("fails closed when Supabase env vars are absent", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      await expect(
        createServerHealthAccessRecorder().record(event),
      ).rejects.toMatchObject({ code: "write_failed" });
    } finally {
      if (previousUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
      if (previousKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    }
  });
});
