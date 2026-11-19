import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/leads/route";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";

const ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
) as Record<(typeof ENV_KEYS)[number], string | undefined>;

function withoutSupabase() {
  for (const key of ENV_KEYS) delete process.env[key];
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function post(body: unknown): Request {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const contactLead = {
  intent: "contact",
  name: "María González",
  email: "maria@example.com",
  phone: "+593 99 123 4567",
  message: "Quiero comparar planes.",
  consent: true,
  consent_version: LEAD_CONSENT_VERSION,
};

const quoteLead = {
  intent: "quote",
  name: "María González",
  email: "maria@example.com",
  source: "cotizador",
  plan_interest: "34 años · Femenino · Sierra",
  qualification: {
    age: 34,
    dependents: 2,
    city: "Quito",
    budget: 90,
    current_insurance: "Ninguno",
  },
  consent: true,
  consent_version: LEAD_CONSENT_VERSION,
};

const advisorLead = { ...quoteLead, intent: "advisor" };

afterEach(() => {
  restoreEnv();
  vi.restoreAllMocks();
});

describe("POST /api/leads — consent gate", () => {
  it("rejects a contact lead without consent", async () => {
    withoutSupabase();
    const response = await POST(post({ ...contactLead, consent: false }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Datos inválidos");
    expect(body.details.consent).toMatch(/consentimiento/i);
  });

  it("rejects a quote lead with no consent field at all", async () => {
    withoutSupabase();
    const noConsent = { ...quoteLead } as Record<string, unknown>;
    delete noConsent.consent;
    const response = await POST(post(noConsent));

    expect(response.status).toBe(400);
  });

  it("rejects an advisor lead without consent, so no human is queued", async () => {
    withoutSupabase();
    const response = await POST(post({ ...advisorLead, consent: false }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.consent).toBeDefined();
  });

  it("rejects a non-boolean consent value", async () => {
    withoutSupabase();
    const response = await POST(post({ ...contactLead, consent: "true" }));
    expect(response.status).toBe(400);
  });
});

describe("POST /api/leads — consent version", () => {
  it("accepts a lead that names the current consent version", async () => {
    withoutSupabase();
    const response = await POST(post(contactLead));
    expect(response.status).toBe(200);
  });

  it("rejects a lead carrying a stale consent version", async () => {
    withoutSupabase();
    const response = await POST(
      post({ ...contactLead, consent_version: "lopdp-placeholder-2025-01" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Datos inválidos");
    expect(body.details.consent_version).toMatch(/consentimiento cambió/i);
  });

  it("rejects a quote lead whose consent version does not match", async () => {
    withoutSupabase();
    const response = await POST(
      post({ ...quoteLead, consent_version: "fabricado-por-el-cliente" }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects a lead with no consent version, rather than assuming one", async () => {
    withoutSupabase();
    const missingVersion = { ...contactLead } as Record<string, unknown>;
    delete missingVersion.consent_version;
    const response = await POST(post(missingVersion));

    expect(response.status).toBe(400);
  });

  it("stores the server's consent version, never the client's echo", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({ data: { id: "lead-3" }, error: null }),
      }),
    });
    const from = vi.fn().mockReturnValue({ insert });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { POST: postWithSupabase } = await import("@/app/api/leads/route");
    const response = await postWithSupabase(post(advisorLead));

    expect(response.status).toBe(200);
    const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(row.consent_version).toBe(LEAD_CONSENT_VERSION);

    vi.doUnmock("@/lib/supabase/admin");
    vi.resetModules();
  });
});

describe("POST /api/leads — validation", () => {
  it("rejects a malformed JSON body", async () => {
    withoutSupabase();
    const response = await POST(
      new Request("http://localhost/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );

    expect(response.status).toBe(400);
      });

  it("rejects a quote lead missing the qualification profile", async () => {
    withoutSupabase();
    const noProfile = { ...quoteLead } as Record<string, unknown>;
    delete noProfile.qualification;
    const response = await POST(post(noProfile));
    expect(response.status).toBe(400);
  });

  it("reports qualification errors on their nested paths", async () => {
    withoutSupabase();
    const response = await POST(
      post({
        ...quoteLead,
        qualification: { age: 12, dependents: 0, city: "" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details["qualification.age"]).toBeDefined();
    expect(body.details["qualification.city"]).toBeDefined();
  });

  it("rejects an unknown intent", async () => {
    withoutSupabase();
    const response = await POST(post({ ...contactLead, intent: "newsletter" }));
    expect(response.status).toBe(400);
  });
});

describe("POST /api/leads — demo mode without Supabase", () => {
  it("accepts a contact lead and does not flag human follow-up", async () => {
    withoutSupabase();
    const response = await POST(post(contactLead));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.demo).toBe(true);
    expect(body.needs_human_followup).toBe(false);
  });

  it("accepts a quote lead", async () => {
    withoutSupabase();
    const response = await POST(post(quoteLead));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.demo).toBe(true);
    expect(body.needs_human_followup).toBe(false);
  });

  it("flags an advisor lead for human follow-up", async () => {
    withoutSupabase();
    const response = await POST(post(advisorLead));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.needs_human_followup).toBe(true);
  });

  it("never accepts a client-supplied human follow-up flag", async () => {
    withoutSupabase();
    const response = await POST(
      post({ ...quoteLead, needs_human_followup: true }),
    );
    const body = await response.json();

    expect(body.needs_human_followup).toBe(false);
  });

  it("sends no-store so a demo response is never cached", async () => {
    withoutSupabase();
    const response = await POST(post(quoteLead));
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("POST /api/leads — persistence", () => {
  it("writes the qualification, consent and follow-up flag to public.leads", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: "lead-1" }, error: null }) }),
    });
    const from = vi.fn().mockReturnValue({ insert });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { POST: postWithSupabase } = await import("@/app/api/leads/route");
    const response = await postWithSupabase(post(advisorLead));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      id: "lead-1",
      needs_human_followup: true,
    });

    expect(from).toHaveBeenCalledWith("leads");
    const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      name: "María González",
      email: "maria@example.com",
      age: 34,
      dependents: 2,
      city: "Quito",
      budget: 90,
      current_insurance: "Ninguno",
      needs_human_followup: true,
      consent_granted: true,
      consent_version: LEAD_CONSENT_VERSION,
      intent: "advisor",
      source: "cotizador",
    });
    expect(typeof row.consent_granted_at).toBe("string");

    vi.doUnmock("@/lib/supabase/admin");
    vi.resetModules();
  });

  it("stores a contact lead without qualification columns", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: "lead-2" }, error: null }) }),
    });
    const from = vi.fn().mockReturnValue({ insert });

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { POST: postWithSupabase } = await import("@/app/api/leads/route");
    await postWithSupabase(post(contactLead));

    const row = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      intent: "contact",
      source: "contacto",
      plan_interest: "Quiero comparar planes.",
      needs_human_followup: false,
      consent_granted: true,
      age: null,
      dependents: null,
      city: null,
      budget: null,
    });

    vi.doUnmock("@/lib/supabase/admin");
    vi.resetModules();
  });

  it("returns 500 when the insert fails", async () => {
    const insert = vi.fn().mockReturnValue({
      select: () => ({
        single: async () => ({ data: null, error: { message: "boom" } }),
      }),
    });
    const from = vi.fn().mockReturnValue({ insert });
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({ from }),
    }));

    const { POST: postWithSupabase } = await import("@/app/api/leads/route");
    const response = await postWithSupabase(post(quoteLead));

    expect(response.status).toBe(500);

    vi.doUnmock("@/lib/supabase/admin");
    vi.resetModules();
  });
});
