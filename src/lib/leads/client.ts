import type { LeadIntent } from "@/lib/leads/consent";

export interface LeadQualificationPayload {
  age: number;
  dependents: number;
  city: string;
  budget: number | null;
  current_insurance: string | null;
}

/** Body sent to POST /api/leads from the public forms. */
export type LeadPayload =
  | {
      intent: "contact";
      name: string;
      email: string;
      phone?: string;
      source?: string;
      message?: string;
      consent: true;
      consent_version: string;
    }
  | {
      intent: Exclude<LeadIntent, "contact">;
      name: string;
      email: string;
      phone?: string;
      source?: string;
      plan_interest?: string;
      qualification: LeadQualificationPayload;
      consent: true;
      consent_version: string;
    };

export interface LeadAccepted {
  success: true;
  /** True when Supabase is not configured and nothing was persisted. */
  demo: boolean;
  /** Server-derived queue flag; the client never decides this. */
  needsHumanFollowup: boolean;
  id: string | null;
  message: string | null;
}

interface LeadApiResponse {
  success?: boolean;
  demo?: boolean;
  id?: string;
  needs_human_followup?: boolean;
  message?: string;
  error?: string;
  /** Field-level messages keyed by dotted path, e.g. `consent_version`. */
  details?: Record<string, string>;
}

const FALLBACK_ERROR = "No pudimos enviar tu solicitud.";

/**
 * Posts a lead and normalises the API contract. Throws `Error` with the
 * server-provided Spanish message so forms can render it directly. A rejected
 * consent version gets its own message: that lead needs the visitor to accept
 * the current wording, and "Datos inválidos" would not say so.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadAccepted> {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as LeadApiResponse;

  if (!response.ok) {
    throw new Error(
      body.details?.consent_version ?? body.error ?? FALLBACK_ERROR,
    );
  }

  return {
    success: true,
    demo: body.demo === true,
    needsHumanFollowup: body.needs_human_followup === true,
    id: body.id ?? null,
    message: body.message ?? null,
  };
}
