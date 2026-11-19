import { z } from "zod";
import { TARIFF_REGION_VALUES } from "@/lib/catalog-enums";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/consent";
import { QUOTE_AGE_MAX, QUOTE_AGE_MIN, QUOTE_GENDERS } from "@/lib/quoters/types";

/**
 * Browsers post text inputs as strings and empty optional fields as "".
 * `z.coerce.number()` would turn "" into 0, so empty input is mapped to
 * `undefined` first and the field rules below decide what is required.
 */
function inputToNumber(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

function trimmedText(value: unknown): unknown {
  return typeof value === "string" ? value.trim() : value;
}

/** Empty string in a nullable free-text field means "not declared". */
function emptyToNull(value: unknown): unknown {
  const trimmed = trimmedText(value);
  return trimmed === "" ? null : trimmed;
}

/** Trims text fields and treats a blank value as "not provided". */
function optionalText(max: number) {
  return z.preprocess(
    (value) => {
      const trimmed = trimmedText(value);
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().max(max).optional(),
  );
}

/** Qualification profile captured by the quoter lead form. */
export const leadQualificationSchema = z.object({
  age: z.preprocess(
    inputToNumber,
    z
      .number({ error: "La edad debe ser un número" })
      .int("La edad debe ser un número entero")
      .min(QUOTE_AGE_MIN, `La edad debe ser al menos ${QUOTE_AGE_MIN}`)
      .max(QUOTE_AGE_MAX, `La edad no puede superar ${QUOTE_AGE_MAX}`),
  ),
  dependents: z.preprocess(
    inputToNumber,
    z
      .number({ error: "Los dependientes deben ser un número" })
      .int("Los dependientes deben ser un número entero")
      .min(0, "Ingresa entre 0 y 20 dependientes")
      .max(20, "Ingresa entre 0 y 20 dependientes"),
  ),
  city: z.preprocess(
    trimmedText,
    z.string().min(1, "Ciudad requerida").max(120),
  ),
  /** Monthly budget in USD. Null/empty means the visitor did not declare one. */
  budget: z.preprocess(
    inputToNumber,
    z
      .number({ error: "El presupuesto debe ser un número" })
      .min(0, "El presupuesto no puede ser negativo")
      .max(100_000, "El presupuesto es demasiado alto")
      .nullable()
      .optional(),
  ),
  current_insurance: z.preprocess(
    emptyToNull,
    z.string().max(120).nullable().optional(),
  ),
});

export type LeadQualification = z.infer<typeof leadQualificationSchema>;

/**
 * Consent contract. The visitor must have granted consent, and must name the
 * exact consent version the server publishes: accepting older or invented
 * wording is not the same consent, so a mismatch is rejected rather than
 * recorded. Storing the server's own version is what keeps the audit trail
 * meaningful — a client can never assert which label it accepted.
 */
const consentGate = z.literal(true, {
  error: "Necesitamos tu consentimiento para contactarte.",
});

const consentVersionGate = z.literal(LEAD_CONSENT_VERSION, {
  error:
    "El consentimiento cambió. Vuelve a aceptarlo para enviar tus datos.",
});

const contactFields = {
  name: z.preprocess(
    trimmedText,
    z.string().min(1, "Nombre requerido").max(200),
  ),
  email: z.preprocess(trimmedText, z.string().email("Email inválido").max(320)),
  phone: optionalText(30),
  consent: consentGate,
  consent_version: consentVersionGate,
};

/** Contact page lead: no qualification profile, just the message. */
export const contactLeadSchema = z.object({
  ...contactFields,
  intent: z.literal("contact"),
  source: optionalText(50),
  message: optionalText(2000),
});

/**
 * Quoter lead. `intent` separates a plain quote request from an advisor
 * request; both carry the same qualification profile because a human advisor
 * needs the same context the quote was built from.
 */
export const quoterLeadSchema = z.object({
  ...contactFields,
  intent: z.enum(["quote", "advisor"]),
  source: optionalText(50),
  qualification: leadQualificationSchema,
  plan_interest: optionalText(2000),
});

export const leadSchema = z.discriminatedUnion("intent", [
  contactLeadSchema,
  quoterLeadSchema,
]);

export type ContactLeadInput = z.infer<typeof contactLeadSchema>;
export type QuoterLeadInput = z.infer<typeof quoterLeadSchema>;
export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Flattens zod issues into `{ "field": "message" }` keyed by dotted path, so
 * nested qualification errors read as `qualification.city` and the API can
 * return one shape for every lead intent.
 */
export function fieldIssues(error: z.ZodError): Record<string, string> {
  const issues: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !(key in issues)) issues[key] = issue.message;
  }

  return issues;
}

/** Clears one field's message, returning the same object when nothing matched. */
export function clearFieldIssue(
  issues: Record<string, string>,
  field: string,
): Record<string, string> {
  if (!(field in issues)) return issues;
  const next = { ...issues };
  delete next[field];
  return next;
}

/**
 * Public quoter query. The matrix `any` gender row is not a user choice, so
 * only the two selectable genders are accepted here.
 */
export const compareQuerySchema = z.object({
  age: z.coerce
    .number()
    .int()
    .min(QUOTE_AGE_MIN, `La edad debe ser al menos ${QUOTE_AGE_MIN}`)
    .max(QUOTE_AGE_MAX, `La edad no puede superar ${QUOTE_AGE_MAX}`),
  gender: z.enum(QUOTE_GENDERS),
  region: z.enum(TARIFF_REGION_VALUES),
});

export type CompareQuery = z.infer<typeof compareQuerySchema>;

export const signupSchema = z.object({
  email: z.string().email("Email inválido").max(320),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  organizationName: z
    .string()
    .min(1, "Nombre de organización requerido")
    .max(200),
});
