import { describe, expect, it, vi } from "vitest";
import {
  submitLead,
  type LeadPayload,
  type LeadQualificationPayload,
} from "@/lib/leads/client";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";

const qualification: LeadQualificationPayload = {
  age: 34,
  dependents: 2,
  city: "Quito",
  budget: 90,
  current_insurance: "Ninguno",
};

function advisorPayload(): LeadPayload {
  return {
    intent: "advisor",
    name: "Ana",
    email: "ana@example.com",
    source: "cotizador",
    plan_interest: "34 años · Femenino · Sierra",
    qualification,
    consent: true,
    consent_version: LEAD_CONSENT_VERSION,
  };
}

function mockFetch(response: { ok: boolean; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: async () => response.body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("submitLead", () => {
  it("posts the payload as JSON to /api/leads", async () => {
    const fetchMock = mockFetch({ ok: true, body: { success: true } });

    await submitLead(advisorPayload());

    expect(fetchMock).toHaveBeenCalledWith("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(advisorPayload()),
    });
  });

  it("reports the server-derived follow-up flag and demo mode", async () => {
    mockFetch({
      ok: true,
      body: { success: true, demo: true, needs_human_followup: true },
    });

    const result = await submitLead(advisorPayload());

    expect(result).toEqual({
      success: true,
      demo: true,
      needsHumanFollowup: true,
      id: null,
      message: null,
    });
  });

  it("returns a created lead id", async () => {
    mockFetch({
      ok: true,
      body: { success: true, id: "lead-9", needs_human_followup: false },
    });

    const result = await submitLead({
      ...advisorPayload(),
      intent: "quote",
      qualification,
    });

    expect(result.id).toBe("lead-9");
    expect(result.needsHumanFollowup).toBe(false);
    expect(result.demo).toBe(false);
  });

  it("throws the API error message on a rejected lead", async () => {
    mockFetch({ ok: false, body: { error: "Datos inválidos" } });

    await expect(submitLead(advisorPayload())).rejects.toThrow("Datos inválidos");
  });

  it("surfaces the consent-version message so the visitor can re-accept", async () => {
    mockFetch({
      ok: false,
      body: {
        error: "Datos inválidos",
        details: {
          consent_version:
            "El consentimiento cambió. Vuelve a aceptarlo para enviar tus datos.",
        },
      },
    });

    await expect(submitLead(advisorPayload())).rejects.toThrow(
      /El consentimiento cambió/,
    );
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    await expect(submitLead(advisorPayload())).rejects.toThrow(
      "No pudimos enviar tu solicitud.",
    );
  });
});
