import { NextResponse } from "next/server";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";
import { leadInsert, type LeadInsertRow } from "@/lib/leads/lead-insert";
import { fieldIssues, leadSchema, type LeadInput } from "@/lib/validation";

const NO_CACHE_HEADERS = { "Cache-Control": "no-store" } as const;

/**
 * Maps a validated lead onto a public.leads row. Qualification columns stay
 * null for contact-page leads, and `needs_human_followup` is never read from
 * the request body. `consent_version` is the server constant, not the value
 * echoed by the client: the schema has already proven the client sent exactly
 * that version, so the stored audit value never depends on the request.
 */
function toInsertRow(lead: LeadInput): LeadInsertRow {
  const shared = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    gender: null,
    region: null,
    consent_granted: true,
    consent_version: LEAD_CONSENT_VERSION,
    intent: lead.intent,
  };

  if (lead.intent === "contact") {
    return {
      ...shared,
      source: lead.source || "contacto",
      plan_interest: lead.message || null,
      age: null,
      dependents: null,
      city: null,
      budget: null,
      current_insurance: null,
    };
  }

  const qualification = lead.qualification;

  return {
    ...shared,
    source: lead.source || "cotizador",
    plan_interest: lead.plan_interest || null,
    age: qualification.age,
    dependents: qualification.dependents,
    city: qualification.city,
    budget: qualification.budget ?? null,
    current_insurance: qualification.current_insurance ?? null,
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la solicitud inválido" },
      { status: 400, headers: NO_CACHE_HEADERS },
    );
  }

  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        details: fieldIssues(parsed.error),
      },
      { status: 400, headers: NO_CACHE_HEADERS },
    );
  }

  const result = await leadInsert(toInsertRow(parsed.data));

  if (result.status === "demo") {
    return NextResponse.json(
      {
        success: true,
        demo: true,
        needs_human_followup: result.needsHumanFollowup,
        message:
          "Lead recibido en modo demo (Supabase no configurado). Configura las variables de entorno para persistir.",
      },
      { headers: NO_CACHE_HEADERS },
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      { error: "No pudimos guardar tu solicitud. Intenta más tarde." },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    {
      success: true,
      id: result.id,
      needs_human_followup: result.needsHumanFollowup,
    },
    { headers: NO_CACHE_HEADERS },
  );
}
