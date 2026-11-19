/**
 * Funnel analytics contract: the steps CoverU can measure today and the exact
 * payload each one may carry.
 *
 * The payload is a strict allowlist — every object is a `strictObject`, so an
 * unknown key is a parse error rather than something silently dropped, and a
 * property that names a health field is rejected by name (`HEALTH_FIELD_PATTERN`)
 * even if someone adds it to a step schema later.
 *
 * Only steps that are actually emitted exist here. Proposal, application,
 * payment and policy (KAN-242 to KAN-245) are blocked, so they are absent until
 * a caller exists — adding an unused step would be dead code.
 */
import { z } from "zod";
import type { LeadIntent } from "@/lib/leads/consent";

/** Funnel step, in order. Each one maps to a `step` value in public.funnel_events. */
export const FUNNEL_STEPS = ["lead", "quote", "advisor_request"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

/**
 * The lead form and the advisor button both live on the quoter; the contact
 * page carries its own form. The API source is the B2B quote read.
 */
const leadEventSchema = z.strictObject({
  step: z.literal("lead"),
  source: z.enum(["contacto", "cotizador"]),
  properties: z.strictObject({
    intent: z.enum(["contact", "quote", "advisor"]),
  }),
});

const quoteEventSchema = z.strictObject({
  step: z.literal("quote"),
  source: z.enum(["compare", "api"]),
  properties: z.strictObject({
    /**
     * Plans priced for the profile. Absent for an API quote *read*, which
     * returns a single stored quote rather than pricing a profile.
     */
    offerCount: z.number().int().min(0).max(10_000).optional(),
  }),
});

const advisorRequestEventSchema = z.strictObject({
  step: z.literal("advisor_request"),
  source: z.literal("cotizador"),
  properties: z.strictObject({}),
});

export const funnelEventSchema = z.discriminatedUnion("step", [
  leadEventSchema,
  quoteEventSchema,
  advisorRequestEventSchema,
]);

export type FunnelEvent = z.infer<typeof funnelEventSchema>;

/** Surface that produced the event. Must match the CHECK in the migration. */
export type FunnelSource = FunnelEvent["source"];

/**
 * Field names that would mean a payload carries clinical information. Matched
 * case-insensitively against every key in the payload, at any depth.
 */
export const HEALTH_FIELD_PATTERN =
  /diagnos|symptom|medic|medication|prescription|condition|illness|disease|treatment|therapy|allerg|pregnan|surgery|hospitali|blood|clinic|health|salud|enfermedad|sintoma|síntoma|medicament|embaraz|alergia|cirug|diagnósti/i;

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      keys.push(key);
      collectKeys(nested, keys);
    }
  }

  return keys;
}

/** True when any key of `payload` names clinical information. */
function containsHealthField(payload: unknown): boolean {
  return collectKeys(payload).some((key) => HEALTH_FIELD_PATTERN.test(key));
}

export type FunnelEventParseResult =
  | { ok: true; event: FunnelEvent }
  | { ok: false; reason: string };

/**
 * Single entry point used by the emitter and by the tests: validates the shape
 * and then rejects any payload whose keys look clinical. Shape errors and
 * health-field errors are reported separately so a caller cannot mistake one
 * for the other.
 */
export function parseFunnelEvent(payload: unknown): FunnelEventParseResult {
  const parsed = funnelEventSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false, reason: "invalid_payload" };
  }

  if (containsHealthField(parsed.data)) {
    return { ok: false, reason: "health_field" };
  }

  return { ok: true, event: parsed.data };
}

/**
 * Database row shape for public.funnel_events. `null` is the only "not
 * applicable" value, matching the migration's CHECK constraints.
 */
export interface FunnelEventRow {
  organization_id: string | null;
  step: FunnelStep;
  source: FunnelSource;
  lead_intent: LeadIntent | null;
  offer_count: number | null;
}

/** Maps a validated event onto its row. This is where nullable columns are chosen. */
export function toFunnelEventRow(
  event: FunnelEvent,
  organizationId: string | null = null,
): FunnelEventRow {
  switch (event.step) {
    case "lead":
      return {
        organization_id: organizationId,
        step: event.step,
        source: event.source,
        lead_intent: event.properties.intent,
        offer_count: null,
      };
    case "quote":
      return {
        organization_id: organizationId,
        step: event.step,
        source: event.source,
        lead_intent: null,
        offer_count: event.properties.offerCount ?? null,
      };
    case "advisor_request":
      return {
        organization_id: organizationId,
        step: event.step,
        source: event.source,
        lead_intent: null,
        offer_count: null,
      };
  }
}
