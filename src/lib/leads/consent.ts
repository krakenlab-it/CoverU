/**
 * Lead consent + intent contract shared by the API route and the public forms.
 *
 * KAN-238 (LOPDP) is blocked, so the copy below is deliberately a short neutral
 * label, not legal text: it is a placeholder that must be replaced with the
 * approved LOPDP wording. `LEAD_CONSENT_VERSION` identifies which label a lead
 * accepted, so approved copy can be rolled out without losing the audit trail.
 */
export const LEAD_CONSENT_VERSION = "lopdp-placeholder-2026-11";

export const LEAD_CONSENT_LABEL =
  "Acepto que CoverÜ use los datos de este formulario para contactarme sobre mi cotización.";

/** Why the visitor submitted the form. `advisor` is the human follow-up queue. */
export const LEAD_INTENTS = ["contact", "quote", "advisor"] as const;
export type LeadIntent = (typeof LEAD_INTENTS)[number];

/** Intent that puts a lead in front of a human advisor. */
export const HUMAN_FOLLOWUP_INTENT: LeadIntent = "advisor";

export function needsHumanFollowup(intent: LeadIntent): boolean {
  return intent === HUMAN_FOLLOWUP_INTENT;
}
